import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';

// Enhanced User interface with all required fields
interface AuthUser extends User {
  updatedAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  role?: 'admin' | 'risk_manager' | 'auditor' | 'user';
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
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
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
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

// Mock authentication service
const authService = {
  login: async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user authentication logic
    if (email === 'demo@rcsa.com' && password === 'demo123') {
      const user: AuthUser = {
        id: '1',
        email: 'demo@rcsa.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'risk_manager',
        organizationId: 'org-1',
        permissions: ['read_risks', 'write_risks', 'read_controls', 'write_controls'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return { user, token };
    }
    
    // Additional demo users for different roles
    if (email === 'admin@rcsa.com' && password === 'admin123') {
      const user: AuthUser = {
        id: '2',
        email: 'admin@rcsa.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        organizationId: 'org-1',
        permissions: ['*'], // All permissions
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return { user, token };
    }
    
    if (email === 'auditor@rcsa.com' && password === 'audit123') {
      const user: AuthUser = {
        id: '3',
        email: 'auditor@rcsa.com',
        firstName: 'Auditor',
        lastName: 'User',
        role: 'auditor',
        organizationId: 'org-1',
        permissions: ['read_risks', 'read_controls', 'read_reports'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return { user, token };
    }
    
    throw new Error('Invalid credentials');
  },
  
  register: async (userData: RegisterData): Promise<{ user: AuthUser; token: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if email already exists (mock validation)
    if (userData.email === 'demo@rcsa.com' || userData.email === 'admin@rcsa.com') {
      throw new Error('Email already exists');
    }
    
    const user: AuthUser = {
      id: Math.random().toString(36).substring(2, 9),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'user',
      organizationId: 'org-' + Math.random().toString(36).substring(2, 5),
      permissions: ['read_risks', 'read_controls'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    return { user, token };
  },
  
  logout: () => {
    // Clear in-memory token and user data
    return Promise.resolve();
  },
  
  updateProfile: async (userId: string, userData: Partial<AuthUser>): Promise<AuthUser> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock profile update - in real app, this would update the backend
    const updatedUser: AuthUser = {
      ...userData as AuthUser,
      updatedAt: new Date().toISOString(),
    };
    
    return updatedUser;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for token expiration
  useEffect(() => {
    if (state.token) {
      try {
        const tokenData = JSON.parse(atob(state.token));
        if (tokenData.exp < Date.now()) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }
  }, [state.token]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { user, token } = await authService.login(email, password);
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

  const logout = () => {
    authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const updateProfile = async (userData: Partial<AuthUser>) => {
    if (!state.user) throw new Error('No user logged in');
    
    dispatch({ type: 'AUTH_START' });
    try {
      const updatedUser = await authService.updateProfile(state.user.id, {
        ...state.user,
        ...userData,
      });
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateProfile,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};