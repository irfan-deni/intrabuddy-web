import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100',
    env: {
      NUXT_SSR: 'false',
      SUPABASE_URL: 'https://intrabuddy-test.supabase.co',
      SUPABASE_KEY: 'test-public-key',
      NUXT_PUBLIC_SUPABASE_URL: 'https://intrabuddy-test.supabase.co',
      NUXT_PUBLIC_SUPABASE_KEY: 'test-public-key'
    },
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
