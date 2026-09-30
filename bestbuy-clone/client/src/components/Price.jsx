import { money } from '../format.js';

export default function Price({ product, size = 'md' }) {
  return (
    <div className={`price price-${size}`}>
      <div className="price-current">{money(product.price)}</div>
      {product.onSale && (
        <div className="price-savings">
          <span className="save-badge">Save {money(product.savings)}</span>
          <span className="was">Was {money(product.regularPrice)}</span>
        </div>
      )}
    </div>
  );
}
