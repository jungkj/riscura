import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AIProvider } from '@/context/AIContext';
import { AuthProvider } from '@/context/AuthContext';
import { RiskProvider } from '@/context/RiskContext';
import { ControlProvider } from '@/context/ControlContext';
import { QuestionnaireProvider } from '@/context/QuestionnaireContext';
import { WorkflowProvider } from '@/context/WorkflowContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Riscura - AI-Powered RCSA Automation',
  description: 'Advanced Risk and Control Self-Assessment platform powered by AI',
  keywords: ['risk management', 'compliance', 'AI', 'automation', 'RCSA'],
  authors: [{ name: 'Riscura Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Riscura - AI-Powered RCSA Automation',
    description: 'Advanced Risk and Control Self-Assessment platform powered by AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riscura - AI-Powered RCSA Automation',
    description: 'Advanced Risk and Control Self-Assessment platform powered by AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AIProvider>
              <RiskProvider>
                <ControlProvider>
                  <QuestionnaireProvider>
                    <WorkflowProvider>
                      {children}
                      <Toaster />
                      <Sonner />
                    </WorkflowProvider>
                  </QuestionnaireProvider>
                </ControlProvider>
              </RiskProvider>
            </AIProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 