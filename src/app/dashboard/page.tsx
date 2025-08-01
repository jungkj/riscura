'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import dynamic from 'next/dynamic';

const DashboardPage = dynamic(
  () => import('@/pages/dashboard/DashboardPage'),
  { 
    ssr: false,
    loading: () => <div>Loading dashboard...</div>
  }
);

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}