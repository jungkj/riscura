'use client';

import dynamic from 'next/dynamic';

const ARIAPage = dynamic(() => import('@/pages/ai/ARIAPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  ),
});

const MainLayout = dynamic(() => import('@/layouts/MainLayout'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const ProtectedRoute = dynamic(() => import('@/components/auth/ProtectedRoute').then(mod => ({ default: mod.ProtectedRoute })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function ARIAPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ARIAPage />
      </MainLayout>
    </ProtectedRoute>
  );
} 