import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { money, US_STATES } from '../format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { OrderSummary } from './Cart.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [fulfillment, setFulfillment] = useState('ship');
  const [storeId, setStoreId] = useState(user?.storeId || 1);
  const [address, setAddress] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', street: '', apt: '', city: '', state: '', zip: '' });
  const [contact, setContact] = useState({ email: user?.email || '', phone: user?.phone || '' });
  const [payment, setPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => { api('/stores').then(setStores).catch(() => {}); }, []);

  const s = cart.summary;
  // Mirrors the server's pricing so the summary updates as fulfillment changes.
  const shipping = fulfillment === 'pickup' || s.subtotal >= s.freeShippingThreshold ? 0 : s.standardShipping;
  const summary = { ...s, shipping, total: s.subtotal + shipping + s.tax };

  const place = async (e) => {
    e.preventDefault();
    setError(null);
    setPlacing(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          fulfillment,
          storeId: fulfillment === 'pickup' ? Number(storeId) : undefined,
          shippingAddress: fulfillment === 'ship' ? address : undefined,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          payment,
        },
      });
      await refresh();
      navigate(`/orders/${order.orderNumber}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setError(err);
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.items.length) {
    return <div className="container card-surface empty"><h1>Your cart is empty</h1><Link to="/">Continue shopping</Link></div>;
  }

  const field = (obj, set, key, label, props = {}) => (
    <label className={`field ${error?.field === key ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input value={obj[key]} onChange={(e) => set({ ...obj, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="container checkout">
      <h1>Checkout</h1>
      <form className="cart-layout" onSubmit={place}>
        <div className="checkout-steps">
          <section className="card-surface">
            <h2>1. Fulfillment</h2>
            <div className="ff-choice">
              <label className={fulfillment === 'ship' ? 'active' : ''}>
                <input type="radio" name="ff" checked={fulfillment === 'ship'} onChange={() => setFulfillment('ship')} />
                <b>Shipping</b><span className="muted">{s.subtotal >= s.freeShippingThreshold ? 'FREE' : money(s.standardShipping)} · Arrives in 2-4 days</span>
              </label>
              <label className={fulfillment === 'pickup' ? 'active' : ''}>
                <input type="radio" name="ff" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} />
                <b>Store Pickup</b><span className="muted">FREE · Ready in 1 hour</span>
              </label>
            </div>
            {fulfillment === 'pickup' ? (
              <label className="field"><span>Pickup store</span>
                <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                  {stores.map((st) => <option key={st.id} value={st.id}>{st.name} — {st.address}, {st.city}, {st.state}</option>)}
                </select>
              </label>
            ) : (
              <div className="form-grid">
                {field(address, setAddress, 'firstName', 'First name', { required: true, autoComplete: 'given-name' })}
                {field(address, setAddress, 'lastName', 'Last name', { required: true, autoComplete: 'family-name' })}
                <div className="span-2">{field(address, setAddress, 'street', 'Address', { required: true, autoComplete: 'address-line1' })}</div>
                <div className="span-2">{field(address, setAddress, 'apt', 'Apt, suite (optional)', { autoComplete: 'address-line2' })}</div>
                {field(address, setAddress, 'city', 'City', { required: true, autoComplete: 'address-level2' })}
                <label className={`field ${error?.field === 'state' ? 'has-error' : ''}`}><span>State</span>
                  <select value={address.state} required onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                    <option value="">Select</option>
                    {US_STATES.map((st) => <option key={st}>{st}</option>)}
                  </select>
                </label>
                {field(address, setAddress, 'zip', 'ZIP code', { required: true, inputMode: 'numeric', autoComplete: 'postal-code', pattern: '\\d{5}(-\\d{4})?' })}
              </div>
            )}
          </section>

          <section className="card-surface">
            <h2>2. Contact information</h2>
            <div className="form-grid">
              {field(contact, setContact, 'email', 'Email address', { type: 'email', required: true, autoComplete: 'email' })}
              {field(contact, setContact, 'phone', 'Phone number', { type: 'tel', autoComplete: 'tel' })}
            </div>
          </section>

          <section className="card-surface">
            <h2>3. Payment</h2>
            <p className="muted small">Demo store — no real charges. Use test card 4111 1111 1111 1111 with any future date.</p>
            <div className="form-grid">
              <div className="span-2">{field(payment, setPayment, 'cardNumber', 'Card number', { required: true, inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '4111 1111 1111 1111' })}</div>
              {field(payment, setPayment, 'expiry', 'Expiration (MM/YY)', { required: true, autoComplete: 'cc-exp', placeholder: 'MM/YY' })}
              {field(payment, setPayment, 'cvv', 'Security code', { required: true, inputMode: 'numeric', autoComplete: 'cc-csc', maxLength: 4 })}
            </div>
          </section>
        </div>

        <OrderSummary summary={summary}>
          <ul className="mini-lines">
            {cart.items.map(({ product, quantity }) => (
              <li key={product.sku}><img src={product.image} alt="" /><span>{product.name}</span><span className="muted">×{quantity}</span></li>
            ))}
          </ul>
          {error && <p className="form-error">{error.message}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={placing}>{placing ? 'Placing order…' : 'Place Your Order'}</button>
        </OrderSummary>
      </form>
    </div>
  );
}
