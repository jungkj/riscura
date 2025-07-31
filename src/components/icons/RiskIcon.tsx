import { LucideProps } from 'lucide-react';

export function RiskIcon(props: LucideProps) {

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 12 8-8v5h12l-8 8v-5H2Z" />
    </svg>
  );
}