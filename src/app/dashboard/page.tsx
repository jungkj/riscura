'use client';

import DashboardPage from '@/pages/dashboard/DashboardPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPageRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
} 