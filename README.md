# Devstrike Admin

Vite + React admin panel for the Devstrike website. Manages projects,
vacancies, team members, posts, job applications (with CV download), and
contact messages via the Devstrike backend API.

## Setup

```bash
npm install
npm run dev   # http://localhost:5174
```

The backend must be running (default `http://localhost:4001`). To point at a
different API, create `.env.local` with:

```
VITE_API_URL=https://api.example.com
```

Sign in with the admin credentials from the backend's `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
