# YalaByte CRM

Standalone CRM frontend for the YalaByte team, built with React, Vite, and Tailwind CSS.

## CRM capabilities

- Focused Overview with pipeline health, conversion, overdue follow-ups, personal tasks, sources, and owner workload
- Searchable lead workspace with ownership, stage, follow-up, sorting, duplicate detection, and mobile list/detail navigation
- Drag-and-drop deal pipeline with mobile stage controls
- Lead tasks, due-date reminders, attributed calls/emails/meetings/notes, and teammate notifications
- Lead-to-contact conversion, shared prospect contacts, and contact task assignments
- Admin/member roles, protected audited deletion, cross-device notification reads, and safe merge-based imports
- Email, phone, calendar, Cliq, website lead capture, realtime Supabase sync, and JSON backup/export support

## Local development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5174`.

## Production build

```bash
npm run build
```

The production files are generated in `dist`.

## Vercel deployment

Import this repository as a Vercel project and use:

- Framework preset: Vite
- Root directory: repository root (`.`)
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add `crm.yalabyte.com` under the Vercel project's domains, then configure the CNAME record provided by Vercel in Cloudflare.

## Supabase authentication and database

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run the migrations in filename order:
   - [`supabase/migrations/202606230001_create_crm_leads.sql`](supabase/migrations/202606230001_create_crm_leads.sql)
   - [`supabase/migrations/202606230002_team_members_and_lead_audit.sql`](supabase/migrations/202606230002_team_members_and_lead_audit.sql)
   - [`supabase/migrations/202606230003_contacts_and_team_tasks.sql`](supabase/migrations/202606230003_contacts_and_team_tasks.sql)
   - [`supabase/migrations/202606230004_team_profiles_and_avatars.sql`](supabase/migrations/202606230004_team_profiles_and_avatars.sql)
   - [`supabase/migrations/202606240001_operational_crm.sql`](supabase/migrations/202606240001_operational_crm.sql)
3. In Authentication settings, add `https://crm.yalabyte.com` as the Site URL and redirect URL.
4. Copy `.env.example` to `.env` for local development and add the project values.
5. Add the same variables in Vercel Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the browser-safe publishable key, never the Supabase secret or service-role key. Redeploy after adding the variables.

Supabase Auth stores user accounts server-side, so accounts survive browser-data clearing and work across devices. Clearing browser data signs the user out, but they can sign in again. Leads are shared in PostgreSQL and protected by row-level security for authenticated `@yalabyte.com` users.

Each authenticated team member is added to the lead-owner directory on sign-in. Lead deletion is audited through a protected database function that retains a complete snapshot and records who deleted the lead.

The Contacts workspace stores shared prospect details and team assignments. Assignments are saved in Supabase and the website's authenticated `/api/team-notification` endpoint emails the tagged teammate using the server-side SMTP configuration.

## Website lead capture

The website's server-side `/api/contact` handler inserts every valid inquiry into the shared `leads` table with status `New` and source `Website`. Set these server-only variables on the website's Vercel project:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Never expose the service-role key in frontend code or in a `VITE_` variable. Supabase Realtime delivers newly submitted website leads to an open CRM automatically.
