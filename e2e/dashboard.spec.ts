import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'
import { MOCK_DASHBOARD, MOCK_LOGBOOKS, MOCK_STUDENTS } from './fixtures/data'

test.beforeEach(async ({ page }) => {
  await setupPage(page)
})

test('shows semester context, placement, follow-up and weekly submissions once', async ({ page }) => {
  // The first request also cold-compiles the Nuxt client in the test server.
  test.setTimeout(60_000)
  await page.goto('/')
  const header = page.getByRole('main').locator('header')
  await expect(header.getByText('Jan-Jun 2026', { exact: true })).toBeVisible({ timeout: 45_000 })
  await expect(header.getByText('Registration open')).toBeVisible()
  await expect(header.getByRole('link', { name: 'Manage semester' })).toHaveAttribute('href', '/semesters')
  await expect(header.getByRole('button', { name: 'Export Semester Report' })).toBeEnabled()

  const placement = page.getByRole('region', { name: 'Placement overview' })
  await expect(placement.getByRole('link')).toHaveCount(3)
  await expect(placement.getByRole('link', { name: /Enrolled students/ })).toContainText('50')
  const confirmed = placement.getByRole('link', { name: /Confirmed placements/ })
  await expect(confirmed).toContainText('60% of enrolled')
  await expect(confirmed.locator('.placement-progress > span')).toHaveAttribute('style', /width: 60%/)
  await expect(placement.locator('.placement-progress')).toHaveCount(1)

  const attention = page.getByRole('region', { name: 'Needs attention' })
  await expect(attention.getByRole('heading', { name: 'Logbooks', exact: true })).toBeVisible()
  await expect(attention.getByRole('link').first()).toHaveAccessibleName('Overdue: 3 logbooks')
  await expect(attention.getByRole('link', { name: 'Overdue: 3 logbooks' })).toHaveAttribute('href', '/logbooks?status=Late')
  await expect(attention.getByRole('link', { name: 'Awaiting review: 1 logbook' })).toHaveAttribute('href', '/logbooks?review=awaiting')
  await expect(attention.getByRole('link', { name: 'Incomplete checklists 1 student' })).toHaveAttribute('href', '/students?checklist=missing')

  const weekly = page.getByRole('region', { name: 'Weekly logbooks' })
  await expect(weekly.getByRole('progressbar')).toHaveCount(0)
  const trend = weekly.getByRole('figure')
  await expect(trend.getByRole('link')).toHaveCount(6)
  await expect(trend.getByText('Week 5', { exact: true })).toBeVisible()
  await expect(trend.getByText('Week 1', { exact: true })).toHaveCount(0)
  await expect(trend.getByRole('link', { name: 'Week ending 24 April 2026: 2 submitted, 0 overdue, 0 not yet due' })).toBeVisible()
  await expect(trend.getByRole('link', { name: 'Week 8, ending 1 May 2026: 0 submitted, 2 overdue, 0 not yet due' }))
    .toHaveAttribute('href', '/logbooks?week_end=2026-05-01')
  await expect(trend.getByRole('link', { name: 'Week 10 (current), ending 15 May 2026: 1 submitted, 0 overdue, 1 not yet due' })).toBeVisible()
})

test('links placement follow-up to students without an accepted placement, including interviews', async ({ page }) => {
  await page.route('**/api/students', route => route.fulfill({
    json: { students: MOCK_STUDENTS.map((student, i) => i === 1 ? { ...student, placementStatus: 'Interview' } : student) }
  }))
  await page.goto('/')
  await page.getByRole('link', { name: /Needs placement follow-up/ }).click()
  await expect(page).toHaveURL(/\/students\?status=unplaced$/)
  const table = page.getByRole('table')
  await expect(table.getByText('Interview', { exact: true })).toBeVisible()
  await expect(table.getByText('Accepted', { exact: true })).toHaveCount(0)
})

test('opens the filtered checklist and review queues', async ({ page }) => {
  await page.route('**/api/students?checklist=missing', route => route.fulfill({ json: { students: [MOCK_STUDENTS[1]] } }))
  await page.route('**/api/logbooks?review=awaiting', route => route.fulfill({ json: [MOCK_LOGBOOKS[0]] }))

  await page.goto('/')
  await page.getByRole('link', { name: /Incomplete checklists/ }).click()
  await expect(page.getByRole('checkbox', { name: 'Missing required checklist items' })).toBeChecked()
  await expect(page.getByRole('table').getByText('Bob Smith')).toBeVisible()
  await expect(page.getByRole('table').getByText('Alice Johnson')).toHaveCount(0)

  await page.goBack()
  await page.getByRole('link', { name: /Awaiting review:.*logbook/ }).click()
  await expect(page.getByRole('combobox', { name: 'Filter by status' })).toHaveValue('awaiting')
  await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
  await expect(page.getByRole('table').getByText('Bob Smith')).toHaveCount(0)
})

test('opens only the reporting week and allows returning to all weeks', async ({ page }) => {
  await page.route('**/api/logbooks?week_end=2026-05-15', route => route.fulfill({ json: [MOCK_LOGBOOKS[0]] }))
  await page.route('**/api/logbooks', route => route.fulfill({
    json: [MOCK_LOGBOOKS[0], { ...MOCK_LOGBOOKS[1], weekEndDate: '2026-05-08', weekNumber: 5 }]
  }))
  await page.goto('/')
  await page.getByRole('figure').getByRole('link', { name: /Week 10 \(current\), ending 15 May 2026/ }).click()
  await expect(page).toHaveURL(/\/logbooks\?week_end=2026-05-15$/)
  await expect(page.getByRole('table').getByText('Alice Johnson')).toBeVisible()
  await expect(page.getByRole('table').getByText('Bob Smith')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show all weeks' }).click()
  await expect(page.getByRole('table').getByText('Bob Smith')).toBeVisible()
})

test('keeps the overview and first follow-up visible at desktop sizes, without mobile overflow', async ({ page }) => {
  await page.goto('/')
  for (const width of [1366, 1469, 768, 430, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 843 })
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (width >= 1366) {
      await expect(page.getByRole('heading', { name: 'Placement overview' })).toBeInViewport({ ratio: 1 })
      await expect(page.getByRole('link', { name: /Overdue:.*logbooks/ })).toBeInViewport({ ratio: 1 })
      await expect(page.getByRole('heading', { name: 'Weekly logbooks' })).toBeInViewport({ ratio: 1 })
    }
  }
})

test('simplifies the phone header, attention rows, and logbook chart', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 843 })
  await page.goto('/')
  const header = page.getByRole('main').locator('.dashboard-hero')
  const semester = header.getByText('Jan-Jun 2026', { exact: true })
  await expect(semester.locator('..')).toHaveCSS('flex-direction', 'column')
  await expect(header.getByRole('button', { name: 'Refresh' })).toHaveCSS('min-height', '44px')

  const attention = page.getByRole('region', { name: 'Needs attention' })
  const followUp = attention.getByRole('link', { name: /Overdue:.*logbooks/ })
  await expect(followUp).toHaveCSS('border-top-width', '0px')
  await expect(followUp.getByText('3')).toHaveCSS('background-color', 'rgb(254, 243, 199)')
  await expect(attention.getByText('1', { exact: true })).toHaveCSS('background-color', 'rgb(241, 245, 249)')
  await expect(attention.getByText('1 student', { exact: true })).toHaveCSS('background-color', 'rgb(241, 245, 249)')

  const chart = page.getByRole('figure')
  await expect(chart.getByRole('list', { name: 'Logbook statuses' }).locator('..')).toHaveCSS('order', '9999')
  const scroller = chart.locator('.chart-scroll')
  await expect.poll(() => scroller.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
  const lastWeek = chart.getByRole('link', { name: /Week 10 \(current\), ending/ })
  await lastWeek.scrollIntoViewIfNeeded()
  await expect(lastWeek).toBeInViewport()
})

test('matches card heights side by side but keeps the weekly card compact when stacked', async ({ page }) => {
  await page.setViewportSize({ width: 1469, height: 843 })
  await page.route('**/api/dashboard', route => route.fulfill({ json: { ...MOCK_DASHBOARD, logbookTrend: undefined } }))
  await page.goto('/')
  const weekly = page.getByRole('region', { name: 'Weekly logbooks' })
  const attention = page.getByRole('region', { name: 'Needs attention' })
  await expect(weekly.getByText(/9.*15 May 2026/)).toBeVisible()
  await expect(weekly.getByText('1 / 2 submitted')).toBeVisible()
  await expect(weekly.getByText('1 not yet due')).toBeVisible()
  const progress = weekly.getByRole('progressbar', { name: 'Weekly logbooks submitted' })
  await expect(progress).toHaveAttribute('aria-valuenow', '1')
  await expect(progress).toHaveAttribute('aria-valuemax', '2')
  await expect(weekly.getByRole('link', { name: 'View this week' })).toBeVisible()
  await expect(weekly.getByRole('figure')).toHaveCount(0)
  await expect.poll(async () => {
    const logbooksBox = await weekly.boundingBox()
    const attentionBox = await attention.boundingBox()
    return !!(logbooksBox && attentionBox && Math.abs(logbooksBox.height - attentionBox.height) < 1)
  }).toBe(true)

  await page.setViewportSize({ width: 390, height: 843 })
  await expect.poll(async () => {
    const logbooksBox = await weekly.boundingBox()
    const attentionBox = await attention.boundingBox()
    return !!(logbooksBox && attentionBox && logbooksBox.height < attentionBox.height)
  }).toBe(true)
})

test('handles loading, an empty reporting week, a failed refresh, and no active semester', async ({ page }) => {
  let releaseResponse!: () => void
  const responseReady = new Promise<void>(resolve => { releaseResponse = resolve })
  await page.route('**/api/dashboard', async route => {
    await responseReady
    await route.fulfill({ json: {
      ...MOCK_DASHBOARD, studentsMissingChecklists: 0, overdueLogbooks: 0, reviewQueue: undefined,
      logbookSummary: { total: 0, submitted: 0, pending: 0, weekStart: null, weekEnd: null }, logbookTrend: []
    } })
  })
  await page.goto('/')
  await expect(page.getByText('Loading dashboard data…')).toBeVisible()
  releaseResponse()
  await expect(page.getByText('No logbooks due this week.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Weekly logbooks' }).getByRole('figure')).toHaveCount(0)
  await expect(page.getByText('You’re all caught up.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Needs attention' }).getByRole('link')).toHaveCount(0)

  await page.route('**/api/dashboard', route => route.fulfill({ status: 500, json: { message: 'Unavailable' } }))
  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect(page.getByRole('alert')).toContainText('Showing the last loaded dashboard')
  await expect(page.getByRole('heading', { name: 'Placement overview' })).toBeVisible()

  await page.route('**/api/dashboard', route => route.fulfill({ json: { ...MOCK_DASHBOARD, semester: null } }))
  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect(page.getByRole('main').getByText('No active semester', { exact: true })).toBeVisible()
  await expect(page.getByRole('banner').getByText('No active semester', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Placement overview' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Export Semester Report' })).toBeDisabled()
})
