import type { Page } from '@playwright/test'
import { MOCK_USER, MOCK_PROFILE, MOCK_STUDENTS, MOCK_DASHBOARD, MOCK_LOGBOOKS } from './fixtures/data'

const SUPABASE_URL = 'https://yyqoleelprtldlvvizdk.supabase.co'
const PROJECT_REF = 'yyqoleelprtldlvvizdk'

export async function setupAuthSession(page: Page) {
  const session = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: MOCK_USER,
  }

  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    { key: `sb-${PROJECT_REF}-auth-token`, value: session }
  )
}

export async function mockSupabaseAuth(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/**`, async (route) => {
    const url = route.request().url()

    if (url.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
    } else if (url.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'mock-token', token_type: 'bearer', user: MOCK_USER }),
      })
    } else if (url.includes('/auth/v1/logout')) {
      await route.fulfill({ status: 204 })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    }
  })
}

export async function mockSupabaseRest(page: Page) {
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    const tableMatch = url.match(/\/rest\/v1\/([^?]+)/)
    const table = tableMatch ? tableMatch[1] : ''

    if (method === 'GET') {
      if (table === 'users') {
        if (url.includes(`id=eq.${MOCK_PROFILE.id}`) || url.includes('id=eq.user-1')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_PROFILE]) })
        }
        if (url.includes('role=eq.student')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDENTS.map(s => ({ id: s.id, full_name: s.full_name, student_id: s.student_id }))) })
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      if (table === 'cohorts') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Jan-Jun 2026', start_date: '2026-01-15', end_date: '2026-06-30', is_active: true, created_at: '2025-12-01T00:00:00Z' },
            { id: 2, name: 'Jul-Dec 2025', start_date: '2025-07-01', end_date: '2025-12-31', is_active: false, created_at: '2025-06-01T00:00:00Z' },
          ]),
        })
      }
      if (table === 'student_checklists') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, student_id: 'student-1', checklist_item_id: 1, is_completed: true, override_reason: null, updated_by_admin: null },
            { id: 2, student_id: 'student-1', checklist_item_id: 2, is_completed: false, override_reason: null, updated_by_admin: null },
            { id: 3, student_id: 'student-1', checklist_item_id: 3, is_completed: true, override_reason: null, updated_by_admin: null },
          ]),
        })
      }
      if (table === 'checklist_templates') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, title: 'Upload Resume', description: 'Upload your latest resume', display_order: 1, required: true, cohort_id: 1 },
            { id: 2, title: 'Submit Insurance Form', description: null, display_order: 2, required: true, cohort_id: 1 },
          ]),
        })
      }
      if (table === 'job_applications') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, student_id: 'student-1', company_name: 'Tech Corp', position: 'Software Engineer Intern', status: 'Accepted', application_date: '2026-03-15', override_reason: null, updated_by_admin: null, updated_at: '2026-03-20T00:00:00Z' },
          ]),
        })
      }
      if (table === 'weekly_logbook_tracking') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, student_id: 'student-1', week_number: 1, week_end_date: '2026-04-07', is_submitted: true },
            { id: 2, student_id: 'student-1', week_number: 2, week_end_date: '2026-04-14', is_submitted: true },
            { id: 3, student_id: 'student-1', week_number: 3, week_end_date: '2026-04-21', is_submitted: false },
          ]),
        })
      }
      if (table === 'digital_wallet_items') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, item_name: 'Resume.pdf', uploaded_at: '2026-03-10T00:00:00Z' },
          ]),
        })
      }
      if (table === 'faqs') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      if (table === 'faq_categories') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      if (table === 'notifications') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      if (table === 'chatbot_conversations') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }

    if (method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 999 }) })
    }

    if (method === 'PATCH' || method === 'UPDATE') {
      return route.fulfill({ status: 204 })
    }

    if (method === 'DELETE') {
      return route.fulfill({ status: 204 })
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
}

export async function mockApiRoutes(page: Page) {
  await page.route('http://localhost:3000/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/api/dashboard') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) })
    }

    if (url.includes('/api/students') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ students: MOCK_STUDENTS }) })
    }

    if (url.includes('/api/students') && method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'new-student' }) })
    }

    if (url.match(/\/api\/students\/[\w-]+$/) && method === 'PUT') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.match(/\/api\/students\/[\w-]+$/) && method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/logbooks') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LOGBOOKS) })
    }

    if (url.includes('/api/logbooks') && url.includes('/reminder') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/logbooks') && url.includes('/submit') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/broadcasts') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }

    if (url.includes('/api/broadcasts') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.match(/\/api\/broadcasts\/\d+$/) && method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/coordinators') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ coordinators: [] }) })
    }

    if (url.includes('/api/coordinators') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.match(/\/api\/coordinators\/[\w-]+$/) && method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/notifications') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not mocked' }) })
  })
}

export async function setupPage(page: Page) {
  await setupAuthSession(page)
  await mockSupabaseAuth(page)
  await mockSupabaseRest(page)
  await mockApiRoutes(page)
}
