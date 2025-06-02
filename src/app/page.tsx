'use client';

import dynamic from 'next/dynamic';

// Dynamically import the LandingPage component to avoid SSR issues
const LandingPage = dynamic(() => import('@/pages/LandingPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function HomePage() {
  return <LandingPage />;
} 