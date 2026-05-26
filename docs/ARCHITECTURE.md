# INTRA Buddy - Architecture & Context

## 1. Project Overview
INTRA Buddy is an enterprise-grade university web application used by coordinators to track student internship (INTRA) placements, manage logbook submissions, and broadcast notifications. Eventually, it will also serve as a mobile backend with AI chatbot capabilities.

## 2. Tech Stack
- **Framework:** Nuxt 3 (Strictly using the **Nuxt 4 `app/` directory structure**)
- **Styling:** Tailwind CSS (Primary styling engine)
- **UI Components:** PrimeVue (Configured with `theme: 'none'` to allow Tailwind to completely control the styling) + PrimeIcons
- **Database & Auth:** Supabase (PostgreSQL)

## 3. Directory Structure Rules
All frontend Vue code MUST live inside the `app/` directory. Do not place pages or layouts in the root folder.
- `app/pages/` - File-based routing (e.g., `index.vue` is `/`, `students.vue` is `/students`).
- `app/layouts/` - Application shells (e.g., `default.vue` contains the master sidebar and header).
- `app/components/` - Reusable UI components.

## 4. Core Engineering Principles
1. **Unstyled PrimeVue:** Because PrimeVue is headless in this project, every PrimeVue component (DataTables, Dialogs, Buttons) MUST be manually styled using Tailwind classes via the `pt` (pass-through) prop or wrapper `<div>` tags.
2. **Client-Side Data Fetching:** Use `const supabase = useSupabaseClient()` inside `onMounted` hooks for fetching data on dashboard pages. Always handle loading (`isLoading`) and error states.
3. **Soft Deletes:** `users` and other semester records use `is_active` and are not permanently deleted in normal flows; always append `.eq('is_active', true)` when fetching live semester data. `faqs` and `internship_applications` currently use hard deletes in the web UI; align these with soft deletes if you add matching columns and policies later.

## 5. Database Schema (PostgreSQL / Supabase)
Below is the exact schema currently live in the database.

### `users` (Core Profile Hub)
- `id` (UUID, Primary Key, matches Supabase Auth)
- `role` (Text: 'student' | 'coordinator')
- `full_name` (Text)
- `student_id` (Text, Nullable)
- `internship_status` (Text: 'preparing' | 'searching' | 'placed' | 'completed')
- `is_active` (Boolean, Default: true) - *Used for soft deletes*
- `deleted_at` (Timestamptz)
- `created_at` (Timestamptz)

### `pre_internship_checklists` (1-to-1 with users)
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key -> users.id, Cascade)
- `resume_uploaded` (Boolean)
- `university_forms_completed` (Boolean)
- `is_ready_to_apply` (Boolean)

### `internship_applications` (1-to-Many with users)
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key -> users.id, Cascade)
- `company_name` (Text)
- `status` (Text: 'pending' | 'interviewing' | 'rejected' | 'offer_accepted')
- `offer_letter_url` (Text, Nullable)

### `logbook_compliance` (1-to-Many with users)
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key -> users.id, Cascade)
- `week_number` (Integer)
- `submission_status` (Text: 'pending' | 'submitted' | 'overdue')
- `self_reported_at` (Timestamptz, Nullable)

### `broadcast_notifications` (Created by coordinators)
- `id` (UUID, Primary Key)
- `title` (Text)
- `message` (Text)
- `target_audience` (Text: 'all_students' | 'unplaced_students')
- `created_by` (UUID, Foreign Key -> users.id, Set Null)
- `created_at` (Timestamptz)

### `faqs` (Knowledge Base & AI Embeddings)
- `id` (UUID, Primary Key)
- `question` (Text)
- `answer` (Text)
- `last_updated_by` (UUID, Foreign Key -> users.id, Set Null)
- `updated_at` (Timestamptz)
- `embedding` (VECTOR(1536)) - *Used for AI Chatbot RAG*