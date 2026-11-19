import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const defaultAuth = {
  user: null,
  loading: false,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
};

const AuthContext = createContext(defaultAuth);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('biodiversity_token') || localStorage.getItem('abraventure_token');
    if (token) {
      api.get('/api/auth/me').then(data => setUser(data.user)).catch(() => {
        localStorage.removeItem('biodiversity_token');
        localStorage.removeItem('abraventure_token');
      }).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('biodiversity_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('biodiversity_token');
    localStorage.removeItem('abraventure_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || defaultAuth;
