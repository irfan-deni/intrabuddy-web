export type StudentCapabilities = {
  editContact: boolean
  correctRecords: boolean
  reviewLogbooks: boolean
}

export type StudentManagement = {
  semesterId: number | null
  capabilities: StudentCapabilities
  semesters: Array<{ id: number; name: string; is_active: boolean | null }>
  phoneNumber: string | null
  logbooks: Array<{ id: number; week_number: number; week_end_date: string; is_submitted: boolean | null }>
  reviews: Array<{ logbook_id: number; status: string; feedback: string; reviewed_at: string }>
  history: Array<{ id: number; actor_id: string; action: string; target_id: string; reason: string; before_value: unknown; after_value: unknown; created_at: string }>
}
