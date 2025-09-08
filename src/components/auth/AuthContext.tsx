import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  role: string;
  full_name?: string;
  organization?: string;
  phone?: string;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: string, fullName?: string, organization?: string, phone?: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'full_name' | 'organization' | 'phone'>>) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Session timeout: 30 minutes of inactivity
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Reset session timeout
  const resetSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    if (user && token) {
      const timeout = setTimeout(() => {
        logout();
        toast.error('Session expired due to inactivity. Please log in again.');
      }, SESSION_TIMEOUT);
      setSessionTimeout(timeout);
    }
  };

  // Track user activity
  const handleUserActivity = () => {
    if (user && token) {
      resetSessionTimeout();
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (user && token) {
      resetSessionTimeout();

      // Add event listeners for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }
      };
    }
  }, [user, token]);

  useEffect(() => {
    // Check for stored tokens on app load and verify them
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUserData = localStorage.getItem('user_data');

    if (storedAccessToken && storedRefreshToken) {
      apiService.setTokens(storedAccessToken, storedRefreshToken);
      setToken(storedAccessToken);

      // If we have stored user data, use it
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          setLoading(false);
        } catch (error) {
          // Invalid stored user data, fetch fresh
          apiService.getCurrentUser().then(response => {
            if (response.data) {
              setUser(response.data);
              localStorage.setItem('user_data', JSON.stringify(response.data));
            } else {
              // Token is invalid, clear it
              logout();
            }
            setLoading(false);
          });
        }
      } else {
        // No stored user data, fetch it
        apiService.getCurrentUser().then(response => {
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user_data', JSON.stringify(response.data));
          } else {
            // Token is invalid, clear it
            logout();
          }
          setLoading(false);
        });
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.login(username, password);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const { access_token, refresh_token, message } = response.data;
        setToken(access_token);
        apiService.setTokens(access_token, refresh_token);

        // Get user data
        const userResponse = await apiService.getCurrentUser();
        if (userResponse.data) {
          setUser(userResponse.data);
          localStorage.setItem('user_data', JSON.stringify(userResponse.data));
          resetSessionTimeout(); // Start session timeout
          // Show personalized success message
          const welcomeMessage = message || `Welcome back, ${userResponse.data.full_name || userResponse.data.username}!`;
          toast.success(welcomeMessage);
        } else {
          toast.error('Failed to retrieve user information');
          throw new Error('Failed to retrieve user information');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role?: string, fullName?: string, organization?: string, phone?: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.register({
        username,
        email,
        password,
        role: role || 'researcher',
        full_name: fullName,
        organization,
        phone
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // Show success message from backend
        const message = response.data.message || 'Account created successfully! You can now log in.';
        toast.success(message);
        
        // Auto-login after successful registration
        try {
          await login(username, password);
        } catch (loginError) {
          // If auto-login fails, at least show that registration was successful
          toast.info('Registration successful! Please log in with your credentials.');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'full_name' | 'organization' | 'phone'>>): Promise<void> => {
    try {
      setLoading(true);

      // Make direct fetch call for profile update
      const url = 'http://localhost:8000/auth/users/me';
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (data) {
        // Update local user state
        setUser(data);
        localStorage.setItem('user_data', JSON.stringify(data));
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiService.logout();
    } catch (error) {
      // Ignore logout endpoint errors
      console.warn('Logout endpoint error:', error);
    }

    // Clear session timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }

    // Clear user data and tokens
    setUser(null);
    setToken(null);
    apiService.clearTokens();
    localStorage.removeItem('user_data');
    toast.success('Successfully logged out!');
  };

  const value = {
    user,
    token,
    login,
    register,
    updateProfile,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};