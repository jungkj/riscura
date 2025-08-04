import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './production-fix.css';
import '../styles/accessibility.css';
import '../styles/design-system.css';
import Providers from '@/app/providers';
import { CriticalErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/UserFeedback';
import { TourProvider } from '@/components/ui/HelpSystem';
import { GlobalStyles } from '@/components/ui/GlobalStyles';
import { AccessibilityAnnouncements } from '@/components/ui/HighContrastToggle';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#199BEC' },
    { media: '(prefers-color-scheme: dark)', color: '#199BEC' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Riscura - AI-Powered Risk Management Platform',
    template: '%s | Riscura',
  },
  description:
    'Transform your risk management with AI-powered insights, automated compliance workflows, and comprehensive RCSA capabilities.',
  keywords: ['risk management', 'compliance', 'RCSA', 'AI', 'security', 'governance'],
  authors: [{ name: 'Riscura Team' }],
  creator: 'Riscura',
  publisher: 'Riscura',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Riscura - AI-Powered Risk Management Platform',
    description:
      'Transform your risk management with AI-powered insights and automated compliance workflows.',
    siteName: 'Riscura',
    images: [
      {
        url: '/images/og/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Riscura - AI-Powered Risk Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@riscura',
    creator: '@riscura',
    title: 'Riscura - AI-Powered Risk Management Platform',
    description:
      'Transform your risk management with AI-powered insights and automated compliance workflows.',
    images: ['/images/og/twitter-image.png'],
  },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
    googleBot: {
      index: process.env.NODE_ENV === 'production',
      follow: process.env.NODE_ENV === 'production',
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/logo/riscura.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo/riscura.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/logo/riscura.png',
    apple: [{ url: '/images/logo/riscura.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: 'https://riscura.com',
  },
  category: 'technology',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={{ backgroundColor: '#FFFFFF' }}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/images/logo/riscura.png" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#199BEC" />
      </head>
      <body className={`${inter.variable} font-inter antialiased`} suppressHydrationWarning>
        <CriticalErrorBoundary>
          <GlobalStyles />
          <AccessibilityAnnouncements />
          <Providers>
            <TourProvider>
              <ToastProvider>{children}</ToastProvider>
            </TourProvider>
          </Providers>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}
