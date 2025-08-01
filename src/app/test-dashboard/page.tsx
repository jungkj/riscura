'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const DashboardPage = dynamic(
  () => import('@/pages/dashboard/DashboardPage'),
  { 
    ssr: false,
    loading: () => <div>Loading dashboard...</div>
  }
);

export default function TestDashboard() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    // Check OAuth session
    fetch('/api/google-oauth/session')
      .then((res) => res.json())
      .then((data) => setSessionInfo(data))
      .catch((err) => console.error('Failed to check session:', err));
  }, []);

  return (
    <div>
      <div className="bg-yellow-100 p-4 mb-4">
        <h2 className="font-bold">Test Dashboard (No Auth Check)</h2>
        <p>Session Info: {sessionInfo ? JSON.stringify(sessionInfo) : 'Loading...'}</p>
      </div>

      {/* Render the actual dashboard without ProtectedRoute */}
      <DashboardPage />
    </div>
  );
}