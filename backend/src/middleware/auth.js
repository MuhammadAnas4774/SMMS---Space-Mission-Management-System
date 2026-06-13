/**
 * auth.js — JWT verification + RBAC middleware
 *
 * JWT payload shapes:
 *   Admin:  { user_id:0, username, role:"admin", role_name:"admin" }
 *   Person: { user_id:N, username, role:"astronaut"|"ground_control", role_name:same }
 *
 * req.user is set to the decoded payload on success.
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "smms-super-secret-change-in-prod";

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    // Normalise: ensure both role and role_name are present
    if (!req.user.role_name && req.user.role) req.user.role_name = req.user.role;
    if (!req.user.role      && req.user.role_name) req.user.role = req.user.role_name;
    next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token.";
    return res.status(401).json({ error: msg });
  }
}

/**
 * requireRole(...roles) — RBAC middleware
 * Checks both req.user.role and req.user.role_name for compatibility.
 *
 * Usage: router.delete("/users/:id", verifyToken, requireRole("admin"), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });
    const userRole = req.user.role || req.user.role_name;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, JWT_SECRET };
