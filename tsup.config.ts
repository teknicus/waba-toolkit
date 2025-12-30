import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build (existing)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    target: 'node20',
    sourcemap: true,
  },
  // CLI build (new)
  {
    entry: ['src/cli/index.ts'],
    format: ['cjs'],
    outDir: 'dist',
    outExtension: () => ({ js: '.cli.js' }),
    banner: { js: '#!/usr/bin/env node' },
    clean: false,
    target: 'node20',
  },
]);
