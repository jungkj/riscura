/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // New Refined Beige Color Palette
        beige: {
          50: '#FAFAFA',   // Soft White
          100: '#F5F1E9',  // Background Beige - main background
          200: '#E8E2D5',  // Lighter variant
          300: '#D8C3A5',  // Warm Beige Accent - for accents and secondary elements
          400: '#C4A973',  // Medium beige
          500: '#B09441',  // Darker beige
          600: '#9C8337',  // Rich beige
          700: '#7A6429',  // Deep beige
          800: '#5A4A1F',  // Very dark beige
          900: '#191919',  // Dark Black - for text and primary elements
        },
        // Direct color mappings for the new scheme
        'background-beige': '#F5F1E9',
        'dark-black': '#191919',
        'muted-gray': '#A8A8A8',
        'warm-beige-accent': '#D8C3A5',
        'soft-white': '#FAFAFA',
        // Notion-inspired colors updated with new palette
        notion: {
          gray: '#A8A8A8',
          brown: '#D8C3A5',
          orange: '#F97316',
          yellow: '#EAB308',
          green: '#22C55E',
          blue: '#3B82F6',
          purple: '#9333EA',
          pink: '#EC4899',
          red: '#EF4444',
          // Background colors
          'bg-primary': '#F5F1E9',
          'bg-secondary': '#D8C3A5',
          'bg-tertiary': '#FAFAFA',
          // Text colors
          'text-primary': '#191919',
          'text-secondary': '#A8A8A8',
          'text-tertiary': '#999',
          // Borders
          'border': '#D8C3A5',
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "notion-fade-in": "notion-fade-in 0.3s ease-out",
        "notion-slide-in": "notion-slide-in 0.3s ease-out",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '600',
        medium: '600', 
        semibold: '700',
        bold: '800',
        extrabold: '900',
      },
      fontSize: {
        'beige-xs': ['0.75rem', { lineHeight: '1rem', fontFamily: 'Inter' }],
        'beige-sm': ['0.875rem', { lineHeight: '1.25rem', fontFamily: 'Inter' }],
        'beige-base': ['1rem', { lineHeight: '1.5rem', fontFamily: 'Inter' }],
        'beige-lg': ['1.125rem', { lineHeight: '1.75rem', fontFamily: 'Inter' }],
        'beige-xl': ['1.25rem', { lineHeight: '1.75rem', fontFamily: 'Inter' }],
      },
      spacing: {
        'beige-1': '0.25rem',
        'beige-2': '0.5rem',
        'beige-3': '0.75rem',
        'beige-4': '1rem',
        'beige-6': '1.5rem',
        'beige-8': '2rem',
      },
      boxShadow: {
        'beige-sm': '0 1px 2px 0 rgba(25, 25, 25, 0.05)',
        'beige': '0 1px 3px 0 rgba(25, 25, 25, 0.1), 0 1px 2px 0 rgba(25, 25, 25, 0.06)',
        'beige-md': '0 4px 6px -1px rgba(25, 25, 25, 0.1), 0 2px 4px -1px rgba(25, 25, 25, 0.06)',
        'beige-lg': '0 10px 15px -3px rgba(25, 25, 25, 0.1), 0 4px 6px -2px rgba(25, 25, 25, 0.05)',
        'beige-xl': '0 20px 25px -5px rgba(25, 25, 25, 0.1), 0 10px 10px -5px rgba(25, 25, 25, 0.04)',
      },
      // Custom gradients
      backgroundImage: {
        'gradient-beige': 'linear-gradient(135deg, #F5F1E9 0%, #D8C3A5 100%)',
        'gradient-beige-subtle': 'linear-gradient(135deg, #FAFAFA 0%, #F5F1E9 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
