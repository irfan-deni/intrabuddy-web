import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'
import { managementFixture } from './fixtures/student-management'

test.describe('Super Coordinator student management', () => {
  test.beforeEach(async ({ page }) => { await setupPage(page) })

  test('Super Coordinators can correct contact details with a reason', async ({ page }) => {
    const data = managementFixture()
    await page.route('**/api/students/student-1/management*', route => route.fulfill({ json: data }))
    await page.route('**/api/students/student-1', async route => {
      expect(route.request().postDataJSON()).toEqual({ phone_number: '+60 123456789', reason: 'Confirmed with student', semester_id: 1 })
      data.phoneNumber = '+60 123456789'
      data.history.push({ id: 1, actor_id: 'user-1', action: 'profile', target_id: 'student-1', reason: 'Confirmed with student', before_value: { phone_number: 'old' }, after_value: { phone_number: data.phoneNumber }, created_at: '2026-10-27T00:00:00Z' })
      await route.fulfill({ json: { success: true } })
    })
    await page.goto('/student?id=student-1')
    await page.getByLabel('Student phone number', { exact: true }).fill('+60 123456789')
    await page.getByLabel('Contact correction reason', { exact: true }).fill('Confirmed with student')
    await page.getByRole('button', { name: 'Save contact details' }).click()
    await expect(page.getByText('Change saved with audit history.')).toBeVisible()
    await page.getByText('Management history (latest 100 changes)', { exact: true }).click()
    await expect(page.getByText('Confirmed with student', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Primary coordinator', { exact: true })).toHaveCount(0)
  })

  test('ordinary coordinators remain read-only across semesters', async ({ page }) => {
    const data = managementFixture()
    data.capabilities = { editContact: false, correctRecords: false, reviewLogbooks: false }
    await page.route('**/api/auth/privileges', route => route.fulfill({ json: { isSuperCoordinator: false } }))
    await page.route('**/api/students/student-1/management*', route => {
      const previous = new URL(route.request().url()).searchParams.get('semester_id') === '2'
      return route.fulfill({ json: previous ? { ...data, semesterId: 2, logbooks: [] } : data })
    })
    await page.goto('/student?id=student-1')
    await expect(page.getByRole('button', { name: 'Correct Upload Resume', exact: true })).toBeDisabled()
    await expect(page.locator('#student-management')).toHaveCount(0)
    await page.getByLabel('Semester', { exact: true }).selectOption('2')
    await expect(page.getByLabel('Semester', { exact: true })).toHaveValue('2')
    await expect(page.getByText(/Read-only access/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save contact details' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Correct application for/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Review week/ })).toHaveCount(0)
  })

  test('Super Coordinators submit scoped checklist and application corrections', async ({ page }) => {
    const data = managementFixture()
    await page.route('**/api/students/student-1/management*', route => route.fulfill({ json: data }))
    let checklistSaved = false
    let applicationSaved = false
    await page.route('**/api/students/student-1/checklists/1', async route => {
      expect(route.request().postDataJSON()).toEqual({ is_completed: false, reason: 'Resume needs updating', semester_id: 1 })
      checklistSaved = true
      await route.fulfill({ json: { success: true } })
    })
    await page.route('**/api/students/student-1/applications/1', async route => {
      expect(route.request().postDataJSON()).toEqual({ status: 'Offer Declined', reason: 'Student declined the offer', semester_id: 1 })
      applicationSaved = true
      await route.fulfill({ json: { success: true } })
    })
    await page.goto('/student?id=student-1')
    await page.getByRole('button', { name: 'Correct Upload Resume', exact: true }).click()
    await page.getByLabel('Revert Reason', { exact: true }).fill('Resume needs updating')
    await page.getByRole('button', { name: 'Confirm Override', exact: true }).click()
    await expect.poll(() => checklistSaved).toBe(true)
    await page.getByRole('button', { name: 'Correct application for Tech Corp', exact: true }).click()
    await page.getByLabel('New Status', { exact: true }).selectOption('Offer Declined')
    await page.getByLabel('Override Reason', { exact: true }).fill('Student declined the offer')
    await page.getByRole('button', { name: 'Confirm Override', exact: true }).click()
    await expect.poll(() => applicationSaved).toBe(true)
  })

  test('review feedback is saved independently of submission status on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 843 })
    const data = managementFixture()
    await page.route('**/api/students/student-1/management*', route => route.fulfill({ json: data }))
    await page.route('**/api/students/student-1/logbooks/1/review', async route => {
      expect(route.request().postDataJSON()).toEqual({ status: 'corrections_requested', reason: 'Please add supervisor feedback', semester_id: 1 })
      data.reviews = [{ logbook_id: 1, status: 'corrections_requested', feedback: 'Please add supervisor feedback', reviewed_at: '2026-10-27T00:00:00Z' }]
      await route.fulfill({ json: { success: true } })
    })
    await page.goto('/student?id=student-1')
    await page.getByRole('button', { name: 'Review week 1', exact: true }).click()
    await page.getByLabel('Review outcome', { exact: true }).selectOption('corrections_requested')
    await page.getByLabel('Review feedback', { exact: true }).fill('Please add supervisor feedback')
    await page.getByRole('button', { name: 'Save review', exact: true }).click()
    const panel = page.locator('#weekly-logbooks')
    await panel.getByText('Review feedback', { exact: true }).first().click()
    await expect(panel.locator('details[open]').getByText('Please add supervisor feedback', { exact: true })).toBeVisible()
    await expect(panel.getByText('Week 1', { exact: true }).first()).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Review week 3', exact: true })).toHaveCount(0)
  })

  test('no coordinator assignment controls are shown', async ({ page }) => {
    const data = managementFixture()
    await page.route('**/api/students/student-1/management*', route => route.fulfill({ json: data }))
    await page.goto('/student?id=student-1')
    await expect(page.getByLabel('Primary coordinator')).toHaveCount(0)
    await expect(page.getByText(/assigned for this semester/)).toHaveCount(0)
  })

  test('a revoked Super Coordinator role refreshes permissions after a denied save', async ({ page }) => {
    const data = managementFixture()
    await page.route('**/api/students/student-1/management*', route => route.fulfill({ json: data }))
    await page.route('**/api/students/student-1', async route => {
      data.capabilities = { editContact: false, correctRecords: false, reviewLogbooks: false }
      await route.fulfill({ status: 403, json: { statusMessage: 'Super coordinator access required' } })
    })
    await page.goto('/student?id=student-1')
    await page.getByLabel('Contact correction reason', { exact: true }).fill('Old capability')
    await page.getByRole('button', { name: 'Save contact details' }).click()
    await expect(page.getByText(/Read-only access/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save contact details' })).toHaveCount(0)
    await expect(page.getByText('Super coordinator access required', { exact: true })).toBeVisible()
  })

  test('directory lists students without an assignment filter', async ({ page }) => {
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
    await expect(page.getByLabel('My students', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('cell').filter({ hasText: 'Alice Johnson' })).toBeVisible()
    await expect(page.getByRole('cell').filter({ hasText: 'Bob Smith' })).toBeVisible()
  })
})
