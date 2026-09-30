import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api.js';
import { date, money } from '../format.js';
import Spinner from '../components/Spinner.jsx';
import { StatusPill } from './Orders.jsx';

const STATUSES = ['Processing', 'Shipped', 'Ready for Pickup', 'Delivered', 'Picked Up', 'Cancelled'];

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats').then(setS).catch(() => {}); }, []);
  if (!s) return <Spinner />;
  const max = Math.max(1, ...s.salesByDay.map((d) => d.total));
  return (
    <>
      <div className="stat-row">
        <div className="stat card-surface"><span>Revenue</span><b>{money(s.revenue)}</b></div>
        <div className="stat card-surface"><span>Orders</span><b>{s.orders}</b></div>
        <div className="stat card-surface"><span>Customers</span><b>{s.customers}</b></div>
        <div className="stat card-surface"><span>Active products</span><b>{s.products}</b></div>
      </div>
      <div className="admin-grid">
        <section className="card-surface">
          <h2>Sales, last 14 days</h2>
          {s.salesByDay.length === 0 ? <p className="muted">No sales yet.</p> : (
            <div className="bars">
              {s.salesByDay.map((d) => (
                <div key={d.day} className="bar-col" title={`${d.day}: ${money(d.total)} (${d.orders} orders)`}>
                  <span className="bar-val">{money(d.total)}</span>
                  <span className="bar-fill" style={{ height: `${(d.total / max) * 100}%` }} />
                  <span className="bar-label">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card-surface">
          <h2>Top sellers</h2>
          {s.topProducts.length === 0 ? <p className="muted">No sales yet.</p> : (
            <ol className="top-list">{s.topProducts.map((p) => <li key={p.sku}><Link to={`/product/${p.sku}`}>{p.name}</Link> <span className="muted">{p.units} units · {money(p.revenue)}</span></li>)}</ol>
          )}
          <h2>Low stock</h2>
          <ul className="top-list">{s.lowStock.map((p) => <li key={p.sku}><Link to={`/product/${p.sku}`}>{p.name}</Link> <span className={p.stock ? 'muted' : 'form-error'}>{p.stock} left</span></li>)}</ul>
        </section>
      </div>
    </>
  );
}

const EMPTY_PRODUCT = { sku: '', name: '', brand: '', model: '', category: 'tvs', description: '', price: '', regularPrice: '', stock: 10, highlights: '', isFeatured: false, isDealOfDay: false, isActive: true };

function ProductEditor({ product, categories, onClose, onSaved }) {
  const isNew = !product;
  const [f, setF] = useState(() => (isNew ? EMPTY_PRODUCT : {
    ...product, category: product.category.slug, price: (product.price / 100).toFixed(2), regularPrice: (product.regularPrice / 100).toFixed(2), highlights: product.highlights.join('\n'),
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      name: f.name, brand: f.brand, model: f.model, category: f.category, description: f.description,
      price: Math.round(Number(f.price) * 100), regularPrice: Math.round(Number(f.regularPrice || f.price) * 100), stock: Number(f.stock),
      highlights: f.highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      isFeatured: f.isFeatured, isDealOfDay: f.isDealOfDay, isActive: f.isActive,
      ...(isNew && f.sku ? { sku: f.sku } : {}),
    };
    try {
      await api(isNew ? '/admin/products' : `/admin/products/${product.sku}`, { method: isNew ? 'POST' : 'PUT', body });
      onSaved();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{isNew ? 'Add product' : `Edit ${product.sku}`}</h2>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <label className="field span-2"><span>Name</span><input value={f.name} onChange={set('name')} required /></label>
          <label className="field"><span>Brand</span><input value={f.brand} onChange={set('brand')} required /></label>
          <label className="field"><span>Model</span><input value={f.model} onChange={set('model')} required /></label>
          {isNew && <label className="field"><span>SKU (optional)</span><input value={f.sku} onChange={set('sku')} pattern="\d{5,10}" /></label>}
          <label className="field"><span>Category</span>
            <select value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          </label>
          <label className="field"><span>Sale price ($)</span><input type="number" step="0.01" min="0.01" value={f.price} onChange={set('price')} required /></label>
          <label className="field"><span>Regular price ($)</span><input type="number" step="0.01" min="0.01" value={f.regularPrice} onChange={set('regularPrice')} /></label>
          <label className="field"><span>Stock</span><input type="number" min="0" value={f.stock} onChange={set('stock')} required /></label>
          <label className="field span-2"><span>Description</span><textarea rows={3} value={f.description} onChange={set('description')} /></label>
          <label className="field span-2"><span>Highlights (one per line)</span><textarea rows={3} value={f.highlights} onChange={set('highlights')} /></label>
          <div className="checks span-2">
            <label><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Featured</label>
            <label><input type="checkbox" checked={f.isDealOfDay} onChange={set('isDealOfDay')} /> Deal of the Day</label>
            <label><input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Active</label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary">Save</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Products() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const load = () => api(`/admin/products${qs({ q })}`).then(setItems).catch(() => {});
  useEffect(() => { api('/categories').then(setCats); }, []);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (p) => {
    if (!confirm(`Deactivate ${p.name}?`)) return;
    await api(`/admin/products/${p.sku}`, { method: 'DELETE' });
    load();
  };

  return (
    <section className="card-surface">
      <div className="admin-toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU or brand" aria-label="Search products" />
        <button className="btn btn-primary" onClick={() => setEditing(null)}>+ Add product</button>
      </div>
      {!items ? <Spinner /> : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th /><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.sku} className={p.isActive ? '' : 'inactive'}>
                  <td><img src={p.image} alt="" /></td>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category.name}</td>
                  <td>{money(p.price)}{p.onSale && <div className="was">{money(p.regularPrice)}</div>}</td>
                  <td className={p.stock < 5 ? 'form-error' : ''}>{p.stock}</td>
                  <td>{p.isActive ? 'Active' : 'Inactive'}{p.isDealOfDay && ' · DOTD'}</td>
                  <td className="row-actions">
                    <button className="link-btn" onClick={() => setEditing(p)}>Edit</button>
                    {p.isActive && <button className="link-btn danger" onClick={() => remove(p)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing !== undefined && (
        <ProductEditor product={editing} categories={cats} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </section>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const load = () => api(`/admin/orders${qs({ status: filter })}`).then(setOrders).catch(() => {});
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (o, status) => {
    setError('');
    try { await api(`/admin/orders/${o.orderNumber}`, { method: 'PATCH', body: { status } }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <section className="card-surface">
      <div className="admin-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!orders ? <Spinner /> : orders.length === 0 ? <p className="muted">No orders.</p> : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Fulfillment</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderNumber}>
                  <td><Link to={`/orders/${o.orderNumber}`}>{o.orderNumber}</Link></td>
                  <td>{date(o.createdAt)}</td>
                  <td>{o.customerEmail}</td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{money(o.total)}</td>
                  <td>{o.fulfillment === 'pickup' ? `Pickup · ${o.store.name}` : 'Ship'}</td>
                  <td>
                    {o.status === 'Cancelled' ? <StatusPill status={o.status} /> : (
                      <select value={o.status} onChange={(e) => update(o, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Customers() {
  const [users, setUsers] = useState(null);
  useEffect(() => { api('/admin/users').then(setUsers).catch(() => {}); }, []);
  if (!users) return <Spinner />;
  return (
    <section className="card-surface table-wrap">
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tier</th><th>Points</th><th>Orders</th><th>Joined</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}><td>{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.role}</td><td>{u.memberTier}</td><td>{u.rewardPoints}</td><td>{u.orderCount}</td><td>{date(u.createdAt)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const TABS = { dashboard: ['Dashboard', Dashboard], products: ['Products', Products], orders: ['Orders', AdminOrders], customers: ['Customers', Customers] };

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const Current = TABS[tab][1];
  return (
    <div className="container admin">
      <h1>Admin Dashboard</h1>
      <nav className="tabs" role="tablist">
        {Object.entries(TABS).map(([key, [label]]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>
      <Current />
    </div>
  );
}
