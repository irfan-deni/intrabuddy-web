import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'
import { MOCK_DASHBOARD } from './fixtures/data'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('renders dashboard with stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Students')).toBeVisible()
    await expect(page.getByText('Placed', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Unplaced', { exact: true })).toBeVisible()
    await expect(page.locator('text=Placement Rate')).toBeVisible()
  })

  test('uses readable subtitle, label, and section-heading typography', async ({ page }) => {
    const main = page.getByRole('main')
    const subtitle = main.getByText('Real-time overview of the active semester.', { exact: true })
    await expect(subtitle).toHaveCSS('font-size', '14px')
    await expect(subtitle).toHaveCSS('font-weight', '400')
    await expect(subtitle).toHaveCSS('text-transform', 'none')
    await expect(subtitle).toHaveCSS('letter-spacing', 'normal')
    await expect(subtitle).toHaveCSS('color', 'rgb(71, 85, 105)')

    for (const label of ['Total Students', 'Unplaced', 'Compliance']) {
      await expect(main.getByText(label, { exact: true })).toHaveCSS('font-size', '14px')
      await expect(main.getByText(label, { exact: true })).toHaveCSS('font-weight', '500')
    }
    for (const heading of ['Placement Status', 'Logbook Status Summary']) {
      await expect(main.getByRole('heading', { name: heading })).toHaveCSS('font-size', '18px')
      await expect(main.getByRole('heading', { name: heading })).toHaveCSS('font-weight', '600')
      await expect(main.getByRole('heading', { name: heading })).toHaveCSS('letter-spacing', 'normal')
    }
    await expect(main.getByText('Semester Control', { exact: true })).toHaveCSS('color', 'rgb(203, 213, 225)')
    for (const name of ['Refresh', 'Export Semester Report']) {
      await expect(main.getByRole('button', { name, exact: true })).toHaveCSS('font-size', '14px')
    }
  })

  test('readable typography fits desktop and mobile widths', async ({ page }) => {
    for (const width of [1469, 390, 320]) {
      await page.setViewportSize({ width, height: 843 })
      const main = page.getByRole('main')
      await expect(main.getByRole('button', { name: 'Export Semester Report', exact: true })).toBeVisible()
      await expect(main.getByText('Compliance', { exact: true })).toHaveCSS('font-size', '14px')
      await expect.poll(
        () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        { message: `Dashboard should fit a ${width}px viewport after layout transitions` }
      ).toBe(true)
    }
  })

  test('displays placement percentage', async ({ page }) => {
    await expect(page.getByText('60%', { exact: true }).first()).toBeVisible()
  })

  test('fits all desktop dashboard content in one viewport', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1469, height: 843 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(viewport)
      const sectionGap = viewport.height >= 850 ? '20px' : '16px'
      await expect(page.locator('.dashboard-stats')).toHaveCSS('margin-top', sectionGap)
      await expect(page.locator('.dashboard-overview')).toHaveCSS('margin-top', sectionGap)
      await expect(page.locator('.dashboard-stat-content').first()).toHaveCSS('padding-left', '20px')
      await expect(page.locator('.dashboard-logbooks')).toHaveCSS('padding-top', viewport.height >= 850 ? '20px' : '16px')
      await expect(page.locator('.dashboard-stats')).toHaveCSS('flex-grow', '0')
      await expect(page.locator('.dashboard > .p-card')).toHaveCSS('flex-grow', '0')
      for (const collapsed of [false, true]) {
        if (collapsed) await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()

        await expect.poll(() => page.evaluate(() => ({
          vertical: document.documentElement.scrollHeight <= window.innerHeight,
          horizontal: document.documentElement.scrollWidth <= window.innerWidth
        }))).toEqual({ vertical: true, horizontal: true })

        for (const heading of ['Dashboard', 'Placement Status', 'Logbook Status Summary']) {
          await expect(page.getByRole('heading', { name: heading, exact: true })).toBeInViewport({ ratio: 1 })
        }
        await expect(page.getByText('Pending', { exact: true })).toBeInViewport({ ratio: 1 })
        await expect(page.getByRole('link', { name: 'View semesters' })).toBeInViewport({ ratio: 1 })
        await expect(page.getByRole('contentinfo')).toBeInViewport({ ratio: 1 })
        const bottomGap = await page.evaluate(() => {
          const card = document.querySelector('.dashboard > .p-card')!.getBoundingClientRect()
          const footer = document.querySelector('footer')!.getBoundingClientRect()
          return footer.top - card.bottom
        })
        expect(bottomGap).toBeLessThanOrEqual(24)
      }
      await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
    }
  })

  test('fits loading, empty, and error states on a laptop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    let releaseResponse!: () => void
    const responseReady = new Promise<void>(resolve => { releaseResponse = resolve })
    await page.route('**/api/dashboard', async route => {
      await responseReady
      await route.fulfill({ json: { ...MOCK_DASHBOARD, logbookSummary: { total: 0, submitted: 0, late: 0, pending: 0 } } })
    })
    await page.reload()
    await expect(page.getByText('Loading logbook summary…', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
    releaseResponse()
    await expect(page.getByText('No activity data available', { exact: true })).toBeInViewport({ ratio: 1 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)

    await page.route('**/api/dashboard', route => route.fulfill({ status: 500, json: { message: 'Unavailable' } }))
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByText('Unable to load logbook summary. Please refresh to try again.', { exact: true })).toBeInViewport({ ratio: 1 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  })

  test('shows semester name', async ({ page }) => {
    await expect(page.locator('text=Jan-Jun 2026')).toBeVisible()
  })

  test('shows concise placement figures', async ({ page }) => {
    const placement = page.locator('.dashboard-placement')
    await expect(placement.getByRole('heading', { name: 'Placement Status' })).toBeVisible()
    await expect(placement.getByText(`${MOCK_DASHBOARD.placedStudents} of ${MOCK_DASHBOARD.totalStudents} students placed`, { exact: true })).toBeVisible()
    await expect(placement.getByText(`Needs follow-up: ${MOCK_DASHBOARD.unplacedStudents} unplaced`, { exact: true })).toBeVisible()
  })

  test('links unplaced students to the filtered directory', async ({ page }) => {
    const link = page.getByRole('link', { name: 'View unplaced students' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/students?status=unplaced')
  })

  test('keeps semester actions close to the active semester', async ({ page }) => {
    await page.setViewportSize({ width: 1469, height: 843 })
    const semester = page.locator('.dashboard-semester')
    await expect(semester.getByRole('heading', { name: /Active:/ })).toBeVisible()
    await expect(semester.getByRole('link', { name: 'View semesters' })).toHaveAttribute('href', '/semesters')
    await expect(semester.getByRole('link', { name: 'View students' })).toHaveAttribute('href', '/students')
  })

  test('displays logbook compliance summary', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Logbook Status Summary' })).toBeVisible()
    await expect(page.getByText('Compliance', { exact: true })).toBeVisible()
    await expect(page.getByText('1 / 2 this week')).toBeVisible()
  })

  test('displays submission status breakdown', async ({ page }) => {
    for (const [label, count] of [['Submitted', '1'], ['Pending', '1'], ['Overdue', '0']]) {
      const tile = page.getByText(label, { exact: true }).locator('..')
      await expect(tile).toBeVisible()
      await expect(tile).toContainText(count)
    }
  })

  test('navigates to students page via sidebar', async ({ page }) => {
    await page.click('a[href="/students"]')
    await expect(page).toHaveURL(/\/students$/)
  })
})
