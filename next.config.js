import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle canvas for charting libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize for AI/ML libraries
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('openai', 'exceljs');
    }
    
    // Only apply optimization in production to avoid dev conflicts
    if (!dev) {
      // Optimize PDF library handling
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // PDF libraries - lazy load these heavy dependencies
            pdf: {
              test: /[\\/]node_modules[\\/](pdf-parse|pdf\.js-extract|jspdf)[\\/]/,
              name: 'pdf-libs',
              chunks: 'async', // Only load when needed
              priority: 30,
              reuseExistingChunk: true,
            },
            // Core React libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Next.js framework
            framework: {
              test: /[\\/]node_modules[\\/](@next|next)[\\/]/,
              name: 'framework',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Large UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
              name: 'ui-libs',
              priority: 10,
              minSize: 20000,
              reuseExistingChunk: true,
            },
            // Database and API libraries
            database: {
              test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
              name: 'database',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Common vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 5,
              minSize: 30000,
              reuseExistingChunk: true,
            },
            // Common shared code - FURTHER reduced fragmentation
            common: {
              name: 'common',
              minChunks: 4, // Require 4+ references (was 3)
              chunks: 'all',
              priority: 1,
              minSize: 20000, // Minimum 20KB chunks (was 10KB)
              maxSize: 150000, // Maximum 150KB chunks
              reuseExistingChunk: true,
            },
          },
        },
        // Only apply tree shaking in production
        usedExports: true,
        sideEffects: false,
      };
    }
    
    // PDF library optimization - external when possible
    if (!isServer) {
      config.externals = {
        ...config.externals,
        // Externalize heavy PDF libraries in production
        ...(process.env.NODE_ENV === 'production' && {
          'pdf-parse': 'pdf-parse',
          'pdf.js-extract': 'pdf.js-extract',
        }),
      };
    }

    // Ignore large PDF workers in client bundle
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /pdf\.worker\.js$/,
        contextRegExp: /node_modules/,
      })
    );
    
    return config;
  },
  
  // Transpile packages for better performance
  transpilePackages: ['@radix-ui'],
  
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'production' ? process.env.APP_URL || 'https://riscura.com' : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects and rewrites
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Output configuration for deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // PWA optimizations (if using)
  generateEtags: false,
};

export default withBundleAnalyzer(nextConfig); 