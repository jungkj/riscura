// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.APP_VERSION || 'development',
  
  // Server-specific configuration
  enableTracing: true,
  
  // Profiling for performance insights
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enhanced error context
  beforeSend(event, hint) {
    // Filter sensitive information
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't log sensitive errors
      if (error?.message?.includes('password') || 
          error?.message?.includes('token') ||
          error?.message?.includes('secret') ||
          error?.message?.includes('key')) {
        return null;
      }
      
      // Sanitize database connection strings
      if (error?.message?.includes('postgresql://')) {
        error.message = error.message.replace(/postgresql:\/\/[^@]*@/, 'postgresql://***:***@');
      }
    }
    
    // Add server context
    event.contexts = {
      ...event.contexts,
      app: {
        name: 'RISCURA',
        version: process.env.APP_VERSION || 'development',
        component: 'server',
      },
      server: {
        name: process.env.SERVER_NAME || 'unknown',
        version: process.version,
        platform: process.platform,
      }
    };
    
    // Add custom tags
    event.tags = {
      ...event.tags,
      component: 'server',
      environment: process.env.NODE_ENV,
    };
    
    return event;
  },
  
  // Server-specific error filtering
  ignoreErrors: [
    // Database connection timeout (expected during maintenance)
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    
    // Client disconnections
    'ECONNABORTED',
    'socket hang up',
    
    // Rate limiting (expected behavior)
    'Too Many Requests',
    
    // Validation errors (user input issues)
    'ValidationError',
    'Invalid input',
  ],
  
  // Custom integrations for server monitoring
  integrations: [
    // HTTP integration for API monitoring
    new Sentry.Integrations.Http({ 
      tracing: true,
      breadcrumbs: true,
    }),
    
    // Express integration if using Express
    new Sentry.Integrations.Express({
      app: undefined, // Will be set when Express app is available
    }),
    
    // Node profiling
    new Sentry.ProfilingIntegration(),
  ],
  
  // Custom breadcrumb filtering
  beforeBreadcrumb(breadcrumb) {
    // Don't log sensitive HTTP headers
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (breadcrumb.data[header]) {
          breadcrumb.data[header] = '[Filtered]';
        }
      });
    }
    
    // Filter database queries with sensitive data
    if (breadcrumb.category === 'query' && breadcrumb.message) {
      // Mask potential sensitive data in SQL queries
      breadcrumb.message = breadcrumb.message
        .replace(/password\s*=\s*'[^']*'/gi, "password = '[Filtered]'")
        .replace(/token\s*=\s*'[^']*'/gi, "token = '[Filtered]'");
    }
    
    return breadcrumb;
  },
  
  // Server-specific scope
  initialScope: {
    tags: {
      component: 'server',
      runtime: 'nodejs',
      version: process.env.APP_VERSION || 'development',
    },
    contexts: {
      runtime: {
        name: 'node',
        version: process.version,
      },
    },
  },
}); 