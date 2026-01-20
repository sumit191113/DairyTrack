import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled for production to reduce build size and hide source code
    emptyOutDir: true, // Cleans the dist folder before building
    chunkSizeWarningLimit: 1000, // Increases warning limit for larger chunks
  },
  server: {
    port: 3000,
    host: true // Allows access from network IP (good for mobile testing)
  }
});