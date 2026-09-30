import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AddedToCartModal from './components/AddedToCartModal.jsx';
import Spinner from './components/Spinner.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders, { OrderDetail } from './pages/Orders.jsx';
import Account from './pages/Account.jsx';
import Saved from './pages/Saved.jsx';
import Stores from './pages/Stores.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';
import { SignIn, SignUp } from './pages/Auth.jsx';

function RequireAuth({ children, admin = false }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="container"><Spinner /></div>;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== 'admin') return <NotFound />;
  return children;
}

/** Scrolls to the top on page changes, or to #anchor targets once they render. */
function ScrollManager() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 300);
    return () => clearTimeout(t);
  }, [hash, pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Header />
      <ScrollManager />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/site/:category" element={<ProductList mode="category" />} />
          <Route path="/search" element={<ProductList mode="search" />} />
          <Route path="/deals" element={<ProductList mode="deals" />} />
          <Route path="/product/:sku" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/orders/:orderNumber" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/account/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AddedToCartModal />
    </>
  );
}
