import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { date } from '../format.js';
import { useAuth } from '../context/AuthContext.jsx';
import Stars from '../components/Stars.jsx';
import Price from '../components/Price.jsx';
import AddToCartButton from '../components/AddToCartButton.jsx';
import SaveButton from '../components/SaveButton.jsx';
import Carousel from '../components/Carousel.jsx';
import Spinner from '../components/Spinner.jsx';
import { StoreIcon, TruckIcon } from '../components/Icons.jsx';

function Fulfillment({ sku }) {
  const { user } = useAuth();
  const [avail, setAvail] = useState(null);
  useEffect(() => { api(`/products/${sku}/availability`).then(setAvail).catch(() => {}); }, [sku]);
  if (!avail) return null;
  const store = avail.stores.find((s) => s.storeId === user?.storeId) || avail.stores.find((s) => s.available) || avail.stores[0];
  return (
    <div className="fulfillment-box">
      <div className={`ff-option ${store?.available ? 'ok' : 'no'}`}>
        <StoreIcon />
        <div>
          <b>Pickup</b>
          <p>{store?.available ? <>Ready in 1 hour at <b>{store.name}</b></> : `Unavailable at ${store?.name}`}</p>
          <Link to="/stores" className="small-link">Change store</Link>
        </div>
      </div>
      <div className={`ff-option ${avail.shipping.available ? 'ok' : 'no'}`}>
        <TruckIcon />
        <div>
          <b>Shipping</b>
          <p>{avail.shipping.available ? avail.shipping.eta : 'Unavailable'}</p>
          <p className="muted small">Free shipping on orders $35+</p>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ sku, onCreated }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/products/${sku}/reviews`, { method: 'POST', body: { rating, title, body } });
      setTitle(''); setBody('');
      onCreated();
    } catch (err) { setError(err.message); }
  };
  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Write a review</h3>
      <div className="rating-picker" role="radiogroup" aria-label="Overall rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} role="radio" aria-checked={rating === n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <input placeholder="Review title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      <textarea placeholder="What did you like or dislike?" value={body} onChange={(e) => setBody(e.target.value)} required rows={4} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary">Submit Review</button>
    </form>
  );
}

function Reviews({ product, onChange }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState('newest');
  const load = () => api(`/products/${product.sku}/reviews?sort=${sort}`).then(setReviews).catch(() => {});
  useEffect(() => { load(); }, [product.sku, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const max = Math.max(1, ...product.ratingDistribution.map((d) => d.count));
  const helpful = async (id) => {
    const r = await api(`/reviews/${id}/helpful`, { method: 'POST' });
    setReviews((rs) => rs.map((x) => (x.id === id ? { ...x, helpful: r.helpful, voted: true } : x)));
  };
  const recommendPct = reviews.length ? Math.round((reviews.filter((r) => r.recommend).length / reviews.length) * 100) : 0;

  return (
    <section className="pdp-section" id="reviews">
      <h2>Reviews</h2>
      <div className="review-summary">
        <div className="review-score">
          <span className="big-score">{product.rating.toFixed(1)}</span>
          <Stars rating={product.rating} size={20} />
          <p className="muted">{product.reviewCount} reviews</p>
          <p><b>{recommendPct}%</b> would recommend to a friend</p>
        </div>
        <ul className="dist">
          {product.ratingDistribution.map((d) => (
            <li key={d.star}><span>{d.star}★</span><span className="bar"><span style={{ width: `${(d.count / max) * 100}%` }} /></span><span>{d.count}</span></li>
          ))}
        </ul>
        <div>
          {user ? <ReviewForm sku={product.sku} onCreated={() => { load(); onChange(); }} /> : <p><Link to="/signin" state={{ from: `/product/${product.sku}` }}>Sign in</Link> to write a review.</p>}
        </div>
      </div>
      <div className="review-toolbar">
        <label>Sort by{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="rating-low">Lowest rated</option>
          </select>
        </label>
      </div>
      <ul className="review-list">
        {reviews.map((r) => (
          <li key={r.id}>
            <div className="review-author"><b>{r.author}</b><span className="muted">{date(r.createdAt)}</span></div>
            <div>
              <Stars rating={r.rating} size={14} />
              <h4>{r.title}</h4>
              <p>{r.body}</p>
              {r.recommend && <p className="recommend">✓ I would recommend this to a friend</p>}
              <button className="link-btn" disabled={r.voted} onClick={() => helpful(r.id)}>Helpful ({r.helpful})</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Questions({ product }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState(product.questions);
  const [q, setQ] = useState('');
  const ask = async (e) => {
    e.preventDefault();
    const created = await api(`/products/${product.sku}/questions`, { method: 'POST', body: { question: q } });
    setQuestions((qs) => [created, ...qs]);
    setQ('');
  };
  return (
    <section className="pdp-section" id="questions">
      <h2>Questions & Answers</h2>
      {user && (
        <form className="inline-form" onSubmit={ask}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question about this product" required />
          <button className="btn btn-outline">Ask</button>
        </form>
      )}
      {questions.length === 0 && <p className="muted">No questions yet.</p>}
      <ul className="qa-list">
        {questions.map((x) => (
          <li key={x.id}>
            <p><b>Q:</b> {x.question} <span className="muted small">— {x.author}</span></p>
            <p>{x.answer ? <><b>A:</b> {x.answer}</> : <span className="muted">Awaiting an answer.</span>}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProductDetail() {
  const { sku } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [openSpecs, setOpenSpecs] = useState(true);

  const load = () => api(`/products/${sku}`).then(setProduct).catch((e) => setError(e.status === 404 ? 'This product could not be found.' : e.message));
  useEffect(() => { setProduct(null); setImage(0); setQty(1); load(); }, [sku]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="container card-surface empty"><h1>{error}</h1><Link to="/">Continue shopping</Link></div>;
  if (!product) return <div className="container"><Spinner /></div>;

  return (
    <div className="container pdp">
      <nav className="breadcrumb">
        <Link to="/">Best Buy</Link> / <Link to={`/site/${product.category.slug}`}>{product.category.name}</Link> / <span>{product.brand}</span>
      </nav>
      <div className="pdp-top card-surface">
        <div className="gallery">
          <div className="thumbs">
            {product.images.map((src, i) => (
              <button key={src} className={i === image ? 'active' : ''} onClick={() => setImage(i)} aria-label={`Image ${i + 1}`}><img src={src} alt="" /></button>
            ))}
          </div>
          <div className="main-image"><img src={product.images[image]} alt={product.name} /></div>
        </div>

        <div className="pdp-info">
          <Link to={`/search?q=${encodeURIComponent(product.brand)}`} className="brand-link">{product.brand}</Link>
          <h1>{product.name}</h1>
          <div className="sku-line"><span>Model: <b>{product.model}</b></span><span>SKU: <b>{product.sku}</b></span></div>
          <a href="#reviews"><Stars rating={product.rating} count={product.reviewCount} /></a>
          <ul className="highlights">{product.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>

        <div className="pdp-buy">
          {product.isDealOfDay && <span className="dotd-badge">Deal of the Day</span>}
          <Price product={product} size="lg" />
          {product.inStock && product.stock < 10 && <p className="low-stock">Only {product.stock} left!</p>}
          <Fulfillment sku={product.sku} />
          <div className="buy-row">
            <label className="qty">Qty
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={!product.inStock}>
                {Array.from({ length: Math.max(1, Math.min(10, product.stock)) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <AddToCartButton product={product} quantity={qty} large />
          </div>
          <SaveButton product={product} />
          <div className="protection">
            <b>Protect your purchase</b>
            <p className="muted small">Protection plans available at checkout. 15-day return window for all members.</p>
          </div>
        </div>
      </div>

      <div className="pdp-sections card-surface">
        <section className="pdp-section">
          <h2>Overview</h2>
          <p>{product.description}</p>
        </section>
        <section className="pdp-section">
          <button className="accordion-head" onClick={() => setOpenSpecs((o) => !o)} aria-expanded={openSpecs}>
            <h2>Specifications</h2><span>{openSpecs ? '−' : '+'}</span>
          </button>
          {openSpecs && Object.entries(product.specs).map(([group, rows]) => (
            <div key={group} className="spec-group">
              <h3>{group}</h3>
              <dl>{Object.entries(rows).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>
          ))}
        </section>
        <Reviews product={product} onChange={load} />
        <Questions key={product.sku} product={product} />
      </div>

      <Carousel title="Customers also viewed" products={product.related} />
    </div>
  );
}
