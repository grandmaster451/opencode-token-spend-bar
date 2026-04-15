import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/fixtures/']
    }
  },
  resolve: {
    alias: {
      '@opentui/solid': path.resolve(__dirname, 'test/__stubs__/opentui-solid.ts'),
    },
  },
});