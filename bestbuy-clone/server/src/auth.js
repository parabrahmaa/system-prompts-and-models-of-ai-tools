import crypto from 'node:crypto';
import { HttpError } from './util.js';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return process.env.JWT_SECRET || 'dev-only-secret-change-me';
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/** Minimal HS256 JWT so the server needs no auth dependencies. */
export function signToken(user) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: user.id, role: user.role, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const sig = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof claims.exp !== 'number' || claims.exp < Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

export function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    role: u.role,
    memberTier: u.member_tier,
    rewardPoints: u.reward_points,
    storeId: u.store_id,
    createdAt: u.created_at,
  };
}

/** Attaches req.user when a valid bearer token is present; never rejects. */
export function authOptional(db) {
  const findUser = db.prepare('SELECT * FROM users WHERE id = ?');
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer (.+)$/);
    if (match) {
      const claims = verifyToken(match[1]);
      if (claims) req.user = findUser.get(claims.sub) || undefined;
    }
    next();
  };
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin access required.'));
  next();
}
