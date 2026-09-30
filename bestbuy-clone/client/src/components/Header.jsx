import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, qs } from '../api.js';
import { money } from '../format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Logo from './Logo.jsx';
import { CartIcon, ChevronIcon, CloseIcon, MenuIcon, SearchIcon, StoreIcon, UserIcon } from './Icons.jsx';

function SearchBox() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [suggest, setSuggest] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const box = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setSuggest(null); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => api(`/search/suggest${qs({ q })}`, { signal: ctrl.signal }).then(setSuggest).catch(() => {}), 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (term) => {
    setOpen(false);
    if (term.trim()) navigate(`/search${qs({ q: term.trim() })}`);
  };

  return (
    <div className="search" ref={box}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q); }}>
        <input
          type="search"
          value={q}
          placeholder="What can we help you find today?"
          aria-label="Search"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {q && <button type="button" className="search-clear" onClick={() => setQ('')} aria-label="Clear search"><CloseIcon width={16} /></button>}
        <button type="submit" className="search-submit" aria-label="Submit search"><SearchIcon /></button>
      </form>
      {open && suggest && (suggest.terms.length > 0 || suggest.products.length > 0) && (
        <div className="suggest">
          {suggest.terms.length > 0 && (
            <ul className="suggest-terms">
              {suggest.terms.map((t) => <li key={t}><button onClick={() => { setQ(t); go(t); }}><SearchIcon width={14} /> {t}</button></li>)}
            </ul>
          )}
          <ul className="suggest-products">
            {suggest.products.map((p) => (
              <li key={p.sku}>
                <Link to={`/product/${p.sku}`} onClick={() => setOpen(false)}>
                  <img src={p.image} alt="" />
                  <span className="suggest-name">{p.name}</span>
                  <b>{money(p.price)}</b>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MenuDrawer({ open, onClose }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <nav className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Shop by department">
        <header><Logo /><button onClick={onClose} aria-label="Close menu"><CloseIcon /></button></header>
        <h3>Shop by Department</h3>
        <ul>
          {cats.map((c) => (
            <li key={c.slug}><Link to={`/site/${c.slug}`} onClick={onClose}>{c.name} <ChevronIcon width={16} /></Link></li>
          ))}
        </ul>
        <h3>Featured</h3>
        <ul>
          <li><Link to="/deals" onClick={onClose}>Top Deals <ChevronIcon width={16} /></Link></li>
          <li><Link to="/deals" onClick={onClose}>Deal of the Day <ChevronIcon width={16} /></Link></li>
          <li><Link to="/stores" onClick={onClose}>Store Locator <ChevronIcon width={16} /></Link></li>
        </ul>
      </nav>
    </>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="account-menu" ref={ref}>
      <button className="header-link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <UserIcon /> <span>{user ? `Hi, ${user.firstName}` : 'Account'}</span>
      </button>
      {open && (
        <div className="account-pop">
          {user ? (
            <>
              <p className="muted">{user.memberTier} · {user.rewardPoints.toLocaleString()} pts</p>
              <Link to="/account">Account Home</Link>
              <Link to="/account/orders">Orders & Purchases</Link>
              <Link to="/saved">Saved Items</Link>
              {user.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
              <button className="btn btn-outline" onClick={() => { logout(); setOpen(false); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link className="btn btn-primary" to="/signin" state={{ from: location.pathname }}>Sign In</Link>
              <Link className="btn btn-outline" to="/signup">Create Account</Link>
              <Link to="/account/orders">Order Status</Link>
              <Link to="/saved">Saved Items</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [menu, setMenu] = useState(false);
  const { cart } = useCart();
  const count = cart.summary.itemCount;
  return (
    <header className="site-header">
      <div className="header-main">
        <div className="container header-row">
          <button className="menu-btn" onClick={() => setMenu(true)} aria-label="Open menu"><MenuIcon /><span>Menu</span></button>
          <Logo />
          <SearchBox />
          <nav className="header-links">
            <Link to="/stores" className="header-link"><StoreIcon /><span>Stores</span></Link>
            <AccountMenu />
            <Link to="/cart" className="header-link cart-link" aria-label={`Cart, ${count} items`}>
              <span className="cart-icon"><CartIcon />{count > 0 && <span className="cart-count">{count}</span>}</span>
              <span>Cart</span>
            </Link>
          </nav>
        </div>
      </div>
      <nav className="header-sub">
        <div className="container sub-row">
          <NavLink to="/deals">Top Deals</NavLink>
          <NavLink to="/deals#deal-of-the-day">Deal of the Day</NavLink>
          <NavLink to="/site/tvs">TVs</NavLink>
          <NavLink to="/site/laptops">Laptops</NavLink>
          <NavLink to="/site/phones">Cell Phones</NavLink>
          <NavLink to="/site/gaming">Video Games</NavLink>
          <NavLink to="/site/appliances">Appliances</NavLink>
          <span className="spacer" />
          <NavLink to="/account/orders">Order Status</NavLink>
          <NavLink to="/saved">Saved Items</NavLink>
        </div>
      </nav>
      <MenuDrawer open={menu} onClose={() => setMenu(false)} />
    </header>
  );
}
