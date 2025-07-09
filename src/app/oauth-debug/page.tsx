'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(`OAuth Error: ${errorParam}`);
    }
  }, []);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/auth/google-debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError('Failed to fetch debug info');
    }
  };

  const testGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[OAuth Debug] Starting Google sign-in...');
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard',
      });
      
      console.log('[OAuth Debug] Sign-in result:', result);
      
      if (result?.error) {
        setError(`Sign-in error: ${result.error}`);
        console.error('[OAuth Debug] Sign-in error:', result.error);
      } else if (result?.url) {
        console.log('[OAuth Debug] Redirecting to:', result.url);
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('[OAuth Debug] Exception during sign-in:', err);
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>OAuth Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Actions:</h3>
              <div className="space-x-2">
                <Button 
                  onClick={testGoogleSignIn} 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? 'Testing...' : 'Test Google Sign-In'}
                </Button>
                <Button 
                  onClick={fetchDebugInfo} 
                  variant="outline"
                >
                  Refresh Debug Info
                </Button>
              </div>
            </div>

            {debugInfo && (
              <div>
                <h3 className="font-semibold mb-2">Environment Configuration:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Expected OAuth Flow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Test Google Sign-In"</li>
                <li>Redirect to Google OAuth consent screen</li>
                <li>Authorize the application</li>
                <li>Google redirects to: https://riscura.app/api/auth/callback/google</li>
                <li>NextAuth processes the callback</li>
                <li>User is signed in and redirected to dashboard</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Console Logs:</h3>
              <p className="text-sm text-gray-600">
                Open your browser's developer console (F12) to see detailed logs during the OAuth flow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}