'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export const AuthDebugger = () => {
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[AuthDebugger] Component mounted, auth state:', auth);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log('[AuthDebugger] Auth state changed:', {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        isInitialized: auth.isInitialized,
        user: auth.user,
      });
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.isInitialized, auth.user, mounted]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black bg-opacity-80 text-white text-xs rounded-lg max-w-sm">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
      <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
      <div>Initialized: {auth.isInitialized ? '✅' : '❌'}</div>
      <div>User: {auth.user?.email || 'None'}</div>
      <div>Role: {auth.user?.role || 'None'}</div>
    </div>
  );
};
