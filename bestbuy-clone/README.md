# Best Buy Clone — full-stack storefront

A working replica of the Best Buy shopping experience: a React storefront and an Express/SQLite backend with accounts, catalog search, cart, checkout, orders, reviews, store pickup and an admin console.

> Educational project. It is not affiliated with or endorsed by Best Buy Co., Inc. All products, prices, stores and reviews are demo data, and product images are generated SVGs.

## Quick start

Requires **Node.js 22.13+**. The backend uses the built-in `node:sqlite` module, so there are no native dependencies.

```bash
cd bestbuy-clone
npm run install:all

# Development: two terminals
npm run dev:server   # API on http://localhost:4000 (auto-seeds on first run)
npm run dev:client   # Storefront on http://localhost:5173 (proxies /api to :4000)

# Production: build the client, then one server serves the site and the API
npm run build && npm start   # http://localhost:4000
```

Demo accounts (created by the seeder):

| Role     | Email                | Password   |
|----------|----------------------|------------|
| Customer | `demo@bestbuy.test`  | `demo1234` |
| Admin    | `admin@bestbuy.test` | `admin123` |

Test card at checkout: `4111 1111 1111 1111`, any future `MM/YY`, any 3-digit CVV. Only the card brand and last 4 digits are stored.

`npm run seed` wipes and reseeds the database (`server/data/store.db`). `npm test` runs the API test suite.

## Features

**Storefront (client/)**
- Blue header with a department drawer, live search suggestions (terms and products), store link, account menu and cart count
- Home page with hero, category tiles, Deal of the Day countdown, top-deals and category carousels
- Category, search and Top Deals listings with brand, price, rating, availability and on-sale facets, six sort orders, list/grid views and pagination, all kept in the URL
- Product pages with image gallery, highlights, pickup and shipping availability, quantity, Add to Cart modal, Save, grouped specifications, rating histogram, sortable reviews, "helpful" votes, a write-a-review form and Q&A
- Guest cart in localStorage that merges into the account cart on sign-in
- Checkout with shipping or store pickup, address, contact and card validation, a live order summary (savings, free shipping over $35, tax) and an order confirmation page
- Account: membership tier and reward points, profile, password change and home store; order history with cancellation; saved items; store locator
- Admin console: KPIs, 14-day sales chart, top sellers, low stock, product create/edit/deactivate, order status updates and a customer list
- Responsive down to phone widths

**API (server/)**

| Area | Endpoints |
|------|-----------|
| Catalog | `GET /api/categories`, `GET /api/products` (q, category, brand, price, minPrice, maxPrice, rating, onSale, inStock, featured, sort, page, pageSize, returns facets), `GET /api/products/:sku`, `GET /api/products/:sku/availability`, `GET /api/search/suggest`, `GET /api/deals`, `GET /api/images/:sku.svg` |
| Reviews & Q&A | `GET/POST /api/products/:sku/reviews`, `POST /api/reviews/:id/helpful`, `POST /api/products/:sku/questions` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH /api/auth/me` |
| Cart | `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/:sku`, `DELETE /api/cart`, `POST /api/cart/merge`, `POST /api/cart/quote` (guest pricing) |
| Saved | `GET /api/saved`, `POST/DELETE /api/saved/:sku` |
| Orders | `POST /api/orders` (checkout), `GET /api/orders`, `GET /api/orders/:orderNumber`, `POST /api/orders/:orderNumber/cancel` |
| Stores | `GET /api/stores?q=` (ZIP, city or state) |
| Admin | `GET /api/admin/stats`, `GET/POST /api/admin/products`, `PUT/DELETE /api/admin/products/:sku`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:orderNumber`, `GET /api/admin/users` |

Implementation notes:
- Money is stored in integer cents. Tax is 7.75%. Shipping is free at $35 and $5.99 below that; pickup is free.
- Checkout re-checks and decrements stock inside a transaction. Cancelling an order restores stock and removes the reward points it earned.
- Passwords are hashed with scrypt. Auth uses HS256 bearer tokens signed with `JWT_SECRET`, which is required when `NODE_ENV=production`.
- Deleting a product deactivates it (soft delete) so order history stays intact.

## Layout

```
bestbuy-clone/
├── server/
│   ├── src/
│   │   ├── index.js        # entry: open DB, seed if empty, listen
│   │   ├── app.js          # Express app, routers, error handler, serves client/dist
│   │   ├── db.js           # schema + transaction helper (node:sqlite)
│   │   ├── seed.js         # demo data seeder
│   │   ├── catalog.js      # product lines, stores, review snippets
│   │   ├── auth.js         # tokens + auth middleware
│   │   ├── images.js       # SVG product art
│   │   └── routes/         # products, account, cart, orders, saved, admin
│   └── test/api.test.js    # end-to-end API tests (node:test)
└── client/
    └── src/
        ├── App.jsx, main.jsx, api.js, format.js, styles.css
        ├── context/        # AuthContext, CartContext
        ├── components/     # Header, Footer, ProductCard, Carousel, …
        └── pages/          # Home, ProductList, ProductDetail, Cart, Checkout, Orders, Account, Admin, …
```

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | API/server port |
| `DB_FILE` | `server/data/store.db` | SQLite file (`:memory:` works too) |
| `JWT_SECRET` | dev-only value | Token signing secret (required in production) |
