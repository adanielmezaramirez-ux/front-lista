import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../interfaces';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isMaestro: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const userData = authService.getCurrentUser();
      if (userData) {
        setUser(userData);
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Guardar también las clases si vienen en la respuesta
      if (response.clases) {
        localStorage.setItem('clases', JSON.stringify(response.clases));
      }
      
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('clases');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isMaestro = user?.role === 'maestro';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isMaestro }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};