import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';
import Price from './Price.jsx';
import AddToCartButton from './AddToCartButton.jsx';
import SaveButton from './SaveButton.jsx';

export function ProductCard({ product, compact = false }) {
  return (
    <article className={`product-card ${compact ? 'compact' : ''}`}>
      <Link to={`/product/${product.sku}`} className="product-card-img">
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-card-body">
        <Link to={`/product/${product.sku}`} className="product-card-name">{product.name}</Link>
        {!compact && <div className="sku-line"><span>Model: <b>{product.model}</b></span><span>SKU: <b>{product.sku}</b></span></div>}
        <Stars rating={product.rating} count={product.reviewCount} size={14} />
        <Price product={product} size="sm" />
        {!compact && (
          <div className="product-card-actions">
            <AddToCartButton product={product} />
            <SaveButton product={product} />
          </div>
        )}
      </div>
    </article>
  );
}

/** Horizontal list-style row used on search/category pages. */
export function ProductRow({ product }) {
  return (
    <article className="product-row">
      <Link to={`/product/${product.sku}`} className="product-row-img">
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-row-info">
        <Link to={`/product/${product.sku}`} className="product-row-name">{product.name}</Link>
        <div className="sku-line"><span>Model: <b>{product.model}</b></span><span>SKU: <b>{product.sku}</b></span></div>
        <Stars rating={product.rating} count={product.reviewCount} size={14} />
        <ul className="highlights">{product.highlights.slice(0, 3).map((h) => <li key={h}>{h}</li>)}</ul>
      </div>
      <div className="product-row-buy">
        <Price product={product} />
        <p className={`fulfillment ${product.inStock ? 'ok' : 'no'}`}>
          {product.inStock ? <>Pickup <b>Today</b> · Shipping <b>2-4 days</b></> : 'Sold out online'}
        </p>
        <AddToCartButton product={product} />
        <SaveButton product={product} />
      </div>
    </article>
  );
}
