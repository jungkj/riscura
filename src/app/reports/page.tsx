import { redirect } from 'next/navigation';

// Redirect /reports to /dashboard/reporting for backward compatibility
export default function ReportsRedirect() {
  redirect('/dashboard/reporting')
}
