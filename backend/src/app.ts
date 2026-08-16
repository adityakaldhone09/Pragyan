// src/app.ts

import express, { Application, Request, Response } from 'express';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { config } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { configurePassport } from '@/config/passport';
import {
  aiApiRateLimiter,
  authRateLimiter,
  generalApiRateLimiter,
  requestSizeLimits,
  sanitizeRequest,
  secureCors,
  secureHeaders,
} from '@/security';
import { aiFirewall } from '@/security/ai/aiFirewall';
import { aiUsageLimiter } from '@/security/ai/aiUsageLimiter';

// Routes
import authRoutes from '@/modules/auth'; // Phase 2 auth module
import {
  roadmapRoutes,
  assessmentRoadmapRoutes,
  progressRoutes,
  recommendationsRoutes,
  profileRoutes,
  skillRoutes,
  feedbackRoutes,
  notificationRoutes,
  taskRoutes,
  careersRoutes,
  csvCareerRecommendationsRoutes,
  topicsRoutes,
  jobsRoutes,
  careerGraphRoutes,
  learningResourcesRoutes,
} from '@/routes';

import assessmentDiscoveryRoutes from '@/routes/assessmentDiscovery';
import assessmentInterestRoutes from '@/routes/assessmentInterest';
import assessmentCapabilityRoutes from '@/routes/assessmentCapability';
import assessmentRoutes from '@/routes/assessment';
import adminRoutes from '@/routes/admin';
import debugRoutes from '@/routes/debug';
import adminDevRoutes from '@/routes/adminDev';

// Module routes
import journeyRoutes from '@/modules/journey/journey.routes';
import mentorRoutes from '@/modules/mentor/mentor.routes';
import intelligenceRoutes from '@/modules/intelligence/intelligence.routes';
import notesRoutes from '@/modules/notes/notes.routes';
import recruitmentRoutes from '@/modules/recruitment/recruitment.routes';
import placementRoutes from '@/modules/placement/placement.routes';

import { ensureIntelligenceIndexes } from '@/modules/intelligence/intelligence.indexes';
import { csvCareerDatasetService } from '@/services/csv-career-dataset';
import healthRoutes from '@/routes/health';
import path from 'path';
import fs from 'fs';

const app: Application = express();

configurePassport();

function logParseResumeRequest(req: Request, _res: Response, next: () => void) {
  console.info('[Parse Resume Request]', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    hasAuthorization: Boolean(req.headers.authorization),
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });
  next();
}

// ============ SECURITY MIDDLEWARE ============

app.use(secureHeaders);

// Disable ETags on API routes to prevent 304 responses with empty bodies
// This ensures API responses are always delivered with full payloads
app.use('/api/', (_req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  res.removeHeader('ETag');
  next();
});

app.set('trust proxy', 1);

app.use(
  session({
    secret: config.oauth.sessionSecret,
    name: 'pragyan.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// CORS
app.use(secureCors);

// ============ BODY PARSING ============

app.use(requestSizeLimits);
app.use(sanitizeRequest);

// ============ LOGGING ============

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ============ ROUTES ============

app.use('/api/health', healthRoutes);
app.use('/api/assessment/hybrid/parse-resume', logParseResumeRequest);

// API routes
app.use('/api', generalApiRateLimiter);
app.use('/api/auth', authRateLimiter);
app.use('/api/ai', aiApiRateLimiter, aiUsageLimiter, aiFirewall);
app.use('/api/mentor', aiApiRateLimiter, aiUsageLimiter, aiFirewall);
app.use('/api/recommendations/intelligence', aiApiRateLimiter, aiUsageLimiter, aiFirewall);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/roadmap', assessmentRoadmapRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/csv-careers', csvCareerRecommendationsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/learning-resources', learningResourcesRoutes);
app.use('/api/career-graph', careerGraphRoutes);
app.use('/api/assessment/discovery', assessmentDiscoveryRoutes);
app.use('/api/assessment/interest', assessmentInterestRoutes);
app.use('/api/assessment/capability', assessmentCapabilityRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/admin', adminRoutes);

// Development-only debug routes (do not expose in production)
if (config.nodeEnv !== 'production') {
  app.use('/api/debug', debugRoutes);
  // Dev-only admin summary (no auth) for quick checks
  // Mounted under /api/dev/admin to avoid colliding with authenticated /api/admin
  app.use('/api/dev/admin', adminDevRoutes);
}

// Serve frontend production build if present (useful for local demos)
try {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // Serve index.html for non-API routes (SPA fallback)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log('[Static] Serving frontend from', frontendDist);
  }
} catch (err) {
  // ignore static serving errors
}

// Explicit assets handler to avoid other middleware returning JSON for static files
try {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  const assetsRoot = path.join(frontendDist, 'assets');
  if (fs.existsSync(assetsRoot)) {
    app.get('/assets/*', (req, res) => {
      const rel = req.path.replace(/^[\/]+/, '');
      const file = path.join(frontendDist, rel);
      if (fs.existsSync(file)) {
        return res.sendFile(file);
      }
      return res.status(404).end();
    });
  }
} catch (_) {
  // noop
}

// ============ 404 HANDLING ============

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============ ERROR HANDLING ============

app.use(errorHandler);

// Ensure intelligence audit indexes (non-blocking)
void ensureIntelligenceIndexes();

// Initialize CSV Career Dataset (non-blocking)
void (async () => {
  try {
    console.log('[CSV Dataset] Loading career dataset...');
    await csvCareerDatasetService.loadDataset();
    const stats = csvCareerDatasetService.getDatasetStats();
    console.log('[CSV Dataset] ✅ Loaded successfully:', {
      records: stats.totalRecords,
      careers: stats.uniqueCareers,
      skills: stats.totalSkills,
    });
  } catch (error) {
    console.error('[CSV Dataset] ❌ Failed to load:', error);
  }
})();

export default app;

