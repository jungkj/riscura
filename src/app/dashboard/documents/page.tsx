'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import dynamic from 'next/dynamic';

const DocumentAnalysisPage = dynamic(() => import('@/pages/documents/DocumentAnalysisPage'), {
  ssr: false,
  loading: () => <div>Loading documents...</div>,
});

export default function DocumentsPageRoute() {
  return (
    <ProtectedRoute>
      <DocumentAnalysisPage />
    </ProtectedRoute>
  );
}
