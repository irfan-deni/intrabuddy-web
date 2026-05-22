import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Logbooks', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/logbooks')
    await page.waitForLoadState('networkidle')
  })

  test('renders logbook review page', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Logbook Review')
    await expect(page.locator('text=Logbook Submissions')).toBeVisible()
  })

  test('displays logbook entries', async ({ page }) => {
    await expect(page.locator('text=Alice Johnson')).toBeVisible()
    await expect(page.locator('text=Bob Smith')).toBeVisible()
  })

  test('shows week number for each entry', async ({ page }) => {
    await expect(page.locator('text=Week 6')).toBeVisible()
  })

  test('has status filter dropdown', async ({ page }) => {
    const filter = page.locator('select')
    await expect(filter).toBeVisible()
    await filter.selectOption('Submitted')
  })

  test('has refresh button', async ({ page }) => {
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible()
  })
})
