"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';

// Enhanced User interface with all required fields
interface AuthUser extends User {
  updatedAt?: string;
  organization?: {
    id: string;
    name: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: (logoutType?: 'current' | 'all') => Promise<void>;
  updateProfile: (userData: Partial<AuthUser>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  organizationName?: string;
  organizationId?: string;
  acceptTerms: boolean;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INITIALIZE'; payload: { user: AuthUser; token: string } | null }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        isInitialized: true,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
        isInitialized: true,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isInitialized: true,
      };
    case 'AUTH_INITIALIZE':
      if (action.payload) {
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        };
      } else {
        return {
          ...state,
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        };
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Real authentication service
const authService = {
  // Login with email and password
  login: async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<{ user: AuthUser; token: string }> => {
    console.log('AuthContext: Attempting login for:', email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    console.log('AuthContext: Response status:', response.status);
    console.log('AuthContext: Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is JSON or HTML
    const contentType = response.headers.get('content-type');
    
    let data;
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('AuthContext: Parsed JSON response:', data);
      } else {
        // If not JSON, try to read as text to see what we got
        const text = await response.text();
        console.error('AuthContext: API returned non-JSON response:', text.substring(0, 500));
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE html>')) {
          throw new Error('Server error: The login API is not responding correctly. Please check the server logs or use demo credentials (admin@riscura.com / admin123)');
        } else {
          throw new Error(`Server returned unexpected content: ${text.substring(0, 100)}...`);
        }
      }
    } catch (parseError) {
      console.error('AuthContext: Failed to parse response:', parseError);
      if (parseError instanceof Error && parseError.message.includes('Server error:')) {
        throw parseError; // Re-throw our custom error
      }
      throw new Error('Server error: Unable to process response. Please try again or use demo credentials (admin@riscura.com / admin123)');
    }

    if (!response.ok) {
      console.error('AuthContext: Login failed:', data);
      throw new Error(data.error || 'Login failed');
    }

    console.log('AuthContext: Login successful:', data);

    // Store token based on rememberMe preference
    if (data.tokens?.accessToken) {
      if (rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem('accessToken', data.tokens.accessToken);
        // Clear any existing sessionStorage token
        sessionStorage.removeItem('accessToken');
      } else {
        // Store in sessionStorage for session-only login
        sessionStorage.setItem('accessToken', data.tokens.accessToken);
        // Clear any existing localStorage token
        localStorage.removeItem('accessToken');
      }
    }

    return {
      user: data.user,
      token: data.tokens.accessToken,
    };
  },

  // Register new user
  register: async (userData: RegisterData): Promise<{ user: AuthUser; token: string }> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // If registration requires email verification
    if (data.requiresVerification) {
      throw new Error('Please check your email to verify your account before logging in.');
    }

    // Store token if login is immediate (default to session storage for registration)
    if (data.tokens?.accessToken) {
      sessionStorage.setItem('accessToken', data.tokens.accessToken);
    }

    return {
      user: data.user,
      token: data.tokens?.accessToken || '',
    };
  },

  // Logout user
  logout: async (logoutType: 'current' | 'all' = 'current'): Promise<void> => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    try {
      if (token && token !== 'oauth-session') {
        // Regular token logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ logoutType }),
        });
      } else {
        // OAuth session logout
        await fetch('/api/google-oauth/logout');
      }
    } finally {
      // Always clear both storage locations, even if API call fails
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<{ user: AuthUser; token: string } | null> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.tokens?.accessToken) {
        // Check if user has remember me preference and store accordingly
        const rememberMe = localStorage.getItem('remember-me') === 'true';
        if (rememberMe) {
          localStorage.setItem('accessToken', data.tokens.accessToken);
        } else {
          sessionStorage.setItem('accessToken', data.tokens.accessToken);
        }
      }

      return {
        user: data.user,
        token: data.tokens.accessToken,
      };
    } catch {
      return null;
    }
  },

  // Get current user profile
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch {
      return null;
    }
  },

  // Update user profile
  updateProfile: async (userId: string, userData: Partial<AuthUser>): Promise<AuthUser> => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data.user;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      // Also check for simple OAuth session
      if (!token) {
        try {
          // Only check simple OAuth session (bypassing problematic NextAuth)
          console.log('[AuthContext] Checking OAuth session...');
          const oauthResponse = await fetch('/api/google-oauth/session');
          const oauthData = await oauthResponse.json();
          console.log('[AuthContext] OAuth session response:', oauthData);
          
          if (oauthData && oauthData.user) {
            // Convert simple OAuth user to AuthUser format
            const authUser: AuthUser = {
              id: oauthData.user.id,
              email: oauthData.user.email,
              name: oauthData.user.name,
              firstName: oauthData.user.name?.split(' ')[0] || '',
              lastName: oauthData.user.name?.split(' ')[1] || '',
              role: 'user' as any, // Changed from 'USER' to 'user' to match the role type
              isActive: true,
              emailVerified: true,
              organizationId: 'oauth-org',
              permissions: [],
              avatar: oauthData.user.picture,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(), // Add required lastLogin field
            };
            
            dispatch({ type: 'AUTH_INITIALIZE', payload: { user: authUser, token: 'oauth-session' } });
            return;
          }
        } catch (error) {
          console.log('No OAuth session found:', error);
        }
        
        dispatch({ type: 'AUTH_INITIALIZE', payload: null });
        return;
      }

      try {
        // Try to get current user with existing token
        const user = await authService.getCurrentUser();
        
        if (user) {
          dispatch({ type: 'AUTH_INITIALIZE', payload: { user, token } });
        } else {
          // Token might be expired, try to refresh
          const refreshResult = await authService.refreshToken();
          
          if (refreshResult) {
            dispatch({ type: 'AUTH_INITIALIZE', payload: refreshResult });
          } else {
            // Refresh failed, clear auth state
            localStorage.removeItem('accessToken');
            sessionStorage.removeItem('accessToken');
            dispatch({ type: 'AUTH_INITIALIZE', payload: null });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        dispatch({ type: 'AUTH_INITIALIZE', payload: null });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration (reduced frequency)
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) {
      return;
    }

    // Set up token refresh interval (25 minutes - less frequent)
    const refreshInterval = setInterval(async () => {
      try {
        const result = await authService.refreshToken();
        if (result) {
          dispatch({ type: 'AUTH_SUCCESS', payload: result });
        } else {
          // Refresh failed, logout user
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        // Don't logout on refresh error, just log it
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.token]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { user, token } = await authService.login(email, password, rememberMe);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { user, token } = await authService.register(userData);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const logout = async (logoutType: 'current' | 'all' = 'current') => {
    try {
      await authService.logout(logoutType);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const updateProfile = async (userData: Partial<AuthUser>) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    dispatch({ type: 'AUTH_START' });
    try {
      const updatedUser = await authService.updateProfile(state.user.id, userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await authService.changePassword(currentPassword, newPassword);
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const result = await authService.refreshToken();
      if (result) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Manual token refresh error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};