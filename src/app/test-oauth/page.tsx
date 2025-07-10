'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';

function OAuthTestContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [googleConfig, setGoogleConfig] = useState({ configured: false });

  useEffect(() => {
    // Check if Google OAuth is configured
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/google-oauth/config');
        if (response.ok) {
          const data = await response.json();
          setGoogleConfig({ configured: data.configured });
        }
      } catch (error) {
        console.error('Failed to check OAuth config:', error);
      }
    };
    checkConfig();
  }, []);

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/google-oauth/login';
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>OAuth Test Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
        </div>
        
        {isAuthenticated && user ? (
          <>
            <div>
              <strong>Signed in as:</strong> {user.email}
            </div>
            <div>
              <strong>Name:</strong> {user.name || `${user.firstName} ${user.lastName}`}
            </div>
            <div>
              <strong>Provider:</strong> {user.avatar ? 'Google OAuth' : 'Credentials'}
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
            <Button onClick={handleLogout}>Sign Out</Button>
          </>
        ) : (
          <>
            <p>You are not signed in</p>
            <div className="space-x-4">
              <Button onClick={handleGoogleLogin}>Sign in with Google</Button>
              <Button onClick={() => router.push('/auth/login')}>Sign in with Credentials</Button>
            </div>
          </>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-bold mb-2">Google OAuth Configuration Checklist:</h3>
          <ul className="space-y-2 text-sm">
            <li>{googleConfig.configured ? '✓' : '❌'} GOOGLE_CLIENT_ID is set in .env</li>
            <li>{googleConfig.configured ? '✓' : '❌'} GOOGLE_CLIENT_SECRET is set in .env</li>
            <li>⚠️ Add this redirect URI to Google Cloud Console:</li>
            <li className="ml-4 font-mono bg-white p-2 rounded">
              http://localhost:3000/api/google-oauth/callback
            </li>
            <li>⚠️ For production, also add:</li>
            <li className="ml-4 font-mono bg-white p-2 rounded">
              https://your-domain.vercel.app/api/google-oauth/callback
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestOAuthPage() {
  return (
    <div className="container mx-auto p-8">
      <Suspense fallback={
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      }>
        <OAuthTestContent />
      </Suspense>
    </div>
  );
}

