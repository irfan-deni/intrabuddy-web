import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Student Dossier', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/student?id=student-1')
    await page.waitForLoadState('networkidle')
  })

  test('renders student dossier page', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Student Dossier')
    await expect(page.locator('text=Readiness Checklist')).toBeVisible()
    await expect(page.locator('text=Placement Applications')).toBeVisible()
    await expect(page.locator('text=Weekly Logbook Status')).toBeVisible()
  })

  test('displays checklist items', async ({ page }) => {
    await expect(page.locator('text=Upload Resume')).toBeVisible()
    await expect(page.locator('text=Submit Insurance Form')).toBeVisible()
    await expect(page.locator('text=Complete Orientation')).toBeVisible()
  })

  test('displays checklist completion percentage', async ({ page }) => {
    const percentageElements = page.locator('text=67%')
    await expect(percentageElements.first()).toBeVisible()
  })

  test('displays placement applications', async ({ page }) => {
    await expect(page.locator('text=Tech Corp')).toBeVisible()
    await expect(page.locator('text=Software Engineer Intern')).toBeVisible()
  })

  test('displays logbook entries', async ({ page }) => {
    await expect(page.locator('text=Week 1')).toBeVisible()
    await expect(page.locator('text=Week 2')).toBeVisible()
    await expect(page.locator('text=Week 3')).toBeVisible()
  })

  test('shows digital wallet items', async ({ page }) => {
    await expect(page.locator('text=Digital Wallet')).toBeVisible()
    await expect(page.locator('text=Resume.pdf')).toBeVisible()
  })
})
