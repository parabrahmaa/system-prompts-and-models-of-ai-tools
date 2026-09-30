import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const finish = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    setUser,
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(finish),
    register: (data) => api('/auth/register', { method: 'POST', body: data }).then(finish),
    logout: () => { tokenStore.set(null); setUser(null); },
  }), [user, ready, finish]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
