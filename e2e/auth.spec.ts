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
    await mockSupabaseRest(page, { ...MOCK_PROFILE, role: 'student' })
    await page.goto('/student?id=student-1')
    await expect(page).toHaveURL(/\/login\?reason=mobile-only$/)
    await expect(page.getByText('This portal is for coordinators. Students should use the INTRA Buddy mobile app.')).toBeVisible()
  })

  test('student password login stays on login with mobile guidance', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockApiRoutes(page)
    await mockSupabaseRest(page, { ...MOCK_PROFILE, role: 'student' })
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
    await page.route('**/api/auth/privileges', async (route) => {
      authorization = route.request().headers().authorization
      await route.fulfill({ json: { isSuperCoordinator: false } })
    })
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('h1').first()).toContainText('Dashboard')
    expect(authorization).toMatch(/^Bearer /)
  })

  test('missing profile shows a profile error rather than student guidance', async ({ page }) => {
    await mockSupabaseAuth(page)
    await page.route('**/rest/v1/users?*', (route) => route.fulfill({ json: null }))
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Your account profile is missing or inaccessible. Please contact your administrator.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('privilege API failure shows an access verification error', async ({ page }) => {
    await mockSupabaseAuth(page)
    await mockSupabaseRest(page)
    await page.route('**/api/auth/privileges', (route) => route.fulfill({ status: 403, json: { message: 'Forbidden' } }))
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(MOCK_PROFILE.email)
    await page.locator('input[type="password"]').fill('test-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Unable to verify coordinator access. Please try again or contact your administrator.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
