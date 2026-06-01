# Timings Backend - Supabase Cloud Setup

This directory contains the production-ready database schema, security policies, triggers, seed queries, and frontend integration code optimized for deployment to a **hosted Supabase Cloud** project.

---

## 🏗️ Deployment Architecture

```text
GitHub Pages (or Vercel)
        │ (React SPA Client-Side requests)
        ▼
  Supabase Cloud
    ├── Supabase Auth (Google, Email/Password login)
    └── PostgreSQL Database (Data storage, triggers, and Row-Level Security)
```

---

## 📁 Files Included

```text
Backend/
├── README.md                     # This cloud deployment documentation
└── supabase_schema.sql           # Unified schema, triggers, RLS, and seed data
```

---

## 🚀 Cloud Deployment Steps

### Step 1: Execute Database Setup on Supabase Cloud
1. Open your [Supabase Cloud Console](https://supabase.com/dashboard) and navigate to your project.
2. Select the **SQL Editor** from the left navigation bar.
3. Click **New Query** to open a blank SQL workspace.
4. Copy the entire contents of [supabase_schema.sql](file:///Users/santhoshsamudrala/Code/timings/Backend/supabase_schema.sql) and paste it into the editor.
5. Click **Run**. This will:
   - Create the tables: `profiles`, `routines`, `routine_steps`, `routine_checklist_items`, `global_checklist_items`, and `session_history`.
   - Setup triggers for dynamic `updated_at` timestamps and automatic profile creations when users sign up via Supabase Auth.
   - Enforce Row-Level Security (RLS) on all tables with explicit data access policies.
   - Seed default routines, checklists, and history logs associated with the default user for immediate testing.

### Step 2: Configure Frontend Environment Variables
Set up your `.env.local` inside the `Frontend/` folder using your project credentials (find these in your Supabase project under **Settings → API**):
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 3: Verify Integrated Frontend Components
The frontend is already configured to work with Supabase out of the box using:
1. [supabaseClient.ts](file:///Users/santhoshsamudrala/Code/timings/Frontend/src/utils/supabaseClient.ts) and [database.types.ts](file:///Users/santhoshsamudrala/Code/timings/Frontend/src/types/database.types.ts) to handle credentials and typed database clients.
2. [useRoutineStore.ts](file:///Users/santhoshsamudrala/Code/timings/Frontend/src/store/useRoutineStore.ts) to handle real-time Zustand state syncing.
No extra configuration or copying is required other than setting up the local environment variables.

---

## 🔒 Security & Row-Level Security (RLS)

All database endpoints are secured by Row-Level Security. Query requests will automatically fail unless executed by an authenticated user matching the record's owner (`auth.uid() = user_id`).

### User Sync Trigger
A PostgreSQL trigger (`on_auth_user_created`) automatically intercepts new registrations in Supabase Auth and populates the `public.profiles` table with:
- The user's ID and email.
- Display name (defaulting to the email prefix if metadata name is not provided).
- A default streak of `0` days.
- A default avatar ID (`avatar-1`).
