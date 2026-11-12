import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    minify: false,
    target: 'es2022',
    lib: {
      entry: 'src/client/index.ts',
      formats: ['iife'],
      name: 'DshFuturisticStyleClient',
      fileName: () => 'client.js'
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
});
