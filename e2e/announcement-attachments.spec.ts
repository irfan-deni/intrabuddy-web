import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9GQAAAAASUVORK5CYII=', 'base64')
const image = (name = 'notice.png') => ({ name, mimeType: 'image/png', buffer: png })
const project = 'https://intrabuddy-test.supabase.co'
const publicImage = `${project}/storage/v1/object/public/broadcast-media/broadcast-images/notice.png`

test.beforeEach(async ({ page }) => {
  await setupPage(page)
})

test('previews stay local, leave message untouched, and can be removed or abandoned', async ({ page }) => {
  const storageRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/storage/')) storageRequests.push(request.url()) })
  await page.goto('/communications')
  await page.getByLabel('Message', { exact: true }).fill('Plain message')
  const input = page.getByLabel('Choose announcement images')
  await input.setInputFiles(image())
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toHaveAttribute('src', /^blob:/)
  await expect(page.getByRole('button', { name: /Send broadcast/ })).toBeEnabled()
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Plain message')
  await page.getByRole('button', { name: 'Remove attached image 1' }).click()
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toHaveCount(0)
  await input.setInputFiles(image())
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toBeVisible()
  await page.getByRole('banner').getByRole('link', { name: 'Notifications', exact: true }).click()
  await page.waitForURL('**/inbox')
  expect(storageRequests).toEqual([])
})

test('rejects unsupported, oversized, excessive and duplicate attachments', async ({ page }) => {
  await page.goto('/communications')
  const input = page.getByLabel('Choose announcement images')
  await input.setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') })
  await expect(page.getByRole('alert')).toContainText('SVG')
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('5 MB')
  await input.setInputFiles([image('1.png'), image('2.png'), image('3.png'), image('4.png')])
  await expect(page.getByRole('alert')).toContainText('at most 3')
  await input.setInputFiles(image())
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toBeVisible()
  await input.setInputFiles(image())
  await expect(page.getByRole('alert')).toContainText('already attached')
  await expect(page.getByRole('button', { name: /Remove attached image/ })).toHaveCount(1)
})

test('failed sends preserve drafts; retry sends multipart once and locks the composer', async ({ page }) => {
  let calls = 0
  let finish: (() => void) | undefined
  const pending = new Promise<void>(resolve => { finish = resolve })
  await page.route('**/api/broadcasts', async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    calls++
    expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=')
    const body = route.request().postDataBuffer()!.toString()
    expect(body).toContain('name="images"; filename="notice.png"')
    expect(body).toContain('Plain message')
    expect(body).not.toContain('<img')
    if (calls === 1) return route.fulfill({ status: 502, json: { statusMessage: 'Images could not be uploaded. Please try again.' } })
    await pending
    await route.fulfill({ json: { success: true } })
  })
  await page.goto('/communications')
  await page.getByLabel('Title', { exact: true }).fill('Notice')
  await page.getByLabel('Message', { exact: true }).fill('Plain message')
  await page.getByLabel('Choose announcement images').setInputFiles(image())
  const send = page.getByRole('button', { name: /Send broadcast/ })
  await expect(send).toBeEnabled()
  await send.click()
  await expect(page.getByRole('alert')).toContainText('Please try again')
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Plain message')
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toBeVisible()
  await send.click()
  await expect(page.getByLabel('Title', { exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Remove attached image 1' })).toBeDisabled()
  await page.locator('form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  await page.getByRole('navigation', { name: 'Communication type' }).getByRole('link', { name: 'Individual alerts', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Please wait')
  expect(calls).toBe(2)
  finish!()
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('')
  await expect(page.getByAltText('Selected attachment 1: notice.png')).toHaveCount(0)
})

for (const destination of ['inbox', 'communications']) {
  test(`${destination} renders trusted images without executing HTML and handles unavailable images`, async ({ page }) => {
    const body = `Meeting details <script>window.attachmentInjected = true</script><img src="${publicImage}" onerror="window.attachmentInjected = true"><img src="https://foreign.example/tracker.png">`
    await page.route('**/api/notifications**', route => route.fulfill({ json: [{ id: 1, title: 'Notice', body, type: 'broadcast', is_read: true, created_at: '2026-04-01T00:00:00Z' }] }))
    await page.route('**/api/broadcasts', route => route.fulfill({ json: [{ id: 1, title: 'Notice', body, target_roles: ['students_all'], sent_at: '2026-04-01T00:00:00Z' }] }))
    await page.route(publicImage, route => route.fulfill({ status: 404 }))
    const foreign: string[] = []
    page.on('request', request => { if (request.url().includes('foreign.example')) foreign.push(request.url()) })
    await page.goto(`/${destination}`)
    const unavailable = page.getByText('Image attachment 1 is unavailable.').filter({ visible: true })
    await page.getByText('Meeting details', { exact: false }).filter({ visible: true }).scrollIntoViewIfNeeded()
    await expect(unavailable).toBeVisible()
    expect(await page.evaluate(() => (window as any).attachmentInjected)).toBeUndefined()
    expect(foreign).toEqual([])
    await expect(page.getByText('Meeting details', { exact: false }).filter({ visible: true })).toContainText('<script>')
  })
}

test('broadcast history resolves stored image paths from the public bucket', async ({ page }) => {
  const path = 'broadcast-images/actor/12345678-1234-1234-1234-123456789abc.png'
  const url = `${project}/storage/v1/object/public/broadcast-media/${path}`
  await page.route('**/api/broadcasts', route => route.fulfill({ json: [{ id: 1, title: 'Notice', body: 'Plain message', image_paths: [path], target_roles: ['students_all'], sent_at: '2026-04-01T00:00:00Z' }] }))
  await page.route(url, route => route.fulfill({ status: 200, contentType: 'image/png', body: png }))
  await page.goto('/communications')
  await expect(page.getByAltText('Announcement attachment 1').filter({ visible: true })).toHaveAttribute('src', url)
})
