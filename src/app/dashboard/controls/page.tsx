'use client';

import { EnhancedControlRegistry } from '@/pages/controls/EnhancedControlRegistry';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ControlsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <EnhancedControlRegistry />
      </MainLayout>
    </ProtectedRoute>
  );
} 