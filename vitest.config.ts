import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Pages fetch on mount and assertions wait on that, so allow a little
    // headroom over the default without letting a hung test stall the suite.
    testTimeout: 10_000,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['src/pages/**', 'src/services/**', 'src/lib/**'],
      exclude: ['src/test/**', '**/*.d.ts'],
    },
  },
})
