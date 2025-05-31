'use client';

import ControlLibraryPage from '@/pages/controls/ControlLibraryPage';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ControlsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ControlLibraryPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 