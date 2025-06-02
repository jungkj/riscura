import { redirect } from 'next/navigation';

// Redirect /risks to /dashboard/risks for backward compatibility
export default function RisksRedirect() {
  redirect('/dashboard/risks');
} 