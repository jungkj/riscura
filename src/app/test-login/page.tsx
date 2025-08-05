'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthStorage } from '@/lib/auth/storage';
import { LoginStatus } from '@/components/auth/LoginStatus';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

export default function TestLoginPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState({
    hasToken: false,
    storageType: '',
    hasRememberMe: false,
    localStorageToken: null as string | null,
    sessionStorageToken: null as string | null,
    rememberMeCookie: null as string | null,
  });

  useEffect(() => {
    // Only access storage on client side
    if (typeof window !== 'undefined') {
      setTokenInfo({
        hasToken: !!AuthStorage.getAccessToken(),
        storageType: AuthStorage.getStorageType() || '',
        hasRememberMe: AuthStorage.hasRememberMe(),
        localStorageToken: localStorage.getItem('accessToken'),
        sessionStorageToken: sessionStorage.getItem('accessToken'),
        rememberMeCookie: localStorage.getItem('remember-me'),
      });
    }
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Login Status Test Page</h1>

        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Authentication Status</DaisyCardTitle>
          </DaisyCardBody>
          <DaisyCardBody className="space-y-4">
            <div className="flex items-center space-x-4">
              <DaisyBadge variant={isAuthenticated ? 'default' : 'destructive'}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </DaisyBadge>
              {Boolean(isAuthenticated) && <LoginStatus />}
            </div>

            {Boolean(user) && (
              <div className="space-y-2">
                <p>
                  <strong>User:</strong> {user.firstName} {user.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
              </div>
            )}

            {Boolean(isAuthenticated) && (
              <DaisyButton onClick={handleLogout} variant="outline">
                Logout
              </DaisyButton>
            )}
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Token Storage Debug Info</DaisyCardTitle>
          </DaisyCardBody>
          <DaisyCardBody>
            <div className="space-y-2 font-mono text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Has Token:</strong> {tokenInfo.hasToken ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Storage Type:</strong> {tokenInfo.storageType || 'None'}
                  </p>
                  <p>
                    <strong>Remember Me:</strong> {tokenInfo.hasRememberMe ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>LocalStorage Token:</strong>{' '}
                    {tokenInfo.localStorageToken ? 'Present' : 'None'}
                  </p>
                  <p>
                    <strong>SessionStorage Token:</strong>{' '}
                    {tokenInfo.sessionStorageToken ? 'Present' : 'None'}
                  </p>
                  <p>
                    <strong>Remember Me Cookie:</strong> {tokenInfo.rememberMeCookie || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Test Instructions</DaisyCardTitle>
          </DaisyCardBody>
          <DaisyCardBody className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">To test "Stay logged in" feature:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to the login page (/auth/login)</li>
                <li>Check the "Stay logged in" checkbox</li>
                <li>Login with demo credentials (admin@riscura.com / admin123)</li>
                <li>Come back to this page - you should see "Persistent Login" badge</li>
                <li>Close the browser tab and reopen - you should still be logged in</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">To test session-only login:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Logout first</li>
                <li>Go to the login page (/auth/login)</li>
                <li>Do NOT check the "Stay logged in" checkbox</li>
                <li>Login with demo credentials</li>
                <li>Come back to this page - you should see "Session Login" badge</li>
                <li>Close the browser tab and reopen - you should be logged out</li>
              </ol>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
}
