"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo/riscura.png" 
              alt="Riscura Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-3xl font-bold text-foreground">Riscura</h1>
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