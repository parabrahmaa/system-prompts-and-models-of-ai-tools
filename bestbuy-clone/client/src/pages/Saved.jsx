import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ProductCard } from '../components/ProductCard.jsx';

export default function Saved() {
  const { user } = useAuth();
  const { saved } = useCart();
  return (
    <div className="container">
      <h1>Saved Items</h1>
      {!user && <div className="card-surface empty"><p><Link to="/signin" state={{ from: '/saved' }}>Sign in</Link> to see your saved items.</p></div>}
      {user && saved.length === 0 && <div className="card-surface empty"><p>You have no saved items. Tap the ♡ on any product to save it for later.</p></div>}
      <div className="product-grid">{saved.map((p) => <ProductCard key={p.sku} product={p} />)}</div>
    </div>
  );
}
