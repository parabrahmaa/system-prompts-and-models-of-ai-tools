import { fileURLToPath } from 'node:url';
import { openDatabase, transaction } from './db.js';
import { CATEGORIES, STORES, REVIEW_SNIPPETS, REVIEWER_NAMES, buildCatalog } from './catalog.js';
import { hashPassword, mulberry32 } from './util.js';

const HOURS = JSON.stringify({ 'Mon-Sat': '10:00 AM - 9:00 PM', Sun: '11:00 AM - 7:00 PM' });

export function seed(db, { reset = false } = {}) {
  if (reset) {
    for (const t of ['order_items', 'orders', 'cart_items', 'saved_items', 'questions', 'reviews', 'products', 'categories', 'users', 'stores']) {
      db.exec(`DELETE FROM ${t}; DELETE FROM sqlite_sequence WHERE name = '${t}';`);
    }
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
  if (n > 0) return false;

  const rand = mulberry32(20260930);
  transaction(db, () => {
    const insStore = db.prepare('INSERT INTO stores (name, address, city, state, zip, phone, lat, lng, hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of STORES) insStore.run(s.name, s.address, s.city, s.state, s.zip, s.phone, s.lat, s.lng, HOURS);

    const insCat = db.prepare('INSERT INTO categories (slug, name, icon, sort) VALUES (?, ?, ?, ?)');
    const catIds = {};
    CATEGORIES.forEach((c, i) => {
      catIds[c.slug] = Number(insCat.run(c.slug, c.name, c.icon, i).lastInsertRowid);
    });

    const insUser = db.prepare('INSERT INTO users (email, password_hash, first_name, last_name, role, member_tier, reward_points, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insUser.run('admin@bestbuy.test', hashPassword('admin123'), 'Store', 'Admin', 'admin', 'My Best Buy Total', 0, 1);
    insUser.run('demo@bestbuy.test', hashPassword('demo1234'), 'Demo', 'Shopper', 'customer', 'My Best Buy Plus', 1250, 1);

    const insProduct = db.prepare(`INSERT INTO products
      (sku, model, name, brand, category_id, description, price, regular_price, stock, hue, highlights, specs, is_featured, is_deal_of_day)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insReview = db.prepare('INSERT INTO reviews (product_id, author_name, rating, title, body, recommend, helpful, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insQuestion = db.prepare('INSERT INTO questions (product_id, author_name, question, answer) VALUES (?, ?, ?, ?)');

    const catalog = buildCatalog();
    const dealIndex = Math.floor(rand() * catalog.length);
    catalog.forEach((p, i) => {
      const regular = Math.round(p.regular * 100) - 1; // $x99.99 style
      const onSale = rand() < 0.45;
      const discount = onSale ? [0.1, 0.15, 0.2, 0.25, 0.3][Math.floor(rand() * 5)] : 0;
      const price = onSale ? Math.round((regular * (1 - discount)) / 100) * 100 - 1 : regular;
      const sku = String(6400000 + i * 137 + Math.floor(rand() * 100));
      const stock = rand() < 0.08 ? 0 : 3 + Math.floor(rand() * 60);
      const hue = Math.floor(rand() * 360);
      const id = Number(insProduct.run(
        sku, p.model, p.name, p.brand, catIds[p.category], p.description, price, regular, stock, hue,
        JSON.stringify(p.highlights), JSON.stringify(p.specs), rand() < 0.25 ? 1 : 0, i === dealIndex ? 1 : 0,
      ).lastInsertRowid);

      const reviewCount = 2 + Math.floor(rand() * 6);
      for (let r = 0; r < reviewCount; r++) {
        const [rating, title, body] = REVIEW_SNIPPETS[Math.floor(rand() * REVIEW_SNIPPETS.length)];
        const daysAgo = Math.floor(rand() * 300);
        insReview.run(id, REVIEWER_NAMES[Math.floor(rand() * REVIEWER_NAMES.length)], rating, title, body,
          rating >= 3 ? 1 : 0, Math.floor(rand() * 40), new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 19).replace('T', ' '));
      }
      if (rand() < 0.6) {
        insQuestion.run(id, 'Curious Shopper', `Does the ${p.brand} come with a warranty?`, `Yes, it includes the standard ${p.brand} manufacturer warranty. Protection plans are also available.`);
      }
    });
    db.exec(`UPDATE products SET
      rating_avg = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = products.id), 0),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id)`);
  });
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDatabase();
  const seeded = seed(db, { reset: process.argv.includes('--reset') });
  console.log(seeded ? 'Database seeded.' : 'Database already has data (use --reset to reseed).');
}
