'use client';

import ReportingPage from '@/pages/dashboard/reporting/ReportingPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ReportingPageRoute() {
  return (
    <ProtectedRoute>
      <ReportingPage />
    </ProtectedRoute>
  );
} 