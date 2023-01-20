// vite.config.ts
import { defineConfig } from 'vite';

import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '~',
        replacement: path.resolve(__dirname, './lib'),
      },
    ],
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'index.ts'),
      fileName: 'main',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
});
