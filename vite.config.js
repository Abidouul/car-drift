import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/.context/**', '**/dist/**', '**/node_modules/**'],
    },
  },
});
