import { redirect } from 'next/navigation';

// Redirect /workflows to /dashboard/workflows for backward compatibility
export default function WorkflowsRedirect() {
  redirect('/dashboard/workflows');
}
