import { Router } from 'express';
import { PRODUCT_SELECT, serializeProduct } from './serialize.js';
import { productSvg } from '../images.js';
import { badRequest, intParam, notFound, requireString } from '../util.js';
import { requireAuth } from '../auth.js';

export const PRICE_RANGES = [
  { key: '0-50', label: 'Less than $50', min: 0, max: 5000 },
  { key: '50-200', label: '$50 - $199.99', min: 5000, max: 20000 },
  { key: '200-500', label: '$200 - $499.99', min: 20000, max: 50000 },
  { key: '500-1000', label: '$500 - $999.99', min: 50000, max: 100000 },
  { key: '1000-2000', label: '$1,000 - $1,999.99', min: 100000, max: 200000 },
  { key: '2000+', label: '$2,000 and up', min: 200000, max: Number.MAX_SAFE_INTEGER },
];

const SORTS = {
  'best-match': 'p.is_featured DESC, p.rating_count DESC, p.id',
  'price-low': 'p.price ASC, p.id',
  'price-high': 'p.price DESC, p.id',
  'top-rated': 'p.rating_avg DESC, p.rating_count DESC, p.id',
  newest: 'p.created_at DESC, p.id DESC',
  'biggest-savings': '(p.regular_price - p.price) DESC, p.id',
};

const list = (v) => (v === undefined ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean));

/** Build a WHERE clause from query filters. `skip` omits one filter so facet counts stay useful. */
function buildWhere(query, skip) {
  const where = ['p.is_active = 1'];
  const params = [];
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    for (const word of q.split(/\s+/).slice(0, 8)) {
      where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR p.sku = ? OR c.name LIKE ?)');
      const like = `%${word}%`;
      params.push(like, like, like, word, like);
    }
  }
  if (query.category && skip !== 'category') {
    where.push('c.slug = ?');
    params.push(String(query.category));
  }
  const brands = list(query.brand);
  if (brands.length && skip !== 'brand') {
    where.push(`p.brand IN (${brands.map(() => '?').join(',')})`);
    params.push(...brands);
  }
  const ranges = list(query.price).map((k) => PRICE_RANGES.find((r) => r.key === k)).filter(Boolean);
  if (ranges.length && skip !== 'price') {
    where.push(`(${ranges.map(() => '(p.price >= ? AND p.price < ?)').join(' OR ')})`);
    for (const r of ranges) params.push(r.min, r.max);
  }
  if (query.minPrice) { where.push('p.price >= ?'); params.push(Math.round(Number(query.minPrice) * 100) || 0); }
  if (query.maxPrice) { where.push('p.price <= ?'); params.push(Math.round(Number(query.maxPrice) * 100) || 0); }
  if (query.rating && skip !== 'rating') {
    where.push('p.rating_avg >= ?');
    params.push(Number(query.rating) || 0);
  }
  if (query.onSale === 'true' && skip !== 'onSale') where.push('p.price < p.regular_price');
  if (query.inStock === 'true' && skip !== 'inStock') where.push('p.stock > 0');
  if (query.featured === 'true') where.push('p.is_featured = 1');
  return { sql: where.join(' AND '), params };
}

export function productsRouter(db) {
  const r = Router();
  const bySku = db.prepare(`${PRODUCT_SELECT} WHERE p.sku = ?`);

  function loadProduct(sku, { includeInactive = false } = {}) {
    const p = bySku.get(sku);
    if (!p || (!p.is_active && !includeInactive)) throw notFound('Product not found');
    return p;
  }

  r.get('/categories', (_req, res) => {
    const rows = db.prepare(`SELECT c.*, COUNT(p.id) AS product_count FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 GROUP BY c.id ORDER BY c.sort`).all();
    res.json(rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, icon: c.icon, productCount: c.product_count })));
  });

  r.get('/products', (req, res) => {
    const page = intParam(req.query.page, { fallback: 1, max: 10000 });
    const pageSize = intParam(req.query.pageSize, { fallback: 24, max: 100 });
    const sortKey = SORTS[req.query.sort] ? req.query.sort : 'best-match';
    const from = 'FROM products p JOIN categories c ON c.id = p.category_id';

    const { sql, params } = buildWhere(req.query);
    const { total } = db.prepare(`SELECT COUNT(*) AS total ${from} WHERE ${sql}`).get(...params);
    const rows = db.prepare(`SELECT p.*, c.slug AS category_slug, c.name AS category_name ${from} WHERE ${sql}
      ORDER BY ${SORTS[sortKey]} LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize);

    const brandW = buildWhere(req.query, 'brand');
    const brands = db.prepare(`SELECT p.brand AS name, COUNT(*) AS count ${from} WHERE ${brandW.sql} GROUP BY p.brand ORDER BY count DESC, p.brand`).all(...brandW.params);
    const catW = buildWhere(req.query, 'category');
    const categories = db.prepare(`SELECT c.slug, c.name, COUNT(*) AS count ${from} WHERE ${catW.sql} GROUP BY c.id ORDER BY c.sort`).all(...catW.params);
    const priceW = buildWhere(req.query, 'price');
    const prices = db.prepare(`SELECT p.price ${from} WHERE ${priceW.sql}`).all(...priceW.params).map((x) => x.price);
    const priceRanges = PRICE_RANGES.map(({ key, label, min, max }) => ({ key, label, count: prices.filter((v) => v >= min && v < max).length }))
      .filter((x) => x.count > 0);
    const ratingW = buildWhere(req.query, 'rating');
    const ratings = db.prepare(`SELECT p.rating_avg AS r ${from} WHERE ${ratingW.sql}`).all(...ratingW.params).map((x) => x.r);

    res.json({
      items: rows.map(serializeProduct),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      sort: sortKey,
      facets: {
        brands: brands.map((b) => ({ name: b.name, count: Number(b.count) })),
        categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: Number(c.count) })),
        priceRanges,
        ratings: [4, 3, 2].map((min) => ({ min, count: ratings.filter((v) => v >= min).length })),
      },
    });
  });

  r.get('/search/suggest', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) return res.json({ terms: [], products: [] });
    const like = `%${q}%`;
    const products = db.prepare(`${PRODUCT_SELECT} WHERE p.is_active = 1 AND (p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ?)
      ORDER BY p.rating_count DESC LIMIT 5`).all(like, like, like).map(serializeProduct);
    const brandTerms = db.prepare('SELECT DISTINCT brand FROM products WHERE is_active = 1 AND brand LIKE ? LIMIT 3').all(`${q}%`).map((b) => b.brand);
    const catTerms = db.prepare('SELECT name FROM categories WHERE name LIKE ? LIMIT 3').all(like).map((c) => c.name);
    res.json({ terms: [...new Set([...brandTerms, ...catTerms])].slice(0, 6), products });
  });

  r.get('/deals', (_req, res) => {
    const dealOfDay = db.prepare(`${PRODUCT_SELECT} WHERE p.is_deal_of_day = 1 AND p.is_active = 1 LIMIT 1`).get();
    const topDeals = db.prepare(`${PRODUCT_SELECT} WHERE p.is_active = 1 AND p.price < p.regular_price
      ORDER BY (p.regular_price - p.price) DESC LIMIT 12`).all();
    const endsAt = new Date();
    endsAt.setHours(23, 59, 59, 999);
    res.json({
      dealOfDay: dealOfDay ? serializeProduct(dealOfDay) : null,
      dealEndsAt: endsAt.toISOString(),
      topDeals: topDeals.map(serializeProduct),
    });
  });

  r.get('/products/:sku', (req, res) => {
    const p = loadProduct(req.params.sku);
    const related = db.prepare(`${PRODUCT_SELECT} WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY p.rating_count DESC LIMIT 8`).all(p.category_id, p.id);
    const questions = db.prepare('SELECT * FROM questions WHERE product_id = ? ORDER BY created_at DESC').all(p.id);
    const distribution = db.prepare('SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating').all(p.id);
    res.json({
      ...serializeProduct(p),
      ratingDistribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: Number(distribution.find((d) => d.rating === star)?.n || 0) })),
      questions: questions.map((q) => ({ id: q.id, author: q.author_name, question: q.question, answer: q.answer, createdAt: q.created_at })),
      related: related.map(serializeProduct),
    });
  });

  r.get('/products/:sku/reviews', (req, res) => {
    const p = loadProduct(req.params.sku);
    const sort = req.query.sort === 'helpful' ? 'helpful DESC, id DESC' : req.query.sort === 'rating-low' ? 'rating ASC, id DESC' : 'created_at DESC, id DESC';
    const rows = db.prepare(`SELECT * FROM reviews WHERE product_id = ? ORDER BY ${sort}`).all(p.id);
    res.json(rows.map((rv) => ({
      id: rv.id, author: rv.author_name, rating: rv.rating, title: rv.title, body: rv.body,
      recommend: !!rv.recommend, helpful: rv.helpful, createdAt: rv.created_at,
    })));
  });

  r.post('/products/:sku/reviews', requireAuth, (req, res) => {
    const p = loadProduct(req.params.sku);
    const rating = intParam(req.body.rating, { min: 1, max: 5 });
    if (!rating) throw badRequest('rating is required');
    const title = requireString(req.body.title, 'title', { max: 120 });
    const body = requireString(req.body.body, 'body', { max: 4000 });
    const existing = db.prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?').get(p.id, req.user.id);
    if (existing) throw badRequest('You have already reviewed this product.');
    const author = `${req.user.first_name} ${req.user.last_name.charAt(0)}.`;
    const info = db.prepare('INSERT INTO reviews (product_id, user_id, author_name, rating, title, body, recommend) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(p.id, req.user.id, author, rating, title, body, req.body.recommend === false ? 0 : 1);
    db.prepare(`UPDATE products SET rating_avg = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?) WHERE id = ?`).run(p.id, p.id, p.id);
    res.status(201).json({ id: Number(info.lastInsertRowid), author, rating, title, body });
  });

  r.post('/reviews/:id/helpful', (req, res) => {
    const info = db.prepare('UPDATE reviews SET helpful = helpful + 1 WHERE id = ?').run(Number(req.params.id));
    if (!info.changes) throw notFound('Review not found');
    res.json(db.prepare('SELECT id, helpful FROM reviews WHERE id = ?').get(Number(req.params.id)));
  });

  r.post('/products/:sku/questions', requireAuth, (req, res) => {
    const p = loadProduct(req.params.sku);
    const question = requireString(req.body.question, 'question', { max: 1000 });
    const author = `${req.user.first_name} ${req.user.last_name.charAt(0)}.`;
    const info = db.prepare('INSERT INTO questions (product_id, user_id, author_name, question) VALUES (?, ?, ?, ?)').run(p.id, req.user.id, author, question);
    res.status(201).json({ id: Number(info.lastInsertRowid), author, question, answer: null });
  });

  r.get('/products/:sku/availability', (req, res) => {
    const p = loadProduct(req.params.sku);
    const stores = db.prepare('SELECT id, name, city, state FROM stores ORDER BY id').all();
    // Store-level stock is simulated deterministically from the SKU and store id.
    res.json({
      shipping: p.stock > 0 ? { available: true, eta: 'Get it in 2-4 days' } : { available: false },
      stores: stores.map((s) => {
        const qty = p.stock === 0 ? 0 : (Number(p.sku) + s.id * 7) % 6;
        return { storeId: s.id, name: s.name, city: s.city, state: s.state, available: qty > 0, quantity: qty, pickup: qty > 0 ? 'Ready in 1 hour' : 'Unavailable' };
      }),
    });
  });

  r.get('/images/:file', (req, res) => {
    const sku = req.params.file.replace(/\.svg$/, '');
    const p = db.prepare('SELECT p.sku, p.brand, p.hue, c.icon FROM products p JOIN categories c ON c.id = p.category_id WHERE p.sku = ?').get(sku);
    if (!p) throw notFound('Image not found');
    const variant = Math.min(3, Math.max(0, Number(req.query.v) || 0));
    res.set('Content-Type', 'image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(productSvg({ ...p, variant }));
  });

  return r;
}
