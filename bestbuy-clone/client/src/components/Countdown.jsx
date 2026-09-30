import { useEffect, useState } from 'react';

export default function Countdown({ to }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(to).getTime() - now);
  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(left / 3.6e6);
  const m = Math.floor((left % 3.6e6) / 6e4);
  const s = Math.floor((left % 6e4) / 1000);
  return (
    <div className="countdown" aria-label="Time left">
      <span><b>{pad(h)}</b>hours</span>:<span><b>{pad(m)}</b>mins</span>:<span><b>{pad(s)}</b>secs</span>
    </div>
  );
}
