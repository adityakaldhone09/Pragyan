# 🚀 GETTING STARTED WITH PRAGYAN AI

**After cleanup - your next steps**

---

## ✅ Pre-Cleanup Status
- 🧹 Project decluttered
- 📦 Unnecessary files removed
- 💾 ~1.5 GB freed
- 📚 Documentation simplified

---

## Step 1: Restore Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

**Time:** 3-5 minutes (first time)

---

## Step 2: Setup Environment

### Backend Configuration
```bash
# backend/.env should already exist, verify it has:
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend Configuration
```bash
# frontend/.env should exist, verify it has:
VITE_API_URL=http://localhost:3000/api
```

---

## Step 3: Start Development

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Expected output:
```
Server running on port 3000
Database connected
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Expected output:
```
VITE v6.4.3 ready in XXX ms
Local: http://localhost:5173
```

---

## Step 4: Access the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health check:** http://localhost:3000/health

---

## Project Structure

**Quick navigation:**

| Path | Purpose |
|------|---------|
| `backend/src/app.ts` | Express app setup |
| `backend/src/server.ts` | Server entry point |
| `frontend/src/App.tsx` | React root component |
| `frontend/src/pages/` | Page components |
| `backend/prisma/schema.prisma` | Database schema |

See `PROJECT_STRUCTURE.md` for complete guide.

---

## Common Tasks

### Add a New API Endpoint
1. Create route in `backend/src/modules/feature/routes.ts`
2. Implement in `backend/src/modules/feature/services/`
3. Call from `frontend/src/services/`

### Create a New Page
1. Add page component in `frontend/src/pages/`
2. Register route in `frontend/src/App.tsx`
3. Add navigation link in `frontend/src/components/layout.tsx`

### Update Database Schema
1. Edit `backend/prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name description`
3. Restart backend

### Deploy to Production
See `IMMEDIATE_DEPLOYMENT_ACTIONS.md`

---

## Useful Commands

```bash
# Development
npm run dev           # Start both servers
cd backend && npm run dev    # Backend only
cd frontend && npm run dev   # Frontend only

# Building
npm run build         # Build for production
cd backend && npm run build  # Build backend
cd frontend && npm run build # Build frontend

# Database
cd backend && npx prisma studio  # Prisma admin UI
cd backend && npx prisma generate # Regenerate types

# Testing (if configured)
npm run test          # Run tests
npm run test:watch    # Watch mode
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in backend/.env
PORT=3001

# Or kill process using port
lsof -ti:3000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3000   # Windows
```

### Database Connection Error
```bash
# Verify DATABASE_URL in backend/.env
# Check MongoDB connection string
# Ensure credentials are correct
# Test with: npx prisma db push
```

### Frontend Can't Connect to Backend
```bash
# Verify VITE_API_URL in frontend/.env
# Should be: http://localhost:3000/api
# Check backend is running on port 3000
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# For backend and frontend too
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

---

## Documentation Files

| File | Read When |
|------|-----------|
| `README.md` | First - project overview |
| `PROJECT_STRUCTURE.md` | Navigating the code |
| `AFTER_CLEANUP.md` | Understanding what was removed |
| `CLEANUP_SUMMARY.md` | Details of cleanup |
| `IMMEDIATE_DEPLOYMENT_ACTIONS.md` | Deploying to production |

---

## Key Features

- ✅ AI-powered career assessment
- ✅ Personalized learning roadmaps
- ✅ Real-time AI counselor
- ✅ Admin intelligence dashboard
- ✅ Role-based access control
- ✅ Comprehensive error handling

---

## Next Steps

1. ✅ Follow steps 1-4 above
2. ✅ Explore the code structure
3. ✅ Make your first code change
4. ✅ Test locally with `npm run dev`
5. ✅ When ready: follow `IMMEDIATE_DEPLOYMENT_ACTIONS.md`

---

## Support

**Issues?** Check:
1. `PROJECT_STRUCTURE.md` - File navigation
2. `CLEANUP_SUMMARY.md` - What changed
3. Troubleshooting section above
4. Backend/frontend README files

---

## Quick Links

- 📖 Main Docs: `README.md`
- 🗺️ File Map: `PROJECT_STRUCTURE.md`
- 🚀 Deploy: `IMMEDIATE_DEPLOYMENT_ACTIONS.md`
- 📝 Cleanup: `CLEANUP_SUMMARY.md`

---

**You're all set!** Happy coding! 🎉

```bash
npm run dev
```
