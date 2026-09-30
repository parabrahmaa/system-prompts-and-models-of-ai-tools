import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Home">
      <svg viewBox="0 0 80 48" width="66" height="40" aria-hidden="true">
        <path d="M0 8 L14 0 H80 V36 L66 48 H0 Z" fill="#ffe000" />
        <circle cx="10" cy="24" r="3.4" fill="#0046be" />
        <text x="44" y="21" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="15" fill="#1d252c">BEST</text>
        <text x="44" y="37" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="15" fill="#1d252c">BUY</text>
      </svg>
    </Link>
  );
}
