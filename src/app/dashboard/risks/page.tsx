'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskListView } from '@/components/risks/RiskListView';

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
        <Card>
          <CardHeader>
            <CardTitle>Risk Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskListView />
          </CardContent>
        </Card>
      </MainContentArea>
    </ProtectedRoute>
  );
}