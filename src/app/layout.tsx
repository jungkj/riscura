import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthContext';
import { RiskProvider } from '@/context/RiskContext';
import { ControlProvider } from '@/context/ControlContext';
import { AIProvider } from '@/context/AIContext';
import { Toaster } from '@/components/ui/sonner';
import ClientProvider from '@/components/providers/ClientProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Riscura - AI-Powered Risk Management',
  description: 'Comprehensive risk management platform with AI-powered insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body 
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased font-semibold`}
        suppressHydrationWarning={true}
      >
        <ClientProvider>
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
                      <div className="relative min-h-screen bg-background">
                        {children}
                      </div>
                      <Toaster />
                    </AIProvider>
                  </ControlProvider>
                </RiskProvider>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </ClientProvider>
      </body>
    </html>
  );
} 