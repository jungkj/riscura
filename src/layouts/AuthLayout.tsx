"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { RiskIcon } from '@/components/icons/RiskIcon';
import { useEffect } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-muted flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <RiskIcon className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Riscura</h1>
          </div>
        </div>
        
        {children}
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} Riscura Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}