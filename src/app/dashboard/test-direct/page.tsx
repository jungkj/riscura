'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function TestDirectDashboard() {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  
  useEffect(() => {
    console.log('[TestDirect] Auth state:', {
      isAuthenticated,
      isLoading,
      isInitialized,
      hasUser: !!user,
      userEmail: user?.email,
    });
  }, [isAuthenticated, isLoading, isInitialized, user]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Dashboard Test (No ProtectedRoute)</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Auth State:</h2>
          <pre className="text-sm">
            {JSON.stringify({
              isAuthenticated,
              isLoading,
              isInitialized,
              hasUser: !!user,
              userEmail: user?.email,
              userName: user?.name,
              userRole: user?.role,
            }, null, 2)}
          </pre>
        </div>
        
        {user && (
          <div className="p-4 bg-blue-100 rounded">
            <h2 className="font-semibold mb-2">User Data:</h2>
            <pre className="text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold">Debug Links:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="/api/auth/debug-session" className="text-blue-600 hover:underline">Auth Debug Session</a></li>
            <li><a href="/api/google-oauth/debug" className="text-blue-600 hover:underline">OAuth Debug</a></li>
            <li><a href="/api/google-oauth/session" className="text-blue-600 hover:underline">OAuth Session API</a></li>
            <li><a href="/dashboard" className="text-blue-600 hover:underline">Regular Dashboard (with ProtectedRoute)</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}