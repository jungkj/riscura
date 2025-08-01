'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import dynamic from 'next/dynamic';

const ReportingPage = dynamic(
  () => import('@/pages/dashboard/reporting/ReportingPage'),
  { 
    ssr: false,
    loading: () => <div>Loading reports...</div>
  }
);

export default function ReportingPageRoute() {
  return (
    <ProtectedRoute>
      <ReportingPage />
    </ProtectedRoute>
  );
}