import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Authentication & Authorization', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('redirects to login when accessing any protected page', async ({ page }) => {
    await page.goto('/students')
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('stays on login page when already there', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('can access dashboard after auth', async ({ page }) => {
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toContainText('Dashboard')
  })
})
