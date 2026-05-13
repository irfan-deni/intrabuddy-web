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
          email: string | null
          full_name: string
          student_id: string | null
          phone_number: string | null
          role: 'student' | 'coordinator'
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name: string
          student_id?: string | null
          phone_number?: string | null
          role: 'student' | 'coordinator'
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string
          student_id?: string | null
          phone_number?: string | null
          role?: 'student' | 'coordinator'
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cohorts: {
        Row: {
          id: number
          name: string
          start_date: string
          end_date: string
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          start_date: string
          end_date: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      student_cohorts: {
        Row: {
          id: number
          student_id: string | null
          cohort_id: number | null
          enrolled_at: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          cohort_id?: number | null
          enrolled_at?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          cohort_id?: number | null
          enrolled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_cohorts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cohorts_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          }
        ]
      }
      checklist_templates: {
        Row: {
          id: number
          title: string
          description: string | null
          due_offset_days: number | null
          required: boolean | null
          display_order: number | null
          cohort_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          due_offset_days?: number | null
          required?: boolean | null
          display_order?: number | null
          cohort_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          due_offset_days?: number | null
          required?: boolean | null
          display_order?: number | null
          cohort_id?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          }
        ]
      }
      student_checklists: {
        Row: {
          id: number
          student_id: string | null
          checklist_item_id: number | null
          is_completed: boolean | null
          completed_at: string | null
          due_date: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          checklist_item_id?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          due_date?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          checklist_item_id?: number | null
          is_completed?: boolean | null
          completed_at?: string | null
          due_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_checklists_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_checklists_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      job_applications: {
        Row: {
          id: number
          student_id: string | null
          company_name: string
          position: string | null
          application_date: string | null
          status: 'Pending' | 'Interview' | 'Accepted' | 'Rejected' | 'Offer Declined' | string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          company_name: string
          position?: string | null
          application_date?: string | null
          status?: 'Pending' | 'Interview' | 'Accepted' | 'Rejected' | 'Offer Declined' | string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          company_name?: string
          position?: string | null
          application_date?: string | null
          status?: 'Pending' | 'Interview' | 'Accepted' | 'Rejected' | 'Offer Declined' | string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      digital_wallet_items: {
        Row: {
          id: number
          student_id: string | null
          item_name: string
          file_path: string
          file_type: string | null
          uploaded_at: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          item_name: string
          file_path: string
          file_type?: string | null
          uploaded_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          item_name?: string
          file_path?: string
          file_type?: string | null
          uploaded_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_wallet_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      broadcast_messages: {
        Row: {
          id: number
          coordinator_id: string | null
          title: string | null
          body: string | null
          target_roles: string[] | null
          sent_at: string | null
        }
        Insert: {
          id?: number
          coordinator_id?: string | null
          title?: string | null
          body?: string | null
          target_roles?: string[] | null
          sent_at?: string | null
        }
        Update: {
          id?: number
          coordinator_id?: string | null
          title?: string | null
          body?: string | null
          target_roles?: string[] | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_messages_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: number
          recipient_id: string | null
          title: string
          body: string
          type: string | null
          is_read: boolean | null
          created_at: string | null
          scheduled_for: string | null
        }
        Insert: {
          id?: number
          recipient_id?: string | null
          title: string
          body: string
          type?: string | null
          is_read?: boolean | null
          created_at?: string | null
          scheduled_for?: string | null
        }
        Update: {
          id?: number
          recipient_id?: string | null
          title?: string
          body?: string
          type?: string | null
          is_read?: boolean | null
          created_at?: string | null
          scheduled_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      faq_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          display_order: number | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          display_order?: number | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          display_order?: number | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          id: number
          category_id: number | null
          question: string
          answer: string
          keywords: string[] | null
          is_published: boolean | null
          created_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          category_id?: number | null
          question: string
          answer: string
          keywords?: string[] | null
          is_published?: boolean | null
          created_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          category_id?: number | null
          question?: string
          answer?: string
          keywords?: string[] | null
          is_published?: boolean | null
          created_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_logbook_tracking: {
        Row: {
          id: number
          student_id: string | null
          cohort_id: number | null
          week_number: number
          week_end_date: string
          is_submitted: boolean | null
          submitted_at: string | null
          reminder_sent: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          cohort_id?: number | null
          week_number: number
          week_end_date: string
          is_submitted?: boolean | null
          submitted_at?: string | null
          reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          cohort_id?: number | null
          week_number?: number
          week_end_date?: string
          is_submitted?: boolean | null
          submitted_at?: string | null
          reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_logbook_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_logbook_tracking_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          }
        ]
      }
      chatbot_conversations: {
        Row: {
          id: number
          student_id: string | null
          question: string | null
          answer: string | null
          matched_faq_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          student_id?: string | null
          question?: string | null
          answer?: string | null
          matched_faq_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          student_id?: string | null
          question?: string | null
          answer?: string | null
          matched_faq_id?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_conversations_matched_faq_id_fkey"
            columns: ["matched_faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
