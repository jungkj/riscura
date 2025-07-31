'use client';

import RegisterPage from '@/pages/auth/RegisterPage';
import AuthLayout from '@/layouts/AuthLayout';

export default function RegisterPageRoute() {
  return (
    <AuthLayout>
      <RegisterPage />
    </AuthLayout>
  );
}
