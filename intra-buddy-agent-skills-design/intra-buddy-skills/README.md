# INTRA Buddy — Agent Skills Setup Guide

## What this is
Three Agent Skill files that teach GitHub Copilot (Agent mode) everything
about your project — the use cases, database schema, query patterns, and
UI standards — so it gives you accurate, project-aware code every time.

## Folder structure to copy into your project root
```
your-project/
└── .agents/
    └── skills/
        ├── intra-buddy-web-dashboard/
        │   └── SKILL.md   ← Use cases, rules, business logic
        ├── intra-buddy-supabase/
        │   └── SKILL.md   ← DB schema, query patterns, auth
        └── intra-buddy-ui-components/
            └── SKILL.md   ← Components, layout, styling patterns
```

## Step-by-step setup

### 1. Install GitHub Copilot in VS Code
- Open VS Code
- Go to Extensions (Ctrl+Shift+X)
- Search "GitHub Copilot" → Install
- Sign in with your GitHub account

### 2. Copy the .agents folder
- Copy the entire `.agents/` folder from this zip into your project ROOT
  (same level as your package.json / next.config.js)

### 3. Verify skills are detected
- Open VS Code in your project
- Open Copilot Chat panel (Ctrl+Shift+I or click the chat icon)
- Select **Agent** mode from the dropdown at the bottom of the chat
- Type: `/skills`
- You should see all 3 skills listed:
  - intra-buddy-web-dashboard
  - intra-buddy-supabase
  - intra-buddy-ui-components

### 4. Start using it
Now when you ask Copilot in Agent mode, it automatically activates
the right skill based on what you're asking. Examples:

| You ask... | Skill activated |
|---|---|
| "Build the student directory page" | web-dashboard + ui-components |
| "Write a query to get all students in the active cohort" | supabase |
| "Build the broadcast form with validation" | web-dashboard + ui-components |
| "How do I compute logbook status?" | supabase |
| "Create the FAQ CRUD page" | web-dashboard + supabase + ui-components |

---

## Example prompts to try

### Build a full page
```
Build the Review Weekly Logbook Status page. Show a table of all students
in the active cohort with their week number, week end date, and computed
status. Add a filter by status. Show a stale data warning if needed.
```

### Fix a query
```
My query to get students with checklist completion % is not working.
Show me the correct Supabase query using the project schema.
```

### Build a component
```
Create the Cohort Progress Overview page with 4 stat cards:
total students, placed, unplaced, and placement percentage.
Fetch from Supabase using the active cohort.
```

### Add validation
```
Add validation to the broadcast form so title and body are required
before the Supabase insert runs. Show inline field errors.
```

---

## Skill summary

### intra-buddy-web-dashboard
Covers all 6 use cases, actor rules, business logic, and global rules.
Activate: anything about coordinator pages or features.

### intra-buddy-supabase  
Covers the full DB schema, all common query patterns, auth checks,
derived status computations, and Supabase client rules.
Activate: anything touching the database.

### intra-buddy-ui-components
Covers component patterns, StatusBadge, ProgressBar, table layout,
form validation pattern, stale data warning, routing, and styling.
Activate: anything about building or styling UI.
