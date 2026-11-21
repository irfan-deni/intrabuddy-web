import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Layout & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1469, height: 843 })
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('sidebar shows navigation links', async ({ page }) => {
    const navigation = page.getByRole('complementary')
    for (const label of ['Dashboard', 'Students', 'Announcements', 'Logbooks', 'FAQs', 'Semesters']) {
      await expect(navigation.getByRole('link', { name: new RegExp(label) })).toBeVisible()
    }
  })

  test('sidebar separates coordinator work by task', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' }).first()
    for (const heading of ['Student management', 'Student communications', 'Administration']) {
      await expect(navigation.getByText(heading, { exact: true })).toBeVisible()
    }
    await expect(navigation.getByText('Overview', { exact: true })).toHaveCount(0)
  })

  test('sidebar highlights active page', async ({ page }) => {
    const dashboardLink = page.locator('a[href="/"]').first()
    await expect(dashboardLink).toHaveClass(/bg-sky-600/)
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  })

  test('sidebar orders tasks and separates bottom utilities', async ({ page }) => {
    const sidebar = page.getByRole('complementary')
    await expect(sidebar.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveText([
      'Dashboard', 'Students', 'Logbooks', 'Checklists', 'Announcements',
      'FAQs', 'Semesters', 'Coordinators'
    ])
    await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
  })

  test('collapsed sidebar retains accessible links and keyboard focus', async ({ page }) => {
    const sidebar = page.getByRole('complementary')
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click()
    const inbox = sidebar.getByRole('link', { name: 'Students', exact: true })
    await expect(inbox).toHaveAttribute('title', 'Students')
    await inbox.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(inbox).toBeFocused()
    await expect(inbox).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/students')
    await sidebar.getByRole('button', { name: 'Expand sidebar' }).click()
    await expect(sidebar.getByRole('link', { name: 'Students', exact: true })).toBeVisible()
  })

  test('bottom utilities remain visible on a short desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1469, height: 600 })
    const sidebar = page.getByRole('complementary')
    await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeInViewport()
    const semesters = sidebar.getByRole('link', { name: 'Semesters', exact: true })
    await semesters.scrollIntoViewIfNeeded()
    await expect(semesters).toBeInViewport()
  })

  test('mobile drawer preserves ordering and closes after navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    const drawer = page.locator('#mobile-sidebar')
    await expect(drawer).toHaveAttribute('inert', '')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(drawer.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveText([
      'Dashboard', 'Students', 'Logbooks', 'Checklists', 'Announcements',
      'FAQs', 'Semesters', 'Coordinators'
    ])
    await expect(drawer.getByRole('link', { name: 'Dashboard', exact: true })).toBeInViewport()
    await drawer.getByRole('link', { name: 'Students', exact: true }).click()
    await page.waitForURL('**/students')
    await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveAttribute('inert', '')
  })

  test('regular coordinators do not see coordinator administration', async ({ page }) => {
    await page.route('**/api/auth/privileges', route => route.fulfill({ json: { isSuperCoordinator: false } }))
    await page.reload()
    const navigation = page.getByRole('complementary').getByRole('navigation', { name: 'Primary navigation' })
    await expect(navigation.getByRole('link', { name: 'Semesters', exact: true })).toBeVisible()
    await expect(navigation.getByRole('link', { name: 'Coordinators', exact: true })).toHaveCount(0)
  })

  test('highlights new page after navigation', async ({ page }) => {
    await page.click('a[href="/students"]')
    await page.waitForURL('**/students')
    const studentsLink = page.locator('a[href="/students"]').first()
    await expect(studentsLink).toHaveClass(/bg-sky-600/)
  })

  test('communications labels its broadcast tab Announcements without changing its URL', async ({ page }) => {
    await page.goto('/communications')
    const navigation = page.getByRole('navigation', { name: 'Communication type' })
    const announcements = navigation.getByRole('link', { name: 'Announcements', exact: true })
    await expect(announcements).toHaveAttribute('href', '/communications?tab=broadcasts')
    await expect(navigation.getByRole('link', { name: 'Broadcasts', exact: true })).toHaveCount(0)
    await announcements.click()
    await page.waitForURL('**/communications?tab=broadcasts')
    await expect(page.getByRole('heading', { name: 'Announcements & Alerts', exact: true })).toBeVisible()
    await expect(navigation.getByRole('link', { name: 'Individual alerts', exact: true })).toBeVisible()
    await expect(page.getByRole('complementary').getByRole('link', { name: 'Announcements', exact: true })).toBeVisible()
  })

  test('announcement labels sit above their fields with consistent spacing', async ({ page }) => {
    await page.goto('/communications')
    for (const width of [1469, 390]) {
      await page.setViewportSize({ width, height: 843 })
      for (const [label, id] of [['Audience', 'announcement-audience'], ['Title', 'announcement-title'], ['Message', 'announcement-message']]) {
        const field = page.getByLabel(label!, { exact: true })
        await expect(field).toBeVisible()
        await expect.poll(async () => {
          const labelBox = await page.locator(`label[for="${id}"]`).boundingBox()
          const fieldBox = await field.boundingBox()
          return Math.round(fieldBox!.y - labelBox!.y - labelBox!.height)
        }).toBe(8)
      }
    }
  })

  test('communications opens the selected tab from the URL', async ({ page }) => {
    await page.goto('/communications?tab=alerts')
    await expect(page.getByRole('heading', { name: 'Announcements & Alerts' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Send an alert' })).toBeVisible()
    await expect(page.getByText('Individual Alert History', { exact: true })).toBeVisible()
  })

  test('inbox is available from the sidebar', async ({ page }) => {
    await page.click('a[href="/inbox"]')
    await page.waitForURL('**/inbox')
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
  })

  test('legacy communication routes redirect to their replacements', async ({ page }) => {
    await page.goto('/broadcasts')
    await page.waitForURL('**/communications')
    await page.goto('/notifications')
    await page.waitForURL('**/inbox')
  })

  test('header shows user name and account menu', async ({ page }) => {
    await expect(page.locator('text=Test Coordinator')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible()
  })

  test('account menu opens, dismisses, and navigates to settings', async ({ page }) => {
    const trigger = page.locator('header button[aria-controls="account-menu"]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(page.locator('#account-menu')).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(page.locator('#account-menu')).toHaveCount(0)
    await trigger.click()
    await page.getByRole('button', { name: 'Account settings' }).click()
    await page.waitForURL('**/settings')
  })

  test('footer is visible', async ({ page }) => {
    await expect(page.locator('text=INTRA Buddy Management System')).toBeVisible()
    await expect(page.locator('text=Version 2.4.0')).toBeVisible()
  })

  test('subtitle shows on dashboard page', async ({ page }) => {
    await expect(page.getByRole('main').getByText('Real-time overview of the active semester.', { exact: true })).toBeVisible()
  })

  test('sign out is available only through the account menu', async ({ page }) => {
    await expect(page.getByRole('complementary').getByText('Sign out', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Open account menu' }).click()
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  })

  test('navigating to /students shows the directory', async ({ page }) => {
    await page.click('a[href="/students"]')
    await page.waitForURL('**/students')
    await expect(page.getByRole('heading', { name: 'Student Directory' })).toBeVisible()
  })
})
