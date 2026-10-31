import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['**/crud-integration.test.ts', '**/__tests__/components/**'],
    env: { SUPABASE_URL: '', SUPABASE_KEY: '', SUPABASE_SERVICE_KEY: '' }
  }
})
