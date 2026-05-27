# Pragyan

Pragyan is an AI-powered career guidance platform that combines assessment, roadmap generation, curated learning resources, adaptive planning, and progress tracking in one product.

## What it does

- Career assessment and matching
- Personalized learning roadmaps with day-wise sections
- Trusted learning resources for docs, video, practice, and mini-projects
- OAuth authentication with Google and GitHub
- Profile avatars and account linking
- AI mentor inside roadmaps
- Smart daily planner with adaptive difficulty
- Quiz performance feedback loop for recovery, growth, and stretch modes
- Progress tracking with XP, streaks, and project unlocks
- Roadmap search backed by MongoDB text search

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Prisma
- Auth: Passport, JWT, express-session
- AI: Gemini, Groq, and local fallback routing

## Repository Layout

```text
Pragyan/
├── frontend/    # React app
├── backend/     # Express API
├── README.md
└── package.json
```

## Prerequisites

- Node.js 18 or newer
- npm or pnpm
- MongoDB connection string
- Google OAuth credentials
- GitHub OAuth credentials
- Optional: Gemini API key

## Environment Setup

Create `backend/.env` with values similar to:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/Pragyan?retryWrites=true&w=majority"

JWT_SECRET="change_this_to_a_secure_random_string"
JWT_EXPIRY="7d"
JWT_REFRESH_SECRET="change_this_too"
JWT_REFRESH_EXPIRY="30d"

CORS_ORIGINS=http://localhost:5173

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

AI_PROVIDER=gemini
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-1.5-flash"
```

## Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database Setup

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

If Prisma generation is blocked on Windows by a DLL lock, rerun with:

```bash
set PRISMA_GENERATE_NO_ENGINE=1
npx prisma generate
```

## Run Locally

Start the backend first:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://127.0.0.1:5173` and proxies API calls to `http://localhost:5000`.

## Build

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Key Backend Scripts

- `npm run dev` - start the API in development mode
- `npm run build` - compile TypeScript
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:migrate` - run Prisma migrations
- `npm run seed` - seed sample data
- `npm run db:create-roadmap-index` - create the MongoDB roadmap search index

## Key Features

### Authentication

- Google OAuth
- GitHub OAuth
- Provider linking for a single account
- Session and JWT handling
- Profile avatar upload and persistence

### Learning System

- AI-generated roadmap sections by domain
- Daily learning topics and resource cards
- Trusted resource catalog for official docs, videos, practice, and projects
- AI mentor for roadmap-specific help
- Smart daily planner with adaptive mode support
- Project unlocks when the learner is ready

### Adaptive Learning

- Recovery mode for weak quiz performance or low momentum
- Growth mode for balanced progress
- Stretch mode for strong streaks and high quiz scores
- Quiz scores are stored and reused to tune future recommendations

### Productivity and Progress

- XP and streak tracking
- Assessment-to-roadmap handoff
- Roadmap search and browsing
- Progress history for learning resources

## Troubleshooting

- If the frontend shows proxy errors like `ECONNREFUSED`, start the backend on port `5000`.
- If Prisma client types are stale after a schema change, rerun `npx prisma generate`.
- If OAuth does not redirect correctly, confirm the provider callback URLs and env vars.

## License

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for project attribution and licensing notes.
