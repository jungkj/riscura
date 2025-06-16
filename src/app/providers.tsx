'use client';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthContext';
import { RiskProvider } from '@/context/RiskContext';
import { ControlProvider } from '@/context/ControlContext';
import { AIProvider } from '@/context/AIContext';
import { Toaster } from '@/components/ui/sonner';
import ClientProvider from '@/components/providers/ClientProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <PerformanceProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          storageKey="riscura-theme"
        >
          <TooltipProvider>
            <AuthProvider>
              <RiskProvider>
                <ControlProvider>
                  <AIProvider>
                    {children}
                    <Toaster />
                  </AIProvider>
                </ControlProvider>
              </RiskProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </PerformanceProvider>
    </ClientProvider>
  );
} 