import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { date, money } from '../format.js';
import Spinner from '../components/Spinner.jsx';
import { CheckIcon } from '../components/Icons.jsx';

function StatusPill({ status }) {
  return <span className={`status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

function OrderItems({ items }) {
  return (
    <ul className="order-items">
      {items.map((i) => (
        <li key={i.sku}>
          <img src={i.image} alt="" />
          <div><Link to={`/product/${i.sku}`}>{i.name}</Link><p className="muted small">SKU {i.sku} · Qty {i.quantity}</p></div>
          <b>{money(i.price * i.quantity)}</b>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetail() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/orders/${orderNumber}`).then(setOrder).catch((e) => setError(e.message)); }, [orderNumber]);

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try { setOrder(await api(`/orders/${orderNumber}/cancel`, { method: 'POST' })); } catch (e) { setError(e.message); }
  };

  if (error) return <div className="container card-surface empty"><h1>{error}</h1></div>;
  if (!order) return <div className="container"><Spinner /></div>;
  return (
    <div className="container order-detail">
      {state?.justPlaced && (
        <div className="card-surface confirm-banner">
          <CheckIcon width={36} height={36} />
          <div>
            <h1>Thanks for your order!</h1>
            <p>Order updates will go to <b>{order.contactEmail}</b>. You earned <b>{order.pointsEarned.toLocaleString()}</b> reward points.</p>
          </div>
        </div>
      )}
      <div className="card-surface">
        <div className="order-head">
          <div>
            <h2>Order #{order.orderNumber}</h2>
            <p className="muted">Placed {date(order.createdAt)}</p>
          </div>
          <StatusPill status={order.status} />
        </div>
        <div className="order-meta">
          <div>
            <h3>{order.fulfillment === 'pickup' ? 'Store Pickup' : 'Shipping To'}</h3>
            {order.fulfillment === 'pickup' ? (
              <p>{order.store.name}<br />{order.store.address}<br />{order.store.city}, {order.store.state} {order.store.zip}</p>
            ) : (
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />{order.shippingAddress.street} {order.shippingAddress.apt}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            )}
          </div>
          <div><h3>Payment</h3><p>{order.payment.brand} ending in {order.payment.last4}</p></div>
          <div>
            <h3>Total</h3>
            <dl className="mini-dl">
              <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {order.savings > 0 && <div><dt>You saved</dt><dd className="savings">{money(order.savings)}</dd></div>}
              <div><dt>Shipping</dt><dd>{order.shipping ? money(order.shipping) : 'FREE'}</dd></div>
              <div><dt>Tax</dt><dd>{money(order.tax)}</dd></div>
              <div className="total"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </div>
        </div>
        <OrderItems items={order.items} />
        <div className="order-actions">
          <Link to="/account/orders" className="btn btn-outline">All Orders</Link>
          {order.status === 'Processing' && <button className="btn btn-outline danger" onClick={cancel}>Cancel Order</button>}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api('/orders').then(setOrders).catch(() => setOrders([])); }, []);
  if (!orders) return <div className="container"><Spinner /></div>;
  return (
    <div className="container">
      <h1>Orders & Purchases</h1>
      {orders.length === 0 && <div className="card-surface empty"><p>You haven't placed any orders yet.</p><Link to="/deals">Shop deals</Link></div>}
      {orders.map((o) => (
        <div key={o.orderNumber} className="card-surface order-card">
          <div className="order-head">
            <div>
              <Link to={`/orders/${o.orderNumber}`}><h2>Order #{o.orderNumber}</h2></Link>
              <p className="muted">{date(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items · {money(o.total)} · {o.fulfillment === 'pickup' ? `Pickup at ${o.store.name}` : 'Shipping'}</p>
            </div>
            <StatusPill status={o.status} />
          </div>
          <OrderItems items={o.items} />
        </div>
      ))}
    </div>
  );
}

export { StatusPill };
