"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

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

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert NextAuth session to AuthUser format
  const user: AuthUser | null = session?.user ? {
    id: (session.user as any).id,
    email: session.user.email || '',
    name: session.user.name || '',
    firstName: (session.user as any).firstName || session.user.name?.split(' ')[0] || '',
    lastName: (session.user as any).lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
    role: (session.user as any).role || 'USER',
    isActive: (session.user as any).isActive !== false,
    emailVerified: !!(session.user as any).emailVerified || !!session.user.email,
    organizationId: (session.user as any).organizationId,
    permissions: (session.user as any).permissions || [],
    avatar: (session.user as any).avatar || session.user.image,
    createdAt: (session.user as any).createdAt || new Date().toISOString(),
    lastLogin: (session.user as any).lastLogin || new Date().toISOString(),
    organization: (session.user as any).organization,
  } : null;

  // Set initialized once NextAuth has loaded
  useEffect(() => {
    if (status !== 'loading') {
      setIsInitialized(true);
    }
  }, [status]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setError(null);
    try {
      // Use NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        throw new Error(result.error);
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember-me', 'true');
      } else {
        localStorage.removeItem('remember-me');
      }

      // Navigate to dashboard on successful login
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (userData: RegisterData) => {
    setError(null);
    try {
      // Call the register API endpoint
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

      // Auto-login after successful registration
      if (data.user) {
        await login(userData.email, userData.password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const logout = async (logoutType: 'current' | 'all' = 'current') => {
    try {
      // Use NextAuth signOut
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/login'
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Force redirect even if signOut fails
      router.push('/auth/login');
    }
  };

  const updateProfile = async (userData: Partial<AuthUser>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setError(null);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Trigger NextAuth session update
      await update();
      
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      throw err;
    }
  };

  const refreshToken = async () => {
    try {
      // NextAuth handles token refresh automatically
      // This triggers a manual session update
      await update();
    } catch (err) {
      console.error('Session refresh error:', err);
      await logout();
    }
  };

  const clearError = () => {
    setError(null);
  };

  const state: AuthState = {
    user,
    token: session ? 'nextauth-session' : null,
    isLoading: status === 'loading',
    error,
    isAuthenticated: !!session?.user,
    isInitialized,
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