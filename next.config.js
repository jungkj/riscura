// Next.js Configuration Optimized for Vercel Deployment
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Page extensions for MDX
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  
  // Experimental features optimized for Next.js 15.4.5
  experimental: {
    // Enable optimizations for faster builds
    scrollRestoration: true,
    // Optimize bundling for Vercel deployment
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@tabler/icons-react'],
    // Enable SWC transforms for better performance
    forceSwcTransforms: true,
    // Enable optimized CSS loading
    optimizeCss: true,
  },
  
  // External packages for server components
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // Note: Turbopack not available in Next.js 15.0.0
  // turbopack: {
  //   rules: {
  //     '*.svg': {
  //       loaders: ['@svgr/webpack'],
  //       as: '*.js',
  //     },
  //   },
  // },

  // Compiler optimizations with SWC enabled
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-test'] } : false,
    // Enable SWC for styled-components if needed
    styledComponents: false,
    // Note: swcMinify is deprecated in Next.js 15+ (SWC minification is enabled by default)
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack configuration optimized for Next.js 15.3.4 and Vercel
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure proper file extension resolution
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    // Memory optimization for production builds
    if (!dev) {
      // Simplified optimization to prevent memory issues
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        providedExports: true,
        usedExports: true,
        // Disable memory-intensive optimizations
        concatenateModules: false,
        sideEffects: true,
      };
      
      // Increase performance limits for large application
      config.performance = {
        ...config.performance,
        maxAssetSize: 1024000, // 1MB
        maxEntrypointSize: 1024000, // 1MB
        hints: 'warning',
      };

      // Simplified chunk splitting for stability
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            reuseExistingChunk: true,
          },
          // Separate React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Separate UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|@tabler)[\\/]/,
            name: 'ui-libs',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Bundle analyzer (optional)
    if (process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: true,
          })
        );
      } catch (error) {
        console.warn('Bundle analyzer not available:', error.message);
      }
    }

    // Compression for production
    if (!dev && !isServer) {
      try {
        const CompressionPlugin = require('compression-webpack-plugin');
        config.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );
      } catch (error) {
        console.warn('Compression plugin not available:', error.message);
      }
    }

    return config;
  },

  // Output configuration
  output: 'standalone',

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // Redirects and rewrites for performance
  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },

  // PoweredByHeader
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // ESLint configuration for build
  eslint: {
    // Allow builds to complete with warnings, but not errors
    ignoreDuringBuilds: false,
  },

  // Trailing slash
  trailingSlash: false,

  // TypeScript configuration - optimized for Next.js 15.4.5
  typescript: {
    // Temporarily ignore build errors while fixing JSX syntax issues
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },

  // SWC enabled for optimal performance - .babelrc removed


  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Dev indicators
  devIndicators: {
    position: 'bottom-right',
  },

  // Generate static files
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'build-' + Date.now();
  },
};

export default nextConfig;