'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export function AuthTestComponent() {
  const { data: session, status } = useSession();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/risks', {
        credentials: 'include',
      });
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    signIn('credentials', {
      email: 'admin@riscura.com',
      password: 'admin123',
      redirect: false,
    });
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      {session ? (
        <div className="space-y-4">
          <div>
            <p className="text-green-600">✅ Authenticated</p>
            <p className="text-sm">Email: {session.user?.email}</p>
            <p className="text-sm">Role: {(session.user as any)?.role}</p>
          </div>
          
          <button
            onClick={testApiCall}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
          >
            Sign Out
          </button>
          
          {apiResponse && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <h4 className="font-semibold">API Response:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-red-600">❌ Not authenticated</p>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign In with Demo Credentials
          </button>
        </div>
      )}
    </div>
  );
} 