'use client';

import dynamic from 'next/dynamic';

const LoginPage = dynamic(() => import('@/pages/auth/LoginPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  ),
});

const AuthLayout = dynamic(() => import('@/layouts/AuthLayout'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function LoginPageRoute() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
} 