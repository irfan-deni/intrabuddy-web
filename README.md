# INTRA Buddy

INTRA Buddy is an enterprise-grade university web application designed to streamline and manage student industrial training (INTRA) placements, track logbook submissions, and facilitate semester communications.

## 🚀 Features

- **Dashboard & Analytics**: Real-time statistical overview of the semester including placement trends and KPI metrics.
- **Student Directory & Profile Management**: Coordinators can manage student records, while students can track their placement lifecycle ('preparing', 'searching', 'placed', 'completed').
- **Pre-Internship Tracking**: Track pre-internship checklists (resume, university forms) and student application statuses.
- **Logbook Compliance**: Monitor weekly logbook submissions for placed students (pending, submitted, overdue).
- **Semester Communication**: Target broadcast notifications to specific user segments (e.g., all students, unplaced students).
- **Knowledge Base (FAQ)**: Maintain an updatable FAQ base that supports vector embeddings (`pgvector`) for future AI chatbot integrations.

### Announcement images

- The composer keeps message text separate from local image previews. Up to three
  PNG, JPEG, GIF, or WebP images (5 MB each) upload only when Send is pressed.
  Removing an attachment or leaving an unsent draft does not upload anything.
- `/api/broadcasts` accepts multipart fields `title`, `body`, `target_roles`
  (a JSON array), and repeated `images` files. Legacy JSON text requests remain
  supported. The server checks size, MIME type, and image signatures before upload.
- Storage uses the existing public `broadcast-media` bucket and
  `broadcast-images/` prefix. Images are public; do not attach confidential files.
  New broadcasts store object paths in `broadcast_messages.image_paths` and plain
  text in `body`. The web UI also supports legacy image tags in older bodies,
  displays only trusted project images, and never renders raw HTML.
- Failed sends preserve the open draft. New uploads are cleaned up after upload
  failure or a confirmed database rollback. Uncertain save results retain images
  to avoid breaking an announcement that may already have been saved. Check
  history before retrying; manual retries are not guaranteed exactly-once delivery.
  Failed cleanup and uncertain saves can leave unused files; there is no automatic
  orphan sweeper. Deleting an announcement attempts to remove its recorded image
  paths; cleanup failures can leave unused files. Legacy embedded images are not removed.
- Drafts are not persisted across reloads. Apply the `broadcast_image_paths`
  database migration before deploying this version.

## 🛠 Tech Stack

- **Frontend Framework**: [Nuxt 4](https://nuxt.com/) (using the `app/` directory structure)
- **State Management & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [PrimeVue](https://primevue.org/) (Configured in Tailwind-first mode)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit/Component) & [Playwright](https://playwright.dev/) (E2E)

## 💻 Setup & Installation

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
- **Node.js**: Version `22.11.0` (LTS) or higher is recommended.
- **Git**: To clone the repository.
- **Supabase Account**: A free project on [Supabase](https://supabase.com/).

### 2. Environment Setup
Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd intrabuddy-web
npm install
```

> **Windows Users**: If you encounter issues during `npm install` (especially with `sharp` or build tools), we highly recommend using **WSL2 (Windows Subsystem for Linux)** with a Linux distribution like Ubuntu. It provides a more stable environment for Nuxt/Nitro development.

### 3. Configuration
Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
# Server-only credentials for authorized administrative APIs
NUXT_SUPABASE_SECRET_KEY=your_supabase_secret_or_service_role_key
# Optional: comma-separated coordinator Auth emails with administrative privileges
NUXT_SUPER_COORDINATOR_EMAILS=your-email@example.com
```

### 4. Database Initialization
1.  Go to your Supabase Project -> **SQL Editor**.
2.  Apply `docs/core-database-setup.sql` first (creates tables, RLS, and auth triggers).
3.  Apply `docs/mobile-notifications-setup.sql` if you need notification functionality.
4.  *(Important)*: To login locally, ensure the Auth user `coordinator@intrabuddy.my` exists in **Supabase Auth**. After creating it, run the `core-database-setup.sql` again to sync the profile.

### 5. Start Development
Apply `supabase/migrations/20261022132151_coordinator_dashboard_summary.sql` to
the existing INTRA Buddy schema before starting this version. It adds the
coordinator-only `get_coordinator_dashboard()` RPC used by `/api/dashboard`.
The function uses invoker permissions and preserves table RLS policies.

Also apply `supabase/migrations/20261104090000_checklist_phase_due_date.sql`
so the Submission Requirements editor can persist each template's `phase` and
`due_date`; without it those two fields are ignored when saving.

The Submission Requirements page (`/checklists`) can now:
- switch between semesters and manage each semester's template;
- search/filter templates, duplicate them, toggle required inline, and bulk delete;
- edit phase and due date;
- open **Student Progress**, pick a student, and (as a Super Coordinator) mark or
  revert requirements with a required audit reason.

The Semester Management page (`/semesters`) shows student, requirement, logbook,
and application counts for every semester. Active semesters cannot be deleted,
and semesters with historical records are blocked from deletion so their data is
preserved; the confirmation dialog explains the reason and warns when checklist
templates will be removed with an otherwise empty semester.

```bash
npm run dev
```
The app will be live at `http://localhost:3000`.

The web portal is coordinator-only; students use the mobile app. The old
`NUXT_PUBLIC_SUPER_COORDINATOR_EMAILS` variable is no longer used. Configure
`NUXT_SUPER_COORDINATOR_EMAILS` on the server instead; the browser receives only
the current coordinator's capability flag, never the email allowlist.

### Student management

Before enabling student management, review and apply
`supabase/migrations/20261027023346_coordinator_student_management.sql` and
`supabase/migrations/20261030050243_super_coordinator_student_management.sql` to the
existing INTRA Buddy schema **together with this app version**. Back up the
database and test student-mobile workflows in staging first. No remote migration
is applied automatically by the app or test commands.

- All coordinators can view students. Only Super Coordinators can correct student
  profiles, checklist completion, application statuses, and submitted-logbook
  reviews. Regular coordinators have read-only access to these records.
- No student-to-coordinator assignment is needed. Existing assignment rows are
  preserved for historical purposes but are not used for access control.
- All these changes require a reason/feedback and append immutable audit history
  in the same transaction. Logbook review outcomes never change submission state.
- Historical applications receive a semester only when the enrollment is
  unambiguous. Super Coordinators can also correct ambiguous legacy records.
  New applications from older clients inherit their one active enrollment.
- Direct coordinator writes to protected student records, semesters, enrollment,
  and checklist templates are blocked. Super Coordinator configuration writes
  now go through `/api/administration/configuration`, not browser database writes.
  Student own-record operations remain available, with identity and administrative
  audit fields protected by column grants. Check any external clients that write
  identity fields or include administrative columns in generic upserts.
- The server service-role key is required for the service-only mutation RPCs.
  Never expose it to the browser. Neither the client nor authenticated SQL callers
  can submit a trusted actor ID or grant themselves Super Coordinator access.
- Without both migrations, management mutations fail closed. Apply migrations
  before deploying the matching app changes. Knowledge-base approvals and
  enrollment approvals are deferred.

Dashboard, Students, and Logbooks reuse session-local data for 10 seconds.
Snapshots up to 30 seconds old can render while a new request runs. Use each
page's **Refresh** button to bypass the fresh-data window. Relevant edits and
logout invalidate the cache; cached data is not persisted to browser storage.

### Testing

Interface surfaces and corner radii are defined in `tailwind.config.ts`: use
`bg-surface`/`rounded-card` for cards, `bg-surface-muted`/`rounded-control` for
inputs, `rounded-dialog` for scrollable modal panels, and `rounded-badge` for
status labels. Use `text-text-muted` for readable secondary text and
`border-surface-control` for input boundaries. Page roots use `app-surface-ui`
for keyboard-focus and placeholder styling. Keep full-height navigation square
and preserve circular charts and pill-shaped counters.

- `npm test`: isolated unit and API authorization tests; does not load `.env` or run database CRUD.
- `npm run test:permissions:db`: applies both management migrations to a dedicated,
  disposable `postgres:17` Docker container and verifies Super Coordinator-only
  mutations, direct database restrictions, review separation, and audit rollback. It
  never connects to the linked project or another existing local database.
- `npm run test:e2e`: Chromium UI tests with mocked APIs and a dummy Supabase project, on port 3100.
- `npm run test:integration`: opt-in legacy CRUD suite for a disposable **local** INTRA Buddy database.
  Explicitly supply `RUN_SUPABASE_INTEGRATION=1`, `SUPABASE_URL`, `SUPABASE_KEY`, and
  `SUPABASE_SERVICE_KEY`. Remote URLs are rejected. The INTRA schema must already exist locally.

### 🐳 Using Docker
If you prefer to run the app in a container (especially useful on Windows to avoid local dependency issues):

1. **Build and Run**:
   ```bash
   docker-compose up --build
   ```
2. **Access the App**: The application will be available at `http://localhost:3000`.
3. **Note**: Ensure your `.env` file is populated with Supabase credentials as Docker will use them during the build/run process.

## 🪟 Windows Troubleshooting

If you prefer **Native Windows** (PowerShell/CMD) over WSL2, please ensure:
- **Build Tools**: You have installed the [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (required for native modules like `sharp`).
- **Node Version Management**: Use `nvm-windows` to manage Node versions easily.
- **Execution Policy**: If scripts fail to run, try `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell.

## 🔑 Demo Credentials

To access the coordinator dashboard during local development, use:
- **Email:** `coordinator@intrabuddy.my`
- **Password:** `IntraBuddy123!`

Important setup note:
- This account must exist in **Supabase Auth** first. If it does not exist, login will fail with `Invalid login credentials`.
- After creating the Auth user, run `docs/core-database-setup.sql` again once to ensure the `public.users` profile row is present and assigned as `coordinator`.

## 🏗 Documentation

For detailed system architecture, database schema, and functional requirements, please refer to the documentation in the [`docs/`](./docs) folder:
- [Architecture & Schema](./docs/ARCHITECTURE.md)
- [Software Requirements Specification](./docs/REQUIREMENTS.md)
- [AI Rules & Context](./docs/ai-rules.md)

---
*Built for modern university internship management.*

## 🎨 Branding Assets

Place the provided logo PNG at `public/icons/logo.png` (source PNG). To generate the common icon sizes and a favicon, run:

```bash
# install dev deps if needed
npm install
npm run generate:icons
```

The generated icons will be written to `public/icons/icon-<size>.png` and `public/favicon.ico`. The app already references these files in `nuxt.config.ts`.
