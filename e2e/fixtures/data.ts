export const MOCK_USER = {
  id: 'user-1',
  email: 'coordinator@intrabuddy.my',
  user_metadata: { email: 'coordinator@intrabuddy.my' },
  aud: 'authenticated',
  role: 'authenticated',
}

export const MOCK_PROFILE = {
  id: 'user-1',
  email: 'coordinator@intrabuddy.my',
  full_name: 'Test Coordinator',
  role: 'coordinator',
  student_id: null,
  phone_number: '+60 12-345 6789',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
}

export const MOCK_STUDENTS = [
  {
    id: 'student-1',
    full_name: 'Alice Johnson',
    student_id: 'MATRIC001',
    email: 'alice@university.edu',
    placementStatus: 'Accepted',
    completionPercent: 85,
    documentCount: 3,
  },
  {
    id: 'student-2',
    full_name: 'Bob Smith',
    student_id: 'MATRIC002',
    email: 'bob@university.edu',
    placementStatus: 'Searching',
    completionPercent: 45,
    documentCount: 1,
  },
  {
    id: 'student-3',
    full_name: 'Charlie Brown',
    student_id: 'MATRIC003',
    email: 'charlie@university.edu',
    placementStatus: 'Pending',
    completionPercent: 60,
    documentCount: 2,
  },
]

export const MOCK_DASHBOARD = {
  cohortName: 'Jan-Jun 2026',
  totalStudents: 50,
  placedStudents: 30,
  unplacedStudents: 20,
  placementPercentage: 60,
}

export const MOCK_LOGBOOKS = [
  {
    id: 1,
    studentName: 'Alice Johnson',
    studentMatric: 'MATRIC001',
    weekNumber: 6,
    weekEndDate: '2026-05-15',
    isSubmitted: true,
    submittedAt: '2026-05-14T10:00:00Z',
    statusLabel: 'Submitted',
    isStale: false,
    reminderSent: false,
  },
  {
    id: 2,
    studentName: 'Bob Smith',
    studentMatric: 'MATRIC002',
    weekNumber: 6,
    weekEndDate: '2026-05-15',
    isSubmitted: false,
    submittedAt: null,
    statusLabel: 'Not Submitted',
    isStale: false,
    reminderSent: false,
  },
]

export const MOCK_COHORTS = [
  {
    id: 1,
    name: 'Jan-Jun 2026',
    start_date: '2026-01-15',
    end_date: '2026-06-30',
    is_active: true,
    created_at: '2025-12-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jul-Dec 2025',
    start_date: '2025-07-01',
    end_date: '2025-12-31',
    is_active: false,
    created_at: '2025-06-01T00:00:00Z',
  },
]

export const MOCK_APPLICATIONS = [
  {
    id: 1,
    student_id: 'student-1',
    company_name: 'Tech Corp',
    position: 'Software Engineer Intern',
    status: 'Accepted',
    application_date: '2026-03-15',
    override_reason: null,
    updated_by_admin: null,
    updated_at: '2026-03-20T00:00:00Z',
  },
  {
    id: 2,
    student_id: 'student-2',
    company_name: 'Startup Inc',
    position: 'Frontend Developer Intern',
    status: 'Pending',
    application_date: '2026-04-01',
    override_reason: null,
    updated_by_admin: null,
    updated_at: '2026-04-01T00:00:00Z',
  },
]

export const MOCK_CHECKLISTS = [
  { id: 1, title: 'Upload Resume', is_completed: true },
  { id: 2, title: 'Submit Insurance Form', is_completed: false },
  { id: 3, title: 'Complete Orientation', is_completed: true },
]

export const MOCK_WALLET_ITEMS = [
  { id: 1, item_name: 'Resume.pdf', uploaded_at: '2026-03-10T00:00:00Z' },
  { id: 2, item_name: 'Cover Letter.pdf', uploaded_at: '2026-03-12T00:00:00Z' },
]

export const MOCK_LOGBOOK_TRACKING = [
  { id: 1, student_id: 'student-1', week_number: 1, week_end_date: '2026-04-07', is_submitted: true },
  { id: 2, student_id: 'student-1', week_number: 2, week_end_date: '2026-04-14', is_submitted: true },
  { id: 3, student_id: 'student-1', week_number: 3, week_end_date: '2026-04-21', is_submitted: false },
]

export const MOCK_BROADCASTS = [
  { id: 1, title: 'Mandatory Briefing', body: 'All students must attend the industry briefing on Friday.', target_roles: ['student'], sent_at: '2026-05-01T08:00:00Z' },
]

export const MOCK_COORDINATORS = [
  { id: 'coord-1', full_name: 'Test Coordinator', email: 'coordinator@intrabuddy.my', created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_FAQS = [
  { id: 1, category_id: 1, question: 'How do I apply for internship?', answer: 'Submit your application through the portal.', keywords: ['application', 'internship'], updated_at: '2026-04-01T00:00:00Z' },
]

export const MOCK_FAQ_CATEGORIES = [
  { id: 1, name: 'General', description: 'General questions', display_order: 1 },
]

export const MOCK_CHECKLIST_TEMPLATES = [
  { id: 1, title: 'Upload Resume', description: 'Upload your latest resume', display_order: 1, required: true, cohort_id: 1 },
  { id: 2, title: 'Submit Insurance Form', description: null, display_order: 2, required: true, cohort_id: 1 },
]

export const MOCK_NOTIFICATIONS = [
  { id: 1, recipient_id: 'student-1', title: 'Reminder', body: 'Please submit your logbook.', type: 'general', is_read: false, created_at: '2026-05-10T00:00:00Z' },
]

export const MOCK_CHATBOT_CONVERSATIONS = [
  { id: 1, student_id: 'student-1', question: 'When is the deadline?', answer: 'The deadline is June 30th.', matched_faq_id: null, created_at: '2026-05-05T00:00:00Z' },
]
