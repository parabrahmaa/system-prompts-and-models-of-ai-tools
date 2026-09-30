import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function useRedirect() {
  const { state } = useLocation();
  const navigate = useNavigate();
  return () => navigate(state?.from || '/', { replace: true });
}

export function SignIn() {
  const { login, user } = useAuth();
  const done = useRedirect();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); done(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth-page">
      <form className="auth-card card-surface" onSubmit={submit}>
        <Logo />
        <h1>Sign In to Best Buy</h1>
        {error && <p className="form-error">{error}</p>}
        <label className="field"><span>Email Address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <div className="field">
          <label htmlFor="signin-password">Password</label>
          <span className="pw-wrap">
            <input id="signin-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" className="link-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
          </span>
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        <p className="muted small">Demo accounts: <code>demo@bestbuy.test / demo1234</code> · <code>admin@bestbuy.test / admin123</code></p>
        <hr />
        <p>Don't have an account? <Link to="/signup" state={state}>Create an account</Link></p>
      </form>
    </div>
  );
}

export function SignUp() {
  const { register, user } = useAuth();
  const done = useRedirect();
  const { state } = useLocation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={state?.from || '/'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError({ message: 'Passwords do not match.', field: 'confirm' }); return; }
    setBusy(true); setError(null);
    try {
      const { confirm: _c, ...data } = form;
      await register(data);
      done();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const cls = (k) => `field ${error?.field === k ? 'has-error' : ''}`;
  return (
    <div className="auth-page">
      <form className="auth-card card-surface" onSubmit={submit}>
        <Logo />
        <h1>Create an Account</h1>
        {error && <p className="form-error">{error.message}</p>}
        <label className={cls('firstName')}><span>First Name</span><input value={form.firstName} onChange={set('firstName')} required autoComplete="given-name" /></label>
        <label className={cls('lastName')}><span>Last Name</span><input value={form.lastName} onChange={set('lastName')} required autoComplete="family-name" /></label>
        <label className={cls('email')}><span>Email Address</span><input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></label>
        <label className={cls('password')}><span>Password</span><input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" /></label>
        <p className="muted small">At least 8 characters, including a letter and a number.</p>
        <label className={cls('confirm')}><span>Confirm Password</span><input type="password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" /></label>
        <label className="field"><span>Mobile Phone Number (optional)</span><input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create an Account'}</button>
        <hr />
        <p>Already have an account? <Link to="/signin" state={state}>Sign in</Link></p>
      </form>
    </div>
  );
}
