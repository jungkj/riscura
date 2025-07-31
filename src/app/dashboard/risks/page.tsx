'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

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
        <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
            <DaisyCardTitle>Risk Registry</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <p className="text-gray-500">
</DaisyCardContent>Risk management interface coming soon...</p>
          </DaisyCardContent>
        </DaisyCard>
      </MainContentArea>
    </ProtectedRoute>
  );
}