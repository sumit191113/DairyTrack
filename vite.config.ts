import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production to reduce bundle size
    emptyOutDir: true, // Clean the output directory before building
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks for better caching
          vendor: ['react', 'react-dom', 'lucide-react'],
          firebase: ['firebase/app', 'firebase/database'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true, // Expose to network for mobile testing
  }
});