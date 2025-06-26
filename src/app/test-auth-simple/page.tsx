'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TestAuthSimple() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('admin@riscura.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        toast.error('Login failed: ' + result.error);
      } else if (result?.ok) {
        toast.success('Login successful!');
        // Optionally redirect to dashboard
        // window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error('Login error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiEndpoint = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      toast.info(`${endpoint}: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);
    } catch (error) {
      toast.error(`${endpoint}: Error - ${(error as Error).message}`);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Session Status */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Session Status</h3>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Authenticated:</strong> {session ? 'Yes' : 'No'}</p>
            {session?.user && (
              <div className="mt-2">
                <p><strong>User:</strong> {session.user.name}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Role:</strong> {(session.user as any).role}</p>
                <p><strong>Organization:</strong> {(session.user as any).organizationId}</p>
              </div>
            )}
          </div>

          {/* Login Form */}
          {!session && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h3 className="font-semibold">Demo Login (NextAuth)</h3>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@riscura.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          )}

                     {/* Logout Button */}
           {session && (
             <Button onClick={() => signOut()} variant="secondary">
               Sign Out
             </Button>
           )}

          {/* API Test Buttons */}
          <div className="space-y-2">
            <h3 className="font-semibold">API Endpoint Tests</h3>
            <div className="flex flex-wrap gap-2">
                             <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => testApiEndpoint('/api/auth/session')}
               >
                 Test Session
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => testApiEndpoint('/api/health')}
               >
                 Test Health
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => testApiEndpoint('/api/dashboard')}
               >
                 Test Dashboard
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => testApiEndpoint('/api/risks')}
               >
                 Test Risks
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => testApiEndpoint('/api/controls')}
               >
                 Test Controls
               </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Actions</h3>
                         <div className="flex flex-wrap gap-2">
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => window.location.href = '/dashboard'}
               >
                 Go to Dashboard
               </Button>
               <Button
                 variant="secondary"
                 size="sm"
                 onClick={() => window.location.href = '/auth/login'}
               >
                 Go to Login Page
               </Button>
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 