/**
 * personRoutes.js — /api/me/* personal data endpoints
 *
 * Role-based filtering enforced server-side:
 *   operator  → filtered by their linked person_id (astronaut)
 *   staff     → full access to all data (ground control)
 *   admin     → full access to all data
 *
 * Never trust client for role/person_id — always read from req.user (JWT).
 */
const router = require("express").Router();
const pool   = require("../db");
const { verifyToken } = require("../middleware/auth");

/* ── All /api/me/* routes require a valid token ─────────────── */
router.use(verifyToken);

/* ── Helper: derive person_type from DB (used by routes) ────── */
async function getPersonType(personId) {
  if (!personId) return null;
  const [[a]]  = await pool.query("SELECT PersonID FROM `ASTRONAUT` WHERE PersonID = ?", [personId]);
  const [[gc]] = await pool.query("SELECT PersonID FROM `GROUND_CONTROL` WHERE PersonID = ?", [personId]);
  if (a && gc) return "both";
  if (a)       return "astronaut";
  if (gc)      return "ground_control";
  return null;
}

/* ─────────────────────────────────────────────────────────────
   GET /api/me/profile
   Returns the PERSON record linked to this user (if any)
   ───────────────────────────────────────────────────────────── */
router.get("/profile", async (req, res) => {
  const { person_id, role_name } = req.user;
  if (!person_id) return res.json({ person: null, person_type: null, message: "No person record linked to this account." });

  try {
    const [[person]] = await pool.query(
      `SELECT p.*,
         CASE WHEN a.PersonID IS NOT NULL AND gc.PersonID IS NOT NULL THEN 'both'
              WHEN a.PersonID IS NOT NULL THEN 'astronaut'
              WHEN gc.PersonID IS NOT NULL THEN 'ground_control'
              ELSE NULL END AS person_type
       FROM \`PERSON\` p
       LEFT JOIN \`ASTRONAUT\`      a  ON a.PersonID  = p.PersonID
       LEFT JOIN \`GROUND_CONTROL\` gc ON gc.PersonID = p.PersonID
       WHERE p.PersonID = ?`,
      [person_id]
    );
    if (!person) return res.status(404).json({ error: "Person record not found." });

    // If astronaut, also fetch astronaut details
    let astronaut = null, groundControl = null;
    if (person.person_type === "astronaut" || person.person_type === "both") {
      const [[a]] = await pool.query("SELECT * FROM `ASTRONAUT` WHERE PersonID = ?", [person_id]);
      astronaut = a || null;
    }
    if (person.person_type === "ground_control" || person.person_type === "both") {
      const [[gc]] = await pool.query("SELECT * FROM `GROUND_CONTROL` WHERE PersonID = ?", [person_id]);
      groundControl = gc || null;
    }

    return res.json({ person, astronaut, groundControl, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/missions
   operator  → missions where this astronaut is assigned
   staff/admin → all missions
   ───────────────────────────────────────────────────────────── */
router.get("/missions", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT m.*, ma.PrimaryResponsibility, ma.Status AS AssignmentStatus, ma.EVAHoursPlanned
         FROM \`MISSION\` m
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = m.MissionID
         WHERE ma.AstronautID = ? AND m.IsDeleted = FALSE
         ORDER BY m.LaunchDateTime DESC`,
        [person_id]
      );
    } else {
      // staff / admin — all missions
      [rows] = await pool.query(
        `SELECT * FROM \`MISSION\` WHERE IsDeleted = FALSE ORDER BY LaunchDateTime DESC`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/spacecraft
   operator  → spacecraft assigned to their missions
   staff/admin → all spacecraft
   ───────────────────────────────────────────────────────────── */
router.get("/spacecraft", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT DISTINCT sc.*
         FROM \`SPACECRAFT\` sc
         JOIN \`SPACECRAFT_MISSION\` sm  ON sm.SpacecraftID = sc.SpacecraftID
         JOIN \`MISSION_ASSIGNMENT\` ma  ON ma.MissionID    = sm.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY sc.Name`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(`SELECT * FROM \`SPACECRAFT\` ORDER BY Name`);
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/experiments
   operator  → experiment executions on their missions
   staff/admin → all experiment executions (status + summary)
   ───────────────────────────────────────────────────────────── */
router.get("/experiments", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT ee.*, e.Title, e.Objective
         FROM \`EXPERIMENT_EXECUTION\` ee
         JOIN \`EXPERIMENT\` e ON e.ExperimentID = ee.ExperimentID
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = ee.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY ee.ScheduledStart DESC`,
        [person_id]
      );
    } else {
      // staff — status overview only (no sensitive experiment data)
      [rows] = await pool.query(
        `SELECT ee.ExecutionID, ee.MissionID, ee.ExperimentID,
                e.Title, e.Objective,
                ee.Status, ee.SuccessRating, ee.ScheduledStart, ee.ScheduledEnd,
                ee.DataVolumeGenerated
         FROM \`EXPERIMENT_EXECUTION\` ee
         JOIN \`EXPERIMENT\` e ON e.ExperimentID = ee.ExperimentID
         ORDER BY ee.ScheduledStart DESC`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/alerts
   operator  → alerts for their assigned spacecraft's telemetry
   staff/admin → all alerts
   ───────────────────────────────────────────────────────────── */
router.get("/alerts", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT DISTINCT a.*
         FROM \`ALERT\` a
         JOIN \`TELEMETRY_DATA\`     td ON td.TelemetryID  = a.TelemetryID
         JOIN \`SPACECRAFT_MISSION\` sm ON sm.SpacecraftID = td.SpacecraftID
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID    = sm.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY a.Timestamp DESC`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`ALERT\` ORDER BY Timestamp DESC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/events
   operator  → scheduled events on their missions
   staff/admin → all scheduled events
   ───────────────────────────────────────────────────────────── */
router.get("/events", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT se.*
         FROM \`SCHEDULED_EVENT\` se
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = se.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY se.PlannedStartTime ASC`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`SCHEDULED_EVENT\` ORDER BY PlannedStartTime ASC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/telemetry
   staff/admin → all telemetry (operators do not access telemetry directly)
   ───────────────────────────────────────────────────────────── */
router.get("/telemetry", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      // Operators see telemetry for their spacecraft only
      [rows] = await pool.query(
        `SELECT DISTINCT td.*
         FROM \`TELEMETRY_DATA\` td
         JOIN \`SPACECRAFT_MISSION\` sm ON sm.SpacecraftID = td.SpacecraftID
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID    = sm.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY td.Timestamp DESC LIMIT 100`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`TELEMETRY_DATA\` ORDER BY Timestamp DESC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/mission_assignments
   operator  → only their own assignment rows
   staff/admin → all assignments
   ───────────────────────────────────────────────────────────── */
router.get("/mission_assignments", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT ma.*
         FROM \`MISSION_ASSIGNMENT\` ma
         WHERE ma.AstronautID = ?
         ORDER BY ma.AssignmentID DESC`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`MISSION_ASSIGNMENT\` ORDER BY AssignmentID DESC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/spacecraft_missions
   operator  → only spacecraft-mission links for their missions
   staff/admin → all links
   ───────────────────────────────────────────────────────────── */
router.get("/spacecraft_missions", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT DISTINCT sm.*
         FROM \`SPACECRAFT_MISSION\` sm
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = sm.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY sm.SMCID DESC`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`SPACECRAFT_MISSION\` ORDER BY SMCID DESC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/experiment_executions
   operator  → only executions on their missions
   staff/admin → all executions
   ───────────────────────────────────────────────────────────── */
router.get("/experiment_executions", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    let rows;
    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      [rows] = await pool.query(
        `SELECT ee.*
         FROM \`EXPERIMENT_EXECUTION\` ee
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = ee.MissionID
         WHERE ma.AstronautID = ?
         ORDER BY ee.ExecutionID DESC`,
        [person_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM \`EXPERIMENT_EXECUTION\` ORDER BY ExecutionID DESC LIMIT 200`
      );
    }
    return res.json({ data: rows, total: rows.length, role_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/me/summary
   Quick stats for the person dashboard
   ───────────────────────────────────────────────────────────── */
router.get("/summary", async (req, res) => {
  const { person_id, role_name } = req.user;
  try {
    const summary = {};

    if (["astronaut", "ground_control"].includes(role_name) && person_id) {
      // Astronaut stats
      const [[missionCount]] = await pool.query(
        `SELECT COUNT(DISTINCT m.MissionID) AS cnt
         FROM \`MISSION\` m
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = m.MissionID
         WHERE ma.AstronautID = ? AND m.IsDeleted = FALSE`,
        [person_id]
      );
      const [[scCount]] = await pool.query(
        `SELECT COUNT(DISTINCT sc.SpacecraftID) AS cnt
         FROM \`SPACECRAFT\` sc
         JOIN \`SPACECRAFT_MISSION\` sm  ON sm.SpacecraftID = sc.SpacecraftID
         JOIN \`MISSION_ASSIGNMENT\` ma  ON ma.MissionID    = sm.MissionID
         WHERE ma.AstronautID = ?`,
        [person_id]
      );
      const [[expCount]] = await pool.query(
        `SELECT COUNT(DISTINCT ee.ExecutionID) AS cnt
         FROM \`EXPERIMENT_EXECUTION\` ee
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID = ee.MissionID
         WHERE ma.AstronautID = ?`,
        [person_id]
      );
      const [[alertCount]] = await pool.query(
        `SELECT COUNT(DISTINCT a.AlertID) AS cnt
         FROM \`ALERT\` a
         JOIN \`TELEMETRY_DATA\` td     ON td.TelemetryID  = a.TelemetryID
         JOIN \`SPACECRAFT_MISSION\` sm ON sm.SpacecraftID = td.SpacecraftID
         JOIN \`MISSION_ASSIGNMENT\` ma ON ma.MissionID    = sm.MissionID
         WHERE ma.AstronautID = ? AND a.Acknowledged = FALSE`,
        [person_id]
      );

      summary.missions    = Number(missionCount?.cnt ?? 0);
      summary.spacecraft  = Number(scCount?.cnt ?? 0);
      summary.experiments = Number(expCount?.cnt ?? 0);
      summary.openAlerts  = Number(alertCount?.cnt ?? 0);

    } else {
      // Staff / admin — system-wide stats
      const [[ms]] = await pool.query(
        `SELECT COUNT(*) AS total,
                SUM(MissionStatus = 'Active') AS active
         FROM \`MISSION\` WHERE IsDeleted = FALSE`
      );
      const [[sc]] = await pool.query(`SELECT COUNT(*) AS total FROM \`SPACECRAFT\``);
      const [[al]] = await pool.query(
        `SELECT COUNT(*) AS total FROM \`ALERT\` WHERE Acknowledged = FALSE AND Severity IN ('High','Critical')`
      );
      const [[ev]] = await pool.query(`SELECT COUNT(*) AS total FROM \`SCHEDULED_EVENT\``);

      summary.totalMissions  = Number(ms?.total ?? 0);
      summary.activeMissions = Number(ms?.active ?? 0);
      summary.spacecraft     = Number(sc?.total ?? 0);
      summary.criticalAlerts = Number(al?.total ?? 0);
      summary.events         = Number(ev?.total ?? 0);
    }

    return res.json({ summary, role_name, person_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
