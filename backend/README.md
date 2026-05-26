# Pragyan Backend - Production-Ready API

Complete backend implementation for Pragyan, an AI-powered career guidance platform.

## 🎯 Overview

- **Framework**: Express.js + TypeScript
- **Database**: MongoDB + Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, Rate Limiting
- **Architecture**: MVC pattern with services

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation, errors
│   ├── validators/        # Zod schemas
│   ├── types/             # TypeScript interfaces
│   ├── config/            # Environment config
│   ├── utils/             # Helpers (JWT, password, errors)
│   ├── lib/               # External libraries (Prisma)
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── package.json
├── tsconfig.json
└── .env
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (or MongoDB Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Configure your DATABASE_URL in .env
# Example (Atlas): mongodb+srv://user:password@cluster.mongodb.net/pragyan_db?retryWrites=true&w=majority

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run seed

# Start development server
npm run dev
```

The server will start on `http://localhost:5000`

## 🔑 API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh-token     - Refresh access token
```

### Roadmaps

```
GET    /api/roadmaps               - Get all roadmaps (paginated)
GET    /api/roadmaps/:id           - Get single roadmap
GET    /api/roadmaps/search?q=     - Search roadmaps
GET    /api/roadmaps/category/:cat - Get roadmaps by category
GET    /api/roadmaps/categories    - Get all categories
GET    /api/roadmaps/skillup/:careerId - Skill-up plan (auth, explanation + profile)

POST   /api/roadmaps               - Create roadmap (ADMIN)
PUT    /api/roadmaps/:id           - Update roadmap (ADMIN)
DELETE /api/roadmaps/:id           - Delete roadmap (ADMIN)
```

### Progress Tracking

```
GET    /api/progress/:roadmapId    - Get roadmap progress
POST   /api/progress/complete-task - Mark task complete
POST   /api/progress/complete-roadmap - Complete roadmap
GET    /api/progress/user/dashboard - Get dashboard data
```

### Assessment

```
GET    /api/assessment/questions           - Get all questions
GET    /api/assessment/questions/:category - Get category questions
POST   /api/assessment/submit              - Submit assessment
GET    /api/assessment/result/:resultId    - Get assessment result
```

### AI Recommendations

```
GET    /api/ai/recommend-careers                  - Get career recommendations
GET    /api/ai/roadmaps/:career                   - Get roadmaps for career
POST   /api/ai/personalized-roadmap               - Generate personalized roadmap
```

## AI And Cache Configuration

- `AI_PROVIDER`: set to `gemini` for Gemini or `local` to force deterministic fallback mode.
- `GEMINI_API_KEY`: enables live Gemini-generated explanations. If missing, backend uses heuristic fallback.
- `REDIS_URL`: optional Redis connection string for persistent caching. If missing/unavailable, in-memory cache is used.

Example values in `.env`:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
REDIS_URL=redis://127.0.0.1:6379
```

Notes:
- This project uses the official Google Gemini SDK for all AI calls.
- The default model is `gemini-1.5-flash` via configuration (`config.gemini.model`).
- AI responses are requested as JSON where possible; the backend has a robust heuristic fallback when the model is unavailable or returns invalid JSON.

## 📚 API Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Roadmaps

```bash
curl -X GET "http://localhost:5000/api/roadmaps?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search Roadmaps

```bash
curl -X GET "http://localhost:5000/api/roadmaps/search?q=react" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Complete Task

```bash
curl -X POST http://localhost:5000/api/progress/complete-task \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "roadmapId": "roadmap123",
    "taskId": "task456"
  }'
```

### Get Dashboard

```bash
curl -X GET http://localhost:5000/api/progress/user/dashboard \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Submit Assessment

```bash
curl -X POST http://localhost:5000/api/assessment/submit \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "answers": {
      "q1": "yes",
      "q2": "no",
      "q3": "maybe"
    }
  }'
```

### Get Career Recommendations

```bash
curl -X GET http://localhost:5000/api/ai/recommend-careers \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

**Token Expiry**: 7 days
**Refresh Token Expiry**: 30 days

To refresh token:

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \\
  -H "Content-Type: application/json" \\
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🗄️ Database Schema

### User
- id, fullName, email, password, avatar
- selectedCareer, skillLevel, role
- xp, streak, lastActiveDate
- createdAt, updatedAt

### Roadmap
- id, title, category, description
- level, duration, icon, estimatedHours
- tags (array)

### UserProgress
- userId, roadmapId
- completedTasks[], completedDays[]
- progressPercentage, currentDay
- xp, streak, lastActiveDate

### AssessmentResult
- userId, answers, suggestedCareers
- scores, strengths, weaknesses

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT authentication with access/refresh tokens
- ✅ Rate limiting on auth endpoints (5 requests/15 min)
- ✅ General rate limiting (100 requests/15 min)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Prisma
- ✅ Role-based access control (ADMIN, USER)

## 🧪 Environment Variables

```
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/pragyan_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRY=30d
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=10
```

## 📊 Admin Credentials (After Seeding)

```
Email: admin@pragyan.com
Password: admin123
```

## 🔄 Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create new migration
npm run prisma:migrate -- --name add_feature

# Run migrations in production
npm run prisma:migrate:prod

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run seed
```

## 🚢 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production` in .env
2. Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Use MongoDB database
4. Enable HTTPS
5. Set `FRONTEND_URL` to production domain
6. Use environment variables for sensitive data

### Deployment Checklist

- [ ] Update JWT secrets
- [ ] Configure MongoDB connection
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Enable rate limiting
- [ ] Setup monitoring/logging
- [ ] Configure backups
- [ ] Setup SSL/TLS

## 📖 Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation
- **Helmet** - Security headers
- **CORS** - Cross-origin support
- **Morgan** - Logging

## 🐛 Error Handling

All errors return standardized format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["error detail"]
  }
}
```

Common HTTP Status Codes:
- 200 - OK
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 409 - Conflict
- 500 - Internal Server Error

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🎓 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [OWASP Security](https://owasp.org/)

## 📄 License

Proprietary - Pragyan Platform

## 🤝 Contributing

1. Create a new branch for features
2. Follow TypeScript best practices
3. Add proper error handling
4. Write tests for new features
5. Submit pull request

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
