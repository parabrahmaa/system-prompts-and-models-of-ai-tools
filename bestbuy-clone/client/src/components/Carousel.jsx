import { useRef } from 'react';
import { ProductCard } from './ProductCard.jsx';

export default function Carousel({ title, products, action }) {
  const track = useRef(null);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!products?.length) return null;
  return (
    <section className="carousel card-surface">
      <header className="section-head">
        <h2>{title}</h2>
        {action}
      </header>
      <div className="carousel-wrap">
        <button className="carousel-btn prev" onClick={() => scroll(-1)} aria-label="Previous">‹</button>
        <div className="carousel-track" ref={track}>
          {products.map((p) => <ProductCard key={p.sku} product={p} compact />)}
        </div>
        <button className="carousel-btn next" onClick={() => scroll(1)} aria-label="Next">›</button>
      </div>
    </section>
  );
}
