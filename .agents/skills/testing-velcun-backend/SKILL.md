---
name: testing-velcun-backend
description: Test the VELCUN serverless API (auth, onboarding, admin, analytics) and the frontend that calls it, end-to-end. Use when verifying changes under api/ or the portal/onboarding pages.
---

# Testing the VELCUN backend

The app is static HTML/JS + Vercel serverless functions under `api/`, backed by MongoDB.
Handlers use a mixed `require(...)` + `export default handler` style.

## Why you usually can't test the Vercel preview directly
Preview deployments are behind **Vercel SSO / deployment protection** — every request
(UI and API) returns `401` with an "Authentication Required" page. To test the deployed
preview you need either a Protection Bypass token
(`?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$token`) or the user to
relax protection. The preview also needs `MONGODB_URI` + `JWT_SECRET` set in Vercel, or
the DB-backed endpoints will 500.

## Recommended: local harness (no Vercel auth needed)
Runs the **actual** handler code, so it's a faithful test.

1. Start MongoDB: `docker run -d --name velcun-mongo -p 27017:27017 mongo:6`
2. `npm install` (in repo). For the harness also: `npm install --no-save express cookie-parser`.
3. Bundle each handler with esbuild to resolve the `require`/`export default` mix and inline `lib/`:
   `node_modules/.bin/esbuild api/<path>.js --bundle --platform=node --format=cjs --external:mongodb --outfile=<out>/<path>.js`
4. Express server: `express.json()` + `cookie-parser`, then for each endpoint
   `app.all('/api/<path>', (req,res) => handler(req,res))` where
   `handler = require(bundle).default`. Serve the repo root with `express.static` for the
   frontend (add explicit routes for clean URLs: `/login`->portal/login.html,
   `/portal`->portal/index.html, `/onboarding`->onboarding/index.html).
5. Run with `NODE_PATH=<repo>/node_modules` so the externalized `mongodb` resolves, and set
   `MONGODB_URI=mongodb://localhost:27017 MONGODB_DB=velcun_test JWT_SECRET=anything` before
   requiring the bundles (db.js throws at import if `MONGODB_URI` is unset).
6. Log API hits in middleware (`res.on('finish', ...)`) — server logs are your network evidence.

Keep harness files OUTSIDE the repo (e.g. `~/velcun-harness`) so they aren't committed.

## Primary end-to-end flow (UI)
- `/login`: Register tab -> fill name/company/email/password(>=8)/confirm + accept terms ->
  "Account created successfully" toast, switches to Login tab with email prefilled.
- Login -> redirects to `/portal` dashboard with the user's name/company in the header.
  (Login was historically broken — wrong import path + action-gated + no password check — so
  a successful redirect is the key signal the fix works.)
- Visiting `/login` while logged in -> `GET /api/auth/verify` -> auto-redirect back to `/portal`.
- `/onboarding`: completing the Account step advances to Fleet Info and fires
  `POST /api/onboarding/account` (was previously commented out in onboarding.js).

## Adversarial checks worth asserting
- Wrong password -> `POST /api/auth/login` = **401** (not 200/500).
- Garbage token -> `GET /api/auth/verify` = **401**.
- Non-admin token -> `GET /api/admin/overview` = **403**.
- `GET /api/health` = **200** `{status:"healthy", checks.database:"ok"}` (great quick DB probe).

Note: emails are lowercased on register and login, so case shouldn't matter for lookups.

## Devin Secrets Needed
- None for local testing (local Docker Mongo + an arbitrary JWT_SECRET).
- To test the deployed Vercel preview instead: a Vercel **Protection Bypass token** and the
  preview's `MONGODB_URI` / `JWT_SECRET` must be configured.
