import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Stores() {
  const { user, setUser } = useAuth();
  const [q, setQ] = useState('');
  const [stores, setStores] = useState([]);
  const search = (term = q) => api(`/stores${qs({ q: term })}`).then(setStores).catch(() => {});
  useEffect(() => { search(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const makeMyStore = async (id) => setUser(await api('/auth/me', { method: 'PATCH', body: { storeId: id } }));

  return (
    <div className="container stores">
      <h1>Store Locator</h1>
      <form className="inline-form card-surface" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter ZIP code, city or state" aria-label="Find a store" />
        <button className="btn btn-primary">Find Stores</button>
      </form>
      {stores.length === 0 && <p className="card-surface empty">No stores match your search.</p>}
      <ul className="store-list">
        {stores.map((s) => (
          <li key={s.id} className="card-surface">
            <div>
              <h2>{s.name} {user?.storeId === s.id && <span className="my-store">My Store</span>}</h2>
              <p>{s.address}<br />{s.city}, {s.state} {s.zip}</p>
              <p><a href={`tel:${s.phone}`}>{s.phone}</a></p>
            </div>
            <dl className="hours">{Object.entries(s.hours).map(([d, h]) => <div key={d}><dt>{d}</dt><dd>{h}</dd></div>)}</dl>
            <div className="store-actions">
              <a className="btn btn-outline" href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=15/${s.lat}/${s.lng}`} target="_blank" rel="noreferrer">Directions</a>
              {user && user.storeId !== s.id && <button className="btn btn-primary" onClick={() => makeMyStore(s.id)}>Make This My Store</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
