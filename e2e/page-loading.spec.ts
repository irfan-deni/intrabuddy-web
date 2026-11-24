import { test, expect, type Page } from '@playwright/test'
import { setupPage } from './helpers'
import { MOCK_DASHBOARD } from './fixtures/data'

const dashboardSemester = (page: Page, name = MOCK_DASHBOARD.semesterName) =>
  page.getByRole('main').locator('header').getByText(name, { exact: true })

const headerSemester = (page: Page, name = MOCK_DASHBOARD.semesterName) =>
  page.getByRole('banner').getByText(name, { exact: true })

test('dashboard loads statistics, logbook summary and the header semester in one request', async ({ page }) => {
  await setupPage(page)
  const requests: string[] = []
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (['/api/dashboard', '/api/logbooks/summary', '/rest/v1/semesters'].includes(path)) requests.push(path)
  })
  await page.goto('/')
  await expect(page.getByText('60% of enrolled', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /current.*1 submitted/ })).toBeVisible()
  await expect(headerSemester(page)).toBeVisible()
  expect(requests).toEqual(['/api/dashboard'])
})

test('the header reuses the active semester across other pages', async ({ page }) => {
  await setupPage(page)
  const requests: string[] = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname === '/rest/v1/semesters' && url.searchParams.get('select') === 'name') requests.push(url.pathname)
  })
  await page.goto('/students')
  await expect(headerSemester(page)).toBeVisible()
  await page.locator('aside a[href="/checklists"]').click()
  await expect(page.getByRole('table').getByText('Upload Resume')).toBeVisible()
  await expect(headerSemester(page)).toBeVisible()
  expect(requests).toHaveLength(1)
})

test('returning to the dashboard shows its snapshot before the refresh completes', async ({ page }) => {
  await page.clock.install()
  await setupPage(page)
  await page.goto('/')
  await expect(dashboardSemester(page)).toBeVisible()
  await page.locator('aside a[href="/students"]').click()
  await expect(page.getByRole('heading', { name: /student/i }).first()).toBeVisible()
  await page.clock.fastForward(11_000)

  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/dashboard', async (route) => {
    await pending
    await route.fulfill({ json: { ...MOCK_DASHBOARD, semesterName: 'Updated Semester' } })
  })
  try {
    await page.locator('aside a[href="/"]').click()
    await expect(dashboardSemester(page)).toBeVisible()
    await expect(page.getByText('60% of enrolled', { exact: true })).toBeVisible()
  } finally {
    release()
  }
  await expect(dashboardSemester(page, 'Updated Semester')).toBeVisible()
})

test('fresh dashboard navigation skips the request and manual refresh fetches updates', async ({ page }) => {
  await setupPage(page)
  await page.goto('/')
  await expect(dashboardSemester(page)).toBeVisible()
  await page.locator('aside a[href="/students"]').click()
  await expect(page.getByRole('heading', { name: /student/i }).first()).toBeVisible()
  let calls = 0
  await page.route('**/api/dashboard', async route => {
    calls++
    await route.fulfill({ json: { ...MOCK_DASHBOARD, semesterName: 'Refreshed Semester' } })
  })
  await page.locator('aside a[href="/"]').click()
  await expect(dashboardSemester(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled()
  expect(calls).toBe(0)
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(dashboardSemester(page, 'Refreshed Semester')).toBeVisible()
  expect(calls).toBe(1)
})

test('returning to the checklist page uses its cached snapshot', async ({ page }) => {
  await setupPage(page)
  const requests: string[] = []
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/checklists') requests.push(request.url())
  })

  await page.goto('/checklists')
  await expect(page.getByRole('table').getByText('Upload Resume')).toBeVisible()
  await page.locator('aside a[href="/"]').click()
  await expect(dashboardSemester(page)).toBeVisible()
  await page.locator('aside a[href="/checklists"]').click()
  await expect(page.getByRole('table').getByText('Upload Resume')).toBeVisible()

  expect(requests).toHaveLength(1)
})

test('PDF dependencies are deferred until export and the export still downloads', async ({ page }) => {
  await setupPage(page)
  const pdfRequests: string[] = []
  const fullLogbookRequests: string[] = []
  page.on('request', request => {
    if (/jspdf|html2canvas/.test(request.url())) pdfRequests.push(request.url())
    if (new URL(request.url()).pathname === '/api/logbooks') fullLogbookRequests.push(request.url())
  })
  await page.goto('/')
  await expect(dashboardSemester(page)).toBeVisible()
  expect(pdfRequests).toEqual([])
  expect(fullLogbookRequests).toEqual([])
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Semester Report' }).click()
  expect((await download).suggestedFilename()).toBe('INTRA_Semester_Report.pdf')
  expect(fullLogbookRequests).toHaveLength(1)
})
