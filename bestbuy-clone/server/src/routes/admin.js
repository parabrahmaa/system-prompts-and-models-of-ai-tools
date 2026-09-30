import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { transaction } from '../db.js';
import { badRequest, HttpError, intParam, notFound, requireString } from '../util.js';
import { PRODUCT_SELECT, serializeProduct } from './serialize.js';
import { serializeOrder } from './orders.js';

const STATUSES = ['Processing', 'Shipped', 'Ready for Pickup', 'Delivered', 'Picked Up', 'Cancelled'];

function parseProductBody(db, body, existing) {
  const pick = (k, fallback) => (body[k] !== undefined ? body[k] : fallback);
  const name = requireString(pick('name', existing?.name), 'name', { max: 200 });
  const brand = requireString(pick('brand', existing?.brand), 'brand', { max: 60 });
  const model = requireString(pick('model', existing?.model), 'model', { max: 60 });
  const description = String(pick('description', existing?.description ?? '')).slice(0, 5000);
  const categorySlug = pick('category', existing?.category_slug);
  const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(String(categorySlug ?? ''));
  if (!cat) throw badRequest('Please choose a valid category.', { field: 'category' });
  const price = intParam(pick('price', existing?.price), { min: 1, max: 10_000_000 });
  const regularPrice = intParam(pick('regularPrice', existing?.regular_price ?? price), { min: 1, max: 10_000_000 });
  if (!price) throw badRequest('price (in cents) is required', { field: 'price' });
  if (regularPrice < price) throw badRequest('Regular price must be at least the sale price.', { field: 'regularPrice' });
  const stock = intParam(pick('stock', existing?.stock ?? 0), { min: 0, max: 1_000_000, fallback: 0 });
  const highlights = pick('highlights', existing ? JSON.parse(existing.highlights) : []);
  const specs = pick('specs', existing ? JSON.parse(existing.specs) : {});
  if (!Array.isArray(highlights) || typeof specs !== 'object' || specs === null || Array.isArray(specs)) throw badRequest('Invalid highlights or specs');
  return {
    name, brand, model, description, categoryId: cat.id, price, regularPrice, stock,
    highlights: JSON.stringify(highlights.map(String).slice(0, 10)),
    specs: JSON.stringify(specs),
    isFeatured: pick('isFeatured', !!existing?.is_featured) ? 1 : 0,
    isDealOfDay: pick('isDealOfDay', !!existing?.is_deal_of_day) ? 1 : 0,
    isActive: pick('isActive', existing ? !!existing.is_active : true) ? 1 : 0,
  };
}

export function adminRouter(db) {
  const r = Router();
  r.use('/admin', requireAdmin);

  r.get('/admin/stats', (_req, res) => {
    const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) AS v, COUNT(*) AS n FROM orders WHERE status != 'Cancelled'").get();
    const byDay = db.prepare(`SELECT date(created_at) AS day, SUM(total) AS total, COUNT(*) AS orders FROM orders
      WHERE status != 'Cancelled' AND created_at >= date('now', '-13 days') GROUP BY day ORDER BY day`).all();
    const top = db.prepare(`SELECT sku, name, SUM(quantity) AS units, SUM(price * quantity) AS revenue FROM order_items oi
      JOIN orders o ON o.id = oi.order_id WHERE o.status != 'Cancelled' GROUP BY sku ORDER BY units DESC LIMIT 5`).all();
    res.json({
      revenue: revenue.v,
      orders: revenue.n,
      customers: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").get().n,
      products: db.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1').get().n,
      lowStock: db.prepare(`${PRODUCT_SELECT} WHERE p.is_active = 1 AND p.stock < 5 ORDER BY p.stock LIMIT 10`).all().map(serializeProduct),
      salesByDay: byDay,
      topProducts: top,
    });
  });

  r.get('/admin/products', (req, res) => {
    const q = typeof req.query.q === 'string' ? `%${req.query.q.trim()}%` : '%';
    const rows = db.prepare(`${PRODUCT_SELECT} WHERE (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?) ORDER BY p.id DESC`).all(q, q, q);
    res.json(rows.map(serializeProduct));
  });

  r.post('/admin/products', (req, res) => {
    const d = parseProductBody(db, req.body);
    let sku = String(req.body.sku || '').trim();
    if (sku && !/^\d{5,10}$/.test(sku)) throw badRequest('SKU must be 5-10 digits.', { field: 'sku' });
    if (!sku) sku = String(Number(db.prepare('SELECT MAX(CAST(sku AS INTEGER)) AS m FROM products').get().m || 6400000) + 11);
    if (db.prepare('SELECT 1 FROM products WHERE sku = ?').get(sku)) throw new HttpError(409, 'SKU already exists.', { field: 'sku' });
    const info = db.prepare(`INSERT INTO products (sku, model, name, brand, category_id, description, price, regular_price, stock, hue,
        highlights, specs, is_featured, is_deal_of_day, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      sku, d.model, d.name, d.brand, d.categoryId, d.description, d.price, d.regularPrice, d.stock, Math.floor(Math.random() * 360),
      d.highlights, d.specs, d.isFeatured, d.isDealOfDay, d.isActive);
    if (d.isDealOfDay) db.prepare('UPDATE products SET is_deal_of_day = 0 WHERE id != ?').run(info.lastInsertRowid);
    res.status(201).json(serializeProduct(db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(info.lastInsertRowid)));
  });

  r.put('/admin/products/:sku', (req, res) => {
    const existing = db.prepare(`${PRODUCT_SELECT} WHERE p.sku = ?`).get(req.params.sku);
    if (!existing) throw notFound('Product not found');
    const d = parseProductBody(db, req.body, existing);
    transaction(db, () => {
      db.prepare(`UPDATE products SET model = ?, name = ?, brand = ?, category_id = ?, description = ?, price = ?, regular_price = ?, stock = ?,
        highlights = ?, specs = ?, is_featured = ?, is_deal_of_day = ?, is_active = ? WHERE id = ?`).run(
        d.model, d.name, d.brand, d.categoryId, d.description, d.price, d.regularPrice, d.stock, d.highlights, d.specs,
        d.isFeatured, d.isDealOfDay, d.isActive, existing.id);
      if (d.isDealOfDay) db.prepare('UPDATE products SET is_deal_of_day = 0 WHERE id != ?').run(existing.id);
    });
    res.json(serializeProduct(db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(existing.id)));
  });

  // Soft delete: keeps order history intact.
  r.delete('/admin/products/:sku', (req, res) => {
    const info = db.prepare('UPDATE products SET is_active = 0, is_deal_of_day = 0 WHERE sku = ?').run(req.params.sku);
    if (!info.changes) throw notFound('Product not found');
    db.prepare('DELETE FROM cart_items WHERE product_id = (SELECT id FROM products WHERE sku = ?)').run(req.params.sku);
    res.status(204).end();
  });

  r.get('/admin/orders', (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null;
    const rows = status
      ? db.prepare('SELECT o.*, u.email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = ? ORDER BY o.id DESC').all(status)
      : db.prepare('SELECT o.*, u.email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC').all();
    res.json(rows.map((o) => ({ ...serializeOrder(db, o), customerEmail: o.email })));
  });

  r.patch('/admin/orders/:orderNumber', (req, res) => {
    const status = req.body.status;
    if (!STATUSES.includes(status)) throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
    const o = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
    if (!o) throw notFound('Order not found');
    if (o.status === 'Cancelled') throw badRequest('Cancelled orders cannot be changed.');
    transaction(db, () => {
      if (status === 'Cancelled') {
        for (const i of db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(o.id)) {
          if (i.product_id) db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(i.quantity, i.product_id);
        }
        db.prepare('UPDATE users SET reward_points = MAX(0, reward_points - ?) WHERE id = ?').run(o.points_earned, o.user_id);
      }
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, o.id);
    });
    res.json(serializeOrder(db, db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id)));
  });

  r.get('/admin/users', (_req, res) => {
    const rows = db.prepare(`SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.member_tier, u.reward_points, u.created_at,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count FROM users u ORDER BY u.id`).all();
    res.json(rows.map((u) => ({
      id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, role: u.role, memberTier: u.member_tier,
      rewardPoints: u.reward_points, orderCount: u.order_count, createdAt: u.created_at,
    })));
  });

  return r;
}
