'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

export default function RisksPage() {
  return (
    <ProtectedRoute>
      <MainContentArea
        title="Risk Management"
        subtitle="View and manage organizational risks"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Risks', current: true },
        ]}
      >
        <DaisyCard>
          <DaisyCardBody>
            <DaisyCardTitle>Risk Registry</DaisyCardTitle>
            <p className="text-gray-500">Risk management interface coming soon...</p>
          </DaisyCardBody>
        </DaisyCard>
      </MainContentArea>
    </ProtectedRoute>
  );
}
