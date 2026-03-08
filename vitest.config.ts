import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'], // <-- ruta relativa correcta
    include: ['src/**/*.spec.ts'],
  },
});
