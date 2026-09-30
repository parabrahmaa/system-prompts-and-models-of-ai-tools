import { Link } from 'react-router-dom';

const COLUMNS = [
  ['Order & Purchases', [['Check Order Status', '/account/orders'], ['Shipping, Delivery & Store Pickup', '/stores'], ['Returns & Exchanges', '/account/orders'], ['Saved Items', '/saved']]],
  ['Support & Services', [['Visit our Support Center', '/stores'], ['Shop with an Expert', '/stores'], ['Store Locator', '/stores']]],
  ['Rewards & Membership', [['My Best Buy Memberships', '/account'], ['Top Deals', '/deals'], ['Deal of the Day', '/deals']]],
  ['Shop', [['TVs & Projectors', '/site/tvs'], ['Laptops & Computers', '/site/laptops'], ['Cell Phones', '/site/phones'], ['Video Games', '/site/gaming']]],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {COLUMNS.map(([title, links]) => (
          <div key={title}>
            <h4>{title}</h4>
            <ul>{links.map(([label, to]) => <li key={label}><Link to={to}>{label}</Link></li>)}</ul>
          </div>
        ))}
        <div className="footer-signup">
          <h4>Get the latest deals and more.</h4>
          <form onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); alert('Thanks for signing up!'); }}>
            <input type="email" required placeholder="Enter email address" aria-label="Email address" />
            <button className="btn btn-primary">Sign Up</button>
          </form>
        </div>
      </div>
      <div className="footer-legal">
        <div className="container">
          <p>Educational replica of a consumer-electronics storefront. Not affiliated with or endorsed by Best Buy Co., Inc. Prices, products and stores are demo data.</p>
        </div>
      </div>
    </footer>
  );
}
