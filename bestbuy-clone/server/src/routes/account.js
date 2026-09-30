import { Router } from 'express';
import { publicUser, requireAuth, signToken } from '../auth.js';
import { badRequest, HttpError, hashPassword, requireString, verifyPassword } from '../util.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function accountRouter(db) {
  const r = Router();

  r.post('/auth/register', (req, res) => {
    const firstName = requireString(req.body.firstName, 'firstName', { max: 60 });
    const lastName = requireString(req.body.lastName, 'lastName', { max: 60 });
    const email = requireString(req.body.email, 'email', { max: 254 }).toLowerCase();
    if (!EMAIL_RE.test(email)) throw badRequest('Please enter a valid email address.', { field: 'email' });
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw badRequest('Password must be at least 8 characters and include a letter and a number.', { field: 'password' });
    }
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw new HttpError(409, 'An account with this email already exists.', { field: 'email' });
    }
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim().slice(0, 30) : null;
    const info = db.prepare('INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)')
      .run(email, hashPassword(password), firstName, lastName, phone || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  r.post('/auth/login', (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = email && db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, 'Oops! The email or password did not match our records.');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  r.get('/auth/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

  r.patch('/auth/me', requireAuth, (req, res) => {
    const u = req.user;
    const firstName = req.body.firstName !== undefined ? requireString(req.body.firstName, 'firstName', { max: 60 }) : u.first_name;
    const lastName = req.body.lastName !== undefined ? requireString(req.body.lastName, 'lastName', { max: 60 }) : u.last_name;
    const phone = req.body.phone !== undefined ? String(req.body.phone).trim().slice(0, 30) || null : u.phone;
    let storeId = u.store_id;
    if (req.body.storeId !== undefined) {
      storeId = req.body.storeId === null ? null : Number(req.body.storeId);
      if (storeId !== null && !db.prepare('SELECT 1 FROM stores WHERE id = ?').get(storeId)) throw badRequest('Unknown store');
    }
    if (req.body.newPassword !== undefined) {
      if (!verifyPassword(String(req.body.currentPassword || ''), u.password_hash)) throw badRequest('Current password is incorrect.', { field: 'currentPassword' });
      const np = String(req.body.newPassword);
      if (np.length < 8 || !/[A-Za-z]/.test(np) || !/\d/.test(np)) throw badRequest('Password must be at least 8 characters and include a letter and a number.', { field: 'newPassword' });
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(np), u.id);
    }
    db.prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ?, store_id = ? WHERE id = ?').run(firstName, lastName, phone, storeId, u.id);
    res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)));
  });

  r.get('/stores', (req, res) => {
    const stores = db.prepare('SELECT * FROM stores ORDER BY id').all();
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    let result = stores.map((s) => ({ ...s, hours: JSON.parse(s.hours) }));
    if (q) {
      // Exact ZIP/city/state matches first, then the remaining stores sorted by ZIP proximity.
      const matches = (s) => s.zip === q || s.city.toLowerCase().includes(q) || s.state.toLowerCase() === q || s.name.toLowerCase().includes(q);
      const zipNum = /^\d{5}$/.test(q) ? Number(q) : null;
      result = result
        .map((s) => ({ ...s, _score: matches(s) ? -1 : zipNum !== null ? Math.abs(Number(s.zip) - zipNum) : Infinity }))
        .filter((s) => s._score !== Infinity)
        .sort((a, b) => a._score - b._score)
        .map(({ _score, ...s }) => s);
    }
    res.json(result);
  });

  return r;
}
