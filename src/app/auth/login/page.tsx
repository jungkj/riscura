'use client';

import LoginPage from '@/pages/auth/LoginPage';
import AuthLayout from '@/layouts/AuthLayout';

export default function LoginPageRoute() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
} 