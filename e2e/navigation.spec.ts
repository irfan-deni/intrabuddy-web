import { test, expect } from '@playwright/test'
import { setupPage } from './helpers'

test.describe('Layout & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('sidebar shows navigation links', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Students')).toBeVisible()
    await expect(page.locator('text=Broadcasts')).toBeVisible()
    await expect(page.locator('text=Logbooks')).toBeVisible()
    await expect(page.locator('text=Knowledge Base')).toBeVisible()
    await expect(page.locator('text=Cohorts')).toBeVisible()
    await expect(page.locator('text=Notifications')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('sidebar highlights active page', async ({ page }) => {
    const dashboardLink = page.locator('a[href="/"]').first()
    await expect(dashboardLink).toHaveClass(/bg-sky-600/)
  })

  test('highlights new page after navigation', async ({ page }) => {
    await page.click('a[href="/students"]')
    await page.waitForURL('http://localhost:3000/students')
    const studentsLink = page.locator('a[href="/students"]').first()
    await expect(studentsLink).toHaveClass(/bg-sky-600/)
  })

  test('header shows user name and breadcrumb', async ({ page }) => {
    await expect(page.locator('text=Test Coordinator')).toBeVisible()
    await expect(page.locator('text=Internal')).toBeVisible()
  })

  test('footer is visible', async ({ page }) => {
    await expect(page.locator('text=INTRA Buddy Management System')).toBeVisible()
    await expect(page.locator('text=Version 2.4.0')).toBeVisible()
  })

  test('subtitle shows on dashboard page', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('sign out button is visible', async ({ page }) => {
    await expect(page.locator('text=Sign Out')).toBeVisible()
  })

  test('navigating to /students shows correct breadcrumb', async ({ page }) => {
    await page.click('a[href="/students"]')
    await page.waitForURL('http://localhost:3000/students')
    await expect(page.locator('text=Internal')).toBeVisible()
    await expect(page.locator('text=Students').last()).toBeVisible()
  })
})
