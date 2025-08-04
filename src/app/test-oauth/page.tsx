'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
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
      <DaisyCard className="max-w-2xl mx-auto">
        <DaisyCardBody className="p-8">
          <div className="text-center">Loading...</div>
        </DaisyCardBody>
      </DaisyCard>
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
    <DaisyCard className="max-w-2xl mx-auto">
      <DaisyCardBody>
        <DaisyCardTitle>OAuth Test Page</DaisyCardTitle>
      </DaisyCardBody>
      <DaisyCardBody className="space-y-4">
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
            <DaisyButton onClick={handleLogout}>Sign Out</DaisyButton>
          </>
        ) : (
          <>
            <p>You are not signed in</p>
            <div className="space-x-4">
              <DaisyButton onClick={handleGoogleLogin}>Sign in with Google</DaisyButton>
              <DaisyButton onClick={() => router.push('/auth/login')}>
                Sign in with Credentials
              </DaisyButton>
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
      </DaisyCardBody>
    </DaisyCard>
  );
}

export default function TestOAuthPage() {
  return (
    <div className="container mx-auto p-8">
      <Suspense
        fallback={
          <DaisyCard className="max-w-2xl mx-auto">
            <DaisyCardBody className="p-8">
              <div className="text-center">Loading...</div>
            </DaisyCardBody>
          </DaisyCard>
        }
      >
        <OAuthTestContent />
      </Suspense>
    </div>
  );
}
