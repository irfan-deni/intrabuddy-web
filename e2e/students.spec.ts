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
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('Bob Smith')).toBeVisible()
    await expect(page.getByRole('table').getByText('Charlie Brown')).toBeVisible()
  })

  test('can search students by name', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'Alice')
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('Bob Smith')).toHaveCount(0)
  })

  test('can search students by matric number', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'MATRIC002')
    await expect(page.getByRole('table').getByText('Bob Smith')).toBeVisible()
    await expect(page.getByRole('table').getByText('Alice Johnson')).toHaveCount(0)
  })

  test('can filter by placement status', async ({ page }) => {
    const filter = page.getByRole('combobox').filter({ has: page.locator('option[value="Accepted"]') })
    await filter.selectOption('Accepted')
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('Bob Smith')).toHaveCount(0)
  })

  test('shows empty state when no match', async ({ page }) => {
    await page.fill('input[placeholder*="Search by name"]', 'NonExistent')
    await expect(page.getByRole('cell', { name: 'No matching records found' })).toBeVisible()
  })

  test('opens the selected student profile on click', async ({ page }) => {
    await page.getByRole('table').getByText('Alice Johnson').click()
    await expect(page).toHaveURL(/\/student\?id=student-1/)
    await expect(page.getByRole('heading', { name: 'Student Profile', exact: true })).toBeVisible()
    await expect(page.getByText('Alice Johnson', { exact: true })).toBeVisible()
  })

  test('opens the correct profile for a different student', async ({ page }) => {
    await page.getByRole('table').getByText('Bob Smith').click()
    await expect(page).toHaveURL(/\/student\?id=student-2/)
    await expect(page.getByRole('heading', { name: 'Student Profile', exact: true })).toBeVisible()
  })

  test('returns to the directory from the profile', async ({ page }) => {
    await page.getByRole('table').getByText('Alice Johnson').click()
    await expect(page.getByRole('heading', { name: 'Student Profile', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Back to students' }).click()
    await expect(page).toHaveURL(/\/students$/)
    await expect(page.getByRole('heading', { name: 'Student Profile', exact: true })).toHaveCount(0)
  })
})
