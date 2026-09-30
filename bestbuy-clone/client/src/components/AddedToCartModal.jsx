import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../format.js';
import { CheckIcon, CloseIcon } from './Icons.jsx';

export default function AddedToCartModal() {
  const { lastAdded, dismissAdded, cart } = useCart();
  useEffect(() => {
    if (!lastAdded) return;
    const onKey = (e) => e.key === 'Escape' && dismissAdded();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lastAdded, dismissAdded]);
  if (!lastAdded) return null;
  const { product, quantity } = lastAdded;
  return (
    <div className="modal-backdrop" onClick={dismissAdded}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="added-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={dismissAdded} aria-label="Close"><CloseIcon /></button>
        <h2 id="added-title"><CheckIcon className="ok-icon" /> Added to cart</h2>
        <div className="added-item">
          <img src={product.image} alt="" />
          <div>
            <p>{product.name}</p>
            <p className="muted">Qty {quantity} · {money(product.price * quantity)}</p>
          </div>
        </div>
        <div className="modal-summary">
          <span>Cart subtotal ({cart.summary.itemCount} items)</span>
          <b>{money(cart.summary.subtotal)}</b>
        </div>
        <div className="modal-actions">
          <Link to="/cart" className="btn btn-primary" onClick={dismissAdded}>Go to Cart</Link>
          <button className="btn btn-outline" onClick={dismissAdded}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
