import { test, expect } from '@playwright/test'
import { MOCK_LOGBOOKS } from './fixtures/data'
import { setupPage } from './helpers'

test.describe('Logbooks', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/logbooks')
    await page.waitForLoadState('networkidle')
  })

  test('shows results without a redundant heading in the default view', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Logbooks')
    await expect(page.getByRole('heading', { name: 'Logbook Submissions' })).toHaveCount(0)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('labels the awaiting-review results', async ({ page }) => {
    await page.goto('/logbooks?review=awaiting')
    await expect(page.getByRole('heading', { level: 2, name: 'Logbooks awaiting review' })).toBeVisible()
  })

  test('displays logbook entries', async ({ page }) => {
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('MATRIC001')).toBeVisible()
  })

  test('shows submission progress for each student', async ({ page }) => {
    await expect(page.getByRole('row').filter({ hasText: 'Alice Johnson' }).getByText('1 / 1 submitted')).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'Bob Smith' }).getByText('0 / 1 submitted')).toBeVisible()
  })

  test('groups search and status separately from page actions', async ({ page }) => {
    const filters = page.getByRole('group', { name: 'Logbook filters' })
    const filter = filters.getByRole('combobox', { name: 'Filter by status' })
    await expect(filters.getByRole('searchbox', { name: 'Search by student name or matric number' })).toBeVisible()
    await filter.selectOption('Submitted')
    await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
    await expect(page.getByRole('table').getByText('Bob Smith')).toHaveCount(0)

    const header = page.getByRole('main').locator('header').first()
    await expect(header.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Export PDF' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Remind All' })).toBeVisible()
    await expect(filters.getByRole('button')).toHaveCount(0)
  })

  test('overdue shortcut toggles the status filter', async ({ page }) => {
    await page.route('**/api/logbooks', route => route.fulfill({
      json: MOCK_LOGBOOKS.map(entry => entry.isSubmitted ? entry : { ...entry, statusLabel: 'Late' })
    }))
    await page.reload()

    const filters = page.getByRole('group', { name: 'Logbook filters' })
    const shortcut = filters.getByRole('button', { name: '1 overdue' })
    const status = filters.getByRole('combobox', { name: 'Filter by status' })
    const table = page.getByRole('table')

    await shortcut.click()
    await expect(shortcut).toHaveAttribute('aria-pressed', 'true')
    await expect(status).toHaveValue('Late')
    await expect(table.getByText('Bob Smith')).toBeVisible()
    await expect(table.getByText('Alice Johnson')).toHaveCount(0)

    await shortcut.click()
    await expect(shortcut).toHaveAttribute('aria-pressed', 'false')
    await expect(status).toHaveValue('all')
    await expect(table.getByText('Alice Johnson')).toBeVisible()
  })
})
