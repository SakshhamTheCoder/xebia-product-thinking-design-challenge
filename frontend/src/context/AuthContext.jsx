import { useEffect, useState } from 'react';
import client from '../api/client';
import { AuthContext } from './authStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    client
      .get('/users/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function applyAuth(token, nextUser) {
    localStorage.setItem('token', token);
    setUser(nextUser);
  }

  async function refresh() {
    const res = await client.get('/users/me');
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, logout, applyAuth, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
