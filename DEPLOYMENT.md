# FLIXIT Deployment Checklist

## Local links

- Frontend: http://localhost:5173/
- Backend health: http://localhost:5000/api/health
- Video API: http://localhost:5000/api/videos

## Database

1. Create a MySQL 5.7+ or MySQL 8 database.
2. Run `database/schema.sql` against that database.
3. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`.
4. Set a long random `JWT_SECRET` in `backend/.env`.

If MySQL is unavailable, the backend uses a temporary in-memory fallback store. That mode is for local testing only and does not preserve uploads or deletes after restart.

## Backend deployment

- Root directory: `backend`
- Install: `npm install`
- Start: `npm start`
- Health check: `/api/health`
- Required environment: `PORT`, `FRONTEND_URL`, database variables, and `JWT_SECRET`
- Persistent storage is required for `uploads/` if uploaded files must survive restarts.

## Frontend deployment

- Root directory: `frontend`
- Install: `npm install`
- Build: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to `/api` for the same-origin setup, or to the public backend URL ending in `/api` for separate frontend/backend hosts.

## Verification before deployment

Run from the repository root:

```bash
npm test
```

This runs backend API integration tests and the frontend production build. Do not deploy until the command finishes with zero failures.
