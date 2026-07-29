import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AdminAuthContext } from '../lib/useAdminAuth';
import { api, ApiError } from '../lib/api';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ authenticated: boolean }>('/api/admin/session')
      .then((res) => setIsAuthenticated(res.authenticated))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await api.post('/api/admin/login', { username, password });
      setIsAuthenticated(true);
    } catch (err) {
      if (err instanceof ApiError) throw new Error(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/admin/logout');
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
