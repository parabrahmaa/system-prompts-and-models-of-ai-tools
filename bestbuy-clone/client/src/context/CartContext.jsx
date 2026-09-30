import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const GUEST_KEY = 'bby_guest_cart';
const CartContext = createContext(null);
const EMPTY = { items: [], summary: { itemCount: 0, subtotal: 0, savings: 0, shipping: 0, tax: 0, total: 0 } };

function readGuest() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; }
}
function writeGuest(items) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
}

/**
 * Signed-in carts live on the server. Guest carts live in localStorage as
 * [{sku, quantity}] and are priced via /cart/quote, then merged on sign-in.
 */
export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [lastAdded, setLastAdded] = useState(null);
  const [saved, setSaved] = useState([]);
  const merged = useRef(false);

  const quoteGuest = useCallback(async (items = readGuest()) => {
    setCart(items.length ? await api('/cart/quote', { method: 'POST', body: { items } }) : EMPTY);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      merged.current = false;
      setSaved([]);
      quoteGuest().catch(() => setCart(EMPTY));
      return;
    }
    (async () => {
      const guest = readGuest();
      if (guest.length && !merged.current) {
        merged.current = true;
        setCart(await api('/cart/merge', { method: 'POST', body: { items: guest } }));
        writeGuest([]);
      } else {
        setCart(await api('/cart'));
      }
      setSaved(await api('/saved'));
    })().catch(() => setCart(EMPTY));
  }, [user, ready, quoteGuest]);

  const updateGuest = useCallback(async (fn) => {
    const next = fn(readGuest()).filter((i) => i.quantity > 0);
    writeGuest(next);
    await quoteGuest(next);
  }, [quoteGuest]);

  const add = useCallback(async (product, quantity = 1) => {
    if (user) {
      setCart(await api('/cart/items', { method: 'POST', body: { sku: product.sku, quantity } }));
    } else {
      await updateGuest((items) => {
        const found = items.find((i) => i.sku === product.sku);
        if (found) found.quantity = Math.min(10, found.quantity + quantity);
        else items.push({ sku: product.sku, quantity });
        return items;
      });
    }
    setLastAdded({ product, quantity });
  }, [user, updateGuest]);

  const setQuantity = useCallback(async (sku, quantity) => {
    if (user) setCart(await api(`/cart/items/${sku}`, { method: 'PATCH', body: { quantity } }));
    else await updateGuest((items) => items.map((i) => (i.sku === sku ? { ...i, quantity } : i)));
  }, [user, updateGuest]);

  const remove = useCallback((sku) => setQuantity(sku, 0), [setQuantity]);

  const refresh = useCallback(async () => {
    if (user) setCart(await api('/cart'));
    else await quoteGuest();
  }, [user, quoteGuest]);

  const toggleSaved = useCallback(async (product) => {
    const isSaved = saved.some((p) => p.sku === product.sku);
    setSaved(await api(`/saved/${product.sku}`, { method: isSaved ? 'DELETE' : 'POST' }));
  }, [saved]);

  const value = useMemo(() => ({
    cart, add, setQuantity, remove, refresh, lastAdded, dismissAdded: () => setLastAdded(null),
    saved, toggleSaved, isSaved: (sku) => saved.some((p) => p.sku === sku),
  }), [cart, add, setQuantity, remove, refresh, lastAdded, saved, toggleSaved]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
