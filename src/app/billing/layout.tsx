// Force dynamic rendering for all billing pages
export const dynamic = 'force-dynamic'

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
