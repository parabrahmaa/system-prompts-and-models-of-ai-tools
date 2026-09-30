import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { transaction } from '../db.js';
import { badRequest, HttpError, notFound, requireString } from '../util.js';
import { cartSummary, loadCart } from './cart.js';

// Reward points earned per whole dollar of subtotal, by membership tier.
const TIER_POINTS = { 'My Best Buy': 1, 'My Best Buy Plus': 2, 'My Best Buy Total': 3 };

function cardBrand(number) {
  if (/^4/.test(number)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(011|5)/.test(number)) return 'Discover';
  return 'Card';
}

function luhn(number) {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let d = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Validates checkout payment input. Only brand + last4 are ever stored. */
function validatePayment(payment = {}) {
  const number = String(payment.cardNumber || '').replace(/\D/g, '');
  if (number.length < 13 || number.length > 19 || !luhn(number)) throw badRequest('Please enter a valid card number.', { field: 'cardNumber' });
  const m = String(payment.expiry || '').match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) throw badRequest('Expiration must be MM/YY.', { field: 'expiry' });
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  if (month < 1 || month > 12 || year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    throw badRequest('This card has expired.', { field: 'expiry' });
  }
  if (!/^\d{3,4}$/.test(String(payment.cvv || ''))) throw badRequest('Please enter a valid security code.', { field: 'cvv' });
  return { brand: cardBrand(number), last4: number.slice(-4) };
}

function validateAddress(a = {}) {
  const address = {
    firstName: requireString(a.firstName, 'firstName', { max: 60 }),
    lastName: requireString(a.lastName, 'lastName', { max: 60 }),
    street: requireString(a.street, 'street', { max: 120 }),
    apt: typeof a.apt === 'string' ? a.apt.trim().slice(0, 60) : '',
    city: requireString(a.city, 'city', { max: 60 }),
    state: requireString(a.state, 'state', { max: 2 }).toUpperCase(),
    zip: requireString(a.zip, 'zip', { max: 10 }),
  };
  if (!/^[A-Z]{2}$/.test(address.state)) throw badRequest('Please select a state.', { field: 'state' });
  if (!/^\d{5}(-\d{4})?$/.test(address.zip)) throw badRequest('Please enter a valid ZIP code.', { field: 'zip' });
  return address;
}

export function serializeOrder(db, o) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(o.id);
  const store = o.store_id ? db.prepare('SELECT id, name, address, city, state, zip, phone FROM stores WHERE id = ?').get(o.store_id) : null;
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    fulfillment: o.fulfillment,
    store,
    shippingAddress: o.shipping_address ? JSON.parse(o.shipping_address) : null,
    contactEmail: o.contact_email,
    contactPhone: o.contact_phone,
    payment: { brand: o.payment_brand, last4: o.payment_last4 },
    subtotal: o.subtotal,
    savings: o.savings,
    shipping: o.shipping,
    tax: o.tax,
    total: o.total,
    pointsEarned: o.points_earned,
    createdAt: o.created_at,
    items: items.map((i) => ({
      sku: i.sku, name: i.name, price: i.price, regularPrice: i.regular_price, quantity: i.quantity,
      image: `/api/images/${i.sku}.svg`,
    })),
  };
}

export function ordersRouter(db) {
  const r = Router();
  r.use('/orders', requireAuth);

  r.post('/orders', (req, res) => {
    const fulfillment = req.body.fulfillment === 'pickup' ? 'pickup' : 'ship';
    const { items } = loadCart(db, req.user.id);
    if (!items.length) throw badRequest('Your cart is empty.');

    let storeId = null;
    let address = null;
    if (fulfillment === 'pickup') {
      storeId = Number(req.body.storeId);
      if (!db.prepare('SELECT 1 FROM stores WHERE id = ?').get(storeId)) throw badRequest('Please choose a pickup store.', { field: 'storeId' });
    } else {
      address = validateAddress(req.body.shippingAddress);
    }
    const email = requireString(req.body.contactEmail ?? req.user.email, 'contactEmail', { max: 254 });
    const phone = typeof req.body.contactPhone === 'string' ? req.body.contactPhone.trim().slice(0, 30) : null;
    const payment = validatePayment(req.body.payment);

    const order = transaction(db, () => {
      // Re-check stock inside the transaction and decrement atomically.
      const dec = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
      for (const line of items) {
        if (!dec.run(line.quantity, line.product.id, line.quantity).changes) {
          throw new HttpError(409, `Sorry, ${line.product.name} no longer has enough stock.`);
        }
      }
      const summary = cartSummary(items, fulfillment);
      const points = Math.floor(summary.subtotal / 100) * (TIER_POINTS[req.user.member_tier] ?? 1);
      const orderNumber = `BBY01-${Date.now().toString().slice(-6)}${crypto.randomInt(100000, 999999)}`;
      const info = db.prepare(`INSERT INTO orders (order_number, user_id, status, fulfillment, store_id, shipping_address, contact_email, contact_phone,
          payment_brand, payment_last4, subtotal, savings, shipping, tax, total, points_earned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        orderNumber, req.user.id, 'Processing', fulfillment, storeId, address ? JSON.stringify(address) : null, email, phone,
        payment.brand, payment.last4, summary.subtotal, summary.savings, summary.shipping, summary.tax, summary.total, points,
      );
      const orderId = Number(info.lastInsertRowid);
      const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, sku, name, price, regular_price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const l of items) insItem.run(orderId, l.product.id, l.product.sku, l.product.name, l.product.price, l.product.regularPrice, l.quantity);
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      db.prepare('UPDATE users SET reward_points = reward_points + ? WHERE id = ?').run(points, req.user.id);
      return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    });
    res.status(201).json(serializeOrder(db, order));
  });

  r.get('/orders', (req, res) => {
    const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
    res.json(rows.map((o) => serializeOrder(db, o)));
  });

  r.get('/orders/:orderNumber', (req, res) => {
    const o = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
    if (!o || (o.user_id !== req.user.id && req.user.role !== 'admin')) throw notFound('Order not found');
    res.json(serializeOrder(db, o));
  });

  r.post('/orders/:orderNumber/cancel', (req, res) => {
    const o = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(req.params.orderNumber, req.user.id);
    if (!o) throw notFound('Order not found');
    if (o.status !== 'Processing') throw badRequest('Only orders that are still processing can be cancelled.');
    transaction(db, () => {
      for (const i of db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(o.id)) {
        if (i.product_id) db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(i.quantity, i.product_id);
      }
      db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(o.id);
      db.prepare('UPDATE users SET reward_points = MAX(0, reward_points - ?) WHERE id = ?').run(o.points_earned, o.user_id);
    });
    res.json(serializeOrder(db, db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id)));
  });

  return r;
}
