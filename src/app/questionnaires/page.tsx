import { redirect } from 'next/navigation';

// Redirect /questionnaires to /dashboard/questionnaires for backward compatibility
export default function QuestionnairesRedirect() {
  redirect('/dashboard/questionnaires')
}
