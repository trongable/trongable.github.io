import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['three', 'react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['three'],
      },
    },
    environmentMatchGlobs: [
      ['src/utils/**', 'node'],
      ['src/components/canvas/geometries/__tests__/geometryMath.test.ts', 'node'],
      ['src/components/canvas/geometries/__tests__/geometryConfig.test.ts', 'node'],
      ['src/components/videos/__tests__/videoData.test.ts', 'node'],
    ],
    pool: 'vmThreads',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.test.{ts,tsx}',
        'src/testUtils/**',
        'src/components/canvas/geometries/index.ts',
        'src/components/canvas/HaloMenuRing.tsx',
        'src/components/ui/GeometryTuner.tsx',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 70,
        functions: 75,
      },
    },
  },
})
