# Software Requirements Specification (SRS)
**Project Name:** INTRA Buddy
**Version:** 1.0.0
**Description:** A centralized platform to streamline and manage university industrial training (INTRA) placements, logbook submissions, and cohort communications.

---

## 1. User Roles
The system operates on a role-based access control (RBAC) model with two primary personas:

1. **Coordinator (Admin)**
   - University staff members responsible for overseeing the entire internship cohort.
   - Needs high-level overviews, data manipulation capabilities, and communication tools.
2. **Student (End User)**
   - University students undergoing their internship lifecycle.
   - Needs to track their checklist, update their placement status, and submit weekly logbooks.

---

## 2. Functional Requirements (Scope of Work)

### Epic 1: Dashboard & Analytics
- **REQ-1.1:** The system shall display a real-time statistical overview of the cohort.
- **REQ-1.2:** The dashboard must track KPI metrics: Total Students, Placed, Searching, and Action Required (Preparing).
- **REQ-1.3:** The system shall display visual charts indicating placement trends (Future Phase).

### Epic 2: Student Directory & Profile Management
- **REQ-2.1:** Coordinators shall be able to view a master list of all active students.
- **REQ-2.2:** The directory must support text search (by name or ID) and filtering by `internship_status`.
- **REQ-2.3:** Coordinators shall have the ability to explicitly Add, Edit, and Soft-Delete student records.
- **REQ-2.4:** Student profiles must track their current phase: 'preparing', 'searching', 'placed', or 'completed'.

### Epic 3: Pre-Internship & Application Tracking
- **REQ-3.1:** The system shall track a 1-to-1 pre-internship checklist for each student (e.g., resume uploaded, forms completed).
- **REQ-3.2:** Students can maintain a list of their internship applications, tracking company names and statuses ('pending', 'interviewing', 'rejected', 'offer_accepted').

### Epic 4: Logbook Compliance
- **REQ-4.1:** The system shall track weekly logbook submissions for placed students.
- **REQ-4.2:** Coordinators must be able to view which students are 'pending', 'submitted', or 'overdue' for any given week.

### Epic 5: Communication & Knowledge Base
- **REQ-5.1:** Coordinators shall be able to create Broadcast Notifications targeted at specific user segments (e.g., 'all_students', 'unplaced_students').
- **REQ-5.2:** The system must maintain an updatable Knowledge Base (FAQs).
- **REQ-5.3:** FAQ records must support vector embeddings (`pgvector`) to feed the future mobile AI chatbot.

---

## 3. Non-Functional Requirements

### 3.1 Technology Stack & Constraints
- **Frontend Web:** Nuxt 3 (Vue.js) using the `app/` directory structure.
- **Styling:** Tailwind CSS (exclusively) with headless PrimeVue for complex accessible components.
- **Backend/Database:** Supabase (PostgreSQL).
- **Mobile Backend:** The database must be structured to eventually serve as a backend for a Flutter mobile application.

### 3.2 Security & Data Integrity
- **Authentication:** Handled via Supabase Auth (Email/Password or OAuth).
- **Authorization:** Row Level Security (RLS) must be enforced in the database so students cannot read or edit other students' data.
- **Data Retention:** The system must utilize "Soft Deletes" (`is_active = false`) for user records to preserve historical cohort data for university auditing.

### 3.3 Performance
- Data grids and lists must handle cohorts of up to 500 students without UI freezing.
- Client-side data fetching should utilize proper loading states and error handling.