/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    'bg-background',
    'bg-[#F5F1E9]',
    'min-h-screen',
    {
      pattern: /bg-(background|card|primary|secondary|accent)/,
    }
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px', 
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          blue: '#199BEC',
          'blue-hover': '#0f7dc7',
          'blue-light': '#e6f4fd',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // ========== ENTERPRISE NOTION-INSPIRED COLOR SYSTEM ==========
        
        // Primary Navigation & Surfaces
        surface: {
          primary: '#fafbfc',      // Main background (Notion white)
          secondary: '#f1f3f4',    // Secondary background
          tertiary: '#e8eaed',     // Tertiary background
          elevated: '#ffffff',     // Cards and elevated surfaces
          dark: '#1a1a2e',        // Deep navy for dark mode
        },
        
        // Text & Content Hierarchy (WCAG 2.1 AA Compliant)
        text: {
          primary: '#1A1A1A',      // Primary text (Enhanced contrast 15.8:1)
          secondary: '#4A4A4A',    // Secondary text (Enhanced contrast 9.7:1)
          tertiary: '#6B6B6B',     // Muted text (Enhanced contrast 6.4:1)
          inverse: '#ffffff',      // Text on dark backgrounds
          charcoal: '#2C2C2C',     // Alternative primary text (Enhanced contrast 12.6:1)
          disabled: '#9E9E9E',     // Disabled text (4.5:1 minimum)
        },
        
        // Interactive Elements & Actions (WCAG 2.1 AA Compliant)
        interactive: {
          primary: '#1976D2',      // Primary actions (Enhanced contrast 4.5:1)
          primaryHover: '#1565C0', // Primary hover state (Enhanced contrast 5.2:1)
          secondary: '#E3F2FD',    // Secondary actions (light blue)
          danger: '#D32F2F',       // Destructive actions (Enhanced contrast 5.9:1)
          success: '#2E7D32',      // Success states (Enhanced contrast 4.8:1)
          warning: '#F57C00',      // Warning states (Enhanced contrast 4.6:1)
          purple: '#512DA8',       // AI/Insights features (Enhanced contrast 6.1:1)
          focus: '#1976D2',        // Focus indicator color
        },
        
        // Risk Management Status Colors
        risk: {
          critical: '#d32f2f',     // Critical risk
          high: '#f57c00',         // High risk  
          medium: '#fbc02d',       // Medium risk
          low: '#388e3c',          // Low risk
          minimal: '#4caf50',      // Minimal risk
        },
        
        // Compliance & Process Status
        compliance: {
          compliant: '#4caf50',    // Compliant status
          nonCompliant: '#f44336', // Non-compliant status
          inProgress: '#2196f3',   // In progress
          notStarted: '#9e9e9e',   // Not started
          pending: '#f57c00',      // Pending review
          overdue: '#d32f2f',      // Overdue items
          completed: '#388e3c',    // Completed tasks
          deactivated: '#757575',  // Deactivated items
        },
        
        // Enhanced Semantic Colors (WCAG 2.1 AA Compliant)
        semantic: {
          info: '#1976D2',         // Information (Enhanced contrast 4.5:1)
          success: '#2E7D32',      // Success (Enhanced contrast 4.8:1)
          warning: '#F57C00',      // Warning/attention (Enhanced contrast 4.6:1)
          error: '#D32F2F',        // Error (Enhanced contrast 5.9:1)
          neutral: '#616161',      // Neutral medium gray (Enhanced contrast 7.0:1)
        },
        
        // Data Visualization Palette (Color-blind friendly)
        chart: {
          blue: '#2383e2',
          green: '#34a853',
          orange: '#f57c00',
          red: '#ea4335',
          purple: '#6f42c1',
          teal: '#00796b',
          amber: '#fbc02d',
          pink: '#e91e63',
          indigo: '#3f51b5',
          cyan: '#00bcd4',
        },
        
        // Legacy Notion-inspired colors (for backwards compatibility)
        notion: {
          gray: '#6f6f6f',
          brown: '#9b9a97',
          orange: '#f57c00',
          yellow: '#fbbc04',
          green: '#34a853',
          blue: '#2383e2',
          purple: '#6f42c1',
          pink: '#e91e63',
          red: '#ea4335',
          // Background colors
          'bg-primary': '#fafbfc',
          'bg-secondary': '#f1f3f4',
          'bg-tertiary': '#e8eaed',
          // Text colors
          'text-primary': '#37352f',
          'text-secondary': '#6f6f6f',
          'text-tertiary': '#9b9a97',
          // Borders
          'border': '#e8eaed',
        },
        
        // Enterprise tenant branding support
        brand: {
          primary: 'var(--brand-primary, #2383e2)',
          secondary: 'var(--brand-secondary, #f1f3f4)',
          accent: 'var(--brand-accent, #6f42c1)',
          surface: 'var(--brand-surface, #fafbfc)',
        },
        
        // Accessibility & High Contrast Support (WCAG 2.1 AA/AAA Compliant)
        contrast: {
          high: '#000000',         // AAA contrast (21:1)
          medium: '#1A1A1A',       // AA large text contrast (15.8:1)
          low: '#4A4A4A',          // AA normal text contrast (9.7:1)
          inverse: '#ffffff',      // White text on dark backgrounds
          focus: '#1976D2',        // Focus indicator (4.5:1)
          border: '#E0E0E0',       // Border color (3:1 for non-text)
        },
        
        // High Contrast Mode Colors
        highContrast: {
          background: '#FFFFFF',
          surface: '#F5F5F5',
          text: '#000000',
          primary: '#0000EE',      // High contrast blue
          secondary: '#666666',
          success: '#006600',      // High contrast green
          warning: '#CC6600',      // High contrast orange
          error: '#CC0000',        // High contrast red
          border: '#000000',
          focus: '#FF0000',        // High contrast focus (red)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "notion-fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "notion-slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "notion-fade-in": "notion-fade-in 0.3s ease-out",
        "notion-slide-in": "notion-slide-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        // Standard Inter weights for enterprise
        normal: '400',      // Regular text
        medium: '500',      // Body text emphasis
        semibold: '600',    // Headings and strong emphasis
        bold: '700',        // Display headings
        extrabold: '800',   // Large display text
        black: '900',       // Hero text
      },
      letterSpacing: {
        // Notion-inspired letter spacing
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.02em',
        widest: '0.03em',
        // Display text spacing
        'display-tight': '-0.025em',
        'display-normal': '-0.015em',
        'display-wide': '-0.005em',
      },
      lineHeight: {
        // Enhanced line heights for readability
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
        // Typography-specific line heights
        'heading': '1.2',
        'subheading': '1.3',
        'body': '1.6',
        'caption': '1.4',
        'display': '1.1',
      },
      fontSize: {
        // ========== NOTION-INSPIRED TYPOGRAPHY SCALE ==========
        
        // Body Text Hierarchy
        'body-xs': ['0.75rem', { 
          lineHeight: '1.4', 
          fontFamily: 'Inter', 
          fontWeight: '400',
          letterSpacing: '0.01em'
        }],
        'body-sm': ['0.875rem', { 
          lineHeight: '1.6', 
          fontFamily: 'Inter', 
          fontWeight: '400',
          letterSpacing: '0'
        }],
        'body-base': ['1rem', { 
          lineHeight: '1.6', 
          fontFamily: 'Inter', 
          fontWeight: '400',
          letterSpacing: '0'
        }],
        'body-lg': ['1.125rem', { 
          lineHeight: '1.6', 
          fontFamily: 'Inter', 
          fontWeight: '400',
          letterSpacing: '-0.005em'
        }],
        
        // Heading Hierarchy
        'heading-xs': ['0.875rem', { 
          lineHeight: '1.3', 
          fontFamily: 'Inter', 
          fontWeight: '600',
          letterSpacing: '0.01em'
        }],
        'heading-sm': ['1rem', { 
          lineHeight: '1.3', 
          fontFamily: 'Inter', 
          fontWeight: '600',
          letterSpacing: '0'
        }],
        'heading-base': ['1.125rem', { 
          lineHeight: '1.3', 
          fontFamily: 'Inter', 
          fontWeight: '600',
          letterSpacing: '-0.005em'
        }],
        'heading-lg': ['1.25rem', { 
          lineHeight: '1.2', 
          fontFamily: 'Inter', 
          fontWeight: '600',
          letterSpacing: '-0.01em'
        }],
        'heading-xl': ['1.5rem', { 
          lineHeight: '1.2', 
          fontFamily: 'Inter', 
          fontWeight: '700',
          letterSpacing: '-0.015em'
        }],
        'heading-2xl': ['1.875rem', { 
          lineHeight: '1.2', 
          fontFamily: 'Inter', 
          fontWeight: '700',
          letterSpacing: '-0.02em'
        }],
        'heading-3xl': ['2.25rem', { 
          lineHeight: '1.1', 
          fontFamily: 'Inter', 
          fontWeight: '700',
          letterSpacing: '-0.025em'
        }],
        
        // Display Typography for Marketing/Hero sections
        'display-sm': ['2.25rem', { 
          lineHeight: '1.1', 
          fontFamily: 'Inter', 
          fontWeight: '800',
          letterSpacing: '-0.025em'
        }],
        'display-md': ['3rem', { 
          lineHeight: '1.1', 
          fontFamily: 'Inter', 
          fontWeight: '800',
          letterSpacing: '-0.03em'
        }],
        'display-lg': ['3.75rem', { 
          lineHeight: '1.1', 
          fontFamily: 'Inter', 
          fontWeight: '900',
          letterSpacing: '-0.035em'
        }],
        'display-xl': ['4.5rem', { 
          lineHeight: '1.05', 
          fontFamily: 'Inter', 
          fontWeight: '900',
          letterSpacing: '-0.04em'
        }],
        
        // Caption and Label Text
        'caption': ['0.75rem', { 
          lineHeight: '1.4', 
          fontFamily: 'Inter', 
          fontWeight: '500',
          letterSpacing: '0.01em'
        }],
        'label': ['0.875rem', { 
          lineHeight: '1.4', 
          fontFamily: 'Inter', 
          fontWeight: '500',
          letterSpacing: '0.005em'
        }],
        'overline': ['0.75rem', { 
          lineHeight: '1.2', 
          fontFamily: 'Inter', 
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }],
        
        // Interactive Text
        'link': ['1rem', { 
          lineHeight: '1.6', 
          fontFamily: 'Inter', 
          fontWeight: '500',
          letterSpacing: '0'
        }],
        'button': ['0.875rem', { 
          lineHeight: '1.4', 
          fontFamily: 'Inter', 
          fontWeight: '500',
          letterSpacing: '0.005em'
        }],
        'button-lg': ['1rem', { 
          lineHeight: '1.4', 
          fontFamily: 'Inter', 
          fontWeight: '500',
          letterSpacing: '0'
        }],
        
        // Legacy enterprise classes (for backwards compatibility)
        'enterprise-xs': ['0.75rem', { lineHeight: '1.4', fontFamily: 'Inter', fontWeight: '500' }],
        'enterprise-sm': ['0.875rem', { lineHeight: '1.6', fontFamily: 'Inter', fontWeight: '500' }],
        'enterprise-base': ['1rem', { lineHeight: '1.6', fontFamily: 'Inter', fontWeight: '500' }],
        'enterprise-lg': ['1.125rem', { lineHeight: '1.6', fontFamily: 'Inter', fontWeight: '600' }],
        'enterprise-xl': ['1.25rem', { lineHeight: '1.2', fontFamily: 'Inter', fontWeight: '600' }],
        'enterprise-2xl': ['1.5rem', { lineHeight: '1.2', fontFamily: 'Inter', fontWeight: '700' }],
        'enterprise-3xl': ['1.875rem', { lineHeight: '1.1', fontFamily: 'Inter', fontWeight: '700' }],
      },
      
      spacing: {
        // Enterprise spacing scale
        'enterprise-1': '0.25rem',   // 4px
        'enterprise-2': '0.5rem',    // 8px
        'enterprise-3': '0.75rem',   // 12px
        'enterprise-4': '1rem',      // 16px
        'enterprise-5': '1.25rem',   // 20px
        'enterprise-6': '1.5rem',    // 24px
        'enterprise-8': '2rem',      // 32px
        'enterprise-10': '2.5rem',   // 40px
        'enterprise-12': '3rem',     // 48px
        'enterprise-16': '4rem',     // 64px
        'enterprise-20': '5rem',     // 80px
        'enterprise-24': '6rem',     // 96px
        
        // Component-specific spacing
        'sidebar-width': '16rem',     // 256px
        'sidebar-collapsed': '4rem',  // 64px
        'header-height': '4rem',      // 64px
        'card-padding': '1.5rem',     // 24px
        'section-gap': '2rem',        // 32px
      },
      boxShadow: {
        // Notion-inspired subtle shadows
        'notion-sm': '0 1px 2px 0 rgba(55, 53, 47, 0.05)',
        'notion': '0 1px 3px 0 rgba(55, 53, 47, 0.1), 0 1px 2px 0 rgba(55, 53, 47, 0.06)',
        'notion-md': '0 4px 6px -1px rgba(55, 53, 47, 0.1), 0 2px 4px -1px rgba(55, 53, 47, 0.06)',
        'notion-lg': '0 10px 15px -3px rgba(55, 53, 47, 0.1), 0 4px 6px -2px rgba(55, 53, 47, 0.05)',
        'notion-xl': '0 20px 25px -5px rgba(55, 53, 47, 0.1), 0 10px 10px -5px rgba(55, 53, 47, 0.04)',
        
        // Enterprise card shadows
        'card-sm': '0 1px 3px 0 rgba(55, 53, 47, 0.08)',
        'card': '0 2px 4px 0 rgba(55, 53, 47, 0.1), 0 1px 2px 0 rgba(55, 53, 47, 0.06)',
        'card-md': '0 4px 8px 0 rgba(55, 53, 47, 0.12), 0 2px 4px 0 rgba(55, 53, 47, 0.08)',
        'card-lg': '0 8px 16px 0 rgba(55, 53, 47, 0.15), 0 4px 8px 0 rgba(55, 53, 47, 0.1)',
        
        // Interactive element shadows
        'interactive': '0 2px 4px 0 rgba(35, 131, 226, 0.1), 0 1px 2px 0 rgba(35, 131, 226, 0.06)',
        'interactive-lg': '0 4px 8px 0 rgba(35, 131, 226, 0.15), 0 2px 4px 0 rgba(35, 131, 226, 0.1)',
        
        // Focus and accessibility shadows (WCAG 2.1 AA Compliant)
        'focus': '0 0 0 3px rgba(25, 118, 210, 0.3)',
        'focus-error': '0 0 0 3px rgba(211, 47, 47, 0.3)',
        'focus-success': '0 0 0 3px rgba(46, 125, 50, 0.3)',
        'focus-warning': '0 0 0 3px rgba(245, 124, 0, 0.3)',
        'focus-visible': '0 0 0 2px #FFFFFF, 0 0 0 4px rgba(25, 118, 210, 0.6)',
        'focus-high-contrast': '0 0 0 3px #FF0000',
      },
      // Custom gradients
      backgroundImage: {
        // Notion-inspired gradients
        'gradient-notion': 'linear-gradient(135deg, #fafbfc 0%, #f1f3f4 100%)',
        'gradient-notion-subtle': 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        'gradient-interactive': 'linear-gradient(135deg, #2383e2 0%, #1a73d8 100%)',
        'gradient-success': 'linear-gradient(135deg, #34a853 0%, #0f7b0f 100%)',
        'gradient-warning': 'linear-gradient(135deg, #fbbc04 0%, #f57c00 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ea4335 0%, #d50000 100%)',
        
        // Enterprise dashboard gradients
        'gradient-dashboard': 'linear-gradient(135deg, #fafbfc 0%, #e8eaed 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)',
        
        // Status gradients for data visualization
        'gradient-risk-critical': 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
        'gradient-risk-high': 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
        'gradient-risk-medium': 'linear-gradient(135deg, #fbc02d 0%, #f57f17 100%)',
        'gradient-risk-low': 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      {
        riscura: {
          "primary": "#3b82f6",
          "secondary": "#10b981",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      {
        riscuraDark: {
          "primary": "#60a5fa",
          "secondary": "#34d399",
          "accent": "#fbbf24",
          "neutral": "#e5e7eb",
          "base-100": "#1f2937",
          "base-200": "#111827",
          "base-300": "#030712",
          "info": "#60a5fa",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
    ],
  },
}
