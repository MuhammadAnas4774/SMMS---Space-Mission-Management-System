-- ================================================================
-- SPACE MISSION MANAGEMENT SYSTEM (SMMS) - CRUD OPERATIONS
-- ================================================================
-- This file contains all CRUD (Create, Read, Update, Delete) operations
-- Usage: Execute individual queries as needed, or source the entire file
-- ================================================================

USE smms;

-- ================================================================
-- CREATE OPERATIONS (INSERT)
-- ================================================================

-- -------------------- Single Row Insertion --------------------

-- Insert a single person
INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo)
VALUES ('John', 'Doe', '1990-05-15', 'M', 'American', 'john.doe@smms.space');

-- Insert a single astronaut (must reference existing PersonID)
INSERT INTO ASTRONAUT (PersonID, FlightHours, Role, Department, `Rank`, HealthStatus, Specialization, ClearanceLevel)
VALUES (LAST_INSERT_ID(), 250.5, 'Mission Specialist', 'Science', 'Specialist', 'Fit', 'Geology', 'Secret');

-- Insert a single mission
INSERT INTO MISSION (MissionName, MissionType, MissionObjective, LaunchDateTime, EstimatedDuration, Budget, RiskLevel, MissionStatus)
VALUES ('Asteroid Mining Survey', 'Exploration', 'Survey near-Earth asteroids for mining potential', '2027-03-15 12:00:00', 120.0, 12000000.00, 'High', 'Planned');

-- Insert a single spacecraft
INSERT INTO SPACECRAFT (Name, Manufacturer, Status, MaxCrewCapacity, MaxPayloadMass, LaunchDate)
VALUES ('Discovery One', 'AeroSpace Dynamics', 'Testing', 8, 15000.00, '2026-08-01');

-- Insert a single space station
INSERT INTO SPACE_STATION (StationName, LaunchDate, OrbitAltitude, OrbitalInclination, PowerGeneration, MaxCrewCapacity, InternationalPartners, CurrentStatus)
VALUES ('Lunar Gateway', '2026-12-01', 385000.00, 28.5, 250.0, 4, 'NASA, ESA, JAXA, CSA', 'Under Construction');

-- -------------------- Multiple Row Insertion --------------------

-- Insert multiple persons at once
INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo) VALUES
('Alice', 'Cooper', '1988-03-20', 'F', 'Canadian', 'alice.cooper@smms.space'),
('Bob', 'Taylor', '1985-07-10', 'M', 'Australian', 'bob.taylor@smms.space'),
('Chen', 'Wei', '1992-11-05', 'M', 'Chinese', 'chen.wei@smms.space'),
('Diana', 'Ross', '1989-09-18', 'F', 'British', 'diana.ross@smms.space');

-- Insert multiple experiments
INSERT INTO EXPERIMENT (Title, Objective, StartDate, EndDate, Status, PrincipalInvestigator) VALUES
('Quantum Computing Test', 'Test quantum processor in space radiation environment', '2026-08-01', '2027-02-01', 'Planned', 'Dr. Alan Turing'),
('Magnetic Field Study', 'Measure Earth magnetic field variations', '2026-07-15', '2026-12-15', 'Planned', 'Dr. Marie Curie'),
('Space Debris Tracking', 'Track and catalog orbital debris patterns', '2026-06-01', '2027-06-01', 'Active', 'Dr. Carl Sagan');

-- Insert multiple equipment items
INSERT INTO EQUIPMENT (StationID, EquipmentName, EquipmentType, SerialNumber, Manufacturer, Status, Location, PurchaseDate) VALUES
(1, 'Portable Oxygen Concentrator', 'Life Support', 'SN-POC-100-045', 'Hamilton', 'Operational', 'Unity Node Storage', '2025-06-15'),
(1, 'Radiation Detector Array', 'Monitoring', 'SN-RDA-200-012', 'RadSafe', 'Operational', 'External Platform A', '2025-03-20'),
(2, 'Sample Freezer Unit', 'Storage', 'SN-SFU-150-008', 'CryoTech', 'Maintenance', 'Columbus Lab', '2024-11-10');

-- -------------------- Insert with SELECT (Copy Data) --------------------

-- Create a backup/archive table for completed missions
CREATE TABLE IF NOT EXISTS MISSION_ARCHIVE LIKE MISSION;

-- Copy completed missions to archive
INSERT INTO MISSION_ARCHIVE
SELECT * FROM MISSION
WHERE MissionStatus = 'Completed';

-- Create a summary table of astronaut flight hours
CREATE TABLE IF NOT EXISTS ASTRONAUT_FLIGHT_SUMMARY (
    PersonID INT PRIMARY KEY,
    FullName VARCHAR(100),
    TotalFlightHours DECIMAL(10,2),
    Department VARCHAR(50)
);

-- Populate flight summary from astronaut and person data
INSERT INTO ASTRONAUT_FLIGHT_SUMMARY (PersonID, FullName, TotalFlightHours, Department)
SELECT 
    a.PersonID,
    CONCAT(p.FirstName, ' ', p.LastName) AS FullName,
    a.FlightHours,
    a.Department
FROM ASTRONAUT a
INNER JOIN PERSON p ON a.PersonID = p.PersonID;

-- ================================================================
-- READ OPERATIONS (SELECT)
-- ================================================================

-- -------------------- Basic SELECT Queries --------------------

-- Select all records from a table
SELECT * FROM PERSON;

-- Select specific columns
SELECT FirstName, LastName, Nationality FROM PERSON;

-- Select with calculated columns
SELECT 
    FirstName,
    LastName,
    YEAR(CURDATE()) - YEAR(DateOfBirth) AS Age,
    CONCAT(FirstName, ' ', LastName) AS FullName
FROM PERSON;

-- -------------------- WHERE Clause (Filtering) --------------------

-- Comparison operators
SELECT * FROM MISSION WHERE Budget > 5000000;
SELECT * FROM MISSION WHERE RiskLevel = 'High';
SELECT * FROM ASTRONAUT WHERE FlightHours >= 1000;
SELECT * FROM SPACECRAFT WHERE LaunchDate < '2025-06-01';

-- AND, OR operators
SELECT * FROM MISSION 
WHERE RiskLevel = 'High' AND Budget > 7000000;

SELECT * FROM ASTRONAUT 
WHERE Department = 'Operations' OR Department = 'Science';

-- BETWEEN operator
SELECT * FROM MISSION 
WHERE LaunchDateTime BETWEEN '2026-06-01' AND '2026-12-31';

SELECT * FROM ASTRONAUT 
WHERE FlightHours BETWEEN 500 AND 1000;

-- IN operator
SELECT * FROM PERSON 
WHERE Nationality IN ('American', 'British', 'Canadian');

SELECT * FROM SPACECRAFT 
WHERE Status IN ('Ready', 'Testing');

-- LIKE operator (pattern matching)
SELECT * FROM PERSON WHERE LastName LIKE 'S%';  -- Starts with S
SELECT * FROM EXPERIMENT WHERE Title LIKE '%Space%';  -- Contains 'Space'
SELECT * FROM EQUIPMENT WHERE SerialNumber LIKE 'SN-MS-%';  -- Specific pattern
SELECT * FROM PERSON WHERE FirstName LIKE '_va';  -- Second and third letters are 'va'

-- NOT operator
SELECT * FROM MISSION WHERE MissionStatus != 'Completed';
SELECT * FROM PERSON WHERE Nationality NOT IN ('American', 'Chinese');

-- IS NULL / IS NOT NULL
SELECT * FROM SPACECRAFT WHERE LaunchDate IS NULL;
SELECT * FROM ALERT WHERE RootCause IS NOT NULL;

-- -------------------- ORDER BY (Sorting) --------------------

-- Sort ascending (default)
SELECT * FROM ASTRONAUT ORDER BY FlightHours ASC;
SELECT * FROM PERSON ORDER BY LastName, FirstName;

-- Sort descending
SELECT * FROM MISSION ORDER BY Budget DESC;
SELECT * FROM SPACECRAFT ORDER BY LaunchDate DESC;

-- Multiple column sorting
SELECT * FROM MISSION 
ORDER BY RiskLevel DESC, Budget DESC;

-- -------------------- LIMIT and OFFSET (Pagination) --------------------

-- Get first 5 records
SELECT * FROM PERSON LIMIT 5;

-- Get top 3 highest budgets
SELECT MissionName, Budget FROM MISSION 
ORDER BY Budget DESC LIMIT 3;

-- Pagination: Skip first 5, get next 5 (Page 2, 5 per page)
SELECT * FROM PERSON 
ORDER BY PersonID 
LIMIT 5 OFFSET 5;

-- Pagination: Page 3, 10 per page
SELECT * FROM MISSION 
ORDER BY MissionID 
LIMIT 10 OFFSET 20;

-- -------------------- JOIN Operations --------------------

-- INNER JOIN: Get astronauts with their personal information
SELECT 
    p.FirstName,
    p.LastName,
    p.Nationality,
    a.FlightHours,
    a.Department,
    a.`Rank`
FROM ASTRONAUT a
INNER JOIN PERSON p ON a.PersonID = p.PersonID;

-- INNER JOIN: Get mission assignments with astronaut and mission details
SELECT 
    m.MissionName,
    CONCAT(p.FirstName, ' ', p.LastName) AS AstronautName,
    ma.Role,
    ma.EVAHoursPlanned,
    ma.Status
FROM MISSION_ASSIGNMENT ma
INNER JOIN MISSION m ON ma.MissionID = m.MissionID
INNER JOIN ASTRONAUT a ON ma.AstronautID = a.PersonID
INNER JOIN PERSON p ON a.PersonID = p.PersonID;

-- LEFT JOIN: Get all persons and their astronaut info (if they are astronauts)
SELECT 
    p.PersonID,
    p.FirstName,
    p.LastName,
    a.FlightHours,
    a.Department,
    CASE 
        WHEN a.PersonID IS NULL THEN 'Ground Personnel'
        ELSE 'Astronaut'
    END AS PersonnelType
FROM PERSON p
LEFT JOIN ASTRONAUT a ON p.PersonID = a.PersonID;

-- LEFT JOIN: Get all spacecraft and their mission assignments
SELECT 
    s.Name AS SpacecraftName,
    s.Status,
    m.MissionName,
    sm.RoleInMission
FROM SPACECRAFT s
LEFT JOIN SPACECRAFT_MISSION sm ON s.SpacecraftID = sm.SpacecraftID
LEFT JOIN MISSION m ON sm.MissionID = m.MissionID;

-- RIGHT JOIN: Get all missions and their spacecraft (if assigned)
SELECT 
    m.MissionName,
    m.MissionStatus,
    s.Name AS SpacecraftName,
    sm.RoleInMission
FROM SPACECRAFT_MISSION sm
RIGHT JOIN MISSION m ON sm.MissionID = m.MissionID
LEFT JOIN SPACECRAFT s ON sm.SpacecraftID = s.SpacecraftID;

-- SELF JOIN: Get astronauts and their mentors
SELECT 
    CONCAT(p1.FirstName, ' ', p1.LastName) AS Astronaut,
    a1.`Rank` AS AstronautRank,
    CONCAT(p2.FirstName, ' ', p2.LastName) AS Mentor,
    a2.`Rank` AS MentorRank
FROM ASTRONAUT a1
INNER JOIN PERSON p1 ON a1.PersonID = p1.PersonID
LEFT JOIN ASTRONAUT a2 ON a1.MentorID = a2.PersonID
LEFT JOIN PERSON p2 ON a2.PersonID = p2.PersonID;

-- Complex JOIN: Get complete mission assignment details
SELECT 
    m.MissionName,
    m.MissionType,
    m.LaunchDateTime,
    CONCAT(p.FirstName, ' ', p.LastName) AS AstronautName,
    ma.Role,
    a.Department,
    a.FlightHours,
    s.Name AS SpacecraftName
FROM MISSION m
INNER JOIN MISSION_ASSIGNMENT ma ON m.MissionID = ma.MissionID
INNER JOIN ASTRONAUT a ON ma.AstronautID = a.PersonID
INNER JOIN PERSON p ON a.PersonID = p.PersonID
LEFT JOIN SPACECRAFT_MISSION sm ON m.MissionID = sm.MissionID
LEFT JOIN SPACECRAFT s ON sm.SpacecraftID = s.SpacecraftID
WHERE m.MissionStatus IN ('Planned', 'In Progress')
ORDER BY m.LaunchDateTime;

-- -------------------- Aggregate Functions --------------------

-- COUNT
SELECT COUNT(*) AS TotalPersons FROM PERSON;
SELECT COUNT(*) AS TotalAstronauts FROM ASTRONAUT;
SELECT COUNT(DISTINCT Nationality) AS UniqueNationalities FROM PERSON;
SELECT COUNT(*) AS HighRiskMissions FROM MISSION WHERE RiskLevel = 'High';

-- SUM
SELECT SUM(Budget) AS TotalBudget FROM MISSION;
SELECT SUM(FlightHours) AS TotalFlightHours FROM ASTRONAUT;
SELECT SUM(MaxCrewCapacity) AS TotalCrewCapacity FROM SPACE_STATION;

-- AVG
SELECT AVG(Budget) AS AverageBudget FROM MISSION;
SELECT AVG(FlightHours) AS AverageFlightHours FROM ASTRONAUT;
SELECT AVG(OrbitAltitude) AS AverageAltitude FROM SPACE_STATION;

-- MIN and MAX
SELECT MIN(Budget) AS LowestBudget, MAX(Budget) AS HighestBudget FROM MISSION;
SELECT MIN(LaunchDateTime) AS FirstLaunch, MAX(LaunchDateTime) AS LastLaunch FROM MISSION;
SELECT MIN(FlightHours) AS MinHours, MAX(FlightHours) AS MaxHours FROM ASTRONAUT;

-- Multiple aggregates in one query
SELECT 
    COUNT(*) AS TotalMissions,
    SUM(Budget) AS TotalBudget,
    AVG(Budget) AS AvgBudget,
    MIN(Budget) AS MinBudget,
    MAX(Budget) AS MaxBudget
FROM MISSION;

-- -------------------- GROUP BY and HAVING --------------------

-- Group by single column
SELECT Nationality, COUNT(*) AS Count 
FROM PERSON 
GROUP BY Nationality
ORDER BY Count DESC;

-- Group missions by type
SELECT MissionType, COUNT(*) AS Count, AVG(Budget) AS AvgBudget
FROM MISSION
GROUP BY MissionType;

-- Group by multiple columns
SELECT Department, `Rank`, COUNT(*) AS Count, AVG(FlightHours) AS AvgHours
FROM ASTRONAUT
GROUP BY Department, `Rank`
ORDER BY Department, `Rank`;

-- HAVING clause (filter groups)
SELECT Nationality, COUNT(*) AS Count
FROM PERSON
GROUP BY Nationality
HAVING COUNT(*) >= 2;

-- Complex grouping: High-budget mission types
SELECT MissionType, COUNT(*) AS MissionCount, SUM(Budget) AS TotalBudget
FROM MISSION
GROUP BY MissionType
HAVING SUM(Budget) > 5000000
ORDER BY TotalBudget DESC;

-- Group spacecraft by status
SELECT Status, COUNT(*) AS Count, AVG(MaxPayloadMass) AS AvgPayload
FROM SPACECRAFT
GROUP BY Status
HAVING COUNT(*) >= 2;

-- -------------------- Subqueries --------------------

-- Subquery in WHERE clause: Find astronauts with above-average flight hours
SELECT FirstName, LastName, FlightHours
FROM PERSON p
INNER JOIN ASTRONAUT a ON p.PersonID = a.PersonID
WHERE FlightHours > (SELECT AVG(FlightHours) FROM ASTRONAUT);

-- Subquery with IN: Find persons who are astronauts
SELECT FirstName, LastName, Nationality
FROM PERSON
WHERE PersonID IN (SELECT PersonID FROM ASTRONAUT);

-- Subquery with EXISTS: Find missions that have assignments
SELECT MissionName, MissionType, LaunchDateTime
FROM MISSION m
WHERE EXISTS (
    SELECT 1 FROM MISSION_ASSIGNMENT ma 
    WHERE ma.MissionID = m.MissionID
);

-- Subquery in SELECT: Get mission with astronaut count
SELECT 
    MissionName,
    LaunchDateTime,
    (SELECT COUNT(*) FROM MISSION_ASSIGNMENT ma WHERE ma.MissionID = m.MissionID) AS AssignedAstronauts
FROM MISSION m;

-- Correlated subquery: Find most expensive mission per type
SELECT MissionName, MissionType, Budget
FROM MISSION m1
WHERE Budget = (
    SELECT MAX(Budget) 
    FROM MISSION m2 
    WHERE m2.MissionType = m1.MissionType
);

-- Subquery in FROM (derived table)
SELECT MissionType, AVG(Budget) AS AvgBudget
FROM (
    SELECT MissionType, Budget 
    FROM MISSION 
    WHERE RiskLevel IN ('High', 'Critical')
) AS HighRiskMissions
GROUP BY MissionType;

-- -------------------- Advanced SELECT Queries --------------------

-- DISTINCT: Get unique values
SELECT DISTINCT Nationality FROM PERSON;
SELECT DISTINCT Department FROM ASTRONAUT;
SELECT DISTINCT MissionType FROM MISSION;

-- CASE statement
SELECT 
    MissionName,
    Budget,
    CASE 
        WHEN Budget < 2000000 THEN 'Low Budget'
        WHEN Budget BETWEEN 2000000 AND 5000000 THEN 'Medium Budget'
        WHEN Budget > 5000000 THEN 'High Budget'
    END AS BudgetCategory
FROM MISSION;

-- Complex CASE with multiple conditions
SELECT 
    CONCAT(p.FirstName, ' ', p.LastName) AS AstronautName,
    a.FlightHours,
    CASE 
        WHEN a.FlightHours < 500 THEN 'Novice'
        WHEN a.FlightHours BETWEEN 500 AND 1000 THEN 'Experienced'
        WHEN a.FlightHours > 1000 THEN 'Veteran'
    END AS ExperienceLevel,
    CASE 
        WHEN a.HealthStatus = 'Fit' AND a.FlightHours > 1000 THEN 'Commander Candidate'
        WHEN a.HealthStatus = 'Fit' THEN 'Mission Ready'
        ELSE 'Not Ready'
    END AS MissionReadiness
FROM ASTRONAUT a
INNER JOIN PERSON p ON a.PersonID = p.PersonID;

-- UNION: Combine results from multiple queries
SELECT 'Astronaut' AS Type, COUNT(*) AS Count FROM ASTRONAUT
UNION
SELECT 'Ground Control' AS Type, COUNT(*) AS Count FROM GROUND_CONTROL;

-- Date functions
SELECT 
    MissionName,
    LaunchDateTime,
    DATE(LaunchDateTime) AS LaunchDate,
    TIME(LaunchDateTime) AS LaunchTime,
    YEAR(LaunchDateTime) AS LaunchYear,
    MONTH(LaunchDateTime) AS LaunchMonth,
    DAY(LaunchDateTime) AS LaunchDay,
    DAYNAME(LaunchDateTime) AS LaunchDayName
FROM MISSION;

-- String functions
SELECT 
    FirstName,
    LastName,
    UPPER(LastName) AS UpperLastName,
    LOWER(FirstName) AS LowerFirstName,
    CONCAT(FirstName, ' ', LastName) AS FullName,
    LENGTH(FirstName) AS FirstNameLength,
    SUBSTRING(ContactInfo, 1, 10) AS EmailPrefix
FROM PERSON;

-- ================================================================
-- UPDATE OPERATIONS
-- ================================================================

-- -------------------- Update Single Column --------------------

-- Update mission status
UPDATE MISSION 
SET MissionStatus = 'Approved' 
WHERE MissionID = 1;

-- Update spacecraft status
UPDATE SPACECRAFT 
SET Status = 'Ready' 
WHERE SpacecraftID = 5;

-- Update astronaut health status
UPDATE ASTRONAUT 
SET HealthStatus = 'Medical Review' 
WHERE PersonID = 3;

-- -------------------- Update Multiple Columns --------------------

-- Update multiple columns for a person
UPDATE PERSON 
SET ContactInfo = 'newemail@smms.space', 
    Nationality = 'Dual: American/Canadian' 
WHERE PersonID = 1;

-- Update mission details
UPDATE MISSION 
SET MissionStatus = 'In Progress',
    ActualDuration = 15.5,
    UpdatedAt = CURRENT_TIMESTAMP
WHERE MissionID = 6;

-- Update equipment calibration
UPDATE EQUIPMENT 
SET CalibrationDate = CURDATE(),
    Status = 'Operational'
WHERE EquipmentID = 3;

-- -------------------- Update with WHERE Clause --------------------

-- Update all missions with specific criteria
UPDATE MISSION 
SET MissionStatus = 'Under Review' 
WHERE MissionStatus = 'Planned' AND RiskLevel = 'Critical';

-- Increase budget for high-risk missions
UPDATE MISSION 
SET Budget = Budget * 1.15 
WHERE RiskLevel IN ('High', 'Critical');

-- Update astronaut flight hours
UPDATE ASTRONAUT 
SET FlightHours = FlightHours + 50.5 
WHERE PersonID = 1;

-- Mark old equipment for maintenance
UPDATE EQUIPMENT 
SET Status = 'Maintenance Required' 
WHERE CalibrationDate < DATE_SUB(CURDATE(), INTERVAL 6 MONTH);

-- -------------------- Update with JOIN --------------------

-- Update person contact info based on astronaut department
UPDATE PERSON p
INNER JOIN ASTRONAUT a ON p.PersonID = a.PersonID
SET p.ContactInfo = CONCAT(LOWER(p.FirstName), '.', LOWER(p.LastName), '@', LOWER(a.Department), '.smms.space')
WHERE a.Department IS NOT NULL;

-- Update mission assignment status when mission status changes
UPDATE MISSION_ASSIGNMENT ma
INNER JOIN MISSION m ON ma.MissionID = m.MissionID
SET ma.Status = 'Active'
WHERE m.MissionStatus = 'In Progress';

-- -------------------- Update with CASE Statement --------------------

-- Update mission status based on launch date
UPDATE MISSION 
SET MissionStatus = CASE 
    WHEN LaunchDateTime < NOW() THEN 'In Progress'
    WHEN LaunchDateTime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Final Preparation'
    ELSE 'Planned'
END
WHERE MissionStatus = 'Planned';

-- Update astronaut clearance based on flight hours and rank
UPDATE ASTRONAUT 
SET ClearanceLevel = CASE 
    WHEN FlightHours > 1200 AND `Rank` IN ('Captain', 'Major') THEN 'Top Secret'
    WHEN FlightHours > 800 THEN 'Secret'
    ELSE 'Confidential'
END;

-- ================================================================
-- DELETE OPERATIONS
-- ================================================================

-- -------------------- Delete Specific Records --------------------

-- Delete a specific person (will cascade to astronaut/ground_control)
DELETE FROM PERSON WHERE PersonID = 100;

-- Delete a specific mission (must handle foreign key constraints)
DELETE FROM MISSION WHERE MissionID = 999;

-- Delete specific equipment
DELETE FROM EQUIPMENT WHERE EquipmentID = 50;

-- Delete with WHERE clause
DELETE FROM EXPERIMENT 
WHERE Status = 'Cancelled';

-- Delete old alerts that have been resolved
DELETE FROM ALERT 
WHERE Acknowledged = TRUE 
AND ResolutionTime < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- -------------------- Delete with JOIN --------------------

-- Delete mission assignments for cancelled missions
DELETE ma FROM MISSION_ASSIGNMENT ma
INNER JOIN MISSION m ON ma.MissionID = m.MissionID
WHERE m.MissionStatus = 'Cancelled';

-- Delete telemetry data for decommissioned spacecraft
DELETE td FROM TELEMETRY_DATA td
INNER JOIN SPACECRAFT s ON td.SpacecraftID = s.SpacecraftID
WHERE s.Status = 'Decommissioned';

-- -------------------- Soft Delete (Recommended) --------------------

-- Instead of deleting, mark as deleted (preserves data)
UPDATE PERSON SET IsDeleted = TRUE WHERE PersonID = 100;
UPDATE MISSION SET IsDeleted = TRUE WHERE MissionID = 999;

-- Query active (non-deleted) records
SELECT * FROM PERSON WHERE IsDeleted = FALSE OR IsDeleted IS NULL;
SELECT * FROM MISSION WHERE IsDeleted = FALSE OR IsDeleted IS NULL;

-- -------------------- Delete All Records (CAUTION!) --------------------

-- TRUNCATE is faster than DELETE but cannot be rolled back
-- TRUNCATE TABLE MISSION_ARCHIVE;  -- Use with extreme caution!

-- DELETE all records (can be rolled back if in transaction)
-- DELETE FROM MISSION_ARCHIVE;  -- Use with caution!

-- ================================================================
-- COMPLEX CRUD COMBINATIONS
-- ================================================================

-- Insert and immediately retrieve the new record
INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo)
VALUES ('Test', 'User', '1995-01-01', 'M', 'American', 'test@smms.space');

SELECT * FROM PERSON WHERE PersonID = LAST_INSERT_ID();

-- Update and show affected rows
UPDATE MISSION SET MissionStatus = 'Approved' WHERE MissionStatus = 'Planned' AND RiskLevel = 'Low';
SELECT ROW_COUNT() AS AffectedRows;

-- Conditional insert (only if not exists)
INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo)
SELECT 'Jane', 'Doe', '1992-03-15', 'F', 'British', 'jane.doe@smms.space'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM PERSON WHERE FirstName = 'Jane' AND LastName = 'Doe'
);

-- Upsert (Insert or Update)
INSERT INTO EQUIPMENT (EquipmentID, StationID, EquipmentName, EquipmentType, Status, Location)
VALUES (999, 1, 'Test Equipment', 'Testing', 'Operational', 'Lab A')
ON DUPLICATE KEY UPDATE 
    Status = 'Operational',
    Location = 'Lab A';

-- ================================================================
-- USEFUL ADMINISTRATIVE QUERIES
-- ================================================================

-- Show table structure
DESCRIBE PERSON;
DESCRIBE MISSION;

-- Show indexes on a table
SHOW INDEX FROM MISSION;

-- Show table creation statement
SHOW CREATE TABLE ASTRONAUT;

-- Get table row counts
SELECT 
    'PERSON' AS TableName, COUNT(*) AS RowCount FROM PERSON
UNION ALL
SELECT 'ASTRONAUT', COUNT(*) FROM ASTRONAUT
UNION ALL
SELECT 'MISSION', COUNT(*) FROM MISSION
UNION ALL
SELECT 'SPACECRAFT', COUNT(*) FROM SPACECRAFT
UNION ALL
SELECT 'SPACE_STATION', COUNT(*) FROM SPACE_STATION;

-- Check database size
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'smms'
ORDER BY (data_length + index_length) DESC;

-- ================================================================
SELECT 'CRUD operations loaded successfully!' AS Status;
-- ================================================================
