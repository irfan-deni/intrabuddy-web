import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

for (const { trigger, title } of [
  { trigger: 'Manage', title: 'Manage Categories' },
  { trigger: 'New Article', title: 'New Knowledge Base Entry' }
]) {
  test(`${title} backdrop covers the viewport and navigation`, async ({ page }) => {
    await setupPage(page)
    await page.setViewportSize({ width: 1469, height: 843 })
    await page.goto('/faqs')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: trigger, exact: true }).click()

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
