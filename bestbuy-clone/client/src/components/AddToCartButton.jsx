import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { CartIcon } from './Icons.jsx';

export default function AddToCartButton({ product, quantity = 1, large = false }) {
  const { add } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!product.inStock) {
    return <button className={`btn btn-disabled ${large ? 'btn-lg' : ''}`} disabled>Sold Out</button>;
  }
  const onClick = async () => {
    setBusy(true);
    setError('');
    try { await add(product, quantity); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <>
      <button className={`btn btn-cart ${large ? 'btn-lg' : ''}`} onClick={onClick} disabled={busy}>
        <CartIcon width={18} height={18} /> {busy ? 'Adding…' : 'Add to Cart'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </>
  );
}
