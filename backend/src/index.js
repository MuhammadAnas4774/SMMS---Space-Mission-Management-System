/**
 * index.js — SMMS Express API Server
 * Includes: security headers, CORS, rate-limiting, JWT auth,
 *           generic CRUD + auth routes + dashboard
 */
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const pool      = require("./db");
const entities  = require("./entities");
const authRoutes   = require("./routes/authRoutes");
const personRoutes = require("./routes/personRoutes");
const { verifyToken, requireRole } = require("./middleware/auth");

const app  = express();
const PORT = Number(process.env.PORT || 5000);

/* ─── Security headers ─────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

/* ─── CORS ─────────────────────────────────────────────────── */
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

/* ─── Body parsing ──────────────────────────────────────────── */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* ─── Global rate limit ─────────────────────────────────────── */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
}));

/* ─── BigInt serialisation fix ─────────────────────────────── */
app.set("json replacer", (_key, value) =>
  typeof value === "bigint" ? Number(value) : value
);

/* ─── Utility functions ─────────────────────────────────────── */
function quoteIdent(name) {
  return "`" + String(name).replace(/`/g, "") + "`";
}

function buildListClause(req, cfg) {
  const search = req.query.search;
  const parts  = [];
  const params = [];
  if (search && cfg.searchable?.length) {
    parts.push(`(${cfg.searchable.map((col) => `${quoteIdent(col)} LIKE ?`).join(" OR ")})`);
    params.push(...cfg.searchable.map(() => `%${search}%`));
  }
  for (const col of cfg.filters || []) {
    const v = req.query[col];
    if (v !== undefined && v !== "") {
      parts.push(`${quoteIdent(col)} = ?`);
      params.push(v);
    }
  }
  return { clause: parts.length ? `WHERE ${parts.join(" AND ")}` : "", params };
}

function orderClause(cfg, req) {
  const sort = req.query.sort;
  const col  = cfg.sortable?.includes(sort) ? sort : cfg.pk;
  const dir  = String(req.query.dir).toLowerCase() === "asc" ? "ASC" : "DESC";
  return `${quoteIdent(col)} ${dir}`;
}

/* ═══════════════════════════════════════════════════════════════
   AUTH ROUTES  /api/auth/*
   ═══════════════════════════════════════════════════════════════ */
app.use("/api/auth", authRoutes);
app.use("/api/me",   personRoutes);  // role-filtered personal data endpoints

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD  (requires authentication)
   ═══════════════════════════════════════════════════════════════ */
app.get("/api/dashboard/summary", verifyToken, async (_req, res) => {
  try {
    const seen = new Set();
    const tableCounts = {};
    for (const cfg of Object.values(entities)) {
      if (seen.has(cfg.table)) continue;
      seen.add(cfg.table);
      const t = quoteIdent(cfg.table);
      const [r] = await pool.query(`SELECT COUNT(*) AS c FROM ${t}`);
      tableCounts[cfg.table] = Number(r[0]?.c ?? 0);
    }

    const [missionRows] = await pool.query(
      `SELECT MissionStatus, COUNT(*) AS cnt FROM \`MISSION\` GROUP BY MissionStatus`
    );
    const missionStatus = missionRows.map((row) => ({
      status: row.MissionStatus,
      count:  Number(row.cnt ?? 0),
    }));

    const [recentAlerts] = await pool.query(
      `SELECT AlertID, AlertType, Severity, Timestamp, Message, Acknowledged
       FROM \`ALERT\`
       ORDER BY Timestamp DESC
       LIMIT 10`
    );

    // User stats for admin dashboard (uses PERSON table — smms_users was removed)
    const [[userStats]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM PERSON WHERE IsActive = 1 AND IsDeleted = 0 AND Username IS NOT NULL) AS active_users,
         (SELECT COUNT(*) FROM PERSON WHERE IsDeleted = 0 AND Username IS NOT NULL)                  AS total_users,
         (SELECT COUNT(*) FROM smms_audit_log WHERE DATE(created_at) = CURDATE())                    AS today_actions`
    );

    res.json({ tableCounts, missionStatus, recentAlerts, userStats });
  } catch (error) {
    console.error("[dashboard]", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   SUB-RESOURCE ROUTES  (must be before generic /:entity/:id)
   ═══════════════════════════════════════════════════════════════ */
app.get("/api/missions/:missionId/assignments", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM \`MISSION_ASSIGNMENT\` WHERE MissionID = ? ORDER BY AssignmentID DESC`,
      [req.params.missionId]
    );
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/missions/:missionId/executions", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM \`EXPERIMENT_EXECUTION\` WHERE MissionID = ? ORDER BY ExecutionID DESC`,
      [req.params.missionId]
    );
    res.json({ data: rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/telemetry/:telemetryId/status", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM \`SYSTEM_STATUS\` WHERE TelemetryID = ?`,
      [req.params.telemetryId]
    );
    res.json(rows[0] || null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/persons/:personId/delete-impact", verifyToken, async (req, res) => {
  try {
    const id = req.params.personId;
    const [[a]] = await pool.query(`SELECT COUNT(*) AS c FROM \`ASTRONAUT\` WHERE PersonID = ?`, [id]);
    const [[g]] = await pool.query(`SELECT COUNT(*) AS c FROM \`GROUND_CONTROL\` WHERE PersonID = ?`, [id]);
    res.json({ astronautRows: Number(a?.c ?? 0), groundControlRows: Number(g?.c ?? 0) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/* ─── Health check ──────────────────────────────────────────── */
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   GENERIC CRUD  /api/:entity  (requires authentication)
   Write operations also require staff or admin role
   ═══════════════════════════════════════════════════════════════ */
app.get("/api/:entity", verifyToken, async (req, res) => {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).json({ error: "Unknown entity" });

  const page   = Math.max(1, Number(req.query.page  || 1));
  const limit  = Math.max(1, Number(req.query.limit || 25));
  const offset = (page - 1) * limit;
  const { clause, params } = buildListClause(req, cfg);
  const order  = orderClause(cfg, req);
  const tbl    = quoteIdent(cfg.table);

  try {
    const [rows]      = await pool.query(`SELECT * FROM ${tbl} ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM ${tbl} ${clause}`, params);
    const total       = Number(countRows[0]?.total ?? 0);
    res.json({ data: rows, total, page, limit });
  } catch (error) {
    console.error("[GET list]", req.params.entity, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/:entity/:id", verifyToken, async (req, res) => {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).json({ error: "Unknown entity" });
  try {
    const tbl = quoteIdent(cfg.table);
    const pk  = quoteIdent(cfg.pk);
    const [rows] = await pool.query(`SELECT * FROM ${tbl} WHERE ${pk} = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/:entity", verifyToken, requireRole("admin"), async (req, res) => {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).json({ error: "Unknown entity" });

  const payload = { ...req.body };
  delete payload[cfg.pk];
  const columns = Object.keys(payload);
  if (!columns.length) return res.status(400).json({ error: "Empty payload" });

  const tbl    = quoteIdent(cfg.table);
  const cols   = columns.map(quoteIdent).join(",");
  const values = columns.map((c) => payload[c]);

  try {
    const [result] = await pool.query(
      `INSERT INTO ${tbl} (${cols}) VALUES (${columns.map(() => "?").join(",")})`,
      values
    );
    const id  = result.insertId || req.body[cfg.pk];
    const pk  = quoteIdent(cfg.pk);
    const [rows] = await pool.query(`SELECT * FROM ${tbl} WHERE ${pk} = ?`, [id]);
    res.status(201).json(rows[0] || { ...payload, [cfg.pk]: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/:entity/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).json({ error: "Unknown entity" });

  const columns = Object.keys(req.body).filter((c) => c !== cfg.pk);
  if (!columns.length) return res.status(400).json({ error: "No fields to update" });

  const tbl = quoteIdent(cfg.table);
  const pk  = quoteIdent(cfg.pk);

  try {
    await pool.query(
      `UPDATE ${tbl} SET ${columns.map((c) => `${quoteIdent(c)}=?`).join(",")} WHERE ${pk}=?`,
      [...columns.map((c) => req.body[c]), req.params.id]
    );
    const [rows] = await pool.query(`SELECT * FROM ${tbl} WHERE ${pk}=?`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete("/api/:entity/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const cfg = entities[req.params.entity];
  if (!cfg) return res.status(404).json({ error: "Unknown entity" });

  const tbl = quoteIdent(cfg.table);
  const pk  = quoteIdent(cfg.pk);

  try {
    await pool.query(`DELETE FROM ${tbl} WHERE ${pk} = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    if (error.errno === 1451) {
      return res.status(409).json({
        error: "Cannot delete: other records still reference this row. Remove dependent records first.",
      });
    }
    res.status(400).json({ error: error.message });
  }
});

/* ─── 404 fallback ──────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

/* ─── Start server ──────────────────────────────────────────── */
app.listen(PORT, async () => {
  console.log(`\n  🚀 SMMS API running on http://localhost:${PORT}`);
  console.log(`  🔐 Auth routes: /api/auth/*`);
  console.log(`  📡 Data routes: /api/:entity`);
  console.log(`  🩺 Health check: /api/health\n`);
  try {
    await pool.query("SELECT 1");
    console.log("  ✅ Database connection: OK");
  } catch (err) {
    console.error("  ❌ Database connection failed:", err.message);
    if (err.code === "ER_BAD_DB_ERROR") {
      console.error("     Run: mysql -u root -p smms < backend/sql/01_complete_setup.sql");
      console.error("     Then: mysql -u root -p smms < backend/sql/04_auth_views_triggers.sql");
    }
  }
});
