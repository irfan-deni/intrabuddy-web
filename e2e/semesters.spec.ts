import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Semester Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/semesters')
    await page.waitForLoadState('networkidle')
  })

  test('shows record counts for each semester', async ({ page }) => {
    const table = page.getByRole('table')
    await expect(table.getByText('Jan-Jun 2026')).toBeVisible()
    const row = table.getByRole('row', { name: /Jan-Jun 2026/ })
    await expect(row.getByText('3 Students')).toBeVisible()
    await expect(row.getByText('2 Requirements')).toBeVisible()
    await expect(row.getByText('9 Logbooks')).toBeVisible()
    await expect(row.getByText('1 Application')).toBeVisible()
  })

  test('opens and closes semester registration', async ({ page }) => {
    const requests: unknown[] = []
    page.on('request', request => {
      if (request.url().endsWith('/api/semesters/2/registration')) requests.push(request.postDataJSON())
    })

    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2025/ })
    await row.getByRole('switch', { name: 'Registration for Jul-Dec 2025' }).click()
    await expect(row.getByText('Open', { exact: true })).toBeVisible()
    await row.getByRole('switch', { name: 'Registration for Jul-Dec 2025' }).click()
    await expect(row.getByText('Closed', { exact: true })).toBeVisible()
    expect(requests).toEqual([{ registration_open: true }, { registration_open: false }])
  })

  test('ordinary coordinators can view but not change registration', async ({ page }) => {
    await page.route('**/api/auth/privileges', route => route.fulfill({ json: { isSuperCoordinator: false } }))
    await page.reload()
    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2025/ })
    await expect(row.getByRole('switch', { name: 'Registration for Jul-Dec 2025' })).toBeDisabled()
  })

  test('does not allow deleting the active semester', async ({ page }) => {
    const row = page.getByRole('table').getByRole('row', { name: /Jan-Jun 2026/ })
    await row.getByRole('button', { name: 'More actions for Jan-Jun 2026' }).click()
    await expect(page.getByRole('button', { name: 'Cannot delete active semester' })).toBeDisabled()
  })

  test('explains why a semester with history cannot be deleted', async ({ page }) => {
    const row = page.getByRole('table').getByRole('row', { name: /Jan-Jun 2025/ })
    await row.getByRole('button', { name: 'More actions for Jan-Jun 2025' }).click()
    await page.getByRole('button', { name: 'Delete semester', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Delete Semester', exact: true })).toBeVisible()
    await expect(page.getByText(/This semester has 2 students, 5 logbook entries and 1 application/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible()
  })

  test('deletes an empty semester after confirmation', async ({ page }) => {
    const requests: unknown[] = []
    page.on('request', request => {
      if (request.url().includes('/api/administration/configuration')) requests.push(request.postDataJSON())
    })

    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2025/ })
    await row.getByRole('button', { name: 'More actions for Jul-Dec 2025' }).click()
    await page.getByRole('button', { name: 'Delete semester', exact: true }).click()

    await expect(page.getByText('This semester has no related records.')).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByText('Semester removed', { exact: true })).toBeVisible()
    expect(requests).toContainEqual({ action: 'semester.delete', payload: { id: 2 } })
  })

  test('warns that templates are removed with the semester', async ({ page }) => {
    const requests: unknown[] = []
    page.on('request', request => {
      if (request.url().includes('/api/administration/configuration')) requests.push(request.postDataJSON())
    })

    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2024/ })
    await row.getByRole('button', { name: 'More actions for Jul-Dec 2024' }).click()
    await page.getByRole('button', { name: 'Delete semester', exact: true }).click()

    await expect(page.getByText('Deleting this semester will also remove 2 requirement templates.')).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByText('Semester removed', { exact: true })).toBeVisible()
    expect(requests).toContainEqual({ action: 'semester.delete', payload: { id: 4 } })
  })

  test('asks for confirmation before changing the active semester', async ({ page }) => {
    const requests: unknown[] = []
    page.on('request', request => {
      if (request.url().includes('/api/administration/configuration')) requests.push(request.postDataJSON())
    })

    let dialogMessage = ''
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2025/ })
    await row.getByRole('button', { name: 'More actions for Jul-Dec 2025' }).click()
    await page.getByRole('button', { name: 'Set active', exact: true }).click()

    await expect(page.getByText('Semester activated', { exact: true })).toBeVisible()
    expect(dialogMessage).toContain('Activate "Jul-Dec 2025"')
    expect(requests).toContainEqual({ action: 'semester.activate', payload: { id: 2 } })
  })
})
