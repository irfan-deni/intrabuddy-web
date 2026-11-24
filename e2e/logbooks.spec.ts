import { expect, test } from '@playwright/test'
import { setupPage } from './helpers'
import { MOCK_LOGBOOKS } from './fixtures/data'

for (const viewport of [{ width: 1469, height: 843 }, { width: 320, height: 640 }]) {
  test(`student logbook drawer is usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await setupPage(page)
    await page.route('**/api/logbooks/student/student-2/reminder', route => route.fulfill({ json: { entryIds: [2] } }))
    await page.goto('/logbooks')

    const triggers = page.getByRole('button', { name: 'View logbooks' })
    const trigger = triggers.nth(1)
    await trigger.click()

    const drawer = page.getByRole('dialog', { name: 'Student weekly logbooks' })
    await expect(drawer.getByRole('heading', { name: 'Bob Smith' })).toBeVisible()
    await expect(drawer.getByRole('progressbar', { name: 'Submission progress' }))
      .toHaveAttribute('aria-valuetext', '0 of 1 weeks submitted')
    const week = drawer.getByRole('tabpanel', { name: 'Not submitted 1' }).getByRole('listitem')
    await expect(week.getByText('Week 6')).toBeVisible()
    const actions = week.getByRole('button', { name: 'Actions for week 6' })
    const markDone = week.getByRole('button', { name: 'Mark done' })
    await expect(week.getByText('Not submitted', { exact: true })).toHaveCount(0)
    await expect(actions).toBeVisible()
    await expect(markDone).toBeHidden()
    await expect(drawer).toBeInViewport({ ratio: 1 })
    await expect(drawer.getByRole('link', { name: 'View reviews' }))
      .toHaveAttribute('href', '/student?id=student-2#student-management')

    await drawer.getByRole('button', { name: 'Remind student' }).click()
    await expect(drawer.getByText('Reminder sent.', { exact: true })).toBeVisible()
    await actions.press('Enter')
    await expect(markDone).toBeFocused()
    await expect(markDone).toBeInViewport({ ratio: 1 })
    const actionBox = (await actions.boundingBox())!
    const menuBox = (await markDone.boundingBox())!
    expect(Math.abs(menuBox.x + menuBox.width - actionBox.x - actionBox.width)).toBeLessThan(12)
    expect(Math.abs(menuBox.y - actionBox.y)).toBeLessThan(90)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeVisible()
    await expect(markDone).toBeHidden()
    await expect(actions).toBeFocused()
    await actions.click()
    await drawer.getByRole('heading', { name: 'Weekly logbooks' }).click()
    await expect(markDone).toBeHidden()
    await actions.click()
    await markDone.click()
    const submittedWeek = drawer.getByRole('tabpanel', { name: 'Submitted 1', exact: true }).getByRole('listitem')
    await expect(submittedWeek.getByText('Week 6')).toBeVisible()
    await expect(drawer.getByRole('tab', { name: 'Submitted 1', exact: true })).toBeFocused()
    await expect(drawer.getByRole('status', { name: 'Week updates' })).toHaveText('Week 6 marked as submitted.')
    await expect(drawer.getByRole('tab', { name: /Not submitted/ })).toHaveCount(0)
    await expect(submittedWeek.getByRole('button')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()

    await triggers.first().click()
    await expect(drawer.getByRole('progressbar', { name: 'Submission progress' }))
      .toHaveAttribute('aria-valuetext', '1 of 1 weeks submitted')
    await expect(drawer.getByRole('progressbar').locator('div')).toHaveCSS('background-color', 'rgb(5, 150, 105)')
    await expect(drawer.getByRole('button', { name: 'Remind student' })).toHaveCount(0)
  })
}

test('weekly status tabs show just one group in week order and support arrow keys', async ({ page }) => {
  await setupPage(page)
  const [alice, bob] = MOCK_LOGBOOKS
  await page.route('**/api/logbooks', route => route.fulfill({
    json: [
      { ...bob, id: 3, weekNumber: 8 },
      { ...bob, id: 4, weekNumber: 7, statusLabel: 'Late', isStale: true },
      bob,
      { ...bob, id: 5, weekNumber: 5, statusLabel: 'Submitted', isSubmitted: true, submittedAt: alice.submittedAt }
    ]
  }))
  await page.goto('/logbooks')
  await page.getByRole('button', { name: 'View logbooks' }).click()

  const tabs = page.getByRole('tablist', { name: 'Weekly logbooks' })
  const drawer = page.getByRole('dialog', { name: 'Student weekly logbooks' })
  await expect(drawer.locator('.p-drawer-header')).toHaveCSS('background-image', /linear-gradient/)
  await expect(drawer.getByRole('region', { name: 'Submission progress' })).toHaveCSS('background-color', 'rgb(240, 249, 255)')
  await expect(drawer.getByRole('progressbar').locator('div')).toHaveCSS('background-color', 'rgb(2, 132, 199)')
  const overdue = tabs.getByRole('tab', { name: 'Overdue 1', selected: true })
  await expect(overdue).toBeVisible()
  await expect(overdue).toHaveCSS('background-color', 'rgb(254, 243, 199)')
  await expect(overdue.getByText('1', { exact: true })).toHaveCSS('background-color', 'rgb(252, 211, 77)')
  const submitted = tabs.getByRole('tab', { name: 'Submitted 1', exact: true })
  await expect(submitted).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(tabs.getByRole('tab')).toHaveText(['Overdue 1', 'Not submitted 2', 'Submitted 1'])
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await expect(page.getByRole('tabpanel').getByText('Week 7')).toBeVisible()
  await overdue.press('ArrowRight')
  const pendingTab = tabs.getByRole('tab', { name: 'Not submitted 2', selected: true })
  await expect(pendingTab).toBeFocused()
  await expect(pendingTab).toHaveCSS('background-color', 'rgb(219, 234, 254)')
  const pending = page.getByRole('tabpanel', { name: 'Not submitted 2' })
  await expect(pending.getByText(/^Week \d+$/)).toHaveText(['Week 6', 'Week 8'])
  await expect(page.getByText('Week 7', { exact: true })).toHaveCount(0)
  await pendingTab.press('End')
  await expect(submitted).toBeFocused()
  await expect(submitted).toHaveCSS('background-color', 'rgb(209, 250, 229)')
})

test('long tabs show five weeks per page and marking a week done keeps focus in the unfinished tab', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 })
  await setupPage(page)
  const [alice, bob] = MOCK_LOGBOOKS
  await page.route('**/api/logbooks', route => route.fulfill({
    json: [
      { ...bob, id: 3, weekNumber: 5, statusLabel: 'Late' },
      bob,
      { ...bob, id: 4, weekNumber: 7 },
      ...Array.from({ length: 10 }, (_, index) => ({
        ...bob,
        id: 10 + index,
        weekNumber: 8 + index,
        statusLabel: 'Submitted',
        isSubmitted: true,
        submittedAt: alice.submittedAt
      }))
    ]
  }))
  await page.goto('/logbooks')
  await page.getByRole('button', { name: 'View logbooks' }).click()

  const drawer = page.getByRole('dialog', { name: 'Student weekly logbooks' })
  await drawer.getByRole('tab', { name: 'Submitted 10', exact: true }).click()
  const submitted = drawer.getByRole('tabpanel', { name: 'Submitted 10' })
  await expect(submitted.getByRole('listitem')).toHaveCount(5)
  await expect(submitted.getByText('Page 1 of 2')).toBeVisible()
  await submitted.getByRole('button', { name: 'Next' }).click()
  await expect(submitted).toBeFocused()
  await expect(submitted.getByText('Page 2 of 2')).toBeVisible()
  await expect(submitted.getByText(/^Week \d+$/)).toHaveText(['Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17'])
  await expect(submitted.getByRole('button', { name: 'Next' })).toBeDisabled()
  await submitted.getByRole('button', { name: 'Previous' }).click()
  await expect(submitted.getByText('Page 1 of 2')).toBeVisible()

  await drawer.getByRole('tab', { name: 'Not submitted 2', exact: true }).click()
  await drawer.getByRole('button', { name: 'Actions for week 6' }).click()
  await drawer.getByRole('button', { name: 'Mark done' }).click()
  const nextWeek = drawer.getByRole('tabpanel', { name: 'Not submitted 1' }).getByRole('listitem')
  await expect(nextWeek.getByText('Week 7')).toBeVisible()
  await expect(nextWeek).toBeFocused()
  await expect(drawer.getByRole('status', { name: 'Week updates' })).toHaveText('Week 6 marked as submitted.')
  await expect(drawer.getByRole('tab', { name: 'Submitted 11', exact: true })).toHaveAttribute('aria-selected', 'false')
})
