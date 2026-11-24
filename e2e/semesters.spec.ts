import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'
import { MOCK_PROFILE } from './fixtures/data'

test.describe('Semester Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2025-06-30T04:00:00Z'))
    await setupPage(page)
    await page.goto('/semesters', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('table').getByText('Jan-Jun 2026', { exact: true })).toBeVisible({ timeout: 25_000 })
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

  test('opens and closes registration for an upcoming inactive semester', async ({ page }) => {
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

  for (const viewport of [{ width: 1469, height: 843 }, { width: 390, height: 844 }]) {
    test(`shows ended active semesters as closed at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      // July 1 in Malaysia, even though it is still June 30 in UTC.
      await page.clock.setFixedTime(new Date('2026-06-30T16:00:00Z'))
      await page.reload()
      await expect(page.getByText('Closed · Semester ended', { exact: true }).filter({ visible: true })).toHaveCount(4)
      await expect(page.getByRole('switch', { name: 'Registration for Jan-Jun 2026' })).toHaveCount(0)
    })
  }

  test('ordinary coordinators can view but not change registration', async ({ page }) => {
    await page.route('**/api/auth/session-context', route => route.fulfill({ json: { profile: MOCK_PROFILE, isSuperCoordinator: false } }))
    await page.reload()
    const row = page.getByRole('table').getByRole('row', { name: /Jul-Dec 2025/ })
    await expect(row.getByRole('switch', { name: 'Registration for Jul-Dec 2025' })).toBeDisabled()
  })

  test('does not allow deleting the active semester', async ({ page }) => {
    const row = page.getByRole('table').getByRole('row', { name: /Jan-Jun 2026/ })
    await row.getByRole('button', { name: 'More actions for Jan-Jun 2026' }).click()
    await expect(page.getByRole('button', { name: 'Cannot delete active semester' })).toBeDisabled()
  })

  for (const { action, title } of [
    { action: 'New Semester', title: 'New Semester' },
    { action: 'Edit semester', title: 'Edit Semester' },
    { action: 'Delete semester', title: 'Delete Semester' }
  ]) {
    test(`${title} backdrop covers the viewport and navigation`, async ({ page }) => {
      await page.setViewportSize({ width: 1469, height: 843 })
      if (action !== 'New Semester') {
        await page.getByRole('table').getByRole('button', { name: 'More actions for Jul-Dec 2025' }).click()
      }
      await page.getByRole('button', { name: action, exact: true }).click()

      const backdrop = page.getByRole('heading', { name: title, exact: true }).locator('xpath=../..')
      for (const width of [1469, 390]) {
        await page.setViewportSize({ width, height: 843 })
        await expect.poll(() => backdrop.evaluate(element =>
          ([[1, 1], [innerWidth - 2, 1], [1, innerHeight - 2], [innerWidth - 2, innerHeight - 2]] as const)
            .every(([x, y]) => document.elementFromPoint(x, y) === element)
        )).toBe(true)
      }
    })
  }

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
