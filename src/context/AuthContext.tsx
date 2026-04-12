// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, expiresAt: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Uygulama ilk yüklendiğinde localStorage'ı kontrol et
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const expiry = localStorage.getItem('customerTokenExpiry');

    if (token && expiry && new Date(expiry) > new Date()) {
      setIsAuthenticated(true);
    } else {
      // Token yoksa veya süresi dolmuşsa temizle
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerTokenExpiry');
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  // Giriş yapıldığında hem state'i güncelle hem de localStorage'a yaz
  const login = (token: string, expiresAt: string) => {
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerTokenExpiry', expiresAt);
    setIsAuthenticated(true);
  };

  // Çıkış yapıldığında verileri temizle
  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerTokenExpiry');
    setIsAuthenticated(false);
  };

  // Context yüklenirken alt component'leri render etme (titremeyi önler)
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};