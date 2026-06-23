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

## Current data model

This version stores accounts, sessions, and leads in browser local storage. It is intended for workflow testing and single-browser use. Shared production use requires server-side authentication and a database.
