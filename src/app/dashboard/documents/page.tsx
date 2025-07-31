'use client';

import DocumentAnalysisPage from '@/pages/documents/DocumentAnalysisPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DocumentsPageRoute() {
  return (
    <ProtectedRoute>
      <DocumentAnalysisPage />
    </ProtectedRoute>
  );
}
