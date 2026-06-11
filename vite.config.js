import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/car-drift/' : '/',
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Loaders are dynamically imported (GLB streaming); keep them out
          // of the eagerly-loaded three chunk so the menu paints sooner.
          if (id.includes('/node_modules/three/examples/jsm/loaders/')) return 'three-loaders';
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
