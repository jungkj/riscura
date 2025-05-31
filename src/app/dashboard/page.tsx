'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 