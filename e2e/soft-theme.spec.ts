import { test, expect, type Locator } from '@playwright/test'
import { setupPage } from './helpers'

const surface = 'rgb(248, 250, 252)'
const muted = 'rgb(241, 245, 249)'
const border = 'rgb(203, 213, 225)'
const hover = 'rgb(226, 232, 240)'

const luminance = (color: string) => {
  const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(value => {
    const channel = Number(value) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}
const contrast = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b)
  return (values[1]! + 0.05) / (values[0]! + 0.05)
}
const expectTextContrast = async (locator: Locator, background: string) => {
  const foreground = await locator.evaluate(element => getComputedStyle(element).color)
  expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1469, height: 843 })
  await setupPage(page)
})

test('dashboard and shared shell use soft surfaces while preserving dark branding', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(238, 241, 244)')
  await expect(page.getByRole('banner')).toHaveCSS('background-color', surface)
  await expect(page.getByRole('complementary')).toHaveCSS('background-color', 'rgb(15, 23, 42)')
  const stat = page.getByText('Enrolled students', { exact: true })
  const card = page.getByRole('main').locator('.bg-surface').filter({ has: stat })
  await expect(card).toHaveCSS('background-color', surface)
  await expect(card).toHaveCSS('border-color', 'rgb(186, 230, 253)')
  await expectTextContrast(stat, surface)
  const hero = page.getByRole('main').locator('.dashboard-hero')
  await expect(hero).toHaveCSS('background-color', 'rgb(16, 40, 70)')
  await expectTextContrast(page.getByText('Jan-Jun 2026', { exact: true }), 'rgb(16, 40, 70)')
  await expect(page.getByRole('region', { name: 'Needs attention' })).toHaveCSS('background-image', /linear-gradient/)
  await expect(page.getByRole('region', { name: 'Weekly logbooks' })).toHaveCSS('background-color', surface)
  await page.screenshot({ path: testInfo.outputPath('dashboard-soft-theme.png') })
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await expect(page.locator('#account-menu')).toHaveCSS('background-color', surface)
})

test('semester artwork stays between the copy and actions and disappears when space is tight', async ({ page }) => {
  await page.goto('/')
  const header = page.getByRole('main').locator('.dashboard-hero')
  const art = header.locator('.dashboard-hero-art')
  await expect(art).toBeVisible({ timeout: 45_000 })
  await expect.poll(async () => {
    const copy = await header.locator('.dashboard-hero-copy').boundingBox()
    const artwork = await art.boundingBox()
    const actions = await header.locator('.dashboard-hero-actions').boundingBox()
    return !!(copy && artwork && actions && copy.x + copy.width <= artwork.x && artwork.x + artwork.width <= actions.x)
  }).toBe(true)

  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(art).toBeHidden()
  await expect(header.getByRole('button', { name: 'Refresh' })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Export Semester Report' })).toBeVisible()
})

test('students table and controls have distinct surfaces and readable states', async ({ page }, testInfo) => {
  await page.goto('/students')
  await page.waitForLoadState('networkidle')
  const table = page.getByRole('table')
  await expect(page.getByRole('main').locator('article')).toHaveCSS('background-color', surface)
  await expect(table.locator('thead tr')).toHaveCSS('background-color', muted)
  await expect(table.locator('tbody tr').nth(1)).toHaveCSS('background-color', muted)
  const search = page.getByPlaceholder('Search by name or matric number...')
  await expect(search).toHaveCSS('background-color', muted)
  const controlBorder = await search.evaluate(element => getComputedStyle(element).borderTopColor)
  expect(contrast(controlBorder, muted)).toBeGreaterThanOrEqual(3)
  await expectTextContrast(search, muted)
  await search.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(search).toHaveCSS('outline-style', 'solid')
  await expect(search).toHaveCSS('outline-color', 'rgb(3, 105, 161)')
  const accepted = table.getByRole('cell', { name: 'Accepted', exact: true }).locator('span')
  await expectTextContrast(accepted, await accepted.evaluate(element => getComputedStyle(element).backgroundColor))
  const row = table.locator('tbody tr').first()
  await row.hover()
  await expect(row).toHaveCSS('background-color', hover)
  await page.mouse.move(1000, 100)
  await expect(row).toHaveCSS('background-color', surface)
  await page.screenshot({ path: testInfo.outputPath('students-soft-theme.png') })
  await row.click()
  await expect(page).toHaveURL(/\/student\?id=/)
  await expect(page.getByRole('main').locator('article').first()).toHaveCSS('background-color', surface)
  await page.screenshot({ path: testInfo.outputPath('student-profile-soft-theme.png') })
})

test('student enrollment dialog uses off-white surfaces and muted inputs', async ({ page }) => {
  await page.goto('/students')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Enroll Student/ }).click()
  const dialog = page.getByRole('heading', { name: 'Enroll Student', exact: true }).locator('..')
  await expect(dialog).toHaveCSS('background-color', surface)
  for (const input of await dialog.locator('input').all()) {
    await expect(input).toHaveCSS('background-color', muted)
    await expectTextContrast(input, muted)
  }
  const confirm = dialog.getByRole('button', { name: 'Confirm Enrollment', exact: true })
  await expectTextContrast(confirm, await confirm.evaluate(element => getComputedStyle(element).backgroundColor))
})

test('soft surfaces are consistent across mobile students and logbooks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 843 })
  await page.goto('/students')
  await page.waitForLoadState('networkidle')
  const mobileCard = page.locator('.app-surface-ui .md\\:hidden .bg-surface').first()
  await expect(mobileCard).toBeVisible()
  await expect(mobileCard).toHaveCSS('background-color', surface)
  await page.goto('/logbooks')
  await expect(page.getByRole('main').locator('article').first()).toHaveCSS('background-color', surface)
})
