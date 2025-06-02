import { redirect } from 'next/navigation';

// Redirect /controls to /dashboard/controls for backward compatibility
export default function ControlsRedirect() {
  redirect('/dashboard/controls');
} 