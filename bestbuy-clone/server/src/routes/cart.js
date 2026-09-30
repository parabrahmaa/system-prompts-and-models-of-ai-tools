import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PRODUCT_SELECT, serializeProduct } from './serialize.js';
import { badRequest, FREE_SHIPPING_THRESHOLD, intParam, notFound, STANDARD_SHIPPING, TAX_RATE } from '../util.js';
import { transaction } from '../db.js';

export const MAX_QTY = 10;

export function cartSummary(lines, fulfillment = 'ship') {
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const savings = lines.reduce((s, l) => s + (l.product.regularPrice - l.product.price) * l.quantity, 0);
  const shipping = fulfillment === 'pickup' || subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const tax = Math.round(subtotal * TAX_RATE);
  return {
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    savings,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    standardShipping: STANDARD_SHIPPING,
    taxRate: TAX_RATE,
  };
}

export function loadCart(db, userId) {
  const rows = db.prepare(`${PRODUCT_SELECT} JOIN cart_items ci ON ci.product_id = p.id
    WHERE ci.user_id = ? ORDER BY ci.added_at, p.id`).all(userId);
  const qty = new Map(db.prepare('SELECT product_id, quantity FROM cart_items WHERE user_id = ?').all(userId).map((r) => [r.product_id, r.quantity]));
  const lines = rows.map((p) => ({ product: serializeProduct(p), quantity: qty.get(p.id) }));
  return { items: lines, summary: cartSummary(lines) };
}

export function cartRouter(db) {
  const r = Router();
  r.use('/cart', requireAuth);

  const productBySku = db.prepare('SELECT id, stock, is_active FROM products WHERE sku = ?');
  const upsert = db.prepare(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
    ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = MIN(?, cart_items.quantity + excluded.quantity)`);

  function findSellable(sku) {
    const p = productBySku.get(String(sku ?? ''));
    if (!p || !p.is_active) throw notFound('Product not found');
    if (p.stock <= 0) throw badRequest('Sorry, this item is sold out.');
    return p;
  }

  r.get('/cart', (req, res) => res.json(loadCart(db, req.user.id)));

  r.post('/cart/items', (req, res) => {
    const p = findSellable(req.body.sku);
    const quantity = intParam(req.body.quantity, { min: 1, max: MAX_QTY, fallback: 1 });
    upsert.run(req.user.id, p.id, Math.min(quantity, p.stock), Math.min(MAX_QTY, p.stock));
    res.status(201).json(loadCart(db, req.user.id));
  });

  r.patch('/cart/items/:sku', (req, res) => {
    const p = productBySku.get(req.params.sku);
    if (!p) throw notFound('Product not found');
    const quantity = intParam(req.body.quantity, { min: 0, max: MAX_QTY });
    if (quantity === undefined) throw badRequest('quantity is required');
    if (quantity === 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, p.id);
    } else {
      if (quantity > p.stock) throw badRequest(`Only ${p.stock} left in stock.`);
      const info = db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, req.user.id, p.id);
      if (!info.changes) throw notFound('Item is not in your cart');
    }
    res.json(loadCart(db, req.user.id));
  });

  r.delete('/cart/items/:sku', (req, res) => {
    const p = productBySku.get(req.params.sku);
    if (p) db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, p.id);
    res.json(loadCart(db, req.user.id));
  });

  r.delete('/cart', (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json(loadCart(db, req.user.id));
  });

  // Merge a guest (localStorage) cart into the signed-in user's cart.
  r.post('/cart/merge', (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    transaction(db, () => {
      for (const it of items) {
        const p = productBySku.get(String(it.sku ?? ''));
        const q = Number(it.quantity);
        if (!p || !p.is_active || p.stock <= 0 || !Number.isInteger(q) || q < 1) continue;
        const cap = Math.min(MAX_QTY, p.stock);
        upsert.run(req.user.id, p.id, Math.min(q, cap), cap);
      }
    });
    res.json(loadCart(db, req.user.id));
  });

  return r;
}

/** Prices a guest (signed-out) cart without persisting it. */
export function guestCartRouter(db) {
  const r = Router();
  r.post('/cart/quote', (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    const bySku = db.prepare(`${PRODUCT_SELECT} WHERE p.sku = ? AND p.is_active = 1`);
    const lines = [];
    for (const it of items) {
      const p = bySku.get(String(it.sku ?? ''));
      const q = Number(it.quantity);
      if (!p || !Number.isInteger(q) || q < 1) continue;
      lines.push({ product: serializeProduct(p), quantity: Math.min(q, MAX_QTY) });
    }
    res.json({ items: lines, summary: cartSummary(lines) });
  });
  return r;
}
