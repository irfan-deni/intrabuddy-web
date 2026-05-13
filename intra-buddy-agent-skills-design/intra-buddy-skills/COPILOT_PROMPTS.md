# INTRA Buddy — Copilot Prompt Cheat Sheet
# Use these in VS Code Copilot Agent mode

# ══════════════════════════════════════════════════════
# BRANDING PROMPTS
# ══════════════════════════════════════════════════════

# Apply branding to the whole layout
Build the root layout for INTRA Buddy Web Dashboard. Use the brand design
system: navy sidebar (#0A1628), blue-to-teal gradient (#1E4FD8 → #00C2CB),
light gray page background (#F4F6FB). Sidebar shows logo + "INTRA Buddy"
two-tone wordmark + tagline "Guide · Support · Grow". Active nav link uses
the brand gradient. 6 nav items matching the use cases.

# ──────────────────────────────────────────────────────

# Login page with branding
Build the Login page for the INTRA Buddy coordinator portal. Center the
logo, show "INTRA" in navy and "Buddy" in teal (#00C2CB), tagline
"Guide · Support · Grow", subtitle "Coordinator Portal · UniKL MIIT".
Use Supabase auth. Validate empty fields. Deny if role is not 'coordinator'.

# ──────────────────────────────────────────────────────

# Cohort Progress Overview with branded stat cards
Build the Cohort Progress Overview page. Show 4 stat cards: total students
(gradient accent card), placed, unplaced, placement %. Use the branded
StatCard with gradient for the main metric. Fetch from Supabase active cohort.

# ──────────────────────────────────────────────────────

# Student Directory with brand table
Build the Student Directory page. Show a white rounded table with brand
primary button "View Milestones". Search by name, filter by placement status.
Per row: name, student ID, checklist % (progress bar with teal fill), latest
application status (StatusBadge), document count.

# ──────────────────────────────────────────────────────

# Broadcast page with gradient Send button
Build the Broadcast Notifications & Alerts page. Form with title, message
body, target selector (All Students / Unplaced Students). Send button uses
the brand gradient (from-[#1E4FD8] to-[#00C2CB]). Validate before insert.
Show confirmation after successful broadcast.

# ──────────────────────────────────────────────────────

# Knowledge Base CRUD page
Build the Manage Knowledge Base page. List FAQs grouped by category.
Add/Edit/Delete FAQ entries. Brand gradient for the "Add FAQ" button.
Validate question and answer not empty. Toggle is_published.

# ──────────────────────────────────────────────────────

# Logbook Review with stale data warning
Build the Review Weekly Logbook Status page. Table: name, week number,
week end date, status badge (Submitted/Late/Not Submitted, derived not stored).
Filter by status. Show yellow stale data warning banner if any updated_at
is older than 24 hours.

# ══════════════════════════════════════════════════════
# COMPONENT PROMPTS
# ══════════════════════════════════════════════════════

# Sidebar only
Build the sidebar navigation component for INTRA Buddy. Navy background
(#0A1628), logo image + two-tone wordmark, tagline, 6 nav links with icons,
active state uses brand gradient pill, inactive uses white/40 text.

# Progress bar (teal fill)
Create a ProgressBar component where the fill uses the teal brand color
(#00C2CB) instead of blue. Used for checklist completion %.

# StatusBadge
Create a StatusBadge component covering: Placed (green), Unplaced (red),
Accepted (green), Interview (blue), Pending (yellow), Rejected (red),
Submitted (green), Late (red), Not Submitted (gray).

# ══════════════════════════════════════════════════════
# QUICK FIX PROMPTS
# ══════════════════════════════════════════════════════

# Apply brand colors to existing component
Update this component to use INTRA Buddy brand colors: navy #0A1628,
blue #1E4FD8, teal #00C2CB. Buttons should use the gradient from-[#1E4FD8]
to-[#00C2CB]. Headings in navy. Accent text in teal.

# Make sure Tailwind config has brand colors
Update tailwind.config.ts to add the INTRA Buddy brand color palette:
navy #0A1628, blue #1E4FD8, teal #00C2CB, mid #1A73E8, bg #F4F6FB.
