import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/accessibility.css';
import '../styles/design-system.css';
import Providers from './providers';
import { AccessibilityAnnouncements } from '@/components/ui/HighContrastToggle';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Riscura - AI-Powered Risk Management',
  description: 'Comprehensive risk management platform with AI-powered insights',
  icons: {
    icon: [
      { url: '/images/logo/riscura.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo/riscura.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/logo/riscura.png',
    apple: { url: '/images/logo/riscura.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logo/riscura.png" sizes="any" />
        <link rel="icon" href="/images/logo/riscura.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/riscura.png" />
      </head>
      <body 
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased font-semibold`}
        suppressHydrationWarning={true}
      >
        {/* Skip Links for Keyboard Navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#navigation" className="skip-link">
          Skip to navigation
        </a>
        
        <Providers>
          <div className="relative min-h-screen bg-background">
            {children}
          </div>
        </Providers>
        
        {/* Accessibility Announcements */}
        <AccessibilityAnnouncements />
      </body>
    </html>
  );
} 