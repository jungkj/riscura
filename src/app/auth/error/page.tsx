'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

const AuthErrorContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error occurred while signing in with Google. Please try again.';
      case 'OAuthCallback':
        return 'Error occurred during authentication callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create an account with the provided information.';
      case 'EmailCreateAccount':
        return 'Could not create an account with the provided email.';
      case 'Callback':
        return 'Error occurred during the authentication process. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'This email is already registered with a different sign-in method.';
      default:
        return 'An unexpected error occurred during authentication. Please try again.';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
      <div className="relative w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-8">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura Logo"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <DaisyCard className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          <DaisyCardBody>
            <div className="space-y-3 pb-6">
              <div className="mx-auto rounded-full bg-red-100 dark:bg-red-900/30 p-3 w-fit">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DaisyCardTitle className="text-2xl text-center font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Authentication Error
              </DaisyCardTitle>
              <p className="text-center text-slate-600 dark:text-slate-400">
                We encountered an issue signing you in
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-red-800 dark:text-red-200 text-sm">{getErrorMessage()}</p>
              </div>

              <div className="space-y-3">
                <DaisyButton
                  asChild
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
                >
                  <Link href="/auth/login">Try Again</Link>
                </DaisyButton>

                <DaisyButton
                  asChild
                  variant="outline"
                  className="w-full h-11 bg-white/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </DaisyButton>
              </div>

              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                Need help?{' '}
                <Link
                  href="/support"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline underline-offset-4 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          © 2024 Riscura. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
