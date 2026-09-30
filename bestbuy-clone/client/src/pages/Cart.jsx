import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { money } from '../format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import SaveButton from '../components/SaveButton.jsx';

export function OrderSummary({ summary, children }) {
  const remaining = summary.freeShippingThreshold - summary.subtotal;
  return (
    <aside className="order-summary card-surface">
      <h2>Order Summary</h2>
      <dl>
        <div><dt>Original Price</dt><dd>{money(summary.subtotal + summary.savings)}</dd></div>
        {summary.savings > 0 && <div className="savings"><dt>Savings</dt><dd>−{money(summary.savings)}</dd></div>}
        <div><dt>Shipping</dt><dd>{summary.shipping ? money(summary.shipping) : 'FREE'}</dd></div>
        <div><dt>Estimated Sales Tax</dt><dd>{money(summary.tax)}</dd></div>
        <div className="total"><dt>Total</dt><dd>{money(summary.total)}</dd></div>
      </dl>
      {remaining > 0 && summary.subtotal > 0 && <p className="muted small">Add {money(remaining)} more for free shipping.</p>}
      {children}
    </aside>
  );
}

export default function Cart() {
  const { cart, setQuantity, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const change = async (sku, q) => {
    setError('');
    try { await setQuantity(sku, q); } catch (e) { setError(e.message); }
  };

  if (!cart.items.length) {
    return (
      <div className="container">
        <div className="card-surface empty">
          <h1>Your cart is empty</h1>
          <p>Not sure where to start? <Link to="/deals">Check out today's top deals.</Link></p>
          {!user && <p><Link to="/signin" state={{ from: '/cart' }}>Sign in</Link> to see items you added previously.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Your Cart</h1>
      {error && <p className="form-error">{error}</p>}
      <div className="cart-layout">
        <ul className="cart-lines card-surface">
          {cart.items.map(({ product, quantity }) => (
            <li key={product.sku} className="cart-line">
              <Link to={`/product/${product.sku}`}><img src={product.image} alt="" /></Link>
              <div className="cart-line-info">
                <Link to={`/product/${product.sku}`}>{product.name}</Link>
                <div className="sku-line"><span>Model: <b>{product.model}</b></span><span>SKU: <b>{product.sku}</b></span></div>
                {!product.inStock && <p className="form-error">This item is sold out.</p>}
                <div className="cart-line-actions">
                  <button className="link-btn" onClick={() => remove(product.sku)}>Remove</button>
                  {user && <SaveButton product={product} />}
                </div>
              </div>
              <label className="qty">Qty
                <select value={quantity} onChange={(e) => change(product.sku, Number(e.target.value))}>
                  {Array.from({ length: Math.max(quantity, Math.min(10, product.stock)) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
              <div className="cart-line-price">
                <b>{money(product.price * quantity)}</b>
                {product.onSale && <span className="was">Was {money(product.regularPrice * quantity)}</span>}
              </div>
            </li>
          ))}
        </ul>
        <OrderSummary summary={cart.summary}>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate(user ? '/checkout' : '/signin', { state: { from: '/checkout' } })}>
            Checkout
          </button>
          {!user && <p className="muted small">You'll sign in or create an account before checkout.</p>}
        </OrderSummary>
      </div>
    </div>
  );
}
