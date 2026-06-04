import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/car-drift/' : '/',
  server: {
    watch: {
      ignored: ['**/.context/**', '**/dist/**', '**/node_modules/**'],
    },
  },
});
