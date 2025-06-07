'use client';

import MainLayout from '@/layouts/MainLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MainLayout showSidebar={true}>
      {children}
    </MainLayout>
  );
} 