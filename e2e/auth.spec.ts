import { test, expect } from '@playwright/test'
import { setupPage, mockSupabaseRest, mockSupabaseAuth, mockApiRoutes } from './helpers'
import { MOCK_PROFILE } from './fixtures/data'

test.describe('Authentication & Authorization', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    // This is the first browser visit to the development server; allow Vite's
    // cold module compilation before client-side middleware can run.
    await expect(page).toHaveURL(/\/login$/, { timeout: 15000 })
  })

  test('redirects to login when accessing any protected page', async ({ page }) => {
    await page.goto('/students')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('stays on login page when already there', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('can access dashboard after auth', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toContainText('Dashboard')
  })

  test('direct student access returns to login with mobile guidance', async ({ page }) => {
    await setupPage(page)
    await page.route('**/api/auth/session-context', route => route.fulfill({
      json: { profile: { ...MOCK_PROFILE, role: 'student' }, isSuperCoordinator: false }
    }))
    await page.goto('/student?id=student-1')
    await expect(page).toHaveURL(/\/login\?reason=mobile-only$/)
    await expect(page.getByText('This portal is for coordinators. Students should use the INTRA Buddy mobile app.')).toBeVisible()
  })

  test('student password login stays on login with mobile guidance', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockApiRoutes(page)
    await page.route('**/api/auth/session-context', route => route.fulfill({
      json: { profile: { ...MOCK_PROFILE, role: 'student' }, isSuperCoordinator: false }
    }))
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('student@example.com')
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('This portal is for coordinators. Students should use the INTRA Buddy mobile app.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('coordinator password login works without a pre-existing session', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockSupabaseRest(page)
    await mockApiRoutes(page)
    let authorization: string | undefined
    let calls = 0
    await page.route('**/api/auth/session-context', async (route) => {
      calls++
      authorization = route.request().headers().authorization
      await route.fulfill({ json: { profile: MOCK_PROFILE, isSuperCoordinator: false } })
    })
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Enrolled students')).toBeVisible()
    expect(authorization).toMatch(/^Bearer /)
    expect(calls).toBe(1)
  })

  test('missing profile shows a profile error rather than student guidance', async ({ page }) => {
    await mockSupabaseAuth(page)
    await page.route('**/api/auth/session-context', route => route.fulfill({
      json: { profile: null, isSuperCoordinator: false }
    }))
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Your account profile is missing or inaccessible. Please contact your administrator.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('session context API failure shows an access verification error', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockSupabaseRest(page)
    await page.route('**/api/auth/session-context', (route) => route.fulfill({ status: 403, json: { message: 'Forbidden' } }))
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Unable to verify coordinator access. Please try again or contact your administrator.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
