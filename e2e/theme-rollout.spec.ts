import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

const surface = 'rgb(248, 250, 252)'
const muted = 'rgb(241, 245, 249)'

const routes = [
  '/logbooks', '/checklists', '/inbox', '/communications?tab=broadcasts',
  '/communications?tab=alerts', '/faqs', '/semesters', '/coordinators',
  '/settings', '/student?id=student-1'
]

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1469, height: 843 })
  await setupPage(page)
})

for (const { path, label, breakpoint } of [
  { path: '/logbooks', label: 'Student', breakpoint: 768 },
  { path: '/students', label: 'Identity', breakpoint: 768 },
  { path: '/checklists', label: 'Requirement Title', breakpoint: 768 },
  { path: '/semesters', label: 'Semester', breakpoint: 1280 },
  { path: '/coordinators', label: 'Coordinator', breakpoint: 768 }
]) {
  test(`${path} uses the shared Logbooks table header`, async ({ page }) => {
    await page.goto(path)
    const header = page.getByRole('main').getByRole('columnheader', { name: label, exact: true })
    await expect(header).toBeVisible()
    await expect(header.locator('..')).toHaveCSS('background-color', muted)
    await expect(header).toHaveCSS('font-size', '14px')
    await expect(header).toHaveCSS('font-weight', '600')
    await expect(header).toHaveCSS('text-transform', 'none')
    await expect(header).toHaveCSS('padding-top', '24px')
    await expect(header).toHaveCSS('padding-bottom', '24px')

    await page.setViewportSize({ width: breakpoint, height: 843 })
    await expect(header).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    await page.setViewportSize({ width: breakpoint - 1, height: 843 })
    await expect(header).toBeHidden()
  })
}

for (const path of routes) {
  test(`${path} uses shared soft surfaces and radii`, async ({ page }, testInfo) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const main = page.getByRole('main')
    const panels = main.locator('.rounded-card.bg-surface:visible')
    expect(await panels.count()).toBeGreaterThan(0)
    for (const panel of await panels.all()) {
      await expect(panel).toHaveCSS('background-color', surface)
      await expect(panel).toHaveCSS('border-radius', '12px')
    }
    await expect(main.locator('.bg-white:not([aria-hidden="true"] *)')).toHaveCount(0)
    await expect(main.locator('.rounded-none')).toHaveCount(0)
    const fields = main.locator('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):visible, select:visible, textarea:visible')
    for (const field of await fields.all()) {
      expect([muted, surface]).toContain(await field.evaluate(element => getComputedStyle(element).backgroundColor))
      await expect(field).toHaveCSS('border-radius', '8px')
    }
    await page.screenshot({ path: testInfo.outputPath('page-theme.png') })

    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 843 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), {
        message: `${path} should not cause page-wide overflow at ${width}px`
      }).toBe(true)
    }
  })
}

for (const dialog of [
  { path: '/checklists', trigger: /New Requirement/, title: 'New Requirement' },
  { path: '/semesters', trigger: /New Semester/, title: 'New Semester' },
  { path: '/faqs', trigger: /New Article/, title: 'New Knowledge Base Entry' },
  { path: '/coordinators', trigger: /Add Coordinator/, title: 'Add Coordinator' }
]) {
  test(`${dialog.title} dialog stays rounded and scrollable on short screens`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 440 })
    await page.goto(dialog.path)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: dialog.trigger }).click()
    const panel = page.getByRole('heading', { name: dialog.title, exact: true }).locator('..')
    await expect(panel).toHaveCSS('background-color', surface)
    await expect(panel).toHaveCSS('border-radius', '16px')
    await expect(panel).toHaveCSS('overflow-y', 'auto')
    const submit = panel.locator('button[type="submit"]')
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
    await submit.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(submit).toHaveCSS('outline-style', 'solid')
  })
}

test('recipient dropdown is rounded and not clipped by its form card', async ({ page }) => {
  await page.goto('/communications?tab=alerts')
  await page.waitForLoadState('networkidle')
  const search = page.getByPlaceholder('Search for a student...')
  await search.fill('Alice')
  const option = page.getByRole('listitem').filter({ hasText: 'Alice Johnson' })
  await expect(option).toBeVisible()
  const dropdown = option.locator('..')
  await expect(dropdown).toHaveCSS('background-color', surface)
  await expect(dropdown).toHaveCSS('border-radius', '8px')
  await expect(search.locator('xpath=ancestor::form/..')).toHaveCSS('overflow', 'visible')
  await option.click()
  await expect(search).toHaveValue(/Alice Johnson/)
})

test('login preserves dark branding while using soft cards and controls', async ({ page }) => {
  await page.goto('/login')
  const card = page.getByRole('heading', { name: 'Coordinator login' }).locator('..')
  await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(card).toHaveCSS('border-radius', '12px')
  await expect(page.locator('#email')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(page.locator('#password')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toHaveCSS('border-radius', '8px')
  await expect(page.locator('.bg-slate-900').first()).toHaveCSS('background-color', 'rgb(15, 23, 42)')
})

test('logbook row actions keep their labels inside rounded buttons', async ({ page }) => {
  await page.goto('/logbooks')
  await page.waitForLoadState('networkidle')
  for (const button of await page.getByRole('table').locator('tbody button').all()) {
    await expect(button).toHaveCSS('white-space', 'nowrap')
    expect(await button.evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true)
  }
})
