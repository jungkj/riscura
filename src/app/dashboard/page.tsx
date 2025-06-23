'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardPage from '@/pages/dashboard/DashboardPage';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
} 