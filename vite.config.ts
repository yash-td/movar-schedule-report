import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    hmr: {
      overlay: true,
      // Increase timeout to prevent disconnections during development
      timeout: 5000
    },
    // Add watch options to optimize file watching
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  optimizeDeps: {
    // Pre-bundle these dependencies to improve startup time
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@supabase/supabase-js'
    ]
  }
});