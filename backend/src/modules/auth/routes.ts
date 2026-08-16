/**
 * Auth Module - Routes
 */

import { Router } from "express";
import passport from "passport";
import { AuthController } from "./controller";
import { requireAuth } from "./middleware";
import { validateInput } from "./validators";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./validators";
import { profileUpdateSchema } from "@/validators/auth";

const router = Router();

/**
 * Public routes
 */
router.get(
  "/config",
  AuthController.getConfig
);

router.post(
  "/register",
  (req, _res, next) => {
    req.body = validateInput(registerSchema, req.body);
    next();
  },
  AuthController.register
);

router.get(
  "/verify-email",
  (req, _res, next) => {
    req.body = validateInput(verifyEmailSchema, req.query);
    next();
  },
  AuthController.verifyEmail
);

router.post(
  "/login",
  (req, _res, next) => {
    req.body = validateInput(loginSchema, req.body);
    next();
  },
  AuthController.login
);

router.post(
  "/refresh",
  (req, _res, next) => {
    req.body = validateInput(refreshTokenSchema, req.body);
    next();
  },
  AuthController.refresh
);

// Alias used by the frontend client
router.post(
  "/refresh-token",
  (req, _res, next) => {
    req.body = validateInput(refreshTokenSchema, req.body);
    next();
  },
  AuthController.refresh
);

router.post(
  "/forgot-password",
  (req, _res, next) => {
    req.body = validateInput(forgotPasswordSchema, req.body);
    next();
  },
  AuthController.forgotPassword
);

router.post(
  "/verify-reset-token",
  (req, _res, next) => {
    req.body = {
      token: String(req.body.token || ""),
      email: String(req.body.email || ""),
    };
    next();
  },
  AuthController.verifyResetToken
);

router.post(
  "/reset-password",
  (req, _res, next) => {
    req.body = validateInput(resetPasswordSchema, req.body);
    next();
  },
  AuthController.resetPassword
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`,
    })(req, res, (err: any) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`);
      }
      next();
    });
  },
  AuthController.googleCallback
);

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`,
    })(req, res, (err: any) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`);
      }
      next();
    });
  },
  AuthController.githubCallback
);

/**
 * Protected routes (require authentication)
 */
router.use(requireAuth);

router.post(
  "/logout",
  AuthController.logout
);

router.get(
  "/me",
  AuthController.getMe
);

router.patch(
  "/me",
  (req, _res, next) => {
    req.body = validateInput(profileUpdateSchema, req.body);
    next();
  },
  AuthController.updateProfile
);

router.post(
  "/change-password",
  (req, _res, next) => {
    req.body = validateInput(changePasswordSchema, req.body);
    next();
  },
  AuthController.changePassword
);

// ── Account deletion ───────────────────────────────────────────────────────────
router.delete("/account", AuthController.deleteAccount);

// ── Password Management ────────────────────────────────────────────────────────
router.post(
  "/change-password",
  (req, _res, next) => {
    req.body = validateInput(changePasswordSchema, req.body);
    next();
  },
  AuthController.changePassword
);

// ── 2FA ───────────────────────────────────────────────────────────────────────
router.get("/2fa/status",  AuthController.get2FAStatus);
router.post("/2fa/setup",  AuthController.setup2FA);
router.post("/2fa/enable", AuthController.enable2FA);
router.post("/2fa/disable",AuthController.disable2FA);

export default router;
