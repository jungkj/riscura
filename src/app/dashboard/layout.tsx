'use client';

import MainLayout from '@/layouts/MainLayout';
import DashboardProviders from '@/app/dashboard-providers';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MainLayout showSidebar={true}>
      <DashboardProviders>{children}</DashboardProviders>
    </MainLayout>
  );
}
