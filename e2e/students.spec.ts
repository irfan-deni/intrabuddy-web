import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Students Directory', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
  })

  test('renders student directory page', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Student Directory')
    await expect(page.locator('input[placeholder*="Search by name"]')).toBeVisible()
  })

  test('displays student list', async ({ page }) => {
    await expect(page.locator('text=Alice Johnson')).toBeVisible()
    await expect(page.locator('text=Bob Smith')).toBeVisible()
    await expect(page.locator('text=Charlie Brown')).toBeVisible()
  })

  test('can search students by name', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'Alice')
    await page.waitForTimeout(300)
    await expect(page.locator('text=Alice Johnson')).toBeVisible()
    await expect(page.locator('text=Bob Smith')).not.toBeVisible()
  })

  test('can search students by matric number', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'MATRIC002')
    await page.waitForTimeout(300)
    await expect(page.locator('text=Bob Smith')).toBeVisible()
    await expect(page.locator('text=Alice Johnson')).not.toBeVisible()
  })

  test('can filter by placement status', async ({ page }) => {
    const filter = page.locator('select').first()
    await filter.selectOption('Accepted')
    await page.waitForTimeout(300)
    await expect(page.locator('text=Alice Johnson')).toBeVisible()
    await expect(page.locator('text=Bob Smith')).not.toBeVisible()
  })

  test('shows empty state when no match', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'NonExistent')
    await page.waitForTimeout(300)
    await expect(page.locator('text=No matching records found')).toBeVisible()
  })

  test('opens student dossier sidebar on click', async ({ page }) => {
    await page.locator('text=Alice Johnson').first().click()
    await expect(page.locator('text=Student Dossier')).toBeVisible()
    await expect(page.locator('text=ALICE JOHNSON')).toBeVisible()
    await expect(page.locator('text=MATRIC001')).toBeVisible()
  })

  test('student dossier sidebar has full profile link', async ({ page }) => {
    await page.locator('text=Alice Johnson').first().click()
    const profileLink = page.locator('a[href*="/student?id=student-1"]')
    await expect(profileLink).toBeVisible()
    await expect(profileLink).toContainText('Full Profile')
  })

  test('closes sidebar with close button', async ({ page }) => {
    await page.locator('text=Alice Johnson').first().click()
    await expect(page.locator('text=Student Dossier')).toBeVisible()
    await page.locator('button:has(.pi-arrow-left)').first().click()
    await expect(page.locator('text=Student Dossier')).not.toBeVisible()
  })
})
