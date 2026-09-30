import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container card-surface empty">
      <h1>Sorry, something went wrong.</h1>
      <p>We couldn't find the page you were looking for.</p>
      <Link to="/" className="btn btn-primary">Go to Homepage</Link>
    </div>
  );
}
