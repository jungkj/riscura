'use client';

import { EnhancedRiskRegistry } from '@/pages/risks/EnhancedRiskRegistry';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RisksPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <EnhancedRiskRegistry />
      </MainLayout>
    </ProtectedRoute>
  );
} 