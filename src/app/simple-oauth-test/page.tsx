'use client';

import { useEffect, useState } from 'react';

export default function SimpleOAuthTest() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session
    fetch('/api/google-oauth/session')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const signIn = () => {
    window.location.href = '/api/google-oauth/login';
  };

  const signOut = () => {
    document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-8">
            Simple Google OAuth Test
          </h1>
          
          {user ? (
            <div className="space-y-4">
              <div className="text-center">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                )}
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <button
                onClick={signOut}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Test Google OAuth without NextAuth
              </p>
              
              <button
                onClick={signIn}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <p className="font-semibold mb-2">How this works:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Direct OAuth flow without NextAuth</li>
              <li>Minimal dependencies</li>
              <li>Simple session management</li>
              <li>No database required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}