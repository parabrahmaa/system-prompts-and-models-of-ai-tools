import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { seed } from '../src/seed.js';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  const db = openDatabase(':memory:');
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const login = async (email, password) => (await api('/auth/login', { method: 'POST', body: { email, password } })).body.token;
const card = { cardNumber: '4111 1111 1111 1111', expiry: '12/30', cvv: '123' };

test('lists products with facets, filters and sorting', async () => {
  const all = await api('/products?pageSize=100');
  assert.equal(all.status, 200);
  assert.ok(all.body.total >= 70);
  assert.ok(all.body.facets.brands.length > 10);

  const tvs = await api('/products?category=tvs&brand=LG,Sony&sort=price-low');
  assert.ok(tvs.body.items.every((p) => p.category.slug === 'tvs' && ['LG', 'Sony'].includes(p.brand)));
  const prices = tvs.body.items.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  // Brand facet ignores the brand filter so other brands stay selectable.
  assert.ok(tvs.body.facets.brands.some((b) => b.name === 'Samsung'));

  const sale = await api('/products?onSale=true&pageSize=100');
  assert.ok(sale.body.items.every((p) => p.price < p.regularPrice));

  const search = await api('/products?q=macbook');
  assert.ok(search.body.items.length >= 2);
  assert.ok(search.body.items.every((p) => /macbook/i.test(p.name)));
});

test('product detail, suggestions, deals, stores and images', async () => {
  const { body: list } = await api('/products?pageSize=1');
  const sku = list.items[0].sku;
  const detail = await api(`/products/${sku}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.ratingDistribution.length, 5);
  assert.ok(Array.isArray(detail.body.related));
  assert.equal((await api('/products/000')).status, 404);

  const suggest = await api('/search/suggest?q=sam');
  assert.ok(suggest.body.terms.includes('Samsung'));

  const deals = await api('/deals');
  assert.ok(deals.body.dealOfDay);
  assert.ok(deals.body.topDeals.length > 0);

  const stores = await api('/stores?q=10003');
  assert.equal(stores.body[0].zip, '10003');

  const img = await fetch(`${base}/images/${sku}.svg`);
  assert.equal(img.headers.get('content-type'), 'image/svg+xml; charset=utf-8');
});

test('registration validates input and issues tokens', async () => {
  const weak = await api('/auth/register', { method: 'POST', body: { firstName: 'A', lastName: 'B', email: 'a@b.co', password: 'short' } });
  assert.equal(weak.status, 400);
  const ok = await api('/auth/register', { method: 'POST', body: { firstName: 'Ann', lastName: 'Lee', email: 'ann@example.com', password: 'password1' } });
  assert.equal(ok.status, 201);
  assert.ok(ok.body.token);
  const dup = await api('/auth/register', { method: 'POST', body: { firstName: 'Ann', lastName: 'Lee', email: 'ANN@example.com', password: 'password1' } });
  assert.equal(dup.status, 409);
  const me = await api('/auth/me', { token: ok.body.token });
  assert.equal(me.body.email, 'ann@example.com');
  assert.equal((await api('/auth/me', { token: ok.body.token + 'x' })).status, 401);
  assert.equal((await api('/auth/login', { method: 'POST', body: { email: 'ann@example.com', password: 'nope' } })).status, 401);
});

test('cart, checkout, order history and cancellation', async () => {
  const token = await login('demo@bestbuy.test', 'demo1234');
  assert.equal((await api('/cart')).status, 401);

  const { body: list } = await api('/products?inStock=true&pageSize=3&sort=price-low');
  const [a, b] = list.items;
  await api('/cart/items', { method: 'POST', token, body: { sku: a.sku, quantity: 2 } });
  let cart = await api('/cart/merge', { method: 'POST', token, body: { items: [{ sku: b.sku, quantity: 1 }, { sku: 'bogus', quantity: 1 }] } });
  assert.equal(cart.body.items.length, 2);
  assert.equal(cart.body.summary.subtotal, a.price * 2 + b.price);

  cart = await api(`/cart/items/${b.sku}`, { method: 'PATCH', token, body: { quantity: 0 } });
  assert.equal(cart.body.items.length, 1);

  const bad = await api('/orders', { method: 'POST', token, body: { fulfillment: 'pickup', storeId: 1, payment: { ...card, cardNumber: '4111111111111112' } } });
  assert.equal(bad.status, 400);

  const order = await api('/orders', { method: 'POST', token, body: { fulfillment: 'pickup', storeId: 1, payment: card } });
  assert.equal(order.status, 201);
  assert.equal(order.body.payment.last4, '1111');
  assert.equal(order.body.shipping, 0);
  assert.equal(order.body.total, order.body.subtotal + order.body.tax);
  assert.equal((await api('/cart', { token })).body.items.length, 0);

  const after = await api(`/products/${a.sku}`);
  assert.equal(after.body.stock, a.stock - 2);

  const history = await api('/orders', { token });
  assert.equal(history.body[0].orderNumber, order.body.orderNumber);

  const cancelled = await api(`/orders/${order.body.orderNumber}/cancel`, { method: 'POST', token });
  assert.equal(cancelled.body.status, 'Cancelled');
  assert.equal((await api(`/products/${a.sku}`)).body.stock, a.stock);

  // Other users cannot see the order.
  const other = await login('ann@example.com', 'password1');
  assert.equal((await api(`/orders/${order.body.orderNumber}`, { token: other })).status, 404);
});

test('shipping orders validate address and apply the free-shipping threshold', async () => {
  const token = await login('ann@example.com', 'password1');
  const { body } = await api('/products?inStock=true&sort=price-low&pageSize=1');
  await api('/cart/items', { method: 'POST', token, body: { sku: body.items[0].sku } });
  const missing = await api('/orders', { method: 'POST', token, body: { fulfillment: 'ship', payment: card, shippingAddress: { firstName: 'Ann' } } });
  assert.equal(missing.status, 400);
  const addr = { firstName: 'Ann', lastName: 'Lee', street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' };
  const order = await api('/orders', { method: 'POST', token, body: { fulfillment: 'ship', payment: card, shippingAddress: addr } });
  assert.equal(order.status, 201);
  assert.equal(order.body.shipping, order.body.subtotal >= 3500 ? 0 : 599);
  assert.equal(order.body.shippingAddress.city, 'Austin');
});

test('reviews and saved items', async () => {
  const token = await login('ann@example.com', 'password1');
  const { body } = await api('/products?pageSize=1');
  const sku = body.items[0].sku;
  const before = (await api(`/products/${sku}`)).body.reviewCount;
  const created = await api(`/products/${sku}/reviews`, { method: 'POST', token, body: { rating: 5, title: 'Great', body: 'Really great.' } });
  assert.equal(created.status, 201);
  assert.equal((await api(`/products/${sku}`)).body.reviewCount, before + 1);
  assert.equal((await api(`/products/${sku}/reviews`, { method: 'POST', token, body: { rating: 4, title: 'x', body: 'y' } })).status, 400);

  let saved = await api(`/saved/${sku}`, { method: 'POST', token });
  assert.equal(saved.body.length, 1);
  saved = await api(`/saved/${sku}`, { method: 'DELETE', token });
  assert.equal(saved.body.length, 0);
});

test('admin endpoints are protected and manage catalog and orders', async () => {
  const customer = await login('demo@bestbuy.test', 'demo1234');
  assert.equal((await api('/admin/stats', { token: customer })).status, 403);

  const token = await login('admin@bestbuy.test', 'admin123');
  const stats = await api('/admin/stats', { token });
  assert.ok(stats.body.orders >= 1);

  const created = await api('/admin/products', { method: 'POST', token, body: {
    name: 'Test Brand - Widget', brand: 'Test Brand', model: 'W-1', category: 'audio', price: 1999, regularPrice: 2999, stock: 5,
  } });
  assert.equal(created.status, 201);
  assert.ok(created.body.onSale);

  const updated = await api(`/admin/products/${created.body.sku}`, { method: 'PUT', token, body: { stock: 0 } });
  assert.equal(updated.body.stock, 0);

  assert.equal((await api(`/admin/products/${created.body.sku}`, { method: 'DELETE', token })).status, 204);
  assert.equal((await api(`/products/${created.body.sku}`)).status, 404);

  const orders = await api('/admin/orders', { token });
  const open = orders.body.find((o) => o.status === 'Processing');
  const shipped = await api(`/admin/orders/${open.orderNumber}`, { method: 'PATCH', token, body: { status: 'Shipped' } });
  assert.equal(shipped.body.status, 'Shipped');
});
