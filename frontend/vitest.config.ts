import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fake-anon-key'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // @ts-expect-error vitest coverage types may mismatch
      all: true,
      include: ['src/services/**/*.ts', 'src/context/**/*.tsx', 'src/hooks/**/*.ts', 'src/lib/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.config.ts',
        'vitest.setup.ts',
        'tailwind.config.js',
        'postcss.config.mjs',
        'eslint.config.mjs',
        'next-env.d.ts',
        'src/types/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/components/ui/**',
        'src/app/**',
        'src/app/layout.tsx',
        'src/app/globals.css'
      ]
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
