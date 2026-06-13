USE smms;

INSERT INTO PERSON (FirstName, LastName, DateOfBirth, Gender, Nationality, ContactInfo) VALUES
('Ava', 'Khan', '1988-01-10', 'F', 'Pakistani', 'ava@smms.local'),
('Zayd', 'Ali', '1986-03-21', 'M', 'Pakistani', 'zayd@smms.local'),
('Noah', 'Smith', '1990-06-15', 'M', 'American', 'noah@smms.local'),
('Mila', 'Chen', '1992-09-05', 'F', 'Chinese', 'mila@smms.local'),
('Sara', 'Park', '1989-11-17', 'F', 'Korean', 'sara@smms.local');

INSERT INTO ASTRONAUT (PersonID, FlightHours, Role, Department, `Rank`, HealthStatus) VALUES
(1, 1250.5, 'Commander', 'Operations', 'Captain', 'Fit'),
(2, 980.0, 'Pilot', 'Navigation', 'Lieutenant', 'Fit'),
(3, 760.0, 'Engineer', 'Systems', 'Specialist', 'Fit');

INSERT INTO GROUND_CONTROL (PersonID, Role, Department, ShiftSchedule, ConsoleAssignment, ClearanceLevel) VALUES
(4, 'Flight Director', 'Mission Ops', 'Morning', 'FD-1', 'High'),
(5, 'Comms Specialist', 'Communications', 'Night', 'COM-2', 'Medium');

INSERT INTO SPACE_STATION (StationName, LaunchDate, OrbitAltitude, CurrentStatus, MaxCrewCapacity) VALUES
('Aurora Station', '2024-05-01', 410.5, 'Active', 8),
('Orion Outpost', '2023-02-10', 420.2, 'Active', 6),
('Zenith Hub', '2022-07-12', 405.0, 'Active', 5),
('Pioneer Lab', '2021-09-21', 430.1, 'Maintenance', 4),
('Atlas Dock', '2020-04-13', 390.7, 'Active', 7);

INSERT INTO SPACECRAFT (Name, Manufacturer, Status, MaxCrewCapacity, LaunchDate) VALUES
('SMMS-Alpha', 'OrbitalWorks', 'Ready', 4, '2025-01-01'),
('SMMS-Beta', 'OrbitalWorks', 'Ready', 6, '2025-03-01'),
('SMMS-Gamma', 'NovaTech', 'Maintenance', 3, '2024-12-01'),
('SMMS-Delta', 'NovaTech', 'Ready', 5, '2025-02-20'),
('SMMS-Epsilon', 'AeroLabs', 'Ready', 2, '2025-04-11');

INSERT INTO MISSION (MissionName, MissionType, MissionObjective, LaunchDateTime, EstimatedDuration, Budget, RiskLevel, MissionStatus) VALUES
('Lunar Survey I', 'Research', 'Map lunar surface', '2026-07-10 10:00:00', 30, 2500000, 'Medium', 'Planned'),
('Mars Relay', 'Communication', 'Deploy relay satellites', '2026-09-01 08:00:00', 90, 8600000, 'High', 'Planned'),
('Orbital BioLab', 'Biological', 'Microgravity cell growth', '2026-10-15 13:00:00', 60, 4200000, 'Medium', 'Planned'),
('Deep Space Test', 'Engineering', 'Long-range propulsion test', '2026-11-01 09:00:00', 75, 7300000, 'High', 'Planned'),
('Station Upgrade', 'Maintenance', 'Upgrade station power', '2026-06-01 06:30:00', 20, 1900000, 'Low', 'Planned');
