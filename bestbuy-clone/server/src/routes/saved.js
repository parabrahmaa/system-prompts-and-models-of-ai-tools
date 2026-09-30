import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { notFound } from '../util.js';
import { PRODUCT_SELECT, serializeProduct } from './serialize.js';

export function savedRouter(db) {
  const r = Router();
  r.use('/saved', requireAuth);

  const list = (userId) => db.prepare(`${PRODUCT_SELECT} JOIN saved_items s ON s.product_id = p.id
    WHERE s.user_id = ? ORDER BY s.saved_at DESC, p.id`).all(userId).map(serializeProduct);

  r.get('/saved', (req, res) => res.json(list(req.user.id)));

  r.post('/saved/:sku', (req, res) => {
    const p = db.prepare('SELECT id FROM products WHERE sku = ? AND is_active = 1').get(req.params.sku);
    if (!p) throw notFound('Product not found');
    db.prepare('INSERT OR IGNORE INTO saved_items (user_id, product_id) VALUES (?, ?)').run(req.user.id, p.id);
    res.status(201).json(list(req.user.id));
  });

  r.delete('/saved/:sku', (req, res) => {
    db.prepare('DELETE FROM saved_items WHERE user_id = ? AND product_id = (SELECT id FROM products WHERE sku = ?)').run(req.user.id, req.params.sku);
    res.json(list(req.user.id));
  });

  return r;
}
