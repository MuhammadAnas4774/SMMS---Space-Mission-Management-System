-- ================================================================
-- SMMS AUTH EXTENSION: Users, Roles, Audit Logs, Views,
--                      Stored Procedures & Triggers
-- ================================================================
-- Run AFTER 01_complete_setup.sql
-- Usage: mysql -u root -p smms < backend/sql/04_auth_views_triggers.sql
-- ================================================================

USE smms;

-- ================================================================
-- SECTION 1: ROLES & PERMISSIONS TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS smms_roles (
  role_id   INT          PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(30)  NOT NULL UNIQUE,
  description VARCHAR(200),
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='System roles for RBAC';

INSERT IGNORE INTO smms_roles (role_name, description) VALUES
  ('admin',    'Full system access — can manage users, missions, settings and view all reports'),
  ('staff',    'Operational staff — can update data and process tasks, cannot modify system settings'),
  ('operator', 'Mission operator — read-only access to missions and telemetry');

-- ================================================================
-- SECTION 2: USERS TABLE (Authentication)
-- ================================================================

CREATE TABLE IF NOT EXISTS smms_users (
  user_id        INT           PRIMARY KEY AUTO_INCREMENT,
  username       VARCHAR(50)   NOT NULL UNIQUE,
  email          VARCHAR(120)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  full_name      VARCHAR(100)  NOT NULL,
  role_id        INT           NOT NULL DEFAULT 2,       -- default: staff
  avatar_url     VARCHAR(300)  DEFAULT NULL,
  phone          VARCHAR(20)   DEFAULT NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at  DATETIME      DEFAULT NULL,
  failed_logins  TINYINT       NOT NULL DEFAULT 0,
  locked_until   DATETIME      DEFAULT NULL,
  reset_token    VARCHAR(255)  DEFAULT NULL,
  reset_expires  DATETIME      DEFAULT NULL,
  remember_token VARCHAR(255)  DEFAULT NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_role FOREIGN KEY (role_id)
    REFERENCES smms_roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT chk_users_email   CHECK (email REGEXP '^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_users_phone   CHECK (phone IS NULL OR phone REGEXP '^[+]?[0-9 \\-()]{7,20}$'),
  CONSTRAINT chk_users_uname   CHECK (username REGEXP '^[A-Za-z0-9_]{3,50}$'),

  INDEX idx_users_email    (email),
  INDEX idx_users_role     (role_id),
  INDEX idx_users_username (username),
  INDEX idx_users_active   (is_active)
) ENGINE=InnoDB COMMENT='Authenticated system users';

-- ================================================================
-- SECTION 3: AUDIT LOG TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS smms_audit_log (
  log_id       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id      INT           DEFAULT NULL,
  username     VARCHAR(50)   DEFAULT NULL,        -- denormalized for fast reads
  action       VARCHAR(50)   NOT NULL,            -- INSERT / UPDATE / DELETE / LOGIN / LOGOUT
  table_name   VARCHAR(80)   DEFAULT NULL,
  record_id    VARCHAR(40)   DEFAULT NULL,        -- PK of affected row
  old_values   JSON          DEFAULT NULL,
  new_values   JSON          DEFAULT NULL,
  ip_address   VARCHAR(45)   DEFAULT NULL,
  user_agent   VARCHAR(255)  DEFAULT NULL,
  status       ENUM('success','failure') NOT NULL DEFAULT 'success',
  notes        TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES smms_users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_audit_user      (user_id),
  INDEX idx_audit_action    (action),
  INDEX idx_audit_table     (table_name),
  INDEX idx_audit_created   (created_at),
  INDEX idx_audit_status    (status)
) ENGINE=InnoDB COMMENT='Immutable audit trail for all data changes';

-- ================================================================
-- SECTION 4: SESSIONS TABLE (persistent remember-me tokens)
-- ================================================================

CREATE TABLE IF NOT EXISTS smms_sessions (
  session_id    VARCHAR(128)  PRIMARY KEY,
  user_id       INT           NOT NULL,
  ip_address    VARCHAR(45)   DEFAULT NULL,
  user_agent    VARCHAR(255)  DEFAULT NULL,
  expires_at    DATETIME      NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES smms_users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_sessions_user    (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB COMMENT='Persistent login sessions';

-- ================================================================
-- SECTION 5: SEED DEFAULT ADMIN USER
-- password = "Admin@1234"  (bcrypt hash — re-hash before production)
-- ================================================================

INSERT IGNORE INTO smms_users
  (username, email, password_hash, full_name, role_id, is_active)
VALUES
  ('admin',
   'admin@smms.space',
   '$2b$12$KPpfzLBjJ0kKHC.f3.s8SeGbB9Z.X5GZq5y0QFjVRl4oG3nVdE/pK',
   'System Administrator',
   1,
   TRUE),
  ('staff01',
   'staff01@smms.space',
   '$2b$12$KPpfzLBjJ0kKHC.f3.s8SeGbB9Z.X5GZq5y0QFjVRl4oG3nVdE/pK',
   'Operations Staff',
   2,
   TRUE),
  ('operator01',
   'operator01@smms.space',
   '$2b$12$KPpfzLBjJ0kKHC.f3.s8SeGbB9Z.X5GZq5y0QFjVRl4oG3nVdE/pK',
   'Mission Operator',
   3,
   TRUE);

-- ================================================================
-- SECTION 6: VIEWS
-- ================================================================

-- 6.1 Active Users (logged in within last 30 days)
CREATE OR REPLACE VIEW vw_active_users AS
SELECT
  u.user_id,
  u.username,
  u.full_name,
  u.email,
  r.role_name,
  u.last_login_at,
  u.is_active
FROM smms_users u
JOIN smms_roles r ON r.role_id = u.role_id
WHERE u.is_active = TRUE
  AND u.last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 6.2 Mission Activity Summary
CREATE OR REPLACE VIEW vw_mission_activity AS
SELECT
  m.MissionID,
  m.MissionName,
  m.MissionType,
  m.MissionStatus,
  m.LaunchDateTime,
  m.Budget,
  m.RiskLevel,
  COUNT(DISTINCT ma.AstronautID)   AS astronaut_count,
  COUNT(DISTINCT sm.SpacecraftID)  AS spacecraft_count,
  COUNT(DISTINCT ee.ExperimentID)  AS experiment_count,
  COUNT(DISTINCT se.EventID)       AS event_count
FROM MISSION m
LEFT JOIN MISSION_ASSIGNMENT     ma ON ma.MissionID = m.MissionID
LEFT JOIN SPACECRAFT_MISSION     sm ON sm.MissionID = m.MissionID
LEFT JOIN EXPERIMENT_EXECUTION   ee ON ee.MissionID = m.MissionID
LEFT JOIN SCHEDULED_EVENT        se ON se.MissionID = m.MissionID
WHERE m.IsDeleted = FALSE
GROUP BY m.MissionID;

-- 6.3 Personnel Overview (persons + role)
CREATE OR REPLACE VIEW vw_personnel_overview AS
SELECT
  p.PersonID,
  CONCAT(p.FirstName, ' ', p.LastName) AS full_name,
  p.Nationality,
  p.Gender,
  p.ContactInfo,
  CASE
    WHEN a.PersonID IS NOT NULL AND gc.PersonID IS NOT NULL THEN 'Both'
    WHEN a.PersonID  IS NOT NULL THEN 'Astronaut'
    WHEN gc.PersonID IS NOT NULL THEN 'Ground Control'
    ELSE 'Unassigned'
  END AS personnel_type,
  COALESCE(a.Role,  gc.Role)  AS role,
  COALESCE(a.Department, gc.Department) AS department,
  COALESCE(a.HealthStatus, 'N/A') AS health_status
FROM PERSON p
LEFT JOIN ASTRONAUT      a  ON a.PersonID  = p.PersonID
LEFT JOIN GROUND_CONTROL gc ON gc.PersonID = p.PersonID
WHERE p.IsDeleted = FALSE;

-- 6.4 Low-Calibration Equipment (overdue calibration)
CREATE OR REPLACE VIEW vw_equipment_maintenance AS
SELECT
  e.EquipmentID,
  e.EquipmentName,
  e.EquipmentType,
  e.SerialNumber,
  e.Status,
  e.Location,
  e.CalibrationDate,
  e.WarrantyExpiry,
  DATEDIFF(CURDATE(), e.CalibrationDate)  AS days_since_calibration,
  DATEDIFF(e.WarrantyExpiry, CURDATE())   AS warranty_days_remaining,
  ss.StationName,
  sc.Name AS spacecraft_name
FROM EQUIPMENT e
LEFT JOIN SPACE_STATION ss ON ss.StationID   = e.StationID
LEFT JOIN SPACECRAFT    sc ON sc.SpacecraftID = e.SpacecraftID
WHERE e.CalibrationDate < DATE_SUB(CURDATE(), INTERVAL 365 DAY)
   OR e.WarrantyExpiry  < DATE_ADD(CURDATE(), INTERVAL 90  DAY);

-- 6.5 Critical Alerts (unacknowledged, high/critical)
CREATE OR REPLACE VIEW vw_critical_alerts AS
SELECT
  a.AlertID,
  a.AlertType,
  a.Severity,
  a.Timestamp,
  a.Message,
  a.RootCause,
  a.Acknowledged,
  t.SpacecraftID,
  t.MissionID,
  DATEDIFF(NOW(), a.Timestamp) AS age_days
FROM ALERT a
LEFT JOIN TELEMETRY_DATA t ON t.TelemetryID = a.TelemetryID
WHERE a.Acknowledged = FALSE
  AND a.Severity IN ('High','Critical')
ORDER BY
  FIELD(a.Severity, 'Critical','High') ASC,
  a.Timestamp ASC;

-- 6.6 Spacecraft Status Overview
CREATE OR REPLACE VIEW vw_spacecraft_status AS
SELECT
  sc.SpacecraftID,
  sc.Name,
  sc.Manufacturer,
  sc.Status,
  sc.MaxCrewCapacity,
  sc.MaxPayloadMass,
  sc.LaunchDate,
  CASE WHEN cap.SpacecraftID IS NOT NULL THEN 'Capsule'
       WHEN shu.SpacecraftID IS NOT NULL THEN 'Shuttle'
       WHEN rkt.SpacecraftID IS NOT NULL THEN 'Rocket'
       ELSE 'Unknown' END AS spacecraft_type,
  COUNT(DISTINCT sm.MissionID) AS total_missions
FROM SPACECRAFT sc
LEFT JOIN CAPSULE            cap ON cap.SpacecraftID = sc.SpacecraftID
LEFT JOIN SHUTTLE            shu ON shu.SpacecraftID = sc.SpacecraftID
LEFT JOIN ROCKET             rkt ON rkt.SpacecraftID = sc.SpacecraftID
LEFT JOIN SPACECRAFT_MISSION  sm ON sm.SpacecraftID  = sc.SpacecraftID
GROUP BY sc.SpacecraftID;

-- 6.7 Monthly Experiment Success Rate
CREATE OR REPLACE VIEW vw_experiment_analytics AS
SELECT
  DATE_FORMAT(ee.ScheduledStart, '%Y-%m') AS month,
  COUNT(*)                                AS total_executions,
  AVG(ee.SuccessRating)                   AS avg_success_rating,
  SUM(ee.DataVolumeGenerated)             AS total_data_gb,
  COUNT(CASE WHEN ee.SuccessRating >= 80 THEN 1 END) AS high_success_count
FROM EXPERIMENT_EXECUTION ee
GROUP BY DATE_FORMAT(ee.ScheduledStart, '%Y-%m')
ORDER BY month DESC;

-- 6.8 Audit Log Summary (recent user activity)
CREATE OR REPLACE VIEW vw_audit_summary AS
SELECT
  al.log_id,
  al.username,
  al.action,
  al.table_name,
  al.record_id,
  al.status,
  al.ip_address,
  al.created_at,
  r.role_name
FROM smms_audit_log al
LEFT JOIN smms_users u ON u.user_id = al.user_id
LEFT JOIN smms_roles r ON r.role_id = u.role_id
ORDER BY al.created_at DESC
LIMIT 500;

-- ================================================================
-- SECTION 7: STORED PROCEDURES
-- ================================================================

DROP PROCEDURE IF EXISTS sp_get_dashboard_summary;
DELIMITER //
CREATE PROCEDURE sp_get_dashboard_summary()
BEGIN
  -- Mission counts by status
  SELECT MissionStatus AS status, COUNT(*) AS cnt
  FROM MISSION
  WHERE IsDeleted = FALSE
  GROUP BY MissionStatus;

  -- Active personnel counts
  SELECT
    (SELECT COUNT(*) FROM PERSON     WHERE IsDeleted = FALSE) AS total_persons,
    (SELECT COUNT(*) FROM ASTRONAUT)                          AS total_astronauts,
    (SELECT COUNT(*) FROM GROUND_CONTROL)                     AS total_ground_control,
    (SELECT COUNT(*) FROM SPACECRAFT WHERE Status = 'Ready')  AS ready_spacecraft,
    (SELECT COUNT(*) FROM ALERT      WHERE Acknowledged = FALSE
                                       AND Severity IN ('High','Critical')) AS open_critical_alerts;

  -- Top 5 missions by astronaut count
  SELECT
    m.MissionName,
    m.MissionStatus,
    COUNT(ma.AstronautID) AS crew_size
  FROM MISSION m
  LEFT JOIN MISSION_ASSIGNMENT ma ON ma.MissionID = m.MissionID
  WHERE m.IsDeleted = FALSE
  GROUP BY m.MissionID
  ORDER BY crew_size DESC
  LIMIT 5;
END //
DELIMITER ;

-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_log_audit;
DELIMITER //
CREATE PROCEDURE sp_log_audit(
  IN p_user_id    INT,
  IN p_username   VARCHAR(50),
  IN p_action     VARCHAR(50),
  IN p_table      VARCHAR(80),
  IN p_record_id  VARCHAR(40),
  IN p_old_json   JSON,
  IN p_new_json   JSON,
  IN p_ip         VARCHAR(45),
  IN p_status     VARCHAR(10)
)
BEGIN
  INSERT INTO smms_audit_log
    (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, status)
  VALUES
    (p_user_id, p_username, p_action, p_table, p_record_id, p_old_json, p_new_json, p_ip, p_status);
END //
DELIMITER ;

-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_lock_user;
DELIMITER //
CREATE PROCEDURE sp_lock_user(IN p_user_id INT, IN p_minutes INT)
BEGIN
  UPDATE smms_users
  SET locked_until = DATE_ADD(NOW(), INTERVAL p_minutes MINUTE),
      failed_logins = failed_logins + 1
  WHERE user_id = p_user_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_mission_crew_report;
DELIMITER //
CREATE PROCEDURE sp_mission_crew_report(IN p_mission_id INT)
BEGIN
  SELECT
    m.MissionName,
    m.MissionStatus,
    m.LaunchDateTime,
    CONCAT(p.FirstName, ' ', p.LastName) AS astronaut_name,
    a.Role,
    a.Department,
    a.HealthStatus,
    ma.PrimaryResponsibility,
    ma.EVAHoursPlanned,
    ma.Status AS assignment_status
  FROM MISSION m
  JOIN MISSION_ASSIGNMENT ma ON ma.MissionID  = m.MissionID
  JOIN ASTRONAUT          a  ON a.PersonID    = ma.AstronautID
  JOIN PERSON             p  ON p.PersonID    = a.PersonID
  WHERE m.MissionID = p_mission_id
  ORDER BY a.Role;
END //
DELIMITER ;

-- ================================================================
-- SECTION 8: TRIGGERS
-- ================================================================

-- 8.1 Prevent negative experiment success rating
DROP TRIGGER IF EXISTS trg_exec_success_check;
DELIMITER //
CREATE TRIGGER trg_exec_success_check
BEFORE INSERT ON EXPERIMENT_EXECUTION
FOR EACH ROW
BEGIN
  IF NEW.SuccessRating IS NOT NULL AND (NEW.SuccessRating < 0 OR NEW.SuccessRating > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SuccessRating must be between 0 and 100';
  END IF;
  IF NEW.ScheduledEnd IS NOT NULL AND NEW.ScheduledStart IS NOT NULL
     AND NEW.ScheduledEnd < NEW.ScheduledStart THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'ScheduledEnd cannot be before ScheduledStart';
  END IF;
END //
DELIMITER ;

-- 8.2 Auto-acknowledge low severity alerts after 7 days
DROP TRIGGER IF EXISTS trg_alert_auto_insert;
DELIMITER //
CREATE TRIGGER trg_alert_auto_insert
BEFORE INSERT ON ALERT
FOR EACH ROW
BEGIN
  -- Normalize severity casing
  SET NEW.Severity = CONCAT(UPPER(SUBSTRING(NEW.Severity,1,1)),
                            LOWER(SUBSTRING(NEW.Severity,2)));
  -- Set timestamp if missing
  IF NEW.Timestamp IS NULL THEN
    SET NEW.Timestamp = NOW();
  END IF;
END //
DELIMITER ;

-- 8.3 Audit trigger on MISSION (INSERT)
DROP TRIGGER IF EXISTS trg_audit_mission_insert;
DELIMITER //
CREATE TRIGGER trg_audit_mission_insert
AFTER INSERT ON MISSION
FOR EACH ROW
BEGIN
  INSERT INTO smms_audit_log (action, table_name, record_id, new_values, status)
  VALUES (
    'INSERT', 'MISSION', NEW.MissionID,
    JSON_OBJECT(
      'MissionName',   NEW.MissionName,
      'MissionStatus', NEW.MissionStatus,
      'MissionType',   NEW.MissionType,
      'LaunchDateTime',NEW.LaunchDateTime
    ),
    'success'
  );
END //
DELIMITER ;

-- 8.4 Audit trigger on MISSION (UPDATE)
DROP TRIGGER IF EXISTS trg_audit_mission_update;
DELIMITER //
CREATE TRIGGER trg_audit_mission_update
AFTER UPDATE ON MISSION
FOR EACH ROW
BEGIN
  INSERT INTO smms_audit_log (action, table_name, record_id, old_values, new_values, status)
  VALUES (
    'UPDATE', 'MISSION', NEW.MissionID,
    JSON_OBJECT(
      'MissionName',   OLD.MissionName,
      'MissionStatus', OLD.MissionStatus
    ),
    JSON_OBJECT(
      'MissionName',   NEW.MissionName,
      'MissionStatus', NEW.MissionStatus
    ),
    'success'
  );
END //
DELIMITER ;

-- 8.5 Audit trigger on MISSION (DELETE / soft-delete flag)
DROP TRIGGER IF EXISTS trg_audit_mission_delete;
DELIMITER //
CREATE TRIGGER trg_audit_mission_delete
BEFORE DELETE ON MISSION
FOR EACH ROW
BEGIN
  INSERT INTO smms_audit_log (action, table_name, record_id, old_values, status)
  VALUES (
    'DELETE', 'MISSION', OLD.MissionID,
    JSON_OBJECT(
      'MissionName', OLD.MissionName,
      'MissionStatus', OLD.MissionStatus
    ),
    'success'
  );
END //
DELIMITER ;

-- 8.6 Prevent spacecraft mission assignment for inactive spacecraft
DROP TRIGGER IF EXISTS trg_spacecraft_mission_check;
DELIMITER //
CREATE TRIGGER trg_spacecraft_mission_check
BEFORE INSERT ON SPACECRAFT_MISSION
FOR EACH ROW
BEGIN
  DECLARE sc_status VARCHAR(50);
  SELECT Status INTO sc_status FROM SPACECRAFT WHERE SpacecraftID = NEW.SpacecraftID;
  IF sc_status = 'Decommissioned' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot assign a decommissioned spacecraft to a mission';
  END IF;
END //
DELIMITER ;

-- 8.7 Update User last_login timestamp automatically (called from app)
DROP TRIGGER IF EXISTS trg_users_update_ts;
DELIMITER //
CREATE TRIGGER trg_users_update_ts
BEFORE UPDATE ON smms_users
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- ================================================================
-- SECTION 9: MYSQL ROLES & GRANTS (optional — requires SUPER)
-- ================================================================
-- Uncomment if your MySQL user has SUPER / GRANT OPTION privilege.
--
-- CREATE ROLE IF NOT EXISTS 'smms_admin_role';
-- CREATE ROLE IF NOT EXISTS 'smms_staff_role';
-- CREATE ROLE IF NOT EXISTS 'smms_operator_role';
--
-- GRANT ALL PRIVILEGES          ON smms.* TO 'smms_admin_role';
-- GRANT SELECT, INSERT, UPDATE  ON smms.* TO 'smms_staff_role';
-- GRANT SELECT                  ON smms.* TO 'smms_operator_role';

-- ================================================================
-- DONE
-- ================================================================
SELECT 'Auth extension applied successfully!' AS status;
SELECT COUNT(*) AS user_count  FROM smms_users;
SELECT COUNT(*) AS role_count  FROM smms_roles;
SELECT COUNT(*) AS view_count
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'smms';
