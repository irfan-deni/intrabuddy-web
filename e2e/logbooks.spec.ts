import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Logbooks', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/logbooks')
    await page.waitForLoadState('networkidle')
  })

  test('renders logbook review page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Logbooks')
    await expect(page.locator('text=Logbook Submissions')).toBeVisible()
  })

  test('displays logbook entries', async ({ page }) => {
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('MATRIC001')).toBeVisible()
  })

  test('shows submission progress for each student', async ({ page }) => {
    await expect(page.getByRole('table').getByText('1 / 2 submitted')).toBeVisible()
  })

  test('has status filter dropdown', async ({ page }) => {
    const filter = page.getByLabel('Filter by status')
    await expect(filter).toBeVisible()
    await filter.selectOption('Submitted')
  })

  test('has refresh button', async ({ page }) => {
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible()
  })
})
