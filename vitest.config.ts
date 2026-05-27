import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config()

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.output', '.nuxt', '**/__tests__/components/**']
  }
})
