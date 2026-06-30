# Pragyan Backend

This package is the backend for Pragyan, the AI-powered career guidance platform. It provides the Express API, Prisma schema, authentication, recommendation endpoints, and seed scripts.

## What Runs Here

- Express + TypeScript server
- MongoDB via Prisma
- JWT authentication and session support
- Route modules for auth, roadmaps, progress, assessment, AI, jobs, and admin workflows
- Startup validation that fails fast when required env values are missing or invalid

## Project Structure

```text
backend/
├── src/
│   ├── app.ts                 # Express middleware and route wiring
│   ├── server.ts              # Startup validation and server bootstrap
│   ├── config/                # Environment, validation, passport, diagnostics
│   ├── routes/                # API routes
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── middleware/            # Auth, validation, rate limiting, errors
│   ├── ai/                    # AI helpers and fallback logic
│   ├── lib/                   # Prisma, cache, and integrations
│   └── utils/                 # Shared utilities
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   └── seed.ts                # Seed script
├── scripts/                   # Import, smoke test, and maintenance scripts
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 18 or newer
- npm 9+ or pnpm 8+
- MongoDB Atlas or another replica-set compatible MongoDB instance
- Optional: Gemini key, Groq key, Redis URL, and OAuth credentials if you use those features

## Environment Setup

Create the local environment file from the example:

```bash
cd /workspaces/Pragyan/backend
cp .env.example .env
```

The current backend config reads values from `backend/.env` and validates them at startup.

### Required values

Set these first:

- `PORT` - backend port, usually `5000`
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - access-token secret
- `JWT_REFRESH_SECRET` - refresh-token secret
- `FRONTEND_URL` - usually `http://localhost:5173`
- `CORS_ORIGINS` - comma-separated list of allowed browser origins
- `RAPID_API_KEY` - required by the current config layer

### Common optional values

- `NODE_ENV` - `development` or `production`
- `JWT_EXPIRY` and `JWT_REFRESH_EXPIRY`
- `AI_PROVIDER` - `gemini`, `groq`, or `local`
- `GEMINI_API_KEY` and `GEMINI_MODEL`
- `GROQ_API_KEY` and `GROQ_MODEL`
- `REDIS_URL`
- `API_BASE_URL`
- `BCRYPT_ROUNDS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET` if you use OAuth

Do not commit `.env` to git.

## First-Time Backend Setup

### 1. Install dependencies

```bash
cd /workspaces/Pragyan/backend
npm install
```

### 2. Generate Prisma client

```bash
npm run prisma:generate
```

### 3. Push the Prisma schema

```bash
npm run prisma:push
```

### 4. Seed data if needed

```bash
npm run seed
```

The seed step is optional, but it is useful when you want demo careers, roadmaps, jobs, and test accounts in a fresh database.

## Start The Backend

```bash
cd /workspaces/Pragyan/backend
npm run dev
```

This starts the API on `http://localhost:5000` using `tsx watch src/server.ts`.

The startup flow does three important things before the server listens:

1. loads environment variables
2. validates the MongoDB URL and required secrets
3. connects Prisma to MongoDB before the app is marked ready

If the environment is invalid, the server exits early with a clear diagnostic message instead of hanging.

## Production Build

```bash
npm run build
npm run start
```

- `npm run build` compiles TypeScript to `dist/`
- `npm run start` runs the compiled server with module aliases enabled

## Available Scripts

```bash
npm run dev               # Development server with watch mode
npm run build             # Compile TypeScript
npm run start             # Run the compiled server
npm run prisma:generate   # Generate Prisma client
npm run prisma:push       # Push schema to MongoDB
npm run seed              # Seed demo data
npm run test              # Jest test suite with coverage
npm run ci                # Build + test
```

## Runtime Behavior

The backend app setup in `src/app.ts` includes:

- Helmet security headers
- session middleware
- Passport initialization
- CORS restrictions using `FRONTEND_URL` / `CORS_ORIGINS`
- request logging in development
- API rate limiting
- centralized error handling

The server bootstrap in `src/server.ts` includes:

- environment validation
- Prisma connection retries
- DNS fallback handling for Atlas SRV lookups
- graceful shutdown handlers
- startup diagnostics for easier debugging

## API Overview

The current route groups are mounted under `/api` and include:

- `/api/auth`
- `/api/skills`
- `/api/tasks`
- `/api/roadmaps`
- `/api/progress`
- `/api/assessment`
- `/api/ai`
- `/api/recommendations`
- `/api/career-matching`
- `/api/careers`
- `/api/jobs`
- `/api/admin`

There is also a health endpoint at `/health`.

## Database

The Prisma schema is MongoDB-based and contains models for users, roadmaps, tasks, progress tracking, assessments, AI personalization, jobs, and related relationships.

Common maintenance commands:

```bash
npm run prisma:generate
npm run prisma:push
npm run seed
```

## Local Development Checklist

Before you start the backend, confirm:

1. `backend/.env` exists
2. `DATABASE_URL` is a valid MongoDB connection string
3. the MongoDB user can reach the cluster
4. the required secrets are not placeholder values
5. the frontend is allowed in `CORS_ORIGINS`

## Troubleshooting

### Backend exits during startup

- Check `backend/.env`
- Fix `DATABASE_URL`
- Replace placeholder secrets
- Verify the MongoDB cluster is reachable

### Prisma connection errors

- Re-run `npm run prisma:generate`
- Re-run `npm run prisma:push`
- Confirm the database supports the Prisma MongoDB workflow

### Auth or CORS errors from the browser

- Ensure the frontend runs on `http://localhost:5173`
- Make sure `FRONTEND_URL` and `CORS_ORIGINS` include that origin
- Restart the backend after updating `.env`

### Seed data is missing

- Run `npm run seed` after the schema is pushed
- Confirm the backend is connected to the expected database

## Notes For Maintenance

- Use `.env.example` as the source of truth for the full list of supported variables.
- Keep `backend/.env` out of git.
- The app fails fast on configuration issues by design, so startup errors should be treated as setup problems first.
