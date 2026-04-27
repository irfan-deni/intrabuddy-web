# INTRA Buddy

INTRA Buddy is an enterprise-grade university web application designed to streamline and manage student industrial training (INTRA) placements, track logbook submissions, and facilitate cohort communications.

## 🚀 Features

- **Dashboard & Analytics**: Real-time statistical overview of the cohort including placement trends and KPI metrics.
- **Student Directory & Profile Management**: Coordinators can manage student records, while students can track their placement lifecycle ('preparing', 'searching', 'placed', 'completed').
- **Pre-Internship Tracking**: Track pre-internship checklists (resume, university forms) and student application statuses.
- **Logbook Compliance**: Monitor weekly logbook submissions for placed students (pending, submitted, overdue).
- **Cohort Communication**: Target broadcast notifications to specific user segments (e.g., all students, unplaced students).
- **Knowledge Base (FAQ)**: Maintain an updatable FAQ base that supports vector embeddings (`pgvector`) for future AI chatbot integrations.

## 🛠 Tech Stack

- **Frontend Framework**: [Nuxt 3](https://nuxt.com/) (using the `app/` directory structure)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [PrimeVue](https://primevue.org/) (Configured in headless mode using Tailwind for styling)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)

## 💻 Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and ensure your Supabase credentials are set:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

3. **Apply Database Setup SQL (Supabase SQL Editor):**
   - Apply `docs/core-database-setup.sql` first (core tables + RLS + auth trigger).
   - Apply `docs/mobile-notifications-setup.sql` next if you want mobile notification APIs.

4. **(Optional) Seed Demo Coordinator Auth User:**
   Ensure the Auth user `coordinator@intrabuddy.local` exists in Supabase Auth.
   The core SQL script will upsert a matching coordinator profile in `public.users`.

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 🔑 Demo Credentials

To access the coordinator dashboard during local development, you can use the hardcoded demo credentials:
- **Email:** `coordinator@intrabuddy.local`
- **Password:** `IntraBuddy123!`

## 🏗 Documentation

For detailed system architecture, database schema, and functional requirements, please refer to the documentation in the [`docs/`](./docs) folder:
- [Architecture & Schema](./docs/ARCHITECTURE.md)
- [Software Requirements Specification](./docs/REQUIREMENTS.md)
- [AI Rules & Context](./docs/ai-rules.md)

---
*Built for modern university internship management.*
