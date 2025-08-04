import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LandingPage from '@/pages/LandingPage';
import { useEffect } from 'react';

export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Handle authentication logic in useEffect
  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // If user is authenticated, don't render the landing page
  if (isAuthenticated) {
    return null;
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};
