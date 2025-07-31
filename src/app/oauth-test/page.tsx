'use client';

import { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyAlert } from '@/components/ui/DaisyAlert';

export default function OAuthTestPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [dbTestData, setDbTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch environment data
      const envResponse = await fetch('/api/check-env');
      const envJson = await envResponse.json();
      setEnvData(envJson);
      
      // Fetch database test data
      const dbResponse = await fetch('/api/test-db');
      const dbJson = await dbResponse.json();
      setDbTestData(dbJson);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const testGoogleLogin = () => {
    window.location.href = '/api/google-oauth/login?redirect=/dashboard';
  };

  if (loading) {

  return (
    <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">OAuth Debug Page</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">OAuth Debug Page</h1>
        
        {error && (
          <DaisyAlert variant="error">
            <DaisyAlertDescription>{error}
          </DaisyAlert>
        )}

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Environment Variables</DaisyCardTitle>
            <DaisyCardDescription>Current environment configuration</p>
          
          <DaisyCardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(envData, null, 2)}
            </pre>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Database Connection Test</DaisyCardTitle>
            <DaisyCardDescription>Results of database connection attempts</p>
          
          <DaisyCardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(dbTestData, null, 2)}
            </pre>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>OAuth Test</DaisyCardTitle>
            <DaisyCardDescription>Test the Google OAuth flow</p>
          
          <DaisyCardContent className="space-y-4">
            <DaisyButton onClick={testGoogleLogin} className="w-full">
              Test Google Login
            </DaisyButton>
            
            <div className="text-sm text-gray-600">
              <p>When you click the button above:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>You&apos;ll be redirected to Google</li>
                <li>After authentication, you&apos;ll return to /api/google-oauth/callback</li>
                <li>Check the browser console and Vercel logs for error details</li>
              </ol>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Quick Links</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-2">
            <a href="/api/check-env" className="text-blue-600 hover:underline block">
              /api/check-env - Environment check endpoint
            </a>
            <a href="/api/test-db" className="text-blue-600 hover:underline block">
              /api/test-db - Database connection test
            </a>
            <a href="/api/google-oauth/debug" className="text-blue-600 hover:underline block">
              /api/google-oauth/debug - OAuth configuration debug
            </a>
          </DaisyCardContent>
        </DaisyCard>
      </div>
    </div>
  );
}