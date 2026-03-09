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
  isAlumno: boolean;
  hasRole: (role: string) => boolean;
  currentView: 'admin' | 'maestro' | null;
  setCurrentView: (view: 'admin' | 'maestro' | null) => void;
  canSwitchView: boolean;
  availableViews: ('admin' | 'maestro')[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'admin' | 'maestro' | null>(null);
  const [showViewSelector, setShowViewSelector] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const userData = authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        
        const savedView = localStorage.getItem('currentView') as 'admin' | 'maestro' | null;
        const availableViews = getAvailableViews(userData);
        
        if (savedView && availableViews.includes(savedView)) {
          setCurrentView(savedView);
        } else if (availableViews.length > 0) {
          if (availableViews.length === 1) {
            setCurrentView(availableViews[0]);
          } else {
            setShowViewSelector(true);
          }
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const getAvailableViews = (userData: User): ('admin' | 'maestro')[] => {
    const views: ('admin' | 'maestro')[] = [];
    if (userData.roles?.includes('admin')) views.push('admin');
    if (userData.roles?.includes('maestro')) views.push('maestro');
    return views;
  };

  useEffect(() => {
    if (currentView) {
      localStorage.setItem('currentView', currentView);
    } else {
      localStorage.removeItem('currentView');
    }
  }, [currentView]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (response.clases) {
        localStorage.setItem('clases', JSON.stringify(response.clases));
      }
      
      setUser(response.user);
      
      const availableViews = getAvailableViews(response.user);
      
      if (availableViews.length === 1) {
        setCurrentView(availableViews[0]);
      } else if (availableViews.length > 1) {
        const savedView = localStorage.getItem('currentView') as 'admin' | 'maestro' | null;
        if (savedView && availableViews.includes(savedView)) {
          setCurrentView(savedView);
        } else {
          setCurrentView(null);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('clases');
    localStorage.removeItem('currentView');
    setUser(null);
    setCurrentView(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const isAdmin = user?.roles?.includes('admin') || false;
  const isMaestro = user?.roles?.includes('maestro') || false;
  const isAlumno = user?.roles?.includes('alumno') || false;
  
  const availableViews = user ? getAvailableViews(user) : [];
  const canSwitchView = availableViews.length > 1;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAdmin, 
      isMaestro,
      isAlumno,
      hasRole,
      currentView,
      setCurrentView,
      canSwitchView,
      availableViews
    }}>
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