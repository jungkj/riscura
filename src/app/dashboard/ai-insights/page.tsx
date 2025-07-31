'use client';

import AIInsightsPage from '@/pages/ai/AIInsightsPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AIInsightsPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AIInsightsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
