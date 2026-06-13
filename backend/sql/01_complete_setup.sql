-- ================================================================
-- SPACE MISSION MANAGEMENT SYSTEM (SMMS) - COMPLETE SETUP
-- ================================================================
-- This file creates the database, all tables, and loads sample data
-- Run this file to set up the entire database from scratch
-- Usage: mysql -u root -p < backend/sql/01_complete_setup.sql
-- ================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS smms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smms;

-- ================================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ================================================================

DROP TABLE IF EXISTS MODULE_INTEGRATION;
DROP TABLE IF EXISTS MISSION_ASSIGNMENT;
DROP TABLE IF EXISTS SPACECRAFT_MISSION;
DROP TABLE IF EXISTS EXPERIMENT_EXECUTION;
DROP TABLE IF EXISTS ALERT;
DROP TABLE IF EXISTS SYSTEM_STATUS;
DROP TABLE IF EXISTS ENVIRONMENTAL_DATA;
DROP TABLE IF EXISTS NAVIGATION_DATA;
DROP TABLE IF EXISTS TELEMETRY_DATA;
DROP TABLE IF EXISTS SCHEDULED_EVENT;
DROP TABLE IF EXISTS BIOLOGICAL;
DROP TABLE IF EXISTS PHYSICAL;
DROP TABLE IF EXISTS ASTRONOMY;
DROP TABLE IF EXISTS ENGINEERING_EXP;
DROP TABLE IF EXISTS EXPERIMENT;
DROP TABLE IF EXISTS HABITAT;
DROP TABLE IF EXISTS LABORATORY;
DROP TABLE IF EXISTS MODULE;
DROP TABLE IF EXISTS ROCKET;
DROP TABLE IF EXISTS SHUTTLE;
DROP TABLE IF EXISTS CAPSULE;
DROP TABLE IF EXISTS EQUIPMENT;
DROP TABLE IF EXISTS SPACECRAFT;
DROP TABLE IF EXISTS MISSION;
DROP TABLE IF EXISTS SPACE_STATION;
DROP TABLE IF EXISTS ASTRONAUT;
DROP TABLE IF EXISTS GROUND_CONTROL;
DROP TABLE IF EXISTS PERSON;

-- ================================================================
-- CREATE CORE TABLES
-- ================================================================

-- PERSON: Base table for all personnel
CREATE TABLE PERSON (
  PersonID INT PRIMARY KEY AUTO_INCREMENT,
  FirstName VARCHAR(50) NOT NULL,
  LastName VARCHAR(50) NOT NULL,
  DateOfBirth DATE NOT NULL,
  Gender VARCHAR(10) CHECK (Gender IN ('M', 'F', 'Other')),
  Nationality VARCHAR(50) NOT NULL,
  ContactInfo VARCHAR(100),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  IsDeleted BOOLEAN DEFAULT FALSE,
  INDEX IDX_PERSON_LastName (LastName),
  INDEX IDX_PERSON_Nationality (Nationality)
) ENGINE=InnoDB;

-- ASTRONAUT: Personnel in space
CREATE TABLE ASTRONAUT (
  PersonID INT PRIMARY KEY,
  FlightHours DECIMAL(8,2) DEFAULT 0,
  Role VARCHAR(50) NOT NULL,
  Specialization VARCHAR(100),
  ClearanceLevel VARCHAR(20),
  SpaceSuitSize VARCHAR(10),
  Department VARCHAR(50),
  `Rank` VARCHAR(30),
  HealthStatus VARCHAR(50),
  ConsoleAssignment VARCHAR(50),
  ShiftSchedule VARCHAR(50),
  MentorID INT NULL,
  CONSTRAINT FK_ASTRONAUT_PERSON FOREIGN KEY (PersonID) 
    REFERENCES PERSON(PersonID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FK_ASTRONAUT_MENTOR FOREIGN KEY (MentorID) 
    REFERENCES ASTRONAUT(PersonID) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX IDX_ASTRONAUT_Department (Department),
  INDEX IDX_ASTRONAUT_HealthStatus (HealthStatus)
) ENGINE=InnoDB;

-- GROUND_CONTROL: Ground-based personnel
CREATE TABLE GROUND_CONTROL (
  PersonID INT PRIMARY KEY,
  Role VARCHAR(50) NOT NULL,
  Department VARCHAR(50),
  ShiftSchedule VARCHAR(50),
  ConsoleAssignment VARCHAR(50),
  ClearanceLevel VARCHAR(20),
  CONSTRAINT FK_GROUND_CONTROL_PERSON FOREIGN KEY (PersonID) 
    REFERENCES PERSON(PersonID) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX IDX_GC_Department (Department)
) ENGINE=InnoDB;

-- SPACE_STATION: Orbital stations
CREATE TABLE SPACE_STATION (
  StationID INT PRIMARY KEY AUTO_INCREMENT,
  StationName VARCHAR(100) NOT NULL UNIQUE,
  LaunchDate DATE,
  OrbitAltitude DECIMAL(10,2),
  OrbitalInclination DECIMAL(5,2),
  PowerGeneration DECIMAL(10,2),
  MaxCrewCapacity INT,
  InternationalPartners VARCHAR(200),
  CurrentStatus VARCHAR(50),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX IDX_STATION_Status (CurrentStatus)
) ENGINE=InnoDB;

-- MODULE: Station modules
CREATE TABLE MODULE (
  ModuleID INT PRIMARY KEY AUTO_INCREMENT,
  StationID INT NULL,
  Name VARCHAR(100) NOT NULL,
  Manufacturer VARCHAR(100),
  LaunchMass DECIMAL(10,2),
  LaunchDate DATE,
  Dimensions VARCHAR(100),
  CONSTRAINT FK_MODULE_STATION FOREIGN KEY (StationID) 
    REFERENCES SPACE_STATION(StationID) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX IDX_MODULE_StationID (StationID),
  INDEX IDX_MODULE_Name (Name)
) ENGINE=InnoDB;

-- HABITAT: Residential modules
CREATE TABLE HABITAT (
  ModuleID INT PRIMARY KEY,
  SleepingQuarters INT,
  ExerciseEquipment VARCHAR(100),
  GalleyFacilities VARCHAR(100),
  LifeSupportCapacity INT,
  CONSTRAINT FK_HABITAT_MODULE FOREIGN KEY (ModuleID) 
    REFERENCES MODULE(ModuleID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- LABORATORY: Research modules
CREATE TABLE LABORATORY (
  ModuleID INT PRIMARY KEY,
  ResearchFocus VARCHAR(150),
  CleanRoomLevel VARCHAR(50),
  SampleStorage VARCHAR(100),
  EquipmentList TEXT,
  CONSTRAINT FK_LAB_MODULE FOREIGN KEY (ModuleID) 
    REFERENCES MODULE(ModuleID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- SPACECRAFT: Vehicles
CREATE TABLE SPACECRAFT (
  SpacecraftID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL UNIQUE,
  Manufacturer VARCHAR(100),
  Status VARCHAR(50),
  MaxCrewCapacity INT,
  MaxPayloadMass DECIMAL(12,2),
  LaunchDate DATE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX IDX_SPACECRAFT_Status (Status),
  INDEX IDX_SPACECRAFT_Manufacturer (Manufacturer)
) ENGINE=InnoDB;

-- CAPSULE: Crew capsules
CREATE TABLE CAPSULE (
  SpacecraftID INT PRIMARY KEY,
  DockingPorts INT,
  LandingGear VARCHAR(50),
  HeatShieldType VARCHAR(50),
  CrewCapacity INT,
  CONSTRAINT FK_CAPSULE_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- SHUTTLE: Space shuttles
CREATE TABLE SHUTTLE (
  SpacecraftID INT PRIMARY KEY,
  CargoBaySize DECIMAL(10,2),
  Wingspan DECIMAL(10,2),
  CrewCapacity INT,
  CONSTRAINT FK_SHUTTLE_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ROCKET: Launch vehicles
CREATE TABLE ROCKET (
  SpacecraftID INT PRIMARY KEY,
  StageCount INT,
  BoosterCount INT,
  Reusable BOOLEAN,
  CONSTRAINT FK_ROCKET_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- MISSION: Space missions
CREATE TABLE MISSION (
  MissionID INT PRIMARY KEY AUTO_INCREMENT,
  MissionName VARCHAR(100) NOT NULL UNIQUE,
  MissionType VARCHAR(50) NOT NULL,
  MissionObjective TEXT,
  LaunchDateTime DATETIME NOT NULL,
  EstimatedDuration DECIMAL(6,2),
  ActualDuration DECIMAL(6,2),
  Budget DECIMAL(15,2),
  RiskLevel VARCHAR(20) CHECK (RiskLevel IN ('Low', 'Medium', 'High', 'Critical')),
  MissionStatus VARCHAR(30) NOT NULL DEFAULT 'Planned',
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  IsDeleted BOOLEAN DEFAULT FALSE,
  INDEX IDX_MISSION_Status (MissionStatus),
  INDEX IDX_MISSION_Type (MissionType),
  INDEX IDX_MISSION_RiskLevel (RiskLevel),
  INDEX IDX_MISSION_LaunchDateTime (LaunchDateTime)
) ENGINE=InnoDB;

-- EXPERIMENT: Scientific experiments
CREATE TABLE EXPERIMENT (
  ExperimentID INT PRIMARY KEY AUTO_INCREMENT,
  Title VARCHAR(120) NOT NULL,
  Objective TEXT,
  StartDate DATE,
  EndDate DATE,
  Status VARCHAR(40),
  PrincipalInvestigator VARCHAR(100),
  INDEX IDX_EXPERIMENT_Status (Status),
  INDEX IDX_EXPERIMENT_StartDate (StartDate)
) ENGINE=InnoDB;

-- BIOLOGICAL: Biological experiments
CREATE TABLE BIOLOGICAL (
  ExperimentID INT PRIMARY KEY,
  SpecimenType VARCHAR(80),
  Containment VARCHAR(80),
  CrewImpact VARCHAR(80),
  CONSTRAINT FK_BIO_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- PHYSICAL: Physics experiments
CREATE TABLE PHYSICAL (
  ExperimentID INT PRIMARY KEY,
  PhysicsType VARCHAR(80),
  PhysicsPrecision VARCHAR(40),
  DataRate VARCHAR(40),
  CONSTRAINT FK_PHY_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ASTRONOMY: Astronomical observations
CREATE TABLE ASTRONOMY (
  ExperimentID INT PRIMARY KEY,
  SkyRegion VARCHAR(80),
  TelescopeUsed VARCHAR(80),
  Wavelength VARCHAR(40),
  ExposureTime VARCHAR(40),
  CONSTRAINT FK_ASTRO_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ENGINEERING_EXP: Engineering tests
CREATE TABLE ENGINEERING_EXP (
  ExperimentID INT PRIMARY KEY,
  TestObjective VARCHAR(120),
  SafetyMargin VARCHAR(40),
  RedundancyLevel VARCHAR(40),
  StressFactors VARCHAR(120),
  CONSTRAINT FK_ENG_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- TELEMETRY_DATA: Spacecraft data
CREATE TABLE TELEMETRY_DATA (
  TelemetryID INT PRIMARY KEY AUTO_INCREMENT,
  SpacecraftID INT NOT NULL,
  MissionID INT NOT NULL,
  Timestamp DATETIME NOT NULL,
  DataQuality VARCHAR(40),
  SourceSystem VARCHAR(80),
  CONSTRAINT FK_TELEM_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_TELEM_MISSION FOREIGN KEY (MissionID) 
    REFERENCES MISSION(MissionID) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX IDX_TELEM_MissionID (MissionID),
  INDEX IDX_TELEM_SpacecraftID (SpacecraftID),
  INDEX IDX_TELEM_Timestamp (Timestamp)
) ENGINE=InnoDB;

-- SYSTEM_STATUS: System health data
CREATE TABLE SYSTEM_STATUS (
  TelemetryID INT PRIMARY KEY,
  Temperature DECIMAL(6,2),
  Humidity DECIMAL(6,2),
  CPUUsage DECIMAL(6,2),
  PowerLevel DECIMAL(6,2),
  OxygenLevel DECIMAL(6,2),
  Pressure DECIMAL(8,2),
  MemoryUsage DECIMAL(6,2),
  CommStatus VARCHAR(50),
  CONSTRAINT FK_SYS_TELEM FOREIGN KEY (TelemetryID) 
    REFERENCES TELEMETRY_DATA(TelemetryID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ENVIRONMENTAL_DATA: Environmental readings
CREATE TABLE ENVIRONMENTAL_DATA (
  TelemetryID INT PRIMARY KEY,
  Temperature DECIMAL(6,2),
  Humidity DECIMAL(6,2),
  Pressure DECIMAL(8,2),
  OxygenLevel DECIMAL(6,2),
  Radiation DECIMAL(8,2),
  CONSTRAINT FK_ENV_TELEM FOREIGN KEY (TelemetryID) 
    REFERENCES TELEMETRY_DATA(TelemetryID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- NAVIGATION_DATA: Position and velocity
CREATE TABLE NAVIGATION_DATA (
  TelemetryID INT PRIMARY KEY,
  PositionX DECIMAL(12,4),
  PositionY DECIMAL(12,4),
  PositionZ DECIMAL(12,4),
  Velocity DECIMAL(12,4),
  Orientation VARCHAR(80),
  TransmissionDelay DECIMAL(8,3),
  ErrorCodes VARCHAR(120),
  CONSTRAINT FK_NAV_TELEM FOREIGN KEY (TelemetryID) 
    REFERENCES TELEMETRY_DATA(TelemetryID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ALERT: System alerts
CREATE TABLE ALERT (
  AlertID INT PRIMARY KEY AUTO_INCREMENT,
  TelemetryID INT,
  AlertType VARCHAR(50),
  Severity VARCHAR(20) CHECK (Severity IN ('Low', 'Medium', 'High', 'Critical')),
  Timestamp DATETIME,
  Message TEXT,
  Acknowledged BOOLEAN DEFAULT FALSE,
  RootCause TEXT,
  ResolutionTime DATETIME,
  CONSTRAINT FK_ALERT_TELEM FOREIGN KEY (TelemetryID) 
    REFERENCES TELEMETRY_DATA(TelemetryID) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX IDX_ALERT_Severity (Severity),
  INDEX IDX_ALERT_Acknowledged (Acknowledged),
  INDEX IDX_ALERT_Timestamp (Timestamp)
) ENGINE=InnoDB;

-- SCHEDULED_EVENT: Mission events
CREATE TABLE SCHEDULED_EVENT (
  EventID INT PRIMARY KEY AUTO_INCREMENT,
  MissionID INT,
  AlertID INT NULL,
  ExperimentID INT NULL,
  PersonID INT NULL,
  PrecedingEventID INT NULL,
  EventType VARCHAR(60),
  Description TEXT,
  PlannedStartTime DATETIME,
  PlannedDuration DECIMAL(8,2),
  ActualStartTime DATETIME,
  ActualDuration DECIMAL(8,2),
  Criticality VARCHAR(20),
  Status VARCHAR(40),
  CONSTRAINT FK_EVENT_MISSION FOREIGN KEY (MissionID) 
    REFERENCES MISSION(MissionID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_EVENT_ALERT FOREIGN KEY (AlertID) 
    REFERENCES ALERT(AlertID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT FK_EVENT_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT FK_EVENT_GC FOREIGN KEY (PersonID) 
    REFERENCES GROUND_CONTROL(PersonID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT FK_EVENT_PRECEDING FOREIGN KEY (PrecedingEventID) 
    REFERENCES SCHEDULED_EVENT(EventID) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX IDX_EVENT_MissionID (MissionID),
  INDEX IDX_EVENT_Status (Status),
  INDEX IDX_EVENT_PlannedStartTime (PlannedStartTime)
) ENGINE=InnoDB;

-- EQUIPMENT: Hardware and tools
CREATE TABLE EQUIPMENT (
  EquipmentID INT PRIMARY KEY AUTO_INCREMENT,
  StationID INT NULL,
  SpacecraftID INT NULL,
  EquipmentName VARCHAR(100) NOT NULL,
  EquipmentType VARCHAR(60) NOT NULL,
  SerialNumber VARCHAR(80) UNIQUE,
  Manufacturer VARCHAR(100),
  Status VARCHAR(40),
  Location VARCHAR(120),
  CalibrationDate DATE,
  WarrantyExpiry DATE,
  PurchaseDate DATE,
  CONSTRAINT FK_EQUIP_STATION FOREIGN KEY (StationID) 
    REFERENCES SPACE_STATION(StationID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT FK_EQUIP_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX IDX_EQUIP_Status (Status),
  INDEX IDX_EQUIP_Type (EquipmentType)
) ENGINE=InnoDB;

-- ================================================================
-- RELATIONSHIP TABLES
-- ================================================================

-- MISSION_ASSIGNMENT: Astronaut assignments
CREATE TABLE MISSION_ASSIGNMENT (
  AssignmentID INT PRIMARY KEY AUTO_INCREMENT,
  MissionID INT NOT NULL,
  AstronautID INT NOT NULL,
  Role VARCHAR(50),
  AssignmentDate DATE,
  EVAHoursPlanned DECIMAL(6,2),
  PrimaryResponsibility VARCHAR(120),
  TrainingCompletionDate DATE,
  Status VARCHAR(40),
  CONSTRAINT FK_ASSIGN_MISSION FOREIGN KEY (MissionID) 
    REFERENCES MISSION(MissionID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_ASSIGN_ASTRONAUT FOREIGN KEY (AstronautID) 
    REFERENCES ASTRONAUT(PersonID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT UQ_MISSION_ASTRONAUT UNIQUE (MissionID, AstronautID),
  INDEX IDX_ASSIGN_MissionID (MissionID),
  INDEX IDX_ASSIGN_AstronautID (AstronautID),
  INDEX IDX_ASSIGN_Status (Status)
) ENGINE=InnoDB;

-- SPACECRAFT_MISSION: Spacecraft usage in missions
CREATE TABLE SPACECRAFT_MISSION (
  SMCID INT PRIMARY KEY AUTO_INCREMENT,
  MissionID INT NOT NULL,
  SpacecraftID INT NOT NULL,
  RoleInMission VARCHAR(60),
  LaunchConfiguration VARCHAR(100),
  ReentryDate DATETIME,
  LandingSite VARCHAR(100),
  ReturnMass DECIMAL(12,2),
  ActualLaunchMass DECIMAL(12,2),
  CONSTRAINT FK_SMC_MISSION FOREIGN KEY (MissionID) 
    REFERENCES MISSION(MissionID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_SMC_SPACECRAFT FOREIGN KEY (SpacecraftID) 
    REFERENCES SPACECRAFT(SpacecraftID) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX IDX_SMC_MissionID (MissionID),
  INDEX IDX_SMC_SpacecraftID (SpacecraftID)
) ENGINE=InnoDB;

-- EXPERIMENT_EXECUTION: Experiment scheduling
CREATE TABLE EXPERIMENT_EXECUTION (
  ExecutionID INT PRIMARY KEY AUTO_INCREMENT,
  MissionID INT NOT NULL,
  ExperimentID INT NOT NULL,
  ScheduledStart DATETIME,
  ScheduledEnd DATETIME,
  ActualStart DATETIME,
  ActualEnd DATETIME,
  SuccessRating INT CHECK (SuccessRating BETWEEN 0 AND 100),
  Notes TEXT,
  EquipmentUsed TEXT,
  Location VARCHAR(100),
  DataVolumeGenerated DECIMAL(12,2),
  CONSTRAINT FK_EXEC_MISSION FOREIGN KEY (MissionID) 
    REFERENCES MISSION(MissionID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_EXEC_EXP FOREIGN KEY (ExperimentID) 
    REFERENCES EXPERIMENT(ExperimentID) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX IDX_EXEC_MissionID (MissionID),
  INDEX IDX_EXEC_ExperimentID (ExperimentID)
) ENGINE=InnoDB;

-- MODULE_INTEGRATION: Module docking
CREATE TABLE MODULE_INTEGRATION (
  IntegrationID INT PRIMARY KEY AUTO_INCREMENT,
  ModuleID INT NOT NULL,
  StationID INT NOT NULL,
  DockingDate DATETIME,
  UndockingDate DATETIME,
  DockingPort VARCHAR(40),
  ConnectionType VARCHAR(40),
  LifeSupportIntegration VARCHAR(40),
  DataLinkStatus VARCHAR(40),
  PowerIntegrationStatus VARCHAR(40),
  CONSTRAINT FK_MI_MODULE FOREIGN KEY (ModuleID) 
    REFERENCES MODULE(ModuleID) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT FK_MI_STATION FOREIGN KEY (StationID) 
    REFERENCES SPACE_STATION(StationID) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX IDX_MI_ModuleID (ModuleID),
  INDEX IDX_MI_StationID (StationID)
) ENGINE=InnoDB;

-- ================================================================
-- INSERT SAMPLE DATA
-- ================================================================

-- Insert Persons
INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo) VALUES
('Ava', 'Khan', '1988-01-10', 'F', 'Pakistani', 'ava.khan@smms.space'),
('Zayd', 'Ali', '1986-03-21', 'M', 'Pakistani', 'zayd.ali@smms.space'),
('Noah', 'Smith', '1990-06-15', 'M', 'American', 'noah.smith@smms.space'),
('Mila', 'Chen', '1992-09-05', 'F', 'Chinese', 'mila.chen@smms.space'),
('Sara', 'Park', '1989-11-17', 'F', 'Korean', 'sara.park@smms.space'),
('James', 'Wilson', '1985-04-22', 'M', 'British', 'james.wilson@smms.space'),
('Emma', 'Johnson', '1991-08-30', 'F', 'Canadian', 'emma.johnson@smms.space'),
('Lucas', 'Silva', '1987-12-05', 'M', 'Brazilian', 'lucas.silva@smms.space'),
('Sofia', 'Martinez', '1993-02-18', 'F', 'Spanish', 'sofia.martinez@smms.space'),
('Raj', 'Patel', '1984-07-14', 'M', 'Indian', 'raj.patel@smms.space');

-- Insert Astronauts
INSERT INTO ASTRONAUT (PersonID, FlightHours, Role, Department, `Rank`, HealthStatus, Specialization, ClearanceLevel) VALUES
(1, 1250.5, 'Commander', 'Operations', 'Captain', 'Fit', 'Mission Command', 'Top Secret'),
(2, 980.0, 'Pilot', 'Navigation', 'Lieutenant', 'Fit', 'Flight Operations', 'Secret'),
(3, 760.0, 'Engineer', 'Systems', 'Specialist', 'Fit', 'Propulsion Systems', 'Secret'),
(6, 1420.75, 'Flight Engineer', 'Engineering', 'Major', 'Fit', 'Life Support', 'Top Secret'),
(7, 890.25, 'Mission Specialist', 'Science', 'Lieutenant', 'Fit', 'Microgravity Research', 'Secret');

-- Insert Ground Control
INSERT INTO GROUND_CONTROL (PersonID, Role, Department, ShiftSchedule, ConsoleAssignment, ClearanceLevel) VALUES
(4, 'Flight Director', 'Mission Operations', 'Day Shift (08:00-16:00)', 'FD-1', 'Top Secret'),
(5, 'Communications Specialist', 'Communications', 'Night Shift (00:00-08:00)', 'COM-2', 'Secret'),
(8, 'CAPCOM', 'Mission Operations', 'Evening Shift (16:00-00:00)', 'CAP-1', 'Top Secret'),
(9, 'Flight Surgeon', 'Medical', 'Day Shift (08:00-16:00)', 'MED-1', 'Secret'),
(10, 'Systems Engineer', 'Engineering', 'Day Shift (08:00-16:00)', 'SYS-3', 'Secret');

-- Insert Space Stations
INSERT INTO SPACE_STATION (StationName, LaunchDate, OrbitAltitude, OrbitalInclination, PowerGeneration, MaxCrewCapacity, InternationalPartners, CurrentStatus) VALUES
('Aurora Station', '2024-05-01', 410.50, 51.60, 120.5, 8, 'NASA, ESA, JAXA, CSA', 'Active'),
('Orion Outpost', '2023-02-10', 420.20, 51.64, 95.3, 6, 'NASA, Roscosmos', 'Active'),
('Zenith Hub', '2022-07-12', 405.00, 51.55, 110.8, 5, 'ESA, CNSA', 'Active'),
('Pioneer Lab', '2021-09-21', 430.10, 51.70, 85.2, 4, 'JAXA, CSA', 'Maintenance'),
('Atlas Dock', '2020-04-13', 390.70, 51.50, 130.4, 7, 'NASA, ESA, CSA', 'Active');

-- Insert Modules
INSERT INTO MODULE (StationID, Name, Manufacturer, LaunchMass, LaunchDate, Dimensions) VALUES
(1, 'Unity Node', 'Boeing', 12500.00, '2024-05-01', '5.5m x 4.6m'),
(1, 'Destiny Lab', 'Lockheed Martin', 14515.00, '2024-06-15', '8.5m x 4.3m'),
(2, 'Columbus', 'Airbus', 12775.00, '2023-02-10', '6.9m x 4.5m'),
(3, 'Kibo', 'Mitsubishi', 15900.00, '2022-07-12', '11.2m x 4.4m'),
(4, 'Harmony Node', 'Thales Alenia', 14288.00, '2021-09-21', '7.2m x 4.4m'),
(5, 'Tranquility', 'Thales Alenia', 15900.00, '2020-04-13', '6.7m x 4.5m'),
(1, 'Cupola Observatory', 'Alenia', 1880.00, '2024-08-20', '3.0m x 1.5m'),
(2, 'Quest Airlock', 'Boeing', 6064.00, '2023-04-10', '5.5m x 4.0m');

-- Insert Laboratories
INSERT INTO LABORATORY (ModuleID, ResearchFocus, CleanRoomLevel, SampleStorage, EquipmentList) VALUES
(2, 'Biotechnology, Materials Science', 'ISO 5', 'Cryo-freezers, Refrigerators', 'Microscopes, Centrifuges, Glove boxes'),
(3, 'Physics, Earth Observation', 'ISO 6', 'Ambient storage', 'Spectrometers, Telescopes'),
(4, 'Life Sciences, Human Research', 'ISO 5', 'Cryo-freezers', 'Medical equipment, Exercise machines');

-- Insert Habitats
INSERT INTO HABITAT (ModuleID, SleepingQuarters, ExerciseEquipment, GalleyFacilities, LifeSupportCapacity) VALUES
(1, 6, 'Treadmill, Cycle ergometer', 'Food warmer, Water dispenser', 8),
(5, 4, 'ARED, Treadmill', 'Microwave, Oven', 6),
(6, 5, 'Treadmill, Resistance bands', 'Food prep station', 7);

-- Insert Spacecraft
INSERT INTO SPACECRAFT (Name, Manufacturer, Status, MaxCrewCapacity, MaxPayloadMass, LaunchDate) VALUES
('Dragon Endeavour', 'SpaceX', 'Ready', 7, 6000.00, '2025-01-15'),
('Starliner Calypso', 'Boeing', 'Ready', 7, 5000.00, '2025-02-20'),
('Soyuz MS-25', 'RSC Energia', 'Ready', 3, 1600.00, '2025-03-10'),
('Orion Artemis III', 'Lockheed Martin', 'In Development', 4, 8000.00, NULL),
('Dream Chaser Tenacity', 'Sierra Space', 'Testing', 7, 5500.00, NULL),
('Falcon Heavy', 'SpaceX', 'Ready', 0, 63800.00, '2024-12-01'),
('Starship HLS', 'SpaceX', 'In Development', 10, 100000.00, NULL),
('Ariane 6', 'ArianeGroup', 'Ready', 0, 21650.00, '2024-11-15');

-- Insert Capsules
INSERT INTO CAPSULE (SpacecraftID, DockingPorts, LandingGear, HeatShieldType, CrewCapacity) VALUES
(1, 2, 'Parachute + splashdown', 'PICA-X', 7),
(2, 2, 'Parachute + airbags', 'Avcoat', 7),
(3, 1, 'Parachute + landing', 'Ablative', 3),
(4, 2, 'Parachute + splashdown', 'Avcoat', 4);

-- Insert Shuttles
INSERT INTO SHUTTLE (SpacecraftID, CargoBaySize, Wingspan, CrewCapacity) VALUES
(5, 450.00, 8.5, 7);

-- Insert Rockets
INSERT INTO ROCKET (SpacecraftID, StageCount, BoosterCount, Reusable) VALUES
(6, 2, 2, TRUE),
(7, 2, 0, TRUE),
(8, 2, 0, FALSE);

-- Insert Missions
INSERT INTO MISSION (MissionName, MissionType, MissionObjective, LaunchDateTime, EstimatedDuration, Budget, RiskLevel, MissionStatus) VALUES
('Lunar Survey I', 'Research', 'Comprehensive mapping of lunar south pole for future base site selection', '2026-07-10 10:00:00', 30.0, 2500000.00, 'Medium', 'Planned'),
('Mars Relay Network', 'Communication', 'Deploy constellation of 6 communication satellites around Mars orbit', '2026-09-01 08:00:00', 90.0, 8600000.00, 'High', 'Planned'),
('Orbital BioLab Alpha', 'Research', 'Microgravity cell growth and tissue engineering experiments', '2026-10-15 13:00:00', 60.0, 4200000.00, 'Medium', 'Planned'),
('Deep Space Propulsion Test', 'Engineering', 'Test new ion propulsion system for long-range missions', '2026-11-01 09:00:00', 75.0, 7300000.00, 'High', 'Planned'),
('Aurora Station Upgrade', 'Maintenance', 'Install new solar array and upgrade power distribution system', '2026-06-01 06:30:00', 20.0, 1900000.00, 'Low', 'Approved'),
('ISS Crew Rotation 70', 'Logistics', 'Transport crew and supplies to Aurora Station', '2026-05-20 14:00:00', 180.0, 1200000.00, 'Low', 'In Progress'),
('Hubble Service Mission 6', 'Maintenance', 'Replace gyroscopes and upgrade science instruments', '2026-12-15 11:00:00', 14.0, 5400000.00, 'Critical', 'Planned'),
('Europa Clipper Launch', 'Exploration', 'Launch mission to study Jupiter''s moon Europa', '2027-02-28 09:30:00', 2190.0, 48000000.00, 'Critical', 'Planned');

-- Insert Experiments
INSERT INTO EXPERIMENT (Title, Objective, StartDate, EndDate, Status, PrincipalInvestigator) VALUES
('Protein Crystal Growth', 'Study protein crystallization in microgravity for drug development', '2026-06-01', '2026-12-01', 'Active', 'Dr. Sarah Mitchell'),
('Plant Growth in Space', 'Investigate plant growth patterns and nutrition in zero-G environment', '2026-05-15', '2026-11-15', 'Active', 'Dr. James Lee'),
('Fluid Dynamics Study', 'Examine fluid behavior in microgravity for propulsion design', '2026-07-01', '2026-09-30', 'Planned', 'Dr. Ana Rodriguez'),
('Bone Density Research', 'Monitor astronaut bone density changes during long missions', '2026-05-20', '2027-05-20', 'Active', 'Dr. Kevin Brown'),
('Solar Panel Efficiency', 'Test new photovoltaic materials in space environment', '2026-08-01', '2027-02-01', 'Planned', 'Dr. Li Wang'),
('Cosmic Ray Detection', 'Map cosmic ray patterns near Earth orbit', '2026-06-15', '2027-06-15', 'Active', 'Dr. Elena Popov'),
('Zero-G Manufacturing', 'Test 3D printing of metal components in microgravity', '2026-09-01', '2026-12-31', 'Planned', 'Dr. Marcus Chen'),
('Bacterial Resistance', 'Study antibiotic resistance development in space', '2026-07-15', '2027-01-15', 'Planned', 'Dr. Fatima Al-Rashid');

-- Insert Biological Experiments
INSERT INTO BIOLOGICAL (ExperimentID, SpecimenType, Containment, CrewImpact) VALUES
(1, 'Protein samples', 'Level 1 - Sealed containers', 'Minimal'),
(2, 'Arabidopsis plants', 'Level 1 - Growth chamber', 'Minimal'),
(4, 'Human bone cells', 'Level 2 - Biosafety cabinet', 'Low'),
(8, 'E. coli bacteria', 'Level 2 - Sealed bioreactor', 'Low');

-- Insert Physical Experiments
INSERT INTO PHYSICAL (ExperimentID, PhysicsType, PhysicsPrecision, DataRate) VALUES
(3, 'Fluid dynamics', 'High (0.001mm)', '100 MB/day');

-- Insert Astronomy Experiments
INSERT INTO ASTRONOMY (ExperimentID, SkyRegion, TelescopeUsed, Wavelength, ExposureTime) VALUES
(6, 'Galactic Center', 'Alpha-Mag X-ray Telescope', 'X-ray (0.1-10 keV)', '30 seconds per frame');

-- Insert Engineering Experiments
INSERT INTO ENGINEERING_EXP (ExperimentID, TestObjective, SafetyMargin, RedundancyLevel, StressFactors) VALUES
(5, 'Test new solar cell degradation in radiation', '150% of normal load', 'Dual backup systems', 'UV radiation, thermal cycling'),
(7, 'Validate additive manufacturing in vacuum', '200% of design load', 'Triple redundancy', 'Vacuum, thermal stress, vibration');

-- Insert Telemetry Data
INSERT INTO TELEMETRY_DATA (SpacecraftID, MissionID, Timestamp, DataQuality, SourceSystem) VALUES
(1, 6, '2026-05-20 14:15:00', 'Good', 'Dragon Flight Computer'),
(1, 6, '2026-05-20 14:30:00', 'Good', 'Dragon Flight Computer'),
(1, 6, '2026-05-20 14:45:00', 'Excellent', 'Dragon Flight Computer'),
(2, 5, '2026-06-01 06:45:00', 'Good', 'Starliner Avionics'),
(2, 5, '2026-06-01 07:00:00', 'Fair', 'Starliner Avionics'),
(3, 6, '2026-05-21 08:00:00', 'Excellent', 'Soyuz Control System'),
(3, 6, '2026-05-21 08:15:00', 'Good', 'Soyuz Control System');

-- Insert System Status
INSERT INTO SYSTEM_STATUS (TelemetryID, Temperature, Humidity, CPUUsage, PowerLevel, OxygenLevel, Pressure, MemoryUsage, CommStatus) VALUES
(1, 22.5, 45.0, 35.2, 98.5, 21.0, 101.3, 42.1, 'Nominal'),
(2, 23.1, 46.5, 38.7, 97.8, 20.9, 101.2, 45.3, 'Nominal'),
(3, 22.8, 45.8, 34.9, 98.9, 21.1, 101.4, 41.8, 'Nominal'),
(4, 24.2, 48.2, 42.3, 96.5, 20.8, 101.1, 48.9, 'Nominal'),
(5, 25.1, 50.1, 45.8, 95.2, 20.7, 101.0, 52.4, 'Degraded');

-- Insert Environmental Data
INSERT INTO ENVIRONMENTAL_DATA (TelemetryID, Temperature, Humidity, Pressure, OxygenLevel, Radiation) VALUES
(6, 21.5, 44.2, 101.5, 21.2, 0.15),
(7, 21.8, 44.8, 101.4, 21.1, 0.16);

-- Insert Navigation Data
INSERT INTO NAVIGATION_DATA (TelemetryID, PositionX, PositionY, PositionZ, Velocity, Orientation, TransmissionDelay, ErrorCodes) VALUES
(1, 6371.5, 0.0, 0.0, 7.8, 'Prograde', 0.045, NULL),
(2, 6372.1, 15.3, 8.9, 7.81, 'Prograde', 0.046, NULL),
(3, 6373.8, 30.5, 17.8, 7.79, 'Prograde', 0.047, NULL);

-- Insert Alerts
INSERT INTO ALERT (TelemetryID, AlertType, Severity, Timestamp, Message, Acknowledged, RootCause) VALUES
(5, 'System Performance', 'Medium', '2026-06-01 07:00:00', 'Communication system showing degraded signal strength', FALSE, 'Antenna alignment issue'),
(NULL, 'Equipment', 'Low', '2026-05-15 10:30:00', 'Routine calibration due for spectrometer in Destiny Lab', TRUE, 'Scheduled maintenance'),
(NULL, 'Environmental', 'High', '2026-05-18 03:45:00', 'Temperature spike detected in Module 3 cooling system', TRUE, 'Coolant pump malfunction'),
(NULL, 'Mission', 'Critical', '2026-05-19 14:20:00', 'Micrometeorite impact detected on solar panel 2B', TRUE, 'Space debris collision');

-- Insert Equipment
INSERT INTO EQUIPMENT (StationID, SpacecraftID, EquipmentName, EquipmentType, SerialNumber, Manufacturer, Status, Location, CalibrationDate, WarrantyExpiry, PurchaseDate) VALUES
(1, NULL, 'Mass Spectrometer MS-2000', 'Scientific Instrument', 'SN-MS-2000-001', 'Thermo Scientific', 'Operational', 'Destiny Lab - Port Side', '2026-01-15', '2028-03-15', '2023-03-15'),
(1, NULL, 'Centrifuge CF-500', 'Laboratory Equipment', 'SN-CF-500-023', 'Beckman Coulter', 'Operational', 'Destiny Lab - Starboard', '2025-12-10', '2027-06-10', '2022-06-10'),
(2, NULL, 'X-ray Diffractometer', 'Scientific Instrument', 'SN-XRD-700-007', 'Bruker', 'Maintenance', 'Columbus Module', '2025-11-20', '2027-11-20', '2022-11-20'),
(NULL, 1, 'EVA Suit - Mark IV', 'Life Support', 'SN-EVA-MK4-102', 'ILC Dover', 'Ready', 'Dragon Storage Bay', '2026-03-01', '2031-03-01', '2024-03-01'),
(NULL, 1, 'Portable Life Support System', 'Life Support', 'SN-PLSS-450-089', 'Hamilton Sundstrand', 'Ready', 'Dragon Equipment Locker', '2026-02-15', '2031-02-15', '2024-02-15'),
(3, NULL, 'Robotic Arm JEM-RMS', 'Robotics', 'SN-JEMRMS-001', 'JAXA/MHI', 'Operational', 'Kibo Module External', '2025-09-05', '2030-07-12', '2022-07-12'),
(5, NULL, 'Water Recovery System', 'Life Support', 'SN-WRS-300-015', 'NASA', 'Operational', 'Tranquility Node', '2026-04-10', '2028-04-13', '2020-04-13'),
(1, NULL, 'Advanced Resistive Exercise Device', 'Fitness', 'SN-ARED-250-003', 'NASA', 'Operational', 'Unity Node - Exercise Area', '2026-01-20', '2029-05-01', '2024-05-01');

-- Insert Mission Assignments
INSERT INTO MISSION_ASSIGNMENT (MissionID, AstronautID, Role, AssignmentDate, EVAHoursPlanned, PrimaryResponsibility, TrainingCompletionDate, Status) VALUES
(6, 1, 'Mission Commander', '2026-02-01', 12.0, 'Overall mission leadership and decision making', '2026-04-30', 'Active'),
(6, 2, 'Pilot', '2026-02-01', 0.0, 'Spacecraft piloting and docking operations', '2026-04-30', 'Active'),
(6, 3, 'Flight Engineer 1', '2026-02-01', 15.0, 'Systems monitoring and EVA operations', '2026-04-30', 'Active'),
(5, 6, 'Lead Engineer', '2026-03-15', 25.0, 'Solar array installation and power system upgrade', '2026-05-15', 'Active'),
(5, 7, 'Mission Specialist', '2026-03-15', 18.0, 'EVA support and equipment testing', '2026-05-15', 'Active'),
(1, 1, 'Commander', '2026-05-01', 8.0, 'Mission planning and execution', NULL, 'Training'),
(1, 3, 'Science Officer', '2026-05-01', 10.0, 'Scientific data collection and analysis', NULL, 'Training');

-- Insert Spacecraft Mission Assignments
INSERT INTO SPACECRAFT_MISSION (MissionID, SpacecraftID, RoleInMission, LaunchConfiguration, ReentryDate, LandingSite, ReturnMass, ActualLaunchMass) VALUES
(6, 1, 'Primary Crew Transport', 'Standard ISS Config', '2026-11-15 10:30:00', 'Pacific Ocean', 9600.00, 12055.00),
(5, 2, 'Primary Transport & EVA Platform', 'Extended EVA Config', NULL, NULL, NULL, 13420.00),
(1, 4, 'Primary Mission Vehicle', 'Lunar Transfer Config', NULL, NULL, NULL, NULL),
(2, 7, 'Cargo Transport', 'Mars Transfer Config', NULL, NULL, NULL, NULL);

-- Insert Experiment Executions
INSERT INTO EXPERIMENT_EXECUTION (MissionID, ExperimentID, ScheduledStart, ScheduledEnd, ActualStart, ActualEnd, SuccessRating, Notes, Location, DataVolumeGenerated) VALUES
(6, 1, '2026-05-25 10:00:00', '2026-05-25 16:00:00', '2026-05-25 10:15:00', '2026-05-25 16:30:00', 95, 'Excellent crystal formation observed. Minor delay in setup.', 'Destiny Lab', 2.5),
(6, 2, '2026-05-22 08:00:00', '2026-05-22 12:00:00', '2026-05-22 08:05:00', '2026-05-22 12:10:00', 88, 'Plant growth chamber functioning nominally.', 'Columbus Module', 1.8),
(6, 4, '2026-05-21 14:00:00', '2026-05-21 18:00:00', '2026-05-21 14:00:00', '2026-05-21 18:00:00', 92, 'Bone cell samples collected successfully.', 'Destiny Lab', 3.2),
(6, 6, '2026-05-23 20:00:00', '2026-05-24 02:00:00', '2026-05-23 20:10:00', '2026-05-24 02:15:00', 90, 'Clear observations despite minor tracking issues.', 'Cupola Observatory', 45.7);

-- Insert Scheduled Events
INSERT INTO SCHEDULED_EVENT (MissionID, ExperimentID, PersonID, EventType, Description, PlannedStartTime, PlannedDuration, ActualStartTime, ActualDuration, Criticality, Status) VALUES
(6, NULL, 4, 'Launch', 'Dragon Endeavour launch from Kennedy Space Center', '2026-05-20 14:00:00', 0.25, '2026-05-20 14:00:00', 0.25, 'Critical', 'Completed'),
(6, NULL, 4, 'Docking', 'Docking with Aurora Station at Harmony forward port', '2026-05-21 08:00:00', 1.5, '2026-05-21 08:15:00', 1.75, 'Critical', 'Completed'),
(6, 1, 4, 'Experiment Setup', 'Setup protein crystallization experiment', '2026-05-25 09:00:00', 2.0, '2026-05-25 09:15:00', 2.25, 'Medium', 'Completed'),
(5, NULL, 4, 'EVA-1', 'First EVA for solar array installation', '2026-06-02 08:00:00', 6.5, NULL, NULL, 'Critical', 'Scheduled'),
(5, NULL, 4, 'EVA-2', 'Second EVA for power distribution upgrade', '2026-06-05 08:00:00', 7.0, NULL, NULL, 'Critical', 'Scheduled'),
(1, NULL, 4, 'Pre-Launch Review', 'Final mission readiness review', '2026-07-08 10:00:00', 4.0, NULL, NULL, 'High', 'Scheduled');

-- Insert Module Integrations
INSERT INTO MODULE_INTEGRATION (ModuleID, StationID, DockingDate, UndockingDate, DockingPort, ConnectionType, LifeSupportIntegration, DataLinkStatus, PowerIntegrationStatus) VALUES
(1, 1, '2024-05-01 12:00:00', NULL, 'Forward', 'Active CBM', 'Fully Integrated', 'Active', 'Nominal'),
(2, 1, '2024-06-15 14:30:00', NULL, 'Starboard', 'Active CBM', 'Fully Integrated', 'Active', 'Nominal'),
(3, 2, '2023-02-10 10:00:00', NULL, 'Nadir', 'Passive CBM', 'Fully Integrated', 'Active', 'Nominal'),
(4, 3, '2022-07-12 16:00:00', NULL, 'Port', 'Active CBM', 'Fully Integrated', 'Active', 'Nominal'),
(5, 4, '2021-09-21 11:30:00', NULL, 'Aft', 'Passive CBM', 'Fully Integrated', 'Active', 'Degraded'),
(6, 5, '2020-04-13 09:00:00', NULL, 'Zenith', 'Active CBM', 'Fully Integrated', 'Active', 'Nominal');

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

SELECT 'Database setup completed successfully!' AS Status;
SELECT COUNT(*) AS PersonCount FROM PERSON;
SELECT COUNT(*) AS AstronautCount FROM ASTRONAUT;
SELECT COUNT(*) AS MissionCount FROM MISSION;
SELECT COUNT(*) AS SpacecraftCount FROM SPACECRAFT;
SELECT COUNT(*) AS StationCount FROM SPACE_STATION;
