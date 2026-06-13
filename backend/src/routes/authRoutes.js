/**
 * authRoutes.js — All /api/auth/* endpoints
 *
 * PUBLIC:
 *   POST /api/auth/login        — PERSON entities only (astronaut / ground_control)
 *   POST /api/auth/admin-login  — Single hardcoded admin ONLY
 *
 * AUTHENTICATED (any valid token):
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *   PUT  /api/auth/profile
 *   PUT  /api/auth/change-password
 *
 * ADMIN-ONLY:
 *   GET    /api/auth/users
 *   POST   /api/auth/users          — create astronaut / ground_control (NOT admin)
 *   PUT    /api/auth/users/:id/role
 *   DELETE /api/auth/users/:id
 *   GET    /api/auth/audit-log
 *   GET    /api/auth/views/:name
 */
const router    = require("express").Router();
const rateLimit = require("express-rate-limit");
const { verifyToken, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/authController");

/* ── Rate limiters ──────────────────────────────────────────── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 10,
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many requests. Please slow down." },
});

/* ── Public: person login ───────────────────────────────────── */
router.post("/login",       loginLimiter, ctrl.login);

/* ── Public: admin-only login (separate endpoint) ───────────── */
router.post("/admin-login", loginLimiter, ctrl.adminLogin);

/* ── Public: self-registration ───────────────────────────────── */
router.post("/register",    loginLimiter, ctrl.register);

/* ── Public: forgot / reset password ───────────────────────── */
router.post("/forgot-password", generalLimiter, ctrl.forgotPassword);
router.post("/reset-password",  generalLimiter, ctrl.resetPassword);

/* ── Authenticated routes ────────────────────────────────────── */
router.get( "/me",               verifyToken, ctrl.me);
router.post("/logout",           verifyToken, ctrl.logout);
router.put( "/profile",          verifyToken, ctrl.updateProfile);
router.put( "/change-password",  verifyToken, ctrl.changePassword);

/* ── Admin-only routes ───────────────────────────────────────── */
router.get(   "/users",          verifyToken, requireRole("admin"), ctrl.listUsers);
router.post(  "/users",          verifyToken, requireRole("admin"), ctrl.createPersonUser);   // create astronaut/gc — NOT admin
router.put(   "/users/:id/role", verifyToken, requireRole("admin"), ctrl.updateUserRole);
router.delete("/users/:id",      verifyToken, requireRole("admin"), ctrl.deleteUser);
router.get(   "/audit-log",      verifyToken, requireRole("admin"), ctrl.getAuditLog);

/* ── Views (admin only) ──────────────────────────────────────── */
router.get("/views/:name",       verifyToken, requireRole("admin"), ctrl.getView);

module.exports = router;
