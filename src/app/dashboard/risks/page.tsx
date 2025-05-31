'use client';

import RiskListPage from '@/pages/risks/RiskListPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RisksPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <RiskListPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 