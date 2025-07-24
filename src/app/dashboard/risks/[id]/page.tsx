'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

export default function RiskDetailPageRoute() {
  const params = useParams();
  const riskId = params?.id as string;

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Risk Details"
        subtitle={`Risk ID: ${riskId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Risks', href: '/dashboard/risks' },
          { label: riskId, current: true },
        ]}
      >
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Risk Information</DaisyCardTitle>
          
          <DaisyCardContent>
            <p className="text-gray-500">Risk details for ID: {riskId} coming soon...</p>
          </DaisyCardBody>
        </DaisyCard>
      </MainContentArea>
    </ProtectedRoute>
  );
}