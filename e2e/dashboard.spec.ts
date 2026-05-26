import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('renders dashboard with stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Students')).toBeVisible()
    await expect(page.locator('text=Placed')).toBeVisible()
    await expect(page.locator('text=Unplaced')).toBeVisible()
    await expect(page.locator('text=Milestones Completed')).toBeVisible()
  })

  test('displays placement percentage', async ({ page }) => {
    await expect(page.locator('text=60%')).toBeVisible()
  })

  test('shows semester name', async ({ page }) => {
    await expect(page.locator('text=Jan-Jun 2026')).toBeVisible()
  })

  test('has link to broadcasts page', async ({ page }) => {
    const dispatchLink = page.locator('a[href="/broadcasts"]')
    await expect(dispatchLink).toBeVisible()
    await expect(dispatchLink).toContainText('Dispatch Alert')
  })

  test('displays logbook intelligence table', async ({ page }) => {
    await expect(page.locator('text=Logbook Intelligence')).toBeVisible()
    await expect(page.locator('text=Student Identity')).toBeVisible()
    await expect(page.locator('text=Week 6')).toBeVisible()
  })

  test('can filter logbook status', async ({ page }) => {
    const filter = page.locator('select')
    await filter.selectOption('Late')
    await page.waitForTimeout(300)
  })

  test('navigates to students page via sidebar', async ({ page }) => {
    await page.click('a[href="/students"]')
    await expect(page).toHaveURL('http://localhost:3000/students')
  })
})
