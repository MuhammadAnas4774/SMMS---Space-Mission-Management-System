-- ================================================================
-- SPACE MISSION MANAGEMENT SYSTEM (SMMS) - ADVANCED OPERATIONS
-- ================================================================
-- This file contains advanced database features:
-- - Views for complex queries
-- - Stored Procedures for reusable logic
-- - Triggers for automatic actions
-- - Functions for custom calculations
-- - Transaction examples
-- ================================================================

USE smms;

-- ================================================================
-- VIEWS (Virtual Tables)
-- ================================================================

-- View: Complete astronaut profile with personal info
CREATE OR REPLACE VIEW v_astronaut_profiles AS
SELECT 
    p.PersonID,
    CONCAT(p.FirstName, ' ', p.LastName) AS FullName,
    p.DateOfBirth,
    YEAR(CURDATE()) - YEAR(p.DateOfBirth) AS Age,
    p.Gender,
    p.Nationality,
    p.ContactInfo,
    a.FlightHours,
    a.Role,
    a.Specialization,
    a.Department,
    a.`Rank`,
    a.HealthStatus,
    a.ClearanceLevel,
    CASE 
        WHEN a.FlightHours < 500 THEN 'Novice'
        WHEN a.FlightHours BETWEEN 500 AND 1000 THEN 'Experienced'
        ELSE 'Veteran'
    END AS ExperienceLevel
FROM PERSON p
INNER JOIN ASTRONAUT a ON p.PersonID = a.PersonID
WHERE p.IsDeleted = FALSE OR p.IsDeleted IS NULL;

-- View: Mission summary with counts
CREATE OR REPLACE VIEW v_mission_summary AS
SELECT 
    m.MissionID,
    m.MissionName,
    m.MissionType,
    m.MissionStatus,
    m.RiskLevel,
    m.LaunchDateTime,
    m.EstimatedDuration,
    m.Budget,
    COUNT(DISTINCT ma.AstronautID) AS AssignedAstronauts,
    COUNT(DISTINCT sm.SpacecraftID) AS AssignedSpacecraft,
    COUNT(DISTINCT ee.ExperimentID) AS ScheduledExperiments,
    DATEDIFF(m.LaunchDateTime, CURDATE()) AS DaysUntilLaunch
FROM MISSION m
LEFT JOIN MISSION_ASSIGNMENT ma ON m.MissionID = ma.MissionID
LEFT JOIN SPACECRAFT_MISSION sm ON m.MissionID = sm.MissionID
LEFT JOIN EXPERIMENT_EXECUTION ee ON m.MissionID = ee.MissionID
WHERE m.IsDeleted = FALSE OR m.IsDeleted IS NULL
GROUP BY m.MissionID;

-- View: Active spacecraft status
CREATE OR REPLACE VIEW v_spacecraft_status AS
SELECT 
    s.SpacecraftID,
    s.Name,
    s.Manufacturer,
    s.Status,
    s.MaxCrewCapacity,
    s.MaxPayloadMass,
    s.LaunchDate,
    COUNT(DISTINCT sm.MissionID) AS MissionCount,
    COALESCE(
        (SELECT MissionName FROM MISSION m 
         INNER JOIN SPACECRAFT_MISSION sm2 ON m.MissionID = sm2.MissionID
         WHERE sm2.SpacecraftID = s.SpacecraftID 
         AND m.MissionStatus IN ('In Progress', 'Active')
         LIMIT 1),
        'No Active Mission'
    ) AS CurrentMission
FROM SPACECRAFT s
LEFT JOIN SPACECRAFT_MISSION sm ON s.SpacecraftID = sm.SpacecraftID
GROUP BY s.SpacecraftID;

-- View: Equipment maintenance schedule
CREATE OR REPLACE VIEW v_equipment_maintenance AS
SELECT 
    e.EquipmentID,
    e.EquipmentName,
    e.EquipmentType,
    e.SerialNumber,
    e.Status,
    e.Location,
    e.CalibrationDate,
    DATEDIFF(CURDATE(), e.CalibrationDate) AS DaysSinceCalibration,
    CASE 
        WHEN DATEDIFF(CURDATE(), e.CalibrationDate) > 180 THEN 'Overdue'
        WHEN DATEDIFF(CURDATE(), e.CalibrationDate) > 150 THEN 'Due Soon'
        ELSE 'Current'
    END AS MaintenanceStatus,
    ss.StationName,
    sp.Name AS SpacecraftName
FROM EQUIPMENT e
LEFT JOIN SPACE_STATION ss ON e.StationID = ss.StationID
LEFT JOIN SPACECRAFT sp ON e.SpacecraftID = sp.SpacecraftID;

-- View: Critical alerts requiring attention
CREATE OR REPLACE VIEW v_critical_alerts AS
SELECT 
    a.AlertID,
    a.AlertType,
    a.Severity,
    a.Timestamp,
    a.Message,
    a.Acknowledged,
    a.RootCause,
    TIMESTAMPDIFF(HOUR, a.Timestamp, COALESCE(a.ResolutionTime, NOW())) AS HoursToResolve,
    td.SpacecraftID,
    s.Name AS SpacecraftName,
    m.MissionName
FROM ALERT a
LEFT JOIN TELEMETRY_DATA td ON a.TelemetryID = td.TelemetryID
LEFT JOIN SPACECRAFT s ON td.SpacecraftID = s.SpacecraftID
LEFT JOIN MISSION m ON td.MissionID = m.MissionID
WHERE a.Acknowledged = FALSE OR a.Severity IN ('High', 'Critical')
ORDER BY 
    FIELD(a.Severity, 'Critical', 'High', 'Medium', 'Low'),
    a.Timestamp DESC;

-- View: Experiment execution performance
CREATE OR REPLACE VIEW v_experiment_performance AS
SELECT 
    ex.ExperimentID,
    ex.Title,
    ex.PrincipalInvestigator,
    ex.Status,
    COUNT(ee.ExecutionID) AS ExecutionCount,
    AVG(ee.SuccessRating) AS AvgSuccessRating,
    SUM(ee.DataVolumeGenerated) AS TotalDataGenerated,
    AVG(TIMESTAMPDIFF(MINUTE, ee.ScheduledStart, ee.ActualStart)) AS AvgDelayMinutes
FROM EXPERIMENT ex
LEFT JOIN EXPERIMENT_EXECUTION ee ON ex.ExperimentID = ee.ExperimentID
GROUP BY ex.ExperimentID;

-- View: Station capacity and utilization
CREATE OR REPLACE VIEW v_station_utilization AS
SELECT 
    ss.StationID,
    ss.StationName,
    ss.MaxCrewCapacity,
    ss.CurrentStatus,
    ss.OrbitAltitude,
    COUNT(DISTINCT m.ModuleID) AS AttachedModules,
    COUNT(DISTINCT e.EquipmentID) AS EquipmentCount,
    SUM(CASE WHEN e.Status = 'Operational' THEN 1 ELSE 0 END) AS OperationalEquipment,
    SUM(CASE WHEN e.Status = 'Maintenance' THEN 1 ELSE 0 END) AS MaintenanceEquipment
FROM SPACE_STATION ss
LEFT JOIN MODULE m ON ss.StationID = m.StationID
LEFT JOIN EQUIPMENT e ON ss.StationID = e.StationID
GROUP BY ss.StationID;

-- View: Ground control shift assignments
CREATE OR REPLACE VIEW v_ground_control_roster AS
SELECT 
    CONCAT(p.FirstName, ' ', p.LastName) AS FullName,
    gc.Role,
    gc.Department,
    gc.ShiftSchedule,
    gc.ConsoleAssignment,
    gc.ClearanceLevel,
    p.ContactInfo
FROM GROUND_CONTROL gc
INNER JOIN PERSON p ON gc.PersonID = p.PersonID
WHERE p.IsDeleted = FALSE OR p.IsDeleted IS NULL
ORDER BY gc.ShiftSchedule, gc.Department;

-- ================================================================
-- STORED PROCEDURES (Reusable Business Logic)
-- ================================================================

DELIMITER $$

-- Procedure: Assign astronaut to mission
CREATE PROCEDURE sp_assign_astronaut_to_mission(
    IN p_mission_id INT,
    IN p_astronaut_id INT,
    IN p_role VARCHAR(50),
    IN p_eva_hours DECIMAL(6,2),
    IN p_responsibility VARCHAR(120)
)
BEGIN
    DECLARE v_mission_status VARCHAR(30);
    DECLARE v_astronaut_health VARCHAR(50);
    
    -- Check if mission exists and is valid
    SELECT MissionStatus INTO v_mission_status 
    FROM MISSION 
    WHERE MissionID = p_mission_id;
    
    IF v_mission_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mission not found';
    END IF;
    
    IF v_mission_status IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot assign to completed or cancelled mission';
    END IF;
    
    -- Check astronaut health status
    SELECT HealthStatus INTO v_astronaut_health 
    FROM ASTRONAUT 
    WHERE PersonID = p_astronaut_id;
    
    IF v_astronaut_health != 'Fit' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Astronaut is not fit for mission';
    END IF;
    
    -- Insert assignment
    INSERT INTO MISSION_ASSIGNMENT (
        MissionID, AstronautID, Role, AssignmentDate, 
        EVAHoursPlanned, PrimaryResponsibility, Status
    ) VALUES (
        p_mission_id, p_astronaut_id, p_role, CURDATE(), 
        p_eva_hours, p_responsibility, 'Assigned'
    );
    
    SELECT 'Astronaut assigned successfully' AS Result;
END$$

-- Procedure: Update mission status with validation
CREATE PROCEDURE sp_update_mission_status(
    IN p_mission_id INT,
    IN p_new_status VARCHAR(30)
)
BEGIN
    DECLARE v_current_status VARCHAR(30);
    
    SELECT MissionStatus INTO v_current_status 
    FROM MISSION 
    WHERE MissionID = p_mission_id;
    
    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mission not found';
    END IF;
    
    -- Status transition validation
    IF v_current_status = 'Completed' AND p_new_status != 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot change status of completed mission';
    END IF;
    
    UPDATE MISSION 
    SET MissionStatus = p_new_status,
        UpdatedAt = CURRENT_TIMESTAMP
    WHERE MissionID = p_mission_id;
    
    SELECT CONCAT('Mission status updated from ', v_current_status, ' to ', p_new_status) AS Result;
END$$

-- Procedure: Schedule experiment on mission
CREATE PROCEDURE sp_schedule_experiment(
    IN p_mission_id INT,
    IN p_experiment_id INT,
    IN p_scheduled_start DATETIME,
    IN p_duration_hours INT,
    IN p_location VARCHAR(100)
)
BEGIN
    DECLARE v_scheduled_end DATETIME;
    
    SET v_scheduled_end = DATE_ADD(p_scheduled_start, INTERVAL p_duration_hours HOUR);
    
    -- Insert experiment execution
    INSERT INTO EXPERIMENT_EXECUTION (
        MissionID, ExperimentID, ScheduledStart, ScheduledEnd, Location
    ) VALUES (
        p_mission_id, p_experiment_id, p_scheduled_start, v_scheduled_end, p_location
    );
    
    -- Create corresponding event
    INSERT INTO SCHEDULED_EVENT (
        MissionID, ExperimentID, EventType, Description,
        PlannedStartTime, PlannedDuration, Criticality, Status
    ) VALUES (
        p_mission_id, p_experiment_id, 'Experiment', 
        CONCAT('Execute experiment: ', (SELECT Title FROM EXPERIMENT WHERE ExperimentID = p_experiment_id)),
        p_scheduled_start, p_duration_hours, 'Medium', 'Scheduled'
    );
    
    SELECT 'Experiment scheduled successfully' AS Result;
END$$

-- Procedure: Generate mission report
CREATE PROCEDURE sp_generate_mission_report(
    IN p_mission_id INT
)
BEGIN
    -- Mission details
    SELECT 
        m.MissionID,
        m.MissionName,
        m.MissionType,
        m.MissionStatus,
        m.LaunchDateTime,
        m.Budget,
        m.RiskLevel,
        COUNT(DISTINCT ma.AstronautID) AS CrewSize,
        COUNT(DISTINCT sm.SpacecraftID) AS SpacecraftCount,
        COUNT(DISTINCT ee.ExperimentID) AS ExperimentCount,
        COUNT(DISTINCT se.EventID) AS ScheduledEvents
    FROM MISSION m
    LEFT JOIN MISSION_ASSIGNMENT ma ON m.MissionID = ma.MissionID
    LEFT JOIN SPACECRAFT_MISSION sm ON m.MissionID = sm.MissionID
    LEFT JOIN EXPERIMENT_EXECUTION ee ON m.MissionID = ee.MissionID
    LEFT JOIN SCHEDULED_EVENT se ON m.MissionID = se.MissionID
    WHERE m.MissionID = p_mission_id
    GROUP BY m.MissionID;
    
    -- Crew assignments
    SELECT 
        CONCAT(p.FirstName, ' ', p.LastName) AS AstronautName,
        ma.Role,
        a.Department,
        a.FlightHours,
        ma.EVAHoursPlanned
    FROM MISSION_ASSIGNMENT ma
    INNER JOIN ASTRONAUT a ON ma.AstronautID = a.PersonID
    INNER JOIN PERSON p ON a.PersonID = p.PersonID
    WHERE ma.MissionID = p_mission_id;
    
    -- Assigned spacecraft
    SELECT 
        s.Name,
        s.Manufacturer,
        sm.RoleInMission,
        s.MaxCrewCapacity
    FROM SPACECRAFT_MISSION sm
    INNER JOIN SPACECRAFT s ON sm.SpacecraftID = s.SpacecraftID
    WHERE sm.MissionID = p_mission_id;
END$$

-- Procedure: Calculate astronaut eligibility for mission
CREATE PROCEDURE sp_check_astronaut_eligibility(
    IN p_astronaut_id INT,
    IN p_mission_id INT
)
BEGIN
    DECLARE v_health VARCHAR(50);
    DECLARE v_flight_hours DECIMAL(8,2);
    DECLARE v_clearance VARCHAR(20);
    DECLARE v_risk_level VARCHAR(20);
    DECLARE v_eligible BOOLEAN DEFAULT FALSE;
    DECLARE v_reason TEXT DEFAULT '';
    
    -- Get astronaut info
    SELECT HealthStatus, FlightHours, ClearanceLevel
    INTO v_health, v_flight_hours, v_clearance
    FROM ASTRONAUT
    WHERE PersonID = p_astronaut_id;
    
    -- Get mission risk level
    SELECT RiskLevel INTO v_risk_level
    FROM MISSION
    WHERE MissionID = p_mission_id;
    
    -- Eligibility checks
    IF v_health != 'Fit' THEN
        SET v_reason = CONCAT(v_reason, 'Health status not fit. ');
    END IF;
    
    IF v_risk_level = 'High' AND v_flight_hours < 500 THEN
        SET v_reason = CONCAT(v_reason, 'Insufficient flight hours for high-risk mission. ');
    END IF;
    
    IF v_risk_level = 'Critical' AND v_flight_hours < 1000 THEN
        SET v_reason = CONCAT(v_reason, 'Insufficient flight hours for critical mission. ');
    END IF;
    
    IF v_risk_level IN ('High', 'Critical') AND v_clearance NOT IN ('Secret', 'Top Secret') THEN
        SET v_reason = CONCAT(v_reason, 'Insufficient clearance level. ');
    END IF;
    
    IF v_reason = '' THEN
        SET v_eligible = TRUE;
        SET v_reason = 'Astronaut meets all eligibility requirements';
    END IF;
    
    SELECT v_eligible AS Eligible, v_reason AS Reason;
END$$

-- Procedure: Batch update equipment calibration
CREATE PROCEDURE sp_batch_calibrate_equipment(
    IN p_station_id INT
)
BEGIN
    UPDATE EQUIPMENT
    SET CalibrationDate = CURDATE(),
        Status = 'Operational'
    WHERE StationID = p_station_id
    AND (Status = 'Maintenance' OR CalibrationDate < DATE_SUB(CURDATE(), INTERVAL 6 MONTH));
    
    SELECT ROW_COUNT() AS EquipmentCalibrated;
END$$

-- Procedure: Archive completed missions
CREATE PROCEDURE sp_archive_completed_missions(
    IN p_months_old INT
)
BEGIN
    DECLARE v_cutoff_date DATETIME;
    
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL p_months_old MONTH);
    
    -- Create archive table if not exists
    CREATE TABLE IF NOT EXISTS MISSION_ARCHIVE LIKE MISSION;
    
    -- Insert into archive
    INSERT INTO MISSION_ARCHIVE
    SELECT * FROM MISSION
    WHERE MissionStatus = 'Completed'
    AND LaunchDateTime < v_cutoff_date
    AND MissionID NOT IN (SELECT MissionID FROM MISSION_ARCHIVE);
    
    SELECT ROW_COUNT() AS MissionsArchived;
END$$

DELIMITER ;

-- ================================================================
-- FUNCTIONS (Custom Calculations)
-- ================================================================

DELIMITER $$

-- Function: Calculate mission cost per day
CREATE FUNCTION fn_mission_cost_per_day(p_mission_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_budget DECIMAL(15,2);
    DECLARE v_duration DECIMAL(6,2);
    DECLARE v_cost_per_day DECIMAL(10,2);
    
    SELECT Budget, COALESCE(ActualDuration, EstimatedDuration)
    INTO v_budget, v_duration
    FROM MISSION
    WHERE MissionID = p_mission_id;
    
    IF v_duration IS NULL OR v_duration = 0 THEN
        RETURN 0;
    END IF;
    
    SET v_cost_per_day = v_budget / v_duration;
    
    RETURN v_cost_per_day;
END$$

-- Function: Calculate astronaut experience score
CREATE FUNCTION fn_astronaut_experience_score(p_astronaut_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_flight_hours DECIMAL(8,2);
    DECLARE v_mission_count INT;
    DECLARE v_score INT;
    
    SELECT FlightHours INTO v_flight_hours
    FROM ASTRONAUT
    WHERE PersonID = p_astronaut_id;
    
    SELECT COUNT(*) INTO v_mission_count
    FROM MISSION_ASSIGNMENT
    WHERE AstronautID = p_astronaut_id;
    
    -- Score calculation: flight hours + (mission count * 100)
    SET v_score = FLOOR(v_flight_hours) + (v_mission_count * 100);
    
    RETURN v_score;
END$$

-- Function: Get spacecraft availability status
CREATE FUNCTION fn_spacecraft_available(p_spacecraft_id INT, p_check_date DATE)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(50);
    DECLARE v_active_missions INT;
    
    SELECT Status INTO v_status
    FROM SPACECRAFT
    WHERE SpacecraftID = p_spacecraft_id;
    
    IF v_status != 'Ready' THEN
        RETURN 'Not Ready';
    END IF;
    
    SELECT COUNT(*) INTO v_active_missions
    FROM SPACECRAFT_MISSION sm
    INNER JOIN MISSION m ON sm.MissionID = m.MissionID
    WHERE sm.SpacecraftID = p_spacecraft_id
    AND m.MissionStatus IN ('In Progress', 'Active')
    AND m.LaunchDateTime <= p_check_date;
    
    IF v_active_missions > 0 THEN
        RETURN 'In Use';
    END IF;
    
    RETURN 'Available';
END$$

-- Function: Calculate days until calibration due
CREATE FUNCTION fn_days_until_calibration(p_equipment_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_last_calibration DATE;
    DECLARE v_days_since INT;
    DECLARE v_days_until INT;
    
    SELECT CalibrationDate INTO v_last_calibration
    FROM EQUIPMENT
    WHERE EquipmentID = p_equipment_id;
    
    IF v_last_calibration IS NULL THEN
        RETURN 0;
    END IF;
    
    SET v_days_since = DATEDIFF(CURDATE(), v_last_calibration);
    SET v_days_until = 180 - v_days_since;
    
    RETURN v_days_until;
END$$

-- Function: Get mission phase
CREATE FUNCTION fn_mission_phase(p_mission_id INT)
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_launch_date DATETIME;
    DECLARE v_duration DECIMAL(6,2);
    DECLARE v_status VARCHAR(30);
    DECLARE v_days_diff INT;
    
    SELECT LaunchDateTime, EstimatedDuration, MissionStatus
    INTO v_launch_date, v_duration, v_status
    FROM MISSION
    WHERE MissionID = p_mission_id;
    
    IF v_status IN ('Completed', 'Cancelled') THEN
        RETURN v_status;
    END IF;
    
    SET v_days_diff = DATEDIFF(v_launch_date, NOW());
    
    IF v_days_diff > 90 THEN
        RETURN 'Early Planning';
    ELSEIF v_days_diff > 30 THEN
        RETURN 'Pre-Launch Preparation';
    ELSEIF v_days_diff > 0 THEN
        RETURN 'Final Countdown';
    ELSEIF v_days_diff >= (v_duration * -1) THEN
        RETURN 'Active Mission';
    ELSE
        RETURN 'Post-Mission';
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGERS (Automatic Actions)
-- ================================================================

DELIMITER $$

-- Trigger: Audit log for mission updates
CREATE TABLE IF NOT EXISTS MISSION_AUDIT_LOG (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    MissionID INT,
    Action VARCHAR(20),
    OldStatus VARCHAR(30),
    NewStatus VARCHAR(30),
    OldBudget DECIMAL(15,2),
    NewBudget DECIMAL(15,2),
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ChangedBy VARCHAR(100)
);

CREATE TRIGGER trg_mission_update_audit
AFTER UPDATE ON MISSION
FOR EACH ROW
BEGIN
    IF OLD.MissionStatus != NEW.MissionStatus OR OLD.Budget != NEW.Budget THEN
        INSERT INTO MISSION_AUDIT_LOG (
            MissionID, Action, OldStatus, NewStatus, OldBudget, NewBudget, ChangedBy
        ) VALUES (
            NEW.MissionID, 'UPDATE', OLD.MissionStatus, NEW.MissionStatus, 
            OLD.Budget, NEW.Budget, USER()
        );
    END IF;
END$$

-- Trigger: Validate astronaut assignment
CREATE TRIGGER trg_validate_astronaut_assignment
BEFORE INSERT ON MISSION_ASSIGNMENT
FOR EACH ROW
BEGIN
    DECLARE v_health VARCHAR(50);
    
    SELECT HealthStatus INTO v_health
    FROM ASTRONAUT
    WHERE PersonID = NEW.AstronautID;
    
    IF v_health != 'Fit' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot assign astronaut with non-fit health status';
    END IF;
END$$

-- Trigger: Auto-acknowledge low severity alerts after 24 hours
CREATE TRIGGER trg_auto_acknowledge_old_alerts
BEFORE UPDATE ON ALERT
FOR EACH ROW
BEGIN
    IF NEW.Severity = 'Low' 
       AND OLD.Acknowledged = FALSE 
       AND TIMESTAMPDIFF(HOUR, OLD.Timestamp, NOW()) > 24 THEN
        SET NEW.Acknowledged = TRUE;
        SET NEW.ResolutionTime = NOW();
    END IF;
END$$

-- Trigger: Update mission status when all assignments complete training
CREATE TRIGGER trg_check_mission_training_completion
AFTER UPDATE ON MISSION_ASSIGNMENT
FOR EACH ROW
BEGIN
    DECLARE v_total_astronauts INT;
    DECLARE v_trained_astronauts INT;
    
    IF NEW.TrainingCompletionDate IS NOT NULL AND OLD.TrainingCompletionDate IS NULL THEN
        SELECT COUNT(*) INTO v_total_astronauts
        FROM MISSION_ASSIGNMENT
        WHERE MissionID = NEW.MissionID;
        
        SELECT COUNT(*) INTO v_trained_astronauts
        FROM MISSION_ASSIGNMENT
        WHERE MissionID = NEW.MissionID
        AND TrainingCompletionDate IS NOT NULL;
        
        IF v_total_astronauts = v_trained_astronauts THEN
            UPDATE MISSION
            SET MissionStatus = 'Ready for Launch'
            WHERE MissionID = NEW.MissionID
            AND MissionStatus = 'Planned';
        END IF;
    END IF;
END$$

-- Trigger: Prevent deletion of active missions
CREATE TRIGGER trg_prevent_active_mission_delete
BEFORE DELETE ON MISSION
FOR EACH ROW
BEGIN
    IF OLD.MissionStatus IN ('In Progress', 'Active') THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete active or in-progress mission';
    END IF;
END$$

-- Trigger: Auto-update spacecraft status when assigned to mission
CREATE TRIGGER trg_update_spacecraft_on_assignment
AFTER INSERT ON SPACECRAFT_MISSION
FOR EACH ROW
BEGIN
    UPDATE SPACECRAFT
    SET Status = 'Assigned'
    WHERE SpacecraftID = NEW.SpacecraftID;
END$$

-- Trigger: Log equipment status changes
CREATE TABLE IF NOT EXISTS EQUIPMENT_STATUS_LOG (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    EquipmentID INT,
    OldStatus VARCHAR(40),
    NewStatus VARCHAR(40),
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_log_equipment_status_change
AFTER UPDATE ON EQUIPMENT
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        INSERT INTO EQUIPMENT_STATUS_LOG (EquipmentID, OldStatus, NewStatus)
        VALUES (NEW.EquipmentID, OLD.Status, NEW.Status);
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- TRANSACTIONS (Data Integrity Examples)
-- ================================================================

-- Example 1: Complete mission launch sequence (all or nothing)
START TRANSACTION;

    -- Update mission status
    UPDATE MISSION 
    SET MissionStatus = 'In Progress' 
    WHERE MissionID = 6;
    
    -- Update all assigned astronauts
    UPDATE MISSION_ASSIGNMENT 
    SET Status = 'Active' 
    WHERE MissionID = 6;
    
    -- Update spacecraft status
    UPDATE SPACECRAFT s
    INNER JOIN SPACECRAFT_MISSION sm ON s.SpacecraftID = sm.SpacecraftID
    SET s.Status = 'In Flight'
    WHERE sm.MissionID = 6;
    
    -- Create launch event
    INSERT INTO SCHEDULED_EVENT (MissionID, EventType, Description, ActualStartTime, Status)
    VALUES (6, 'Launch', 'Mission launch executed', NOW(), 'Completed');

COMMIT;
-- If any step fails, use: ROLLBACK;

-- Example 2: Transfer equipment between stations
START TRANSACTION;

    -- Remove from old station
    UPDATE EQUIPMENT 
    SET StationID = NULL, 
        Location = 'In Transit',
        Status = 'In Transit'
    WHERE EquipmentID = 5;
    
    -- Add to new station
    UPDATE EQUIPMENT 
    SET StationID = 2,
        Location = 'Columbus Lab',
        Status = 'Operational'
    WHERE EquipmentID = 5;
    
    -- Log the transfer
    INSERT INTO SCHEDULED_EVENT (EventType, Description, ActualStartTime, Status)
    VALUES ('Equipment Transfer', 'Transferred equipment ID 5 to Station 2', NOW(), 'Completed');

COMMIT;

-- Example 3: Batch astronaut assignment with validation
START TRANSACTION;

    -- Temporary variable setup (example)
    SET @mission_id = 1;
    SET @astronaut1 = 1;
    SET @astronaut2 = 2;
    SET @astronaut3 = 3;
    
    -- Assign multiple astronauts
    INSERT INTO MISSION_ASSIGNMENT (MissionID, AstronautID, Role, AssignmentDate, Status)
    VALUES 
        (@mission_id, @astronaut1, 'Commander', CURDATE(), 'Assigned'),
        (@mission_id, @astronaut2, 'Pilot', CURDATE(), 'Assigned'),
        (@mission_id, @astronaut3, 'Engineer', CURDATE(), 'Assigned');
    
    -- Update mission status
    UPDATE MISSION 
    SET MissionStatus = 'Crew Assigned'
    WHERE MissionID = @mission_id;

COMMIT;

-- Example 4: Safe mission cancellation with cleanup
START TRANSACTION;

    SET @cancel_mission_id = 999;
    
    -- Update mission status
    UPDATE MISSION 
    SET MissionStatus = 'Cancelled'
    WHERE MissionID = @cancel_mission_id;
    
    -- Cancel all assignments
    UPDATE MISSION_ASSIGNMENT 
    SET Status = 'Cancelled'
    WHERE MissionID = @cancel_mission_id;
    
    -- Free spacecraft
    UPDATE SPACECRAFT s
    INNER JOIN SPACECRAFT_MISSION sm ON s.SpacecraftID = sm.SpacecraftID
    SET s.Status = 'Ready'
    WHERE sm.MissionID = @cancel_mission_id;
    
    -- Cancel scheduled events
    UPDATE SCHEDULED_EVENT 
    SET Status = 'Cancelled'
    WHERE MissionID = @cancel_mission_id;

COMMIT;

-- Example 5: Transaction with error handling (for stored procedure)
DELIMITER $$

CREATE PROCEDURE sp_transfer_astronaut_with_transaction(
    IN p_old_mission INT,
    IN p_new_mission INT,
    IN p_astronaut_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Transfer failed - transaction rolled back' AS Result;
    END;
    
    START TRANSACTION;
    
        -- Remove from old mission
        DELETE FROM MISSION_ASSIGNMENT
        WHERE MissionID = p_old_mission AND AstronautID = p_astronaut_id;
        
        -- Add to new mission
        INSERT INTO MISSION_ASSIGNMENT (MissionID, AstronautID, AssignmentDate, Status)
        VALUES (p_new_mission, p_astronaut_id, CURDATE(), 'Assigned');
    
    COMMIT;
    
    SELECT 'Astronaut transferred successfully' AS Result;
END$$

DELIMITER ;

-- ================================================================
-- TRANSACTION ISOLATION LEVEL EXAMPLES
-- ================================================================

-- Set isolation level for current session
-- SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Example with explicit isolation level
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- START TRANSACTION;
--     SELECT * FROM MISSION WHERE MissionID = 1 FOR UPDATE;
--     -- Perform updates
-- COMMIT;

-- ================================================================
-- USAGE EXAMPLES FOR ADVANCED FEATURES
-- ================================================================

-- Query views
SELECT * FROM v_astronaut_profiles WHERE ExperienceLevel = 'Veteran';
SELECT * FROM v_mission_summary WHERE DaysUntilLaunch < 30;
SELECT * FROM v_critical_alerts;

-- Call stored procedures
CALL sp_assign_astronaut_to_mission(1, 1, 'Commander', 15.0, 'Mission leadership');
CALL sp_update_mission_status(1, 'Approved');
CALL sp_generate_mission_report(6);
CALL sp_check_astronaut_eligibility(1, 1);

-- Use functions
SELECT MissionName, Budget, fn_mission_cost_per_day(MissionID) AS CostPerDay FROM MISSION;
SELECT CONCAT(FirstName, ' ', LastName) AS Name, fn_astronaut_experience_score(PersonID) AS Score 
FROM PERSON WHERE PersonID IN (SELECT PersonID FROM ASTRONAUT);
SELECT fn_spacecraft_available(1, CURDATE()) AS Availability;

-- ================================================================
SELECT 'Advanced operations loaded successfully!' AS Status;
-- ================================================================
