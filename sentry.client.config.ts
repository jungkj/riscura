// This file configures the initialization of Sentry on the browser side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production
  
  // Session Replay for debugging
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1, // 1% in production
  replaysOnErrorSampleRate: 1.0, // 100% on errors
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Performance monitoring
  enableTracing: true,
  
  // User context
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes('password') || error?.message?.includes('token')) {
        return null; // Don't send sensitive errors
      }
    }
    
    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        name: 'RISCURA',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
      }
    };
    
    return event;
  },
  
  // Custom error filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    
    // Random plugins/extensions
    'window.top.opera',
    'conduitPage',
    
    // Network errors that are expected
    'Network request failed',
    'NetworkError',
    'fetch',
    
    // Non-actionable errors
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
  ],
  
  // Enhanced error context
  initialScope: {
    tags: {
      component: 'client',
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'development'
    },
  },
  
  // Profiling (for performance insights)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Custom integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Routing instrumentation
      routingInstrumentation: Sentry.nextRouterInstrumentation(
        require('next/router')
      ),
      
      // Performance monitoring for interactions
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^\/]*\.riscura\.com/,
        /^https:\/\/api\.riscura\.com/,
      ],
    }),
    
    new Sentry.Replay({
      // Capture 10% of all sessions in production
      sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
      
      // But capture 100% of sessions with an error
      errorSampleRate: 1.0,
      
      // Mask sensitive content
      maskAllText: false,
      blockAllMedia: false,
      
      // Custom masking
      mask: [
        '[data-sensitive]',
        '.password-input',
        '.credit-card',
        '.ssn-input',
      ],
    }),
  ],
  
  // Custom breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.type === 'info') {
      return null;
    }
    
    // Enhanced navigation breadcrumbs
    if (breadcrumb.category === 'navigation') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
    }
    
    return breadcrumb;
  },
}); 