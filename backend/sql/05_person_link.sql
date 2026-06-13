-- ================================================================
-- SMMS: Person Link Migration (05_person_link.sql)
-- Links smms_users → PERSON table for role-based data filtering.
-- Run AFTER 04_auth_views_triggers.sql
-- Usage: mysql -u root -p smms < backend/sql/05_person_link.sql
-- ================================================================

USE smms;

-- ─── 1. Add person_id column to smms_users ─────────────────────
ALTER TABLE smms_users
  ADD COLUMN IF NOT EXISTS person_id INT NULL DEFAULT NULL
    COMMENT 'FK to PERSON.PersonID — links this auth account to a domain person (astronaut/ground control). NULL = admin/unlinked.',
  ADD CONSTRAINT fk_users_person
    FOREIGN KEY (person_id) REFERENCES PERSON(PersonID)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 2. Index for fast person lookups ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_person_id ON smms_users(person_id);

-- ─── 3. View: user + person profile joined ─────────────────────
CREATE OR REPLACE VIEW vw_user_person_link AS
SELECT
  u.user_id,
  u.username,
  u.full_name      AS user_full_name,
  u.email,
  r.role_name,
  u.person_id,
  CASE
    WHEN a.PersonID  IS NOT NULL AND gc.PersonID IS NOT NULL THEN 'both'
    WHEN a.PersonID  IS NOT NULL THEN 'astronaut'
    WHEN gc.PersonID IS NOT NULL THEN 'ground_control'
    ELSE NULL
  END               AS person_type,
  CONCAT(p.FirstName, ' ', p.LastName) AS person_full_name,
  p.Nationality,
  p.Gender,
  p.ContactInfo,
  a.Role            AS astronaut_role,
  a.Department      AS astronaut_dept,
  a.HealthStatus,
  a.MentorID,
  gc.Role           AS gc_role,
  gc.Department     AS gc_dept,
  gc.ClearanceLevel
FROM smms_users u
JOIN smms_roles r ON r.role_id = u.role_id
LEFT JOIN PERSON          p  ON p.PersonID  = u.person_id
LEFT JOIN ASTRONAUT       a  ON a.PersonID  = u.person_id
LEFT JOIN GROUND_CONTROL  gc ON gc.PersonID = u.person_id;

-- ─── 4. Verify ─────────────────────────────────────────────────
SELECT 'Migration 05 applied successfully!' AS status;
SELECT
  COUNT(*) AS total_users,
  SUM(person_id IS NOT NULL) AS linked_users,
  SUM(person_id IS NULL)     AS unlinked_users
FROM smms_users;
