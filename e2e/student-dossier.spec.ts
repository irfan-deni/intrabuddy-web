import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'
import { managementFixture } from './fixtures/student-management'

test.describe('Student Dossier', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/student?id=student-1')
    await page.waitForLoadState('networkidle')
  })

  test('renders student dossier page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alice Johnson')
    await expect(page.locator('main header').getByText('Student Profile', { exact: true })).toBeVisible()
    await expect(page.locator('text=Readiness Checklist')).toBeVisible()
    await expect(page.locator('text=Placement Applications')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weekly Logbooks' })).toBeVisible()
  })

  test('groups semester before the header actions', async ({ page }) => {
    const header = page.locator('main header')
    await expect(header.getByRole('button', { name: 'Download PDF' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Send Alert' })).toBeVisible()
    await expect(header.getByText('Status:', { exact: true })).toHaveCount(0)
    const semester = header.getByLabel('Semester', { exact: true })
    await expect(semester).toBeVisible()
    const semesterBox = await semester.boundingBox()
    const downloadBox = await header.getByRole('button', { name: 'Download PDF' }).boundingBox()
    const titleBox = await header.getByRole('heading', { name: 'Alice Johnson' }).boundingBox()
    expect(semesterBox).not.toBeNull()
    expect(downloadBox).not.toBeNull()
    expect(titleBox).not.toBeNull()
    expect(semesterBox!.x + semesterBox!.width).toBeLessThan(downloadBox!.x)
    expect(downloadBox!.x).toBeGreaterThan(titleBox!.x)
  })

  test('places management below documents and logbooks beside the sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1469, height: 843 })
    const documents = await page.getByRole('heading', { name: 'Student Documents' }).locator('xpath=ancestor::article[1]').boundingBox()
    const management = await page.locator('#student-management').boundingBox()
    const logbooks = await page.locator('#weekly-logbooks').boundingBox()
    expect(documents).not.toBeNull()
    expect(management).not.toBeNull()
    expect(logbooks).not.toBeNull()
    expect(management!.x).toBeCloseTo(documents!.x, 0)
    expect(management!.y).toBeGreaterThanOrEqual(documents!.y + documents!.height)
    expect(logbooks!.x).toBeGreaterThan(documents!.x + documents!.width)
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
    for (const week of [1, 2, 3]) {
      await expect(page.getByRole('cell', { name: `Week ${week}`, exact: true })).toHaveCount(1)
    }
    await expect(page.getByRole('row', { name: /Week 1/ }).getByRole('cell', { name: '2026-07-07' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Student Management' })).toBeVisible()
  })

  test('shows student documents', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Student Documents' })).toBeVisible()
    await expect(page.locator('text=Resume.pdf')).toBeVisible()
  })

  test('opens a wallet document with read-only coordinator access', async ({ page }) => {
    await page.route('**/api/students/student-1/management*', route => route.fulfill({
      json: { ...managementFixture(), capabilities: { editContact: false, correctRecords: false, reviewLogbooks: false } },
    }))
    await page.reload()
    await page.route('**/api/students/student-1/wallet/1', route => route.fulfill({
      status: 200, contentType: 'image/png', body: Buffer.from('89504e470d0a1a0a', 'hex'),
    }))
    const viewButton = page.getByRole('button', { name: 'View Resume.pdf' })
    await expect(viewButton).toBeEnabled()
    await viewButton.click()
    const dialog = page.getByRole('dialog', { name: 'Resume.pdf' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('img', { name: 'Resume.pdf' })).toHaveAttribute('src', /^blob:/)
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('shows an error when document access fails', async ({ page }) => {
    await page.route('**/api/students/student-1/wallet/1', route => route.fulfill({
      status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Access denied' }),
    }))
    await page.getByRole('button', { name: 'View Resume.pdf' }).click()
    await expect(page.getByRole('alert')).toContainText('Unable to open this document')
  })
})
