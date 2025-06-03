'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';

export default function DashboardPageRoute() {
  return (
    <DashboardLayout
      title="Executive Dashboard"
      subtitle="Real-time risk intelligence and analytics"
    >
      <DashboardPage />
    </DashboardLayout>
  );
} 