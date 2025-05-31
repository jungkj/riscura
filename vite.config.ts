import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: process.env.SKIP_TYPE_CHECK ? [] : undefined,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: process.env.SKIP_TYPE_CHECK ? [] : undefined,
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    ...(process.env.SKIP_TYPE_CHECK && {
      legalComments: 'none',
      target: 'es2020',
    }),
  },
});
