'use client';

import { useParams } from 'next/navigation';
import RiskDetailPage from '@/pages/risks/RiskDetailPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RiskDetailPageRoute() {
  const params = useParams();
  const riskId = params?.id as string;

  return (
    <ProtectedRoute>
      <MainLayout>
        <RiskDetailPage riskId={riskId} />
      </MainLayout>
    </ProtectedRoute>
  );
} 