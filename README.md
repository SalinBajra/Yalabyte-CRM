# YalaByte Website

Modern production-ready website for **YalaByte**, an IT company providing website development and one-stop digital solutions for businesses.

## Project Structure

```text
yalabyte/
  frontend/
    public/
      images/
    src/
      components/
      data/
      App.jsx
      main.jsx
      styles.css
    index.html
    package.json
    tailwind.config.js
    postcss.config.js
    .env.example
  backend/
    app/
      main.py
      __init__.py
    requirements.txt
  README.md
```

## Frontend

Built with React, JavaScript, Vite, and Tailwind CSS.

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Backend

Built with Python and FastAPI.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend runs at `http://localhost:8000`.

Health check:

```bash
GET http://localhost:8000/api/health
```

Contact form endpoint:

```bash
POST http://localhost:8000/api/contact
```

## CRM

The team CRM is available at:

```text
/crm
```

For production, point a subdomain such as `crm.yalabyte.com` to the same deployed frontend. The app opens the CRM automatically on hosts that start with `crm.`, and `/crm` also works on the main domain or localhost.

Set a team passcode for the browser-based CRM gate:

```env
VITE_CRM_PASSCODE=choose-a-private-team-passcode
```

The first CRM version stores leads in browser local storage and supports JSON import/export. It is useful for team workflow testing and small internal use. For a shared production CRM across multiple team members, connect `/api/contact` and `/crm` to a database such as Supabase/PostgreSQL so website form submissions appear for every logged-in team member.

## Environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

For Vercel production, leave `VITE_API_URL` empty or unset so the form uses the built-in `/api/contact` serverless endpoint.

### Contact Notifications on Vercel

Set these in Vercel Project Settings > Environments > Production > Environment Variables:

```env
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=465
SMTP_USER=info@yalabyte.com
SMTP_PASS=your-zoho-app-password
SMTP_SECURE=true
CONTACT_RECEIVER=info@yalabyte.com
CLIQ_WEBHOOK_URL=your-zoho-cliq-incoming-webhook-url
EMAIL_STRICT=false
```

`CLIQ_WEBHOOK_URL` sends every valid inquiry into the configured Zoho Cliq channel. The webhook itself controls which channel receives the message. Email and Cliq are independent: if SMTP is still blocked, Cliq can still receive notifications.

For local FastAPI development, set `VITE_API_URL` to the deployed or local backend URL and update backend CORS origins in `backend/app/main.py` to include the deployed frontend domain.

Backend CORS can also be configured with:

```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Build

```bash
cd frontend
npm run build
```

The production frontend output will be generated in `frontend/dist`.

## Deployment Notes

- Deploy the frontend to Vercel, Netlify, Cloudflare Pages, or any static host that supports Vite builds.
- For Vercel, import the Git repository and set the project Root Directory to `frontend`.
- Vercel settings for the frontend are already included in `frontend/vercel.json`.
- Deploy the backend to Render, Fly.io, Railway, DigitalOcean, AWS, Azure, or another Python-compatible platform.
- Configure the frontend environment variable `VITE_API_URL` with the backend origin.
- Configure backend CORS for the production frontend origin.
- Set `CONTACT_EMAIL=info@yalabyte.com` for backend deployments if you want to make the routing address explicit.
- Connect the contact endpoint to email, CRM, database, or queue storage before relying on it for live inquiries.

## Production Checklist

- Add real portfolio work, testimonials, and contact details.
- Connect the contact form to email or CRM storage.
- Add analytics and privacy/cookie notices if required.
- Add a social sharing image.
- Review copy and metadata for final service markets and keywords.
