import type { StudentManagement } from '../../app/types/student-management'

export const managementFixture = (): StudentManagement => ({
  semesterId: 1,
  capabilities: { editContact: true, correctRecords: true, reviewLogbooks: true },
  semesters: [{ id: 1, name: 'Jan-Jun 2026', is_active: true }, { id: 2, name: 'Jul-Dec 2025', is_active: false }],
  phoneNumber: '+60 12-345 6789',
  logbooks: [{ id: 1, week_number: 1, week_end_date: '2026-07-07', is_submitted: true }, { id: 2, week_number: 2, week_end_date: '2026-07-14', is_submitted: true }, { id: 3, week_number: 3, week_end_date: '2026-07-21', is_submitted: false }],
  reviews: [], history: []
})
