import { defineConfig } from 'vite';

export default defineConfig({
  base: '/NamaHam/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2020',
  },
});
