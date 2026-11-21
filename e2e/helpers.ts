import type { Page } from '@playwright/test'
import { MOCK_USER, MOCK_PROFILE, MOCK_STUDENTS, MOCK_DASHBOARD, MOCK_LOGBOOKS } from './fixtures/data'
import { managementFixture } from './fixtures/student-management'

const SUPABASE_URL = 'https://intrabuddy-test.supabase.co'
const PROJECT_REF = 'intrabuddy-test'
const MOCK_ACCESS_TOKEN = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ ...MOCK_USER, sub: MOCK_USER.id, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url'),
  Buffer.from('mock-signature').toString('base64url')
].join('.')

export async function setupAuthSession(page: Page) {
  const session = {
    access_token: MOCK_ACCESS_TOKEN,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: MOCK_USER,
  }

  await page.context().addCookies([{
    name: `sb-${PROJECT_REF}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: 'http://localhost:3100',
    sameSite: 'Lax'
  }])

  await page.addInitScript(
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
        body: JSON.stringify({ access_token: MOCK_ACCESS_TOKEN, refresh_token: 'mock-refresh-token', expires_in: 3600, token_type: 'bearer', user: MOCK_USER }),
      })
    } else if (url.includes('/auth/v1/logout')) {
      await route.fulfill({ status: 204 })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    }
  })
}

export async function mockSupabaseRest(page: Page, profile = MOCK_PROFILE) {
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    const tableMatch = url.match(/\/rest\/v1\/([^?]+)/)
    const table = tableMatch ? tableMatch[1] : ''

    if (method === 'GET') {
      if (table === 'users') {
        if (url.includes(`id=eq.${MOCK_PROFILE.id}`) || url.includes('id=eq.user-1')) {
          const isSingle = route.request().headers()['accept']?.includes('application/vnd.pgrst.object+json')
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(isSingle ? profile : [profile]) })
        }
        const student = MOCK_STUDENTS.find(item => url.includes(`id=eq.${item.id}`))
        if (student) {
          const isSingle = route.request().headers()['accept']?.includes('application/vnd.pgrst.object+json')
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(isSingle ? student : [student]) })
        }
        if (url.includes('role=eq.student')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDENTS.map(s => ({ id: s.id, full_name: s.full_name, student_id: s.student_id }))) })
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
      if (table === 'semesters') {
        const semesters = [
          { id: 1, name: 'Jan-Jun 2026', start_date: '2026-01-15', end_date: '2026-06-30', is_active: true, created_at: '2025-12-01T00:00:00Z' },
          { id: 2, name: 'Jul-Dec 2025', start_date: '2025-07-01', end_date: '2025-12-31', is_active: false, created_at: '2025-06-01T00:00:00Z' }
        ]
        const isSingle = route.request().headers()['accept']?.includes('application/vnd.pgrst.object+json')
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? semesters[0] : semesters),
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
            { id: 1, title: 'Upload Resume', description: 'Upload your latest resume', display_order: 1, required: true, semester_id: 1 },
            { id: 2, title: 'Submit Insurance Form', description: null, display_order: 2, required: true, semester_id: 1 },
            { id: 3, title: 'Complete Orientation', description: null, display_order: 3, required: true, semester_id: 1 },
          ]),
        })
      }
      if (table === 'job_applications') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, student_id: 'student-1', semester_id: 1, company_name: 'Tech Corp', position: 'Software Engineer Intern', status: 'Accepted', application_date: '2026-03-15', override_reason: null, updated_by_admin: null, updated_at: '2026-03-20T00:00:00Z' },
          ]),
        })
      }
      if (table === 'weekly_logbook_tracking') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, student_id: 'student-1', semester_id: 1, week_number: 1, week_end_date: '2026-04-07', is_submitted: true },
            { id: 2, student_id: 'student-1', semester_id: 1, week_number: 2, week_end_date: '2026-04-14', is_submitted: true },
            { id: 3, student_id: 'student-1', semester_id: 1, week_number: 3, week_end_date: '2026-04-21', is_submitted: false },
          ]),
        })
      }
      if (table === 'digital_wallet_items') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, item_name: 'Resume.pdf', file_path: 'student-1/resume.pdf', uploaded_at: '2026-03-10T00:00:00Z' },
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
  await page.route(/^http:\/\/localhost:3100\/api\//, async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/api/auth/privileges') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isSuperCoordinator: true }) })
    }

    if (url.includes('/api/semesters') && method === 'GET') {
      return route.fulfill({
        json: {
          semesters: [
            {
               id: 1, name: 'Jan-Jun 2026', start_date: '2026-01-15', end_date: '2026-06-30', is_active: true, registration_open: true, created_at: '2025-12-01T00:00:00Z',
              counts: { students: 3, templates: 2, logbooks: 9, applications: 1, audits: 0 },
              deletion: { allowed: false, message: 'Active semester cannot be deleted. Activate another semester first.' }
            },
            {
               id: 2, name: 'Jul-Dec 2025', start_date: '2025-07-01', end_date: '2025-12-31', is_active: false, registration_open: false, created_at: '2025-06-01T00:00:00Z',
              counts: { students: 0, templates: 0, logbooks: 0, applications: 0, audits: 0 },
              deletion: { allowed: true, message: null }
            },
            {
               id: 3, name: 'Jan-Jun 2025', start_date: '2025-01-15', end_date: '2025-06-30', is_active: false, registration_open: false, created_at: '2024-12-01T00:00:00Z',
              counts: { students: 2, templates: 1, logbooks: 5, applications: 1, audits: 0 },
              deletion: { allowed: false, message: 'This semester has 2 students, 5 logbook entries and 1 application. Set it inactive to preserve its history.' }
            },
            {
               id: 4, name: 'Jul-Dec 2024', start_date: '2024-07-01', end_date: '2024-12-31', is_active: false, registration_open: false, created_at: '2024-06-01T00:00:00Z',
              counts: { students: 0, templates: 2, logbooks: 0, applications: 0, audits: 0 },
              deletion: { allowed: true, message: null }
            }
          ]
        }
      })
    }

    if (/\/api\/semesters\/\d+\/registration$/.test(url) && method === 'PATCH') {
      return route.fulfill({ json: { id: Number(url.match(/\/semesters\/(\d+)\//)?.[1]), registration_open: route.request().postDataJSON().registration_open } })
    }

    if (url.includes('/api/administration/configuration') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }

    if (url.includes('/api/dashboard') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DASHBOARD) })
    }

    if (url.includes('/api/students/lookup') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDENTS) })
    }

    if (/\/api\/students\/[\w-]+\/management/.test(url) && method === 'GET') {
      return route.fulfill({ json: managementFixture() })
    }

    if (/\/api\/students\/[\w-]+\/checklists/.test(url) && method === 'GET') {
      const studentId = url.match(/\/api\/students\/([\w-]+)\/checklists/)?.[1] || 'student-1'
      const student = MOCK_STUDENTS.find(item => item.id === studentId) || MOCK_STUDENTS[0]!
      return route.fulfill({
        json: {
          semesterId: 1,
          semester: { id: 1, name: 'Jan-Jun 2026', is_active: true },
          student: { id: student.id, full_name: student.full_name, student_id: student.student_id, email: 'student@example.com' },
          capabilities: { correctRecords: true },
          items: [
            { entryId: 1, templateId: 1, title: 'Upload Resume', description: 'Upload your latest resume', required: true, displayOrder: 1, phase: 'before', dueDate: '2026-03-01', isCompleted: true, completedAt: '2026-02-01T00:00:00Z', overrideReason: null, hasEntry: true },
            { entryId: 2, templateId: 2, title: 'Submit Insurance Form', description: null, required: true, displayOrder: 2, phase: 'during', dueDate: '2026-04-01', isCompleted: false, completedAt: null, overrideReason: null, hasEntry: true }
          ]
        }
      })
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

    if (url.includes('/api/logbooks/summary') && method === 'GET') {
      const submitted = MOCK_LOGBOOKS.filter(entry => entry.statusLabel === 'Submitted').length
      const late = MOCK_LOGBOOKS.filter(entry => entry.statusLabel === 'Late').length
      return route.fulfill({ json: { total: MOCK_LOGBOOKS.length, submitted, late, pending: MOCK_LOGBOOKS.length - submitted - late } })
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

    if (url.includes('/api/checklists') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          semesterId: 1,
          templates: [
            { id: 1, title: 'Upload Resume', description: 'Upload your latest resume', display_order: 1, required: true, phase: 'before', due_date: '2026-03-01', semester_id: 1 },
            { id: 2, title: 'Submit Insurance Form', description: null, display_order: 2, required: true, phase: 'during', due_date: '2026-04-01', semester_id: 1 }
          ],
          semesters: [
            { id: 1, name: 'Jan-Jun 2026', is_active: true, start_date: '2026-01-15' },
            { id: 2, name: 'Jul-Dec 2025', is_active: false, start_date: '2025-07-01' }
          ]
        })
      })
    }

    if (url.includes('/api/faqs') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ faqs: [], categories: [] }) })
    }

    if (url.includes('/api/notifications') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }

    if (url.includes('/api/alerts') && method === 'GET') {
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
