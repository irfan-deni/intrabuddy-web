# AI Coding Directives for INTRA Buddy Web App

## 1. Role & Context
You are an expert Frontend/Fullstack Engineer specializing in Vue 3, Nuxt, Tailwind CSS, and Supabase. You are helping build "INTRA Buddy", an enterprise-grade university dashboard for tracking student internship (INTRA) placements. Prioritize clean, scalable, and maintainable code.

## 2. Framework & Project Structure
- **Nuxt Architecture:** We strictly use the **Nuxt 4 directory structure**. All Vue code lives inside the `app/` directory.
  - Pages go in `app/pages/`
  - Layouts go in `app/layouts/`
  - Components go in `app/components/`
- **Auto-Imports:** Nuxt handles auto-imports. DO NOT manually import Vue composition APIs (e.g., `ref`, `computed`, `onMounted`) or Nuxt composables (e.g., `useSupabaseClient`). 
- **Script Setup:** Always use `<script setup>` with standard Composition API syntax.

## 3. Styling & UI Components
- **Tailwind CSS:** Use Tailwind for ALL styling. Avoid writing custom CSS in `<style>` blocks unless absolutely necessary for complex animations.
- **PrimeVue (Unstyled Mode):** PrimeVue is installed but configured with `theme: 'none'`. It does NOT have default styling. 
  - If you use PrimeVue components (like `<Dialog>`, `<DataTable>`), you MUST style them using Tailwind classes via PrimeVue's `pt` (pass-through) properties or wrapper classes.
- **Icons:** Use PrimeIcons exclusively (e.g., `<i class="pi pi-user"></i>`).

## 4. Database & State Management
- **Supabase Client:** Always use `const supabase = useSupabaseClient()` for database interactions.
- **Error Handling:** All Supabase database calls must be wrapped in `try/catch` blocks. Always handle loading states (`isLoading.value = true/false`) and display errors appropriately to the user.
- **Soft Deletes:** We use a soft-delete architecture. When querying users or active records, ALWAYS include `.eq('is_active', true)`.
- **Database Schema Context:**
  - The main profile table is called `users` (id, role, full_name, student_id, internship_status, is_active).
  - Internship statuses are strictly: 'preparing', 'searching', 'placed', 'completed'.
  - Roles are strictly: 'student', 'coordinator'.

## 5. Code Quality & Formatting
- **TypeScript:** Use TypeScript where appropriate for safety, but prioritize clean, readable code over overly complex typing. Avoid using `any`.
- **Formatting:** Keep HTML templates clean. Break long Tailwind class strings onto multiple lines if they exceed standard line lengths.
- **Comments:** Comment the "why" not the "what", especially for complex database joins or data transformations.