export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'student' | 'coordinator'
          full_name: string
          student_id: string | null
          internship_status: 'preparing' | 'searching' | 'placed' | 'completed'
          is_active: boolean
          deleted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          role: 'student' | 'coordinator'
          full_name: string
          student_id?: string | null
          internship_status?: 'preparing' | 'searching' | 'placed' | 'completed'
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string | null
        }
        Update: {
          role?: 'student' | 'coordinator'
          full_name?: string
          student_id?: string | null
          internship_status?: 'preparing' | 'searching' | 'placed' | 'completed'
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      pre_internship_checklists: {
        Row: {
          id: string
          student_id: string
          resume_uploaded: boolean
          university_forms_completed: boolean
          is_ready_to_apply: boolean
        }
        Insert: {
          id?: string
          student_id: string
          resume_uploaded?: boolean
          university_forms_completed?: boolean
          is_ready_to_apply?: boolean
        }
        Update: {
          student_id?: string
          resume_uploaded?: boolean
          university_forms_completed?: boolean
          is_ready_to_apply?: boolean
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          id: string
          student_id: string
          company_name: string
          status: 'pending' | 'interviewing' | 'rejected' | 'offer_accepted'
          offer_letter_url: string | null
        }
        Insert: {
          id?: string
          student_id: string
          company_name: string
          status?: 'pending' | 'interviewing' | 'rejected' | 'offer_accepted'
          offer_letter_url?: string | null
        }
        Update: {
          student_id?: string
          company_name?: string
          status?: 'pending' | 'interviewing' | 'rejected' | 'offer_accepted'
          offer_letter_url?: string | null
        }
        Relationships: []
      }
      logbook_compliance: {
        Row: {
          id: string
          student_id: string
          week_number: number
          submission_status: 'pending' | 'submitted' | 'overdue'
          self_reported_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          week_number: number
          submission_status?: 'pending' | 'submitted' | 'overdue'
          self_reported_at?: string | null
        }
        Update: {
          student_id?: string
          week_number?: number
          submission_status?: 'pending' | 'submitted' | 'overdue'
          self_reported_at?: string | null
        }
        Relationships: []
      }
      broadcast_notifications: {
        Row: {
          id: string
          title: string
          message: string
          target_audience: 'all_students' | 'unplaced_students'
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          message: string
          target_audience: 'all_students' | 'unplaced_students'
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          title?: string
          message?: string
          target_audience?: 'all_students' | 'unplaced_students'
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          last_updated_by: string | null
          updated_at: string | null
          embedding: string | null
        }
        Insert: {
          id?: string
          question: string
          answer: string
          last_updated_by?: string | null
          updated_at?: string | null
          embedding?: string | null
        }
        Update: {
          question?: string
          answer?: string
          last_updated_by?: string | null
          updated_at?: string | null
          embedding?: string | null
        }
        Relationships: []
      }
      mobile_device_tokens: {
        Row: {
          id: string
          user_id: string
          device_token: string
          platform: 'android' | 'ios' | 'web'
          app_version: string | null
          is_active: boolean
          last_seen_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_token: string
          platform: 'android' | 'ios' | 'web'
          app_version?: string | null
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          device_token?: string
          platform?: 'android' | 'ios' | 'web'
          app_version?: string | null
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
        }
        Relationships: []
      }
      mobile_notification_outbox: {
        Row: {
          id: string
          broadcast_id: string | null
          user_id: string
          channel: 'mobile_push'
          status: 'queued' | 'sent' | 'failed'
          payload: Json
          queued_at: string
          delivered_at: string | null
          failure_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          broadcast_id?: string | null
          user_id: string
          channel?: 'mobile_push'
          status?: 'queued' | 'sent' | 'failed'
          payload: Json
          queued_at?: string
          delivered_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
        Update: {
          broadcast_id?: string | null
          user_id?: string
          channel?: 'mobile_push'
          status?: 'queued' | 'sent' | 'failed'
          payload?: Json
          queued_at?: string
          delivered_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
