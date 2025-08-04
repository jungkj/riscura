import { redirect } from 'next/navigation';

// Redirect /documents to /dashboard/documents for backward compatibility
export default function DocumentsRedirect() {
  redirect('/dashboard/documents');
}
