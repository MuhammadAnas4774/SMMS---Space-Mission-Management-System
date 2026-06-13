/**
 * authController.js — Authentication business logic
 *
 * Architecture:
 *   - /api/auth/login        → PERSON entities only (astronaut, ground_control)
 *   - /api/auth/admin-login  → Single hardcoded admin from .env ONLY
 *
 * The admin is NOT in the PERSON table. PERSON credentials are
 * rejected on /admin-login, and admin credentials are rejected on /login.
 */
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const pool   = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const SALT_ROUNDS  = 12;
const JWT_EXPIRES  = "8h";
const JWT_REMEMBER = "30d";
const MAX_FAILED   = 5;
const LOCK_MINUTES = 15;

/* ─── Admin credentials (from env, never from DB) ──────────── */
const ADMIN_USERNAME      = process.env.ADMIN_USERNAME      || "admin";
const ADMIN_EMAIL         = process.env.ADMIN_EMAIL         || "admin@smms.space";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

if (!ADMIN_PASSWORD_HASH) {
  console.error("[CRITICAL] ADMIN_PASSWORD_HASH is not set in .env — admin login will be disabled!");
}

/* ─── helpers ─────────────────────────────────────────────── */
function signToken(payload, rememberMe = false) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? JWT_REMEMBER : JWT_EXPIRES,
  });
}

async function logAudit(userId, username, action, table, recordId, ip, status = "success", oldVal = null, newVal = null) {
  try {
    await pool.query(
      `INSERT INTO smms_audit_log
         (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        userId, username, action, table, recordId,
        oldVal ? JSON.stringify(oldVal) : null,
        newVal ? JSON.stringify(newVal) : null,
        ip, status,
      ]
    );
  } catch (_) { /* audit failure must not break request */ }
}

/* ─── adminLogin — /api/auth/admin-login ─────────────────── */
/**
 * Accepts ONLY the single hardcoded admin from .env.
 * Will REJECT any PERSON credentials even if they exist in the DB.
 */
async function adminLogin(req, res) {
  const { identifier, password, rememberMe } = req.body;
  const ip = req.ip;

  try {
    // Normalise identifier
    const id = (identifier || "").trim().toLowerCase();

    // Must match admin username or admin email exactly
    const usernameMatch = id === ADMIN_USERNAME.toLowerCase();
    const emailMatch    = id === ADMIN_EMAIL.toLowerCase();

    if (!usernameMatch && !emailMatch) {
      // Don't reveal whether an account exists
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!ADMIN_PASSWORD_HASH) {
      return res.status(503).json({ error: "Admin account not configured." });
    }

    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!passwordMatch) {
      await logAudit(null, identifier, "ADMIN_LOGIN", "env", null, ip, "failure");
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      user_id:   0,          // sentinel value — not a real DB row
      username:  ADMIN_USERNAME,
      full_name: "System Administrator",
      email:     ADMIN_EMAIL,
      role:      "admin",    // <-- "role" key, not "role_name"
      role_name: "admin",    // kept for backwards compat with middleware
      person_id: null,
      person_type: null,
    };

    const token = signToken(payload, !!rememberMe);
    await logAudit(null, ADMIN_USERNAME, "ADMIN_LOGIN", "env", null, ip, "success");

    return res.json({
      token,
      user: payload,
      message: "Welcome, Administrator.",
    });
  } catch (err) {
    console.error("[adminLogin]", err.message);
    return res.status(500).json({ error: "Login failed. " + err.message });
  }
}

/* ─── login — /api/auth/login (PERSON entities only) ────────── */
/**
 * Accepts ONLY astronaut / ground_control PERSON records.
 * Admin credentials will NEVER match here because admin is NOT in PERSON.
 */
async function login(req, res) {
  const { identifier, password, rememberMe } = req.body;
  const ip = req.ip;

  try {
    const id = (identifier || "").trim().toLowerCase();

    // Query PERSON table directly
    const [[person]] = await pool.query(
      `SELECT
         PersonID, Role, FirstName, LastName, Email, Username,
         PasswordHash, IsActive, ContactInfo,
         (SELECT COUNT(*) FROM PERSON p2
          WHERE p2.Username = p.Username
            AND p2.Username LIKE BINARY ?) AS failed_logins,
         LastLoginAt
       FROM PERSON p
       WHERE (LOWER(Username) = ? OR LOWER(Email) = ?)
         AND Username IS NOT NULL
       LIMIT 1`,
      [id, id, id]
    );

    if (!person) {
      await logAudit(null, identifier, "LOGIN", "PERSON", null, ip, "failure");
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!person.IsActive) {
      return res.status(403).json({ error: "Account disabled. Contact an administrator." });
    }

    // Validate role — only astronaut and ground_control allowed here
    if (!["astronaut", "ground_control"].includes(person.Role)) {
      return res.status(403).json({ error: "Invalid credentials." });
    }

    if (!person.PasswordHash) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const passwordMatch = await bcrypt.compare(password, person.PasswordHash);
    if (!passwordMatch) {
      await logAudit(person.PersonID, person.Username, "LOGIN", "PERSON", person.PersonID, ip, "failure");
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Update last login time
    await pool.query(
      "UPDATE PERSON SET LastLoginAt = NOW() WHERE PersonID = ?",
      [person.PersonID]
    );

    const payload = {
      user_id:     person.PersonID,
      username:    person.Username,
      full_name:   `${person.FirstName} ${person.LastName}`,
      email:       person.Email,
      role:        person.Role,          // "astronaut" | "ground_control"
      role_name:   person.Role,          // kept for middleware compatibility
      person_id:   person.PersonID,
      person_type: person.Role,
    };

    const token = signToken(payload, !!rememberMe);
    await logAudit(person.PersonID, person.Username, "LOGIN", "PERSON", person.PersonID, ip, "success");

    return res.json({
      token,
      user: payload,
      message: `Welcome back, ${person.FirstName}!`,
    });
  } catch (err) {
    console.error("[login]", err.message);
    return res.status(500).json({ error: "Login failed. " + err.message });
  }
}

/* ─── register — /api/auth/register (public self-registration) ── */
async function register(req, res) {
  const {
    username, email, password,
    first_name, last_name,
    role,           // 'astronaut' | 'ground_control'
    date_of_birth,
    gender,
    nationality,
    contact_info,
  } = req.body;
  const ip = req.ip;

  // Validate required fields
  if (!username || !email || !password || !first_name || !last_name || !role || !date_of_birth || !nationality) {
    return res.status(400).json({ error: "All required fields must be filled." });
  }

  if (!["astronaut", "ground_control"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'astronaut' or 'ground_control'." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check for duplicates
    const [[dup]] = await pool.query(
      "SELECT PersonID FROM PERSON WHERE (Username = ? OR Email = ?) AND IsDeleted = 0 LIMIT 1",
      [username, email]
    );
    if (dup) return res.status(409).json({ error: "Username or email already in use." });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO PERSON
         (Role, Username, Email, PasswordHash, FirstName, LastName,
          DateOfBirth, Gender, Nationality, ContactInfo, IsActive, CreatedAt, UpdatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [role, username, email, passwordHash, first_name, last_name,
       date_of_birth, gender || null, nationality, contact_info || null]
    );

    const newId = result.insertId;

    if (role === "astronaut") {
      await pool.query("INSERT INTO ASTRONAUT (PersonID) VALUES (?)", [newId]);
    } else {
      await pool.query("INSERT INTO GROUND_CONTROL (PersonID) VALUES (?)", [newId]);
    }

    await logAudit(null, username, "REGISTER", "PERSON", newId, ip, "success");
    return res.status(201).json({ message: "Account created successfully. You can now log in." });
  } catch (err) {
    console.error("[register]", err.message);
    return res.status(500).json({ error: "Registration failed. " + err.message });
  }
}

/* ─── me (current user from token) ──────────────────────────── */
async function me(req, res) {
  try {
    // Admin is not in DB — return from token payload directly
    if (req.user.role_name === "admin") {
      return res.json({
        user_id:   req.user.user_id,
        username:  req.user.username,
        full_name: req.user.full_name,
        email:     req.user.email,
        role_name: "admin",
        person_id: null,
        person_type: null,
      });
    }

    // For PERSON entities, re-fetch fresh data
    const [[person]] = await pool.query(
      `SELECT PersonID, Role, FirstName, LastName, Email, Username,
              IsActive, LastLoginAt, CreatedAt, ContactInfo
       FROM PERSON WHERE PersonID = ? AND IsDeleted = 0`,
      [req.user.user_id]
    );
    if (!person) return res.status(404).json({ error: "User not found." });

    return res.json({
      user_id:     person.PersonID,
      username:    person.Username,
      full_name:   `${person.FirstName} ${person.LastName}`,
      email:       person.Email,
      role_name:   person.Role,
      role:        person.Role,
      person_id:   person.PersonID,
      person_type: person.Role,
      is_active:   person.IsActive,
      last_login_at: person.LastLoginAt,
      created_at:  person.CreatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── logout ─────────────────────────────────────────────────── */
async function logout(req, res) {
  await logAudit(req.user.user_id || null, req.user.username, "LOGOUT", "token", null, req.ip);
  return res.json({ message: "Logged out successfully." });
}

/* ─── changePassword (PERSON only) ──────────────────────────── */
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  const userId = req.user.user_id;

  // Admin cannot change password through this endpoint
  if (req.user.role_name === "admin") {
    return res.status(403).json({ error: "Admin password must be changed via environment configuration." });
  }

  try {
    const [[person]] = await pool.query(
      "SELECT PasswordHash FROM PERSON WHERE PersonID = ?",
      [userId]
    );
    if (!person) return res.status(404).json({ error: "User not found." });

    const match = await bcrypt.compare(current_password, person.PasswordHash);
    if (!match) return res.status(400).json({ error: "Current password is incorrect." });

    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await pool.query("UPDATE PERSON SET PasswordHash = ? WHERE PersonID = ?", [hash, userId]);
    await logAudit(userId, req.user.username, "CHANGE_PASSWORD", "PERSON", userId, req.ip);
    return res.json({ message: "Password changed successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── updateProfile (PERSON only) ───────────────────────────── */
async function updateProfile(req, res) {
  const { first_name, last_name, email, contact_info } = req.body;
  const userId = req.user.user_id;

  if (req.user.role_name === "admin") {
    return res.status(403).json({ error: "Admin profile is managed via environment configuration." });
  }

  try {
    if (email) {
      const [[dup]] = await pool.query(
        "SELECT PersonID FROM PERSON WHERE Email = ? AND PersonID != ?",
        [email, userId]
      );
      if (dup) return res.status(409).json({ error: "Email already in use." });
    }

    await pool.query(
      `UPDATE PERSON SET
         FirstName   = COALESCE(?, FirstName),
         LastName    = COALESCE(?, LastName),
         Email       = COALESCE(?, Email),
         ContactInfo = COALESCE(?, ContactInfo),
         UpdatedAt   = NOW()
       WHERE PersonID = ?`,
      [first_name || null, last_name || null, email || null, contact_info || null, userId]
    );

    await logAudit(userId, req.user.username, "UPDATE_PROFILE", "PERSON", userId, req.ip);
    const [[updated]] = await pool.query(
      "SELECT PersonID, FirstName, LastName, Email, Username, ContactInfo, Role FROM PERSON WHERE PersonID = ?",
      [userId]
    );
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── listUsers — admin: list all PERSON accounts ───────────── */
async function listUsers(req, res) {
  const page   = Math.max(1, Number(req.query.page  || 1));
  const limit  = Math.max(1, Number(req.query.limit || 20));
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  try {
    const [rows] = await pool.query(
      `SELECT
         p.PersonID AS user_id,
         p.Username AS username,
         p.Email    AS email,
         CONCAT(p.FirstName, ' ', p.LastName) AS full_name,
         p.Role     AS role_name,
         p.IsActive AS is_active,
         p.LastLoginAt AS last_login_at,
         p.CreatedAt   AS created_at,
         p.ContactInfo AS phone,
         p.PersonID    AS person_id
       FROM PERSON p
       WHERE p.Username IS NOT NULL AND p.IsDeleted = 0
         AND (
           p.Username LIKE ? OR p.Email LIKE ?
           OR CONCAT(p.FirstName, ' ', p.LastName) LIKE ?
         )
       ORDER BY p.CreatedAt DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM PERSON
       WHERE Username IS NOT NULL AND IsDeleted = 0
         AND (Username LIKE ? OR Email LIKE ? OR CONCAT(FirstName,' ',LastName) LIKE ?)`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return res.json({ data: rows, total: Number(total), page, limit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── createPersonUser — admin: create new PERSON with login ─── */
async function createPersonUser(req, res) {
  const {
    username, email, password, first_name, last_name,
    role, date_of_birth, gender, nationality, contact_info,
  } = req.body;

  // Admin can only create astronaut or ground_control — NEVER another admin
  if (!["astronaut", "ground_control"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'astronaut' or 'ground_control'. Cannot create admin accounts." });
  }

  try {
    // Duplicate check
    const [[dup]] = await pool.query(
      "SELECT PersonID FROM PERSON WHERE (Username = ? OR Email = ?) AND IsDeleted = 0 LIMIT 1",
      [username, email]
    );
    if (dup) return res.status(409).json({ error: "Username or email already exists." });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into PERSON
    const [personResult] = await pool.query(
      `INSERT INTO PERSON
         (Role, Username, Email, PasswordHash, FirstName, LastName,
          DateOfBirth, Gender, Nationality, ContactInfo, IsActive, CreatedAt, UpdatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [role, username, email, passwordHash, first_name, last_name,
       date_of_birth || null, gender || null, nationality || null, contact_info || null]
    );

    const newPersonId = personResult.insertId;

    // Insert into sub-type table
    if (role === "astronaut") {
      await pool.query(
        "INSERT INTO ASTRONAUT (PersonID) VALUES (?)",
        [newPersonId]
      );
    } else {
      await pool.query(
        "INSERT INTO GROUND_CONTROL (PersonID) VALUES (?)",
        [newPersonId]
      );
    }

    await logAudit(req.user.user_id, req.user.username, "CREATE_USER", "PERSON", newPersonId, req.ip, "success", null, { username, email, role });

    return res.status(201).json({ message: "Account created successfully.", person_id: newPersonId });
  } catch (err) {
    console.error("[createPersonUser]", err.message);
    return res.status(500).json({ error: "Failed to create user. " + err.message });
  }
}

/* ─── updateUserRole — admin: update PERSON account ─────────── */
async function updateUserRole(req, res) {
  const { role, is_active } = req.body;
  const targetId = Number(req.params.id);

  // Never allow setting role to admin through this endpoint
  if (role === "admin") {
    return res.status(400).json({ error: "Cannot assign admin role. There is exactly one hardcoded admin." });
  }

  if (role && !["astronaut", "ground_control"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'astronaut' or 'ground_control'." });
  }

  try {
    const updates = [];
    const params  = [];

    if (role !== undefined) { updates.push("Role = ?"); params.push(role); }
    if (is_active !== undefined) { updates.push("IsActive = ?"); params.push(is_active ? 1 : 0); }

    if (!updates.length) return res.status(400).json({ error: "No fields to update." });

    params.push(targetId);
    await pool.query(
      `UPDATE PERSON SET ${updates.join(", ")}, UpdatedAt = NOW() WHERE PersonID = ?`,
      params
    );

    await logAudit(req.user.user_id, req.user.username, "UPDATE_USER", "PERSON", targetId, req.ip, "success", null, { role, is_active });
    return res.json({ message: "User updated successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── deleteUser — admin: soft-delete a PERSON account ──────── */
async function deleteUser(req, res) {
  const targetId = Number(req.params.id);
  try {
    await pool.query(
      "UPDATE PERSON SET IsDeleted = 1, IsActive = 0, UpdatedAt = NOW() WHERE PersonID = ?",
      [targetId]
    );
    await logAudit(req.user.user_id, req.user.username, "DELETE_USER", "PERSON", targetId, req.ip);
    return res.json({ message: "User account deactivated." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── getAuditLog (admin only) ───────────────────────────────── */
async function getAuditLog(req, res) {
  const limit  = Math.max(1, Number(req.query.limit || 50));
  const page   = Math.max(1, Number(req.query.page  || 1));
  const offset = (page - 1) * limit;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM smms_audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM smms_audit_log");
    return res.json({ data: rows, total: Number(total), page, limit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── getView (admin only) ───────────────────────────────────── */
async function getView(req, res) {
  const ALLOWED_VIEWS = {
    "active-users":          "vw_active_users",
    "mission-activity":      "vw_mission_activity",
    "personnel-overview":    "vw_personnel_overview",
    "equipment-maintenance": "vw_equipment_maintenance",
    "critical-alerts":       "vw_critical_alerts",
    "spacecraft-status":     "vw_spacecraft_status",
    "experiment-analytics":  "vw_experiment_analytics",
    "audit-summary":         "vw_audit_summary",
  };
  const viewName = ALLOWED_VIEWS[req.params.name];
  if (!viewName) return res.status(404).json({ error: "Unknown view." });

  try {
    const [rows] = await pool.query(`SELECT * FROM \`${viewName}\` LIMIT 200`);
    return res.json({ data: rows, view: req.params.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── forgotPassword (PERSON only) ─────────────────────────────── */
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const [[person]] = await pool.query("SELECT PersonID, Username FROM PERSON WHERE Email = ? AND IsDeleted = 0", [email]);
    if (!person) {
      // Don't leak whether email exists or not
      return res.json({ message: "If an account exists, a password reset link has been generated." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE PERSON SET ResetToken = ?, ResetExpires = ? WHERE PersonID = ?",
      [resetToken, expires, person.PersonID]
    );

    await logAudit(person.PersonID, person.Username, "FORGOT_PASSWORD", "PERSON", person.PersonID, req.ip, "success");

    // In a real app, send an email here. For this project, we return the link.
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    return res.json({ 
      message: "If an account exists, a password reset link has been generated.",
      mockLink: resetLink // FOR DEMONSTRATION PURPOSES ONLY
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ─── resetPassword (PERSON only) ──────────────────────────────── */
async function resetPassword(req, res) {
  const { token, new_password } = req.body;
  
  if (!token || !new_password) {
    return res.status(400).json({ error: "Token and new password are required." });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const [[person]] = await pool.query(
      "SELECT PersonID, Username FROM PERSON WHERE ResetToken = ? AND ResetExpires > NOW()",
      [token]
    );

    if (!person) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    
    await pool.query(
      "UPDATE PERSON SET PasswordHash = ?, ResetToken = NULL, ResetExpires = NULL WHERE PersonID = ?",
      [hash, person.PersonID]
    );

    await logAudit(person.PersonID, person.Username, "RESET_PASSWORD", "PERSON", person.PersonID, req.ip, "success");

    return res.json({ message: "Password has been successfully reset. You can now log in." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  login, adminLogin, register, me, logout,
  changePassword, updateProfile, forgotPassword, resetPassword,
  listUsers, createPersonUser, updateUserRole, deleteUser,
  getAuditLog, getView,
};
