import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test('groups checklist actions by view and keeps row selection with the results', async ({ page }) => {
  await setupPage(page)
  await page.setViewportSize({ width: 1469, height: 843 })
  await page.goto('/checklists')
  await page.waitForLoadState('networkidle')

  const main = page.getByRole('main')
  const filters = main.getByRole('group', { name: 'Requirement filters' })
  const search = filters.getByRole('searchbox', { name: 'Search requirements' })
  const required = filters.getByRole('button', { name: /^Required/ })
  const selection = main.locator('article').getByRole('group', { name: 'Requirement selection' })
  const report = main.getByRole('button', { name: 'Export Non-Compliance PDF' })
  const add = main.getByRole('button', { name: 'New Requirement' })
  const importTemplate = main.getByRole('button', { name: 'Import Template' })

  await expect(main.locator('header').getByRole('combobox', { name: 'Semester' })).toBeEnabled()
  await expect(add).toBeVisible()
  await expect(importTemplate).toBeVisible()
  await expect(report).toHaveCount(0)
  await expect.poll(async () => {
    const [query, option] = await Promise.all([search.boundingBox(), required.boundingBox()])
    return !!(query && option && query.y === option.y)
  }).toBe(true)

  const deleteSelected = selection.getByRole('button', { name: /^Delete selected/ })
  const selectAll = main.getByRole('table').getByRole('checkbox', { name: 'Select all visible requirements' })
  const reorderHint = filters.getByText('Clear the search and filter to reorder requirements.')
  await expect(selection).toBeHidden()
  await expect(reorderHint).toBeHidden()
  await required.click()
  await expect(required).toHaveAttribute('aria-pressed', 'true')
  await expect(reorderHint).toBeVisible()
  await expect(selection).toBeHidden()
  await selectAll.check()
  await expect(deleteSelected).toBeVisible()
  await expect(selection.getByRole('button', { name: 'Clear visible selection' })).toBeHidden()
  await selectAll.uncheck()
  await expect(selection).toBeHidden()

  await page.setViewportSize({ width: 390, height: 843 })
  await expect.poll(async () => {
    const [query, option] = await Promise.all([search.boundingBox(), required.boundingBox()])
    return !!(query && option && query.y + query.height < option.y)
  }).toBe(true)
  await expect(selectAll).toBeHidden()
  await selection.getByRole('button', { name: 'Select all visible' }).click()
  await expect(deleteSelected).toBeVisible()
  await selection.getByRole('button', { name: 'Clear visible selection' }).click()
  await expect(deleteSelected).toHaveCount(0)

  await main.getByRole('tab', { name: 'Student Progress' }).click()
  await expect(report).toBeEnabled()
  await expect(add).toHaveCount(0)
  await expect(importTemplate).toHaveCount(0)
  await expect(filters).toHaveCount(0)
})

for (const title of ['New Requirement', 'Mark Requirement Complete']) {
  test(`${title} backdrop covers the viewport and navigation`, async ({ page }) => {
    await setupPage(page)
    await page.setViewportSize({ width: 1469, height: 843 })
    await page.goto('/checklists')
    await page.waitForLoadState('networkidle')

    if (title === 'New Requirement') {
      await page.getByRole('button', { name: title, exact: true }).click()
    } else {
      await page.getByRole('tab', { name: 'Student Progress' }).click()
      await page.getByRole('button', { name: /Alice Johnson/ }).click()
      await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
    }

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
