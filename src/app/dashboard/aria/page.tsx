'use client';

import ARIAPage from '@/pages/ai/ARIAPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ARIAPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ARIAPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 