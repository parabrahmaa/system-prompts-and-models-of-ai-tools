import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, qs } from '../api.js';
import { ProductCard, ProductRow } from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import Stars from '../components/Stars.jsx';

const SORTS = [
  ['best-match', 'Best Match'],
  ['price-low', 'Price Low to High'],
  ['price-high', 'Price High to Low'],
  ['top-rated', 'Customer Rating'],
  ['biggest-savings', 'Biggest Savings'],
  ['newest', 'New Arrivals'],
];

function toggleListParam(params, key, value) {
  const set = new Set((params.get(key) || '').split(',').filter(Boolean));
  set.has(value) ? set.delete(value) : set.add(value);
  const next = new URLSearchParams(params);
  set.size ? next.set(key, [...set].join(',')) : next.delete(key);
  next.delete('page');
  return next;
}

export default function ProductList({ mode }) {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [cats, setCats] = useState([]);

  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);

  const query = useMemo(() => {
    const q = Object.fromEntries(params.entries());
    if (category) q.category = category;
    if (mode === 'deals') q.onSale = 'true';
    if (mode === 'deals' && !q.sort) q.sort = 'biggest-savings';
    return q;
  }, [params, category, mode]);

  useEffect(() => {
    // Keep showing the previous results while the next page loads so facets don't flicker.
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    api(`/products${qs(query)}`, { signal: ctrl.signal })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { if (e.name !== 'AbortError') { setError(e.message); setLoading(false); } });
    window.scrollTo(0, 0);
    return () => ctrl.abort();
  }, [query]);

  // A different category/search should not flash the previous listing's results.
  useEffect(() => { setData(null); }, [category, mode]);

  const catName = cats.find((c) => c.slug === category)?.name;
  const title = mode === 'deals' ? 'Top Deals' : mode === 'search' ? `Results for "${params.get('q') || ''}"` : catName || 'Products';
  const selected = (key) => new Set((params.get(key) || '').split(',').filter(Boolean));
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const activeFilters = ['brand', 'price', 'rating', 'onSale', 'inStock'].some((k) => params.get(k)) || (mode === 'search' && params.get('category'));

  return (
    <div className="container plp">
      <nav className="breadcrumb"><Link to="/">Best Buy</Link> / <span>{title}</span></nav>
      <h1 className="plp-title">{title}</h1>

      <div className="plp-layout">
        <aside className="facets card-surface">
          <div className="facets-head">
            <h2>Filters</h2>
            {activeFilters && <button className="link-btn" onClick={() => setParams(params.get('q') ? { q: params.get('q') } : {})}>Clear all</button>}
          </div>

          {data && !category && data.facets.categories.length > 0 && (
            <fieldset>
              <legend>Category</legend>
              {data.facets.categories.map((c) => (
                <label key={c.slug}><input type="radio" name="cat" checked={params.get('category') === c.slug} onChange={() => setParam('category', c.slug)} /> {c.name} <span className="muted">({c.count})</span></label>
              ))}
            </fieldset>
          )}

          <fieldset>
            <legend>Availability</legend>
            <label><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')} /> Exclude out of stock</label>
            {mode !== 'deals' && <label><input type="checkbox" checked={params.get('onSale') === 'true'} onChange={(e) => setParam('onSale', e.target.checked ? 'true' : '')} /> On sale</label>}
          </fieldset>

          {data && (
            <>
              <fieldset>
                <legend>Brand</legend>
                {data.facets.brands.map((b) => (
                  <label key={b.name}><input type="checkbox" checked={selected('brand').has(b.name)} onChange={() => setParams(toggleListParam(params, 'brand', b.name))} /> {b.name} <span className="muted">({b.count})</span></label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Price</legend>
                {data.facets.priceRanges.map((r) => (
                  <label key={r.key}><input type="checkbox" checked={selected('price').has(r.key)} onChange={() => setParams(toggleListParam(params, 'price', r.key))} /> {r.label} <span className="muted">({r.count})</span></label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Customer Rating</legend>
                {data.facets.ratings.map((r) => (
                  <label key={r.min}><input type="radio" name="rating" checked={params.get('rating') === String(r.min)} onChange={() => setParam('rating', String(r.min))} /> <Stars rating={r.min} size={13} /> & Up <span className="muted">({r.count})</span></label>
                ))}
              </fieldset>
            </>
          )}
        </aside>

        <section className={`plp-results ${loading && data ? 'is-loading' : ''}`} aria-busy={loading}>
          <div className="plp-toolbar card-surface">
            <span>{data ? `${data.total} item${data.total === 1 ? '' : 's'}` : '…'}</span>
            <div className="toolbar-right">
              <label>Sort By{' '}
                <select value={query.sort || 'best-match'} onChange={(e) => setParam('sort', e.target.value)}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <div className="view-toggle" role="group" aria-label="View">
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
                <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Grid</button>
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          {!data && !error && <Spinner />}
          {data && data.items.length === 0 && (
            <div className="card-surface empty">
              <h2>Hmm, we didn't find anything.</h2>
              <p>Try a different search term or clear some filters.</p>
            </div>
          )}
          {data && (view === 'list'
            ? <div className="product-rows">{data.items.map((p) => <ProductRow key={p.sku} product={p} />)}</div>
            : <div className="product-grid">{data.items.map((p) => <ProductCard key={p.sku} product={p} />)}</div>)}

          {data && data.totalPages > 1 && (
            <nav className="pagination" aria-label="Pages">
              <button disabled={data.page <= 1} onClick={() => setParam('page', String(data.page - 1))}>‹ Prev</button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === data.page ? 'active' : ''} onClick={() => setParam('page', String(n))}>{n}</button>
              ))}
              <button disabled={data.page >= data.totalPages} onClick={() => setParam('page', String(data.page + 1))}>Next ›</button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
