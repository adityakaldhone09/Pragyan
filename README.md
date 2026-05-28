# Pragyan

Pragyan is an AI-powered career operating system that combines assessment, roadmap generation, curated learning resources, mentor memory, and explainable placement intelligence.

This README highlights how to run the project and documents the recent intelligence and observability improvements (admin tools, audit logging, TTL/indexing, UX polish).

## What’s new (high level)

- Centralized, explainable Intelligence module (`/api/intelligence`) that computes deterministic placement forecasts, opportunity signals, consistency risk, momentum, and readiness projections.
- Admin observability panel and API:
  - `GET /api/intelligence/debug` — admin-only debug payload (raw inputs, derived signals, explanations, config used).
  - `GET /api/intelligence/audits` — paginated audit listing for admin governance.
  - Frontend admin pages: `/admin/intelligence` and `/admin/intelligence/audits`.
- Audit logging for debug access (fire-and-forget) persisted to `IntelligenceDebugAudit` collection with TTL and indexes to retain logs for a configurable window.
- UX polish: assistant streaming replies, dashboard hero improvements, loading skeletons, and small micro-interaction upgrades.

---

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Prisma
- Auth: Passport + JWT + session
- AI: pluggable provider (Gemini or local fallback)

## Repository Layout

```
Pragyan/
├── frontend/    # React SPA
├── backend/     # Express API + intelligence module
├── README.md
└── package.json
```

## Quickstart (development)

Prerequisites
- Node.js 18+
- npm or pnpm
- MongoDB connection string (Atlas or local)

Environment
- Copy `backend/.env.example` to `backend/.env` and set values.
- Important env vars added recently:
  - `AI_PROVIDER` (e.g. `gemini`)
  - `GEMINI_API_KEY` (if using Gemini)
  - `INTELLIGENCE_AUDIT_TTL_DAYS` — number of days to retain audit logs (default 30)

Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

Database

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

> Note: the audit model `IntelligenceDebugAudit` was added; we use raw Mongo commands for index/TTL creation at app startup so a regenerated client is not strictly required for runtime.

Run locally

```bash
# backend
cd backend
npm run dev

# frontend (in another terminal)
cd frontend
npm run dev
```

Frontend default: `http://127.0.0.1:5173` (proxies to backend)

Build

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

---

## Intelligence & Observability (details)

- The intelligence engine lives under `backend/src/modules/intelligence` and exposes a typed payload shape used by the dashboard and forecast chips.
- Admin debug endpoint returns an explainable payload suitable for QA and ML inspection. Access to the endpoint is protected by `authenticate + authorize('ADMIN')`.
- Audit logging captures each admin access to the debug endpoint and stores a minimal governance record (adminId, targetUser, endpoint, filters, env, createdAt). Logs are written in non-blocking mode; failures do not affect the API response.
- Indexes and TTL are created at startup by the app (see `ensureIntelligenceIndexes`) and are configurable via `INTELLIGENCE_AUDIT_TTL_DAYS`.

Operational guidance
- Default TTL: 30 days. Adjust with `INTELLIGENCE_AUDIT_TTL_DAYS` for staging/production.
- Audit viewer is admin-only and intentionally shows only governance metadata (no raw payload content) to avoid exposing sensitive internals.

---

## UX polish highlights

- Assistant: streaming reply effect (typewriter), personalized greeting, visual typing indicator.
- Dashboard: hero shows live placement readiness, unlocked opportunities, and momentum summary; stat cards show skeletons while loading.
- Admin pages: lightweight observability UI for intelligence and audit logs.

These changes aim to improve perceived product quality and make the platform demo-ready.

---

## Deployment notes

- Ensure `DATABASE_URL` is set and the MongoDB user has permissions to create indexes.
- Ensure `INTELLIGENCE_AUDIT_TTL_DAYS` is set according to retention policy.

## Contributing & Tests

- Run unit tests from `backend`:

```bash
cd backend
npm run test
```

- Open a PR with focused changes; intelligence changes should include unit tests that exercise `intelligence.service`.

---

If you want, I can add a short admin guide (README snippet) that documents how to use `/admin/intelligence` and `/admin/intelligence/audits` for product/QA teams.

**Made with ❤️ for career engineering and explainable AI**
