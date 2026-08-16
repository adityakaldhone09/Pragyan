# 📁 PROJECT STRUCTURE GUIDE

**Quick reference for navigating the cleaned-up Pragyan AI codebase**

---

## Root Level Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `IMMEDIATE_DEPLOYMENT_ACTIONS.md` | Step-by-step deployment guide |
| `CLEANUP_SUMMARY.md` | What was removed and why |
| `ATTRIBUTIONS.md` | License and attribution information |
| `package.json` | Root workspace configuration |
| `.env` | Root environment variables |

---

## Backend Structure

```
backend/
├── src/
│   ├── app.ts                    # Express application setup
│   ├── server.ts                 # Server entry point
│   ├── config/                   # Configuration files
│   │   ├── database.ts
│   │   ├── passport.ts           # Auth strategy config
│   │   └── mongo.ts
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── assessment/           # Assessments
│   │   ├── ai/                   # AI services
│   │   └── ...other modules
│   ├── services/                 # Business logic
│   │   ├── auth.ts
│   │   ├── email.ts
│   │   ├── aiService.ts
│   │   └── ...
│   ├── utils/                    # Utilities
│   │   ├── jwt.ts                # Token management
│   │   ├── password.ts           # Password hashing
│   │   ├── errors.ts             # Error handling
│   │   └── ...
│   ├── middleware/               # Express middleware
│   ├── validators/               # Input validation (Joi, Zod)
│   ├── types/                    # TypeScript types
│   ├── lib/                      # Library connections
│   │   └── prisma.ts             # Prisma client
│   └── security/                 # Security utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── .env                          # Environment variables
├── .env.example                  # Example env vars
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # Backend README

**Key Files:**
- `src/app.ts` - Start here to understand the API structure
- `prisma/schema.prisma` - Database design
- `src/modules/` - Feature implementations
```

---

## Frontend Structure

```
frontend/
├── src/
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── pages/                    # Page components
│   │   ├── landing.tsx
│   │   ├── auth.tsx              # Login/signup
│   │   ├── dashboard.tsx
│   │   ├── ai-counselor.tsx
│   │   └── ...
│   ├── components/               # Reusable components
│   │   ├── layout.tsx            # Main layout
│   │   ├── landing/              # Landing page components
│   │   ├── auth/                 # Auth components
│   │   ├── ui/                   # UI components (buttons, forms, etc.)
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── ...
│   ├── context/                  # React context
│   │   ├── AuthContext.tsx
│   │   └── ...
│   ├── services/                 # API clients
│   │   ├── authService.ts
│   │   ├── aiService.ts
│   │   └── ...
│   ├── types/                    # TypeScript types
│   ├── utils/                    # Utilities
│   └── styles/                   # Global styles
├── public/                       # Static assets
│   ├── favicon.svg
│   └── ...
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite configuration
└── README.md                     # Frontend README

**Key Files:**
- `src/App.tsx` - Start here for routing and layout
- `src/pages/` - Main page implementations
- `src/components/` - Reusable UI components
- `src/services/` - API communication
```

---

## Configuration Files

### Backend
- `.env` - API keys, database URL, secrets
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts
- `prisma/schema.prisma` - Database schema

### Frontend
- `.env` - API endpoint, environment variables
- `.env.production` - Production-specific config
- `tsconfig.json` - TypeScript settings
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies and scripts

---

## Important Directories

| Directory | Purpose |
|-----------|---------|
| `.github/workflows/` | CI/CD pipelines |
| `.vscode/` | VS Code settings |
| `.devcontainer/` | Docker dev environment |
| `backend/prisma/` | Database schema and migrations |
| `frontend/public/` | Static files (images, icons) |
| `backend/src/modules/` | Feature modules (auth, assessment, etc.) |
| `frontend/src/components/` | Reusable UI components |

---

## Quick Commands

```bash
# Setup
npm install                    # Install all dependencies

# Development
npm run dev                    # Start dev servers

# Backend
cd backend && npm run dev      # Start backend dev server

# Frontend
cd frontend && npm run dev     # Start frontend dev server

# Building
npm run build                  # Build for production

# Testing
npm run test                   # Run tests (if configured)
```

---

## What Was Removed

✅ Cleaned up 40+ duplicate documentation files  
✅ Removed test utilities and mock data  
✅ Deleted build artifacts and caches  
✅ Removed node_modules (reinstall with `npm install`)  
✅ Deleted obsolete configuration files  

**See `CLEANUP_SUMMARY.md` for complete list**

---

## File Navigation Tips

1. **Understanding the auth flow?**
   - Start: `frontend/src/pages/auth.tsx`
   - Then: `frontend/src/context/AuthContext.tsx`
   - Then: `backend/src/modules/auth/`

2. **Adding a new API endpoint?**
   - Define in: `backend/src/modules/feature/routes.ts`
   - Implement in: `backend/src/modules/feature/services/`
   - Call from: `frontend/src/services/`

3. **Creating a new page?**
   - Page: `frontend/src/pages/new-page.tsx`
   - Route: Add to `frontend/src/App.tsx`
   - Components: `frontend/src/components/new-page/`

4. **Database schema changes?**
   - Edit: `backend/prisma/schema.prisma`
   - Run: `npx prisma migrate dev`

---

## Documentation Reference

| Document | Use Case |
|----------|----------|
| `README.md` | Project overview |
| `IMMEDIATE_DEPLOYMENT_ACTIONS.md` | Deploy to production |
| `CLEANUP_SUMMARY.md` | Understand what was removed |
| `backend/README.md` | Backend-specific info |
| `frontend/README.md` (if exists) | Frontend-specific info |

---

## Next Steps

1. ✅ Project is cleaned up
2. Run `npm install` to restore dependencies
3. Run `npm run dev` to start development
4. Deploy using `IMMEDIATE_DEPLOYMENT_ACTIONS.md`

**Happy coding!** 🚀
