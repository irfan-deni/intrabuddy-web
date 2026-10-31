import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

const pages = [
  { path: '/', title: 'Dashboard', subtitle: 'Real-time overview of the active semester.' },
  { path: '/students', title: 'Student Directory', subtitle: 'Manage student placements, milestones, and records.' },
  { path: '/logbooks', title: 'Logbooks', subtitle: 'Monitor semester logbook compliance and send reminders.' },
  { path: '/checklists', title: 'Submission Requirements', subtitle: 'Global requirements template for the active semester.' },
  { path: '/inbox', title: 'Notifications', subtitle: 'Notifications sent directly to you.' },
  { path: '/communications?tab=broadcasts', title: 'Announcements & Alerts', subtitle: 'Send announcements and individual alerts.' },
  { path: '/faqs', title: 'FAQs', subtitle: 'Self-service FAQ library for internship candidates.' },
  { path: '/semesters', title: 'Semester Management', subtitle: 'Academic semester configuration and lifecycle.' }
]

test.describe('Consistent page headers', () => {
  for (const entry of pages) {
    test(`${entry.title} has readable typography and responsive header controls`, async ({ page }) => {
      await setupPage(page)
      await page.setViewportSize({ width: 1469, height: 843 })
      await page.goto(entry.path)
      await page.waitForLoadState('networkidle')
      const header = page.getByRole('main').locator('header').first()
      const title = header.getByRole('heading', { level: 1, name: entry.title, exact: true })
      const subtitle = header.getByText(entry.subtitle, { exact: true })

      await expect(title).toHaveCSS('font-size', entry.path === '/' ? '30px' : '36px')
      await expect(title).toHaveCSS('font-weight', '700')
      await expect(title).toHaveCSS('text-transform', 'none')
      await expect(subtitle).toHaveCSS('font-size', '14px')
      await expect(subtitle).toHaveCSS('font-weight', '400')
      await expect(subtitle).toHaveCSS('line-height', '22.75px')
      await expect(subtitle).toHaveCSS('color', 'rgb(71, 85, 105)')
      await expect(subtitle).toHaveCSS('letter-spacing', 'normal')
      await expect(subtitle).toHaveCSS('text-transform', 'none')
      await expect(subtitle).toHaveCSS('margin-top', '8px')
      await expect(subtitle).toHaveCSS('margin-bottom', '0px')

      for (const button of await header.getByRole('button').all()) {
        await expect(button).toHaveCSS('font-size', '14px')
        await expect(button).toHaveCSS('font-weight', '600')
      }

      for (const width of [1469, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 843 })
        await expect(title).toHaveCSS('font-size', width >= 1024 && entry.path === '/' ? '30px' : width >= 768 ? '36px' : '24px')
        await expect.poll(() => header.evaluate(element => {
          const viewport = window.innerWidth
          return [element, ...element.querySelectorAll('h1, p, input, select, button')].flatMap(child => {
            const bounds = child.getBoundingClientRect()
            return bounds.left >= 0 && bounds.right <= viewport + 1 ? [] : [{ tag: child.tagName, right: bounds.right, width: bounds.width }]
          })
        }), { message: `${entry.title} header should fit ${width}px` }).toEqual([])
      }
    })
  }
})
