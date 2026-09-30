import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { HeartIcon } from './Icons.jsx';

export default function SaveButton({ product, label = true }) {
  const { user } = useAuth();
  const { isSaved, toggleSaved } = useCart();
  const navigate = useNavigate();
  const saved = isSaved(product.sku);
  const onClick = () => (user ? toggleSaved(product) : navigate('/signin', { state: { from: `/product/${product.sku}` } }));
  return (
    <button className={`save-btn ${saved ? 'is-saved' : ''}`} onClick={onClick} aria-pressed={saved}>
      <HeartIcon filled={saved} width={18} height={18} />
      {label && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
