'use client';

import ReportingPage from '@/pages/reporting/ReportingPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ReportingPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ReportingPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 