import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/car-drift/' : '/',
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three';
          return undefined;
        },
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/.context/**', '**/dist/**', '**/node_modules/**'],
    },
  },
});
