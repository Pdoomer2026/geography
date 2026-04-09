import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Electron の dist/index.html ロードに必要な相対パス指定
  base: './',
  // settings/ を静的配信: fetch('/cc-map.json') でブラウザ環境でも cc-map.json を読める
  // spec: docs/spec/cc-mapping.spec.md §6
  publicDir: 'settings',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
