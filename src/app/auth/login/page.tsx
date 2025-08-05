'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DaisyCard, DaisyCardBody } from '@/components/ui/daisy-components';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const redirectTo = searchParams?.get('from') || '/dashboard';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
    if (authError) {
      clearError();
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      rememberMe: e.target.checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      // If login is successful, redirect to the intended page
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Store the redirect URL in session storage
      sessionStorage.setItem('oauth_redirect', redirectTo);

      // Use our working simple OAuth implementation with remember me preference and redirect
      const redirectParam = encodeURIComponent(redirectTo);
      window.location.href = `/api/google-oauth/login?remember=${formData.rememberMe}&redirect=${redirectParam}`;

      // Note: This won't return since we're redirecting
      return;
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  // Demo credentials for development
  const handleDemoLogin = () => {
    setFormData({
      email: 'admin@riscura.com',
      password: 'admin123',
      rememberMe: false,
    });
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-6">
          <div className="mx-auto flex justify-center">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura Logo"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">Welcome back</h1>
            <p className="text-base-content/70">Sign in to your Riscura account</p>
          </div>
        </div>

        {/* Login Card */}
        <DaisyCard className="w-full">
          <DaisyCardBody>
            {(error || authError) && (
              <DaisyAlert variant="error" className="mb-6">
                {error || authError}
              </DaisyAlert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Mail className="h-4 w-4 opacity-70" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="grow"
                    required
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Lock className="h-4 w-4 opacity-70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="grow"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleCheckboxChange}
                    className="checkbox checkbox-primary checkbox-sm mr-2"
                  />
                  <span className="label-text">Stay logged in</span>
                </label>
                <Link href="/auth/forgot-password" className="link link-primary text-sm">
                  Forgot password?
                </Link>
              </div>

              <DaisyButton type="submit" loading={isLoading} block size="lg">
                Sign in
              </DaisyButton>
            </form>

            <div className="divider">OR</div>

            <DaisyButton variant="outline" block onClick={handleGoogleLogin} disabled={isLoading}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </DaisyButton>

            {/* Demo Credentials Section */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <div className="divider" />
                <div className="alert alert-info">
                  <CheckCircle className="h-4 w-4" />
                  <div>
                    <h3 className="font-bold">Demo Mode</h3>
                    <div className="text-xs">Use demo credentials to explore the platform</div>
                  </div>
                </div>
                <DaisyButton variant="secondary" size="sm" block onClick={handleDemoLogin}>
                  Use Demo Credentials (admin@riscura.com)
                </DaisyButton>
              </>
            )}

            <div className="text-center">
              <p className="text-base-content/70">
                Don't have an account?{' '}
                <Link href="/auth/register" className="link link-primary">
                  Sign up
                </Link>
              </p>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Footer */}
        <div className="text-center text-xs text-base-content/50">
          © 2024 Riscura. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
