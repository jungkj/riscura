// Next.js Configuration with Performance Optimizations
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-test'] } : false,
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
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // Webpack configuration for performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
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

    // Optimize chunks
    if (config.optimization) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 15,
            reuseExistingChunk: true,
          },
          charts: {
            test: /[\\/](recharts|chart\.js|d3)[\\/]/,
            name: 'charts',
            priority: 20,
            reuseExistingChunk: true,
          },
          icons: {
            test: /[\\/](lucide-react|@heroicons|react-icons)[\\/]/,
            name: 'icons',
            priority: 25,
            reuseExistingChunk: true,
          },
        },
      };
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

    // CSS optimization
    if (!dev && !isServer) {
      try {
        const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
        if (!config.optimization.minimizer) {
          config.optimization.minimizer = [];
        }
        config.optimization.minimizer.push(new CssMinimizerPlugin());
      } catch (error) {
        console.warn('CSS minimizer plugin not available:', error.message);
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
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // Trailing slash
  trailingSlash: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig; 