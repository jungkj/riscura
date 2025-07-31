'use client';

import WorkflowPage from '@/pages/workflows/WorkflowPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function WorkflowsPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <WorkflowPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
