import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  user_id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string, extra?: Record<string, any>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure user data has all required fields
          const userData = {
            user_id: data.user.user_id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name || data.user.email?.split('@')[0] || 'User'
          };
          setUser(userData);
          // Store role in localStorage for easy access
          localStorage.setItem('userRole', data.user.role);
        } else {
          // Token is invalid, try to refresh
          await refreshToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) return false;

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Get user info with new token
        const userResponse = await fetch(`${API_BASE}/api/me`, {
          headers: {
            'Authorization': `Bearer ${data.accessToken}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Ensure user data has all required fields
          const completeUserData = {
            user_id: userData.user.user_id,
            email: userData.user.email,
            role: userData.user.role,
            name: userData.user.name || userData.user.email?.split('@')[0] || 'User'
          };
          setUser(completeUserData);
          // Store role in localStorage for easy access
          localStorage.setItem('userRole', userData.user.role);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    return false;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        // Ensure user data has all required fields
        const userData = {
          user_id: data.user.user_id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || data.user.email?.split('@')[0] || 'User'
        };
        setUser(userData);
        // Store role in localStorage for easy access
        localStorage.setItem('userRole', data.user.role);
        return true;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: string, extra?: Record<string, unknown>): Promise<boolean> => {
    try {
      const payload = { name, email, password, role, ...(extra || {}) };
      console.log('Registration payload being sent to backend:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        // Ensure user data has all required fields
        const userData = {
          user_id: data.user.user_id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name || data.user.email?.split('@')[0] || 'User'
        };
        setUser(userData);
        // Store role in localStorage for easy access
        localStorage.setItem('userRole', data.user.role);
        return true;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (refreshTokenValue) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    setUser(null);
    navigate('/');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
