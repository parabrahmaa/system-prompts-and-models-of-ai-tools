export default function Stars({ rating = 0, count, size = 16 }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="stars" aria-label={`Rating ${rating} out of 5${count !== undefined ? `, ${count} reviews` : ''}`}>
      <span className="stars-track" style={{ fontSize: size }}>
        ★★★★★
        <span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      {count !== undefined && <span className="stars-meta"><strong>{rating.toFixed(1)}</strong> ({count.toLocaleString()})</span>}
    </span>
  );
}
