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
    await expect(page.getByRole('searchbox', { name: 'Search students' })).toBeVisible()
  })

  test('separates directory actions from filters and wraps filters on mobile', async ({ page }) => {
    const header = page.getByRole('main').locator('header').first()
    const filters = header.getByRole('group', { name: 'Student directory filters' })
    const search = filters.getByRole('searchbox', { name: 'Search students' })
    const semester = filters.getByRole('combobox', { name: 'Filter by semester' })
    const status = filters.getByRole('combobox', { name: 'Filter by placement status' })
    const checklist = filters.getByRole('checkbox', { name: 'Missing required checklist items' })
    const refresh = header.getByRole('button', { name: 'Refresh', exact: true })

    await page.setViewportSize({ width: 1469, height: 843 })
    await expect(header.getByRole('button', { name: 'Export PDF' })).toBeVisible()
    await expect.poll(async () => {
      const [action, query, term, placement, missing] = await Promise.all(
        [refresh, search, semester, status, checklist].map(control => control.boundingBox())
      )
      return !!(action && query && term && placement && missing &&
        action.y + action.height < query.y && query.y === term.y && term.y === placement.y &&
        missing.y >= query.y && missing.y + missing.height <= query.y + query.height &&
        query.width > placement.width)
    }).toBe(true)

    await page.setViewportSize({ width: 390, height: 843 })
    await expect.poll(async () => {
      const [query, term] = await Promise.all([search.boundingBox(), semester.boundingBox()])
      return !!(query && term && query.y + query.height < term.y && query.width === term.width)
    }).toBe(true)
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
