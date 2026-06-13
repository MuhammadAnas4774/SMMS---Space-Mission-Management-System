-- 1. Add authentication columns and Role to PERSON
ALTER TABLE PERSON 
  ADD COLUMN Role ENUM('astronaut', 'ground_control') NULL AFTER PersonID,
  ADD COLUMN Username VARCHAR(50) NULL UNIQUE,
  ADD COLUMN Email VARCHAR(100) NULL UNIQUE,
  ADD COLUMN PasswordHash VARCHAR(255) NULL,
  ADD COLUMN IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN LastLoginAt DATETIME NULL;

-- 2. Migrate existing data from smms_users to PERSON where person_id matches
UPDATE PERSON p
JOIN smms_users u ON u.person_id = p.PersonID
SET 
  p.Username = u.username,
  p.Email = u.email,
  p.PasswordHash = u.password_hash,
  p.IsActive = u.is_active,
  p.LastLoginAt = u.last_login_at;

-- Set Role based on existing ASTRONAUT / GROUND_CONTROL tables
UPDATE PERSON p
JOIN ASTRONAUT a ON a.PersonID = p.PersonID
SET p.Role = 'astronaut';

UPDATE PERSON p
JOIN GROUND_CONTROL gc ON gc.PersonID = p.PersonID
SET p.Role = 'ground_control';

-- 3. We cannot have a person without a Role in the new system (or at least we assume they have one).
-- To be safe, if there's any Username but no role, we can leave it or clear it.

-- 4. Drop the old view that depends on smms_users
DROP VIEW IF EXISTS vw_user_person_link;

-- 5. Re-create the view using only PERSON
CREATE VIEW vw_user_person_link AS
SELECT
  p.PersonID AS user_id,
  p.Username AS username,
  CONCAT(p.FirstName, ' ', p.LastName) AS user_full_name,
  p.Email AS email,
  p.Role AS role_name,
  p.PersonID AS person_id,
  p.Role AS person_type,
  CONCAT(p.FirstName, ' ', p.LastName) AS person_full_name,
  p.Nationality,
  p.Gender,
  p.ContactInfo,
  a.Role AS astronaut_role,
  a.Department AS astronaut_dept,
  a.HealthStatus,
  a.MentorID,
  gc.Role AS gc_role,
  gc.Department AS gc_dept,
  gc.ClearanceLevel
FROM PERSON p
LEFT JOIN ASTRONAUT a ON a.PersonID = p.PersonID
LEFT JOIN GROUND_CONTROL gc ON gc.PersonID = p.PersonID
WHERE p.Username IS NOT NULL;

-- 6. Now that data is migrated, drop old auth tables
-- Drop audit log constraint first if exists
ALTER TABLE smms_audit_log DROP FOREIGN KEY IF EXISTS fk_audit_user;

DROP TABLE IF EXISTS smms_sessions;
DROP TABLE IF EXISTS smms_users;
DROP TABLE IF EXISTS smms_roles;

-- 7. Update Audit Log table to reference PERSON instead of smms_users
ALTER TABLE smms_audit_log
  MODIFY COLUMN user_id INT NULL;

ALTER TABLE smms_audit_log
  ADD CONSTRAINT fk_audit_person FOREIGN KEY (user_id) REFERENCES PERSON(PersonID) ON DELETE SET NULL;
