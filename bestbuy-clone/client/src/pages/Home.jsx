import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Carousel from '../components/Carousel.jsx';
import Countdown from '../components/Countdown.jsx';
import Price from '../components/Price.jsx';
import Stars from '../components/Stars.jsx';
import AddToCartButton from '../components/AddToCartButton.jsx';
import Spinner from '../components/Spinner.jsx';

const CAT_ART = { tvs: '📺', laptops: '💻', phones: '📱', audio: '🎧', gaming: '🎮', appliances: '🧊', cameras: '📷', 'smart-home': '🔊', tablets: '📲', wearables: '⌚' };

export default function Home() {
  const [deals, setDeals] = useState(null);
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [tvs, setTvs] = useState([]);

  useEffect(() => {
    api('/deals').then(setDeals).catch(() => {});
    api('/categories').then(setCats).catch(() => {});
    api('/products?featured=true&pageSize=12').then((r) => setFeatured(r.items)).catch(() => {});
    api('/products?category=laptops&sort=top-rated&pageSize=12').then((r) => setLaptops(r.items)).catch(() => {});
    api('/products?category=tvs&onSale=true&pageSize=12').then((r) => setTvs(r.items)).catch(() => {});
  }, []);

  const dotd = deals?.dealOfDay;

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Fall Savings Event</p>
            <h1>Save big on the tech you love.</h1>
            <p>Hundreds of deals on TVs, laptops, appliances and more. Free shipping on orders $35+, or pick up in store today.</p>
            <div className="hero-actions">
              <Link to="/deals" className="btn btn-cart btn-lg">Shop Top Deals</Link>
              <Link to="/site/tvs" className="btn btn-ghost btn-lg">Shop TVs</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            {deals?.topDeals.slice(0, 3).map((p, i) => <img key={p.sku} src={p.images[i]} alt="" className={`hero-img hero-img-${i}`} />)}
          </div>
        </div>
      </section>

      <div className="container">
        <section className="card-surface cat-tiles">
          <h2>Shop by category</h2>
          <div className="cat-grid">
            {cats.map((c) => (
              <Link key={c.slug} to={`/site/${c.slug}`} className="cat-tile">
                <span className="cat-emoji" aria-hidden="true">{CAT_ART[c.slug] || '🛒'}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {!deals && <Spinner />}
        {dotd && (
          <section className="card-surface dotd" id="deal-of-the-day">
            <div className="dotd-head">
              <h2>Deal of the Day</h2>
              <Countdown to={deals.dealEndsAt} />
            </div>
            <div className="dotd-body">
              <Link to={`/product/${dotd.sku}`}><img src={dotd.image} alt={dotd.name} /></Link>
              <div>
                <Link to={`/product/${dotd.sku}`} className="dotd-name">{dotd.name}</Link>
                <Stars rating={dotd.rating} count={dotd.reviewCount} />
                <Price product={dotd} size="lg" />
                <AddToCartButton product={dotd} large />
              </div>
            </div>
          </section>
        )}

        {deals && <Carousel title="Top deals" products={deals.topDeals} action={<Link to="/deals">See all deals</Link>} />}

        <section className="promo-grid">
          <Link to="/site/gaming" className="promo promo-dark"><h3>Level up your play</h3><p>Consoles, controllers and VR.</p><span className="link-arrow">Shop gaming</span></Link>
          <Link to="/site/appliances" className="promo promo-light"><h3>Appliance upgrades</h3><p>Free haul-away on major appliances.</p><span className="link-arrow">Shop appliances</span></Link>
          <Link to="/site/smart-home" className="promo promo-yellow"><h3>Make your home smarter</h3><p>Speakers, cameras and more.</p><span className="link-arrow">Shop smart home</span></Link>
        </section>

        <Carousel title="Featured products" products={featured} />
        <Carousel title="Top-rated laptops" products={laptops} action={<Link to="/site/laptops">Shop all laptops</Link>} />
        <Carousel title="TVs on sale" products={tvs} action={<Link to="/site/tvs?onSale=true">Shop TV deals</Link>} />
      </div>
    </div>
  );
}
