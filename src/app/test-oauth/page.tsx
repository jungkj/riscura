'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

function OAuthTestContent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>OAuth Test Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        {session ? (
          <>
            <div>
              <strong>Signed in as:</strong> {session.user?.email}
            </div>
            <div>
              <strong>Provider:</strong> {(session as any).provider || 'credentials'}
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
            <Button onClick={() => signOut()}>Sign Out</Button>
          </>
        ) : (
          <>
            <p>You are not signed in</p>
            <div className="space-x-4">
              <Button onClick={() => signIn('google')}>Sign in with Google</Button>
              <Button onClick={() => signIn('credentials')}>Sign in with Credentials</Button>
            </div>
          </>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-bold mb-2">Google OAuth Configuration Checklist:</h3>
          <ul className="space-y-2 text-sm">
            <li>✓ GOOGLE_CLIENT_ID is set in .env</li>
            <li>✓ GOOGLE_CLIENT_SECRET is set in .env</li>
            <li>⚠️ Add this redirect URI to Google Cloud Console:</li>
            <li className="ml-4 font-mono bg-white p-2 rounded">
              http://localhost:3000/api/auth/callback/google
            </li>
            <li>⚠️ For production, also add:</li>
            <li className="ml-4 font-mono bg-white p-2 rounded">
              https://your-domain.vercel.app/api/auth/callback/google
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

