import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    middleware: []
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  // Capacitor configuration for mobile builds
  define: {
    'process.env.CAPACITOR': JSON.stringify(true)
  }
});
