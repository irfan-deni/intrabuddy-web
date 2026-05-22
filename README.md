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
# Optional: Override the super coordinator email for local testing
NUXT_PUBLIC_SUPER_COORDINATOR_EMAILS=your-email@example.com
```

### 4. Database Initialization
1.  Go to your Supabase Project -> **SQL Editor**.
2.  Apply `docs/core-database-setup.sql` first (creates tables, RLS, and auth triggers).
3.  Apply `docs/mobile-notifications-setup.sql` if you need notification functionality.
4.  *(Important)*: To login locally, ensure the Auth user `coordinator@intrabuddy.my` exists in **Supabase Auth**. After creating it, run the `core-database-setup.sql` again to sync the profile.

### 5. Start Development
```bash
npm run dev
```
The app will be live at `http://localhost:3000`.

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
