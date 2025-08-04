'use client';

// import { RiskProvider } from '@/context/RiskContext'
import { ControlProvider } from '@/context/ControlContext';
import { RCSAProvider } from '@/context/RCSAContext';

export default function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <RCSAProvider>
      <RiskProvider>
        <ControlProvider>{children}</ControlProvider>
      </RiskProvider>
    </RCSAProvider>
  );
}
