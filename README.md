# YalaByte CRM

Standalone CRM frontend for the YalaByte team, built with React, Vite, and Tailwind CSS.

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
2. Open the Supabase SQL Editor and run [`supabase/migrations/202606230001_create_crm_leads.sql`](supabase/migrations/202606230001_create_crm_leads.sql).
3. In Authentication settings, add `https://crm.yalabyte.com` as the Site URL and redirect URL.
4. Copy `.env.example` to `.env` for local development and add the project values.
5. Add the same variables in Vercel Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the browser-safe publishable key, never the Supabase secret or service-role key. Redeploy after adding the variables.

Supabase Auth stores user accounts server-side, so accounts survive browser-data clearing and work across devices. Clearing browser data signs the user out, but they can sign in again. Leads are shared in PostgreSQL and protected by row-level security for authenticated `@yalabyte.com` users.
