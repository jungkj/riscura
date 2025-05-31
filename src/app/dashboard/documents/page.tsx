'use client';

import DocumentAnalysisPage from '@/pages/documents/DocumentAnalysisPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DocumentsPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DocumentAnalysisPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 