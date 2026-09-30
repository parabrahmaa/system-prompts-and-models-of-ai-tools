import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account() {
  const { user, setUser, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', storeId: user.storeId || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api('/stores').then(setStores).catch(() => {}); }, []);

  const save = async (body) => {
    setMsg(''); setError('');
    try {
      setUser(await api('/auth/me', { method: 'PATCH', body }));
      setMsg('Your changes have been saved.');
      return true;
    } catch (e) { setError(e.message); return false; }
  };

  const nextTier = user.memberTier === 'My Best Buy' ? 'My Best Buy Plus' : user.memberTier === 'My Best Buy Plus' ? 'My Best Buy Total' : null;

  return (
    <div className="container account">
      <h1>Hi, {user.firstName}</h1>
      <div className="account-grid">
        <section className="card-surface member-card">
          <p className="eyebrow">Membership</p>
          <h2>{user.memberTier}</h2>
          <p className="points"><b>{user.rewardPoints.toLocaleString()}</b> reward points</p>
          <p className="muted small">Earn points on every purchase. Higher tiers earn more points per dollar.</p>
          {nextTier && <p className="small">Upgrade to <b>{nextTier}</b> for more perks.</p>}
        </section>
        <section className="card-surface quick-links">
          <Link to="/account/orders">📦 Orders & Purchases</Link>
          <Link to="/saved">♡ Saved Items</Link>
          <Link to="/stores">🏬 My Store</Link>
          {user.role === 'admin' && <Link to="/admin">🛠 Admin Dashboard</Link>}
          <button className="link-btn" onClick={logout}>Sign Out</button>
        </section>

        <form className="card-surface" onSubmit={(e) => { e.preventDefault(); save({ ...form, storeId: form.storeId ? Number(form.storeId) : null }); }}>
          <h2>Personal details</h2>
          {msg && <p className="form-ok">{msg}</p>}
          {error && <p className="form-error">{error}</p>}
          <label className="field"><span>Email</span><input value={user.email} disabled /></label>
          <div className="form-grid">
            <label className="field"><span>First name</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label className="field"><span>Last name</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
          </div>
          <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="field"><span>My store</span>
            <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">None</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}, {s.state}</option>)}
            </select>
          </label>
          <button className="btn btn-primary">Save</button>
        </form>

        <form className="card-surface" onSubmit={async (e) => { e.preventDefault(); if (await save(pw)) setPw({ currentPassword: '', newPassword: '' }); }}>
          <h2>Change password</h2>
          <label className="field"><span>Current password</span><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" /></label>
          <label className="field"><span>New password</span><input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" /></label>
          <button className="btn btn-outline">Update password</button>
        </form>
      </div>
    </div>
  );
}
