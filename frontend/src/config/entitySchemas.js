/** Field configs for EnhancedCrudPage — aligned with SMMS PRD §5.1 & §7 */

export const genderOptions = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
  { value: "Other", label: "Other" },
];

export const riskLevelOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

export const severityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

export const missionStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "Active", label: "Active" },
  { value: "Completed", label: "Completed" },
  { value: "Aborted", label: "Aborted" },
];

export const astronautsCrud = {
  entityKey: "astronauts",
  title: "Astronauts",
  idField: "PersonID",
  defaultSort: { key: "PersonID", dir: "desc" },
  columns: [
    { key: "PersonID", label: "Person ID" },
    { key: "Role", label: "Role" },
    { key: "Rank", label: "Rank" },
    { key: "FlightHours", label: "Flight hours" },
    { key: "HealthStatus", label: "Health" },
    { key: "Department", label: "Department" },
  ],
  filters: [
    { param: "Role", label: "Role", options: [] },
    { param: "Department", label: "Department", options: [] },
    { param: "HealthStatus", label: "Health status", options: [] },
  ],
  fields: [
    {
      key: "PersonID",
      label: "Person",
      type: "fk",
      fk: { entity: "persons", labelField: "LastName", valueField: "PersonID" },
      required: true,
    },
    { key: "FlightHours", label: "Flight hours", type: "number" },
    { key: "Role", label: "Role", type: "text", required: true },
    { key: "Specialization", label: "Specialization", type: "text" },
    { key: "ClearanceLevel", label: "Clearance level", type: "text" },
    { key: "SpaceSuitSize", label: "Space suit size", type: "text" },
    { key: "Department", label: "Department", type: "text" },
    { key: "Rank", label: "Rank", type: "text" },
    { key: "HealthStatus", label: "Health status", type: "text" },
    { key: "ConsoleAssignment", label: "Console assignment", type: "text" },
    { key: "ShiftSchedule", label: "Shift schedule", type: "text" },
    {
      key: "MentorID",
      label: "Mentor (astronaut)",
      type: "fk",
      fk: { entity: "astronauts", labelField: "Role", valueField: "PersonID" },
    },
  ],
  validateCreate: (p) => {
    if (!p.PersonID) return "Person is required.";
    if (!p.Role?.trim()) return "Role is required.";
    return null;
  },
  deleteIntro: "Deleting an astronaut row does not delete the person record.",
};

export const groundControlCrud = {
  entityKey: "ground_control",
  title: "Ground control",
  idField: "PersonID",
  defaultSort: { key: "PersonID", dir: "desc" },
  columns: [
    { key: "PersonID", label: "Person ID" },
    { key: "Role", label: "Role" },
    { key: "Department", label: "Department" },
    { key: "ShiftSchedule", label: "Shift" },
    { key: "ConsoleAssignment", label: "Console" },
    { key: "ClearanceLevel", label: "Clearance" },
  ],
  filters: [
    { param: "Role", label: "Role", options: [] },
    { param: "Department", label: "Department", options: [] },
  ],
  fields: [
    {
      key: "PersonID",
      label: "Person",
      type: "fk",
      fk: { entity: "persons", labelField: "LastName", valueField: "PersonID" },
      required: true,
    },
    { key: "Role", label: "Role", type: "text", required: true },
    { key: "Department", label: "Department", type: "text" },
    { key: "ShiftSchedule", label: "Shift schedule", type: "text" },
    { key: "ConsoleAssignment", label: "Console assignment", type: "text" },
    { key: "ClearanceLevel", label: "Clearance level", type: "text" },
  ],
  validateCreate: (p) => {
    if (!p.PersonID) return "Person is required.";
    if (!p.Role?.trim()) return "Role is required.";
    return null;
  },
};

export const equipmentCrud = {
  entityKey: "equipment",
  title: "Equipment",
  idField: "EquipmentID",
  defaultSort: { key: "EquipmentID", dir: "desc" },
  columns: [
    { key: "EquipmentID", label: "ID" },
    { key: "EquipmentName", label: "Name" },
    { key: "EquipmentType", label: "Type" },
    { key: "Status", label: "Status" },
    { key: "Location", label: "Location" },
    { key: "CalibrationDate", label: "Calibration" },
  ],
  filters: [
    { param: "Status", label: "Status", options: [] },
    { param: "EquipmentType", label: "Type", options: [] },
  ],
  fields: [
    {
      key: "StationID",
      label: "Station",
      type: "fk",
      fk: { entity: "stations", labelField: "StationName", valueField: "StationID" },
    },
    {
      key: "SpacecraftID",
      label: "Spacecraft",
      type: "fk",
      fk: { entity: "spacecraft", labelField: "Name", valueField: "SpacecraftID" },
    },
    { key: "EquipmentName", label: "Equipment name", type: "text", required: true },
    { key: "EquipmentType", label: "Equipment type", type: "text", required: true },
    { key: "SerialNumber", label: "Serial number", type: "text", required: true },
    { key: "Manufacturer", label: "Manufacturer", type: "text", required: true },
    { key: "Status", label: "Status", type: "text", required: true },
    { key: "Location", label: "Location", type: "text", required: true },
    { key: "CalibrationDate", label: "Calibration date", type: "date" },
    { key: "WarrantyExpiry", label: "Warranty expiry", type: "date" },
    { key: "PurchaseDate", label: "Purchase date", type: "date" },
  ],
  validateCreate: (p) => {
    if (!p.EquipmentName?.trim()) return "Equipment name is required.";
    if (!p.EquipmentType?.trim()) return "Type is required.";
    if (!p.SerialNumber?.trim()) return "Serial number is required.";
    if (!p.Manufacturer?.trim()) return "Manufacturer is required.";
    if (!p.Status?.trim()) return "Status is required.";
    if (!p.Location?.trim()) return "Location is required.";
    return null;
  },
};

export const eventsCrud = {
  entityKey: "events",
  title: "Scheduled events",
  idField: "EventID",
  defaultSort: { key: "EventID", dir: "desc" },
  columns: [
    { key: "EventID", label: "ID" },
    { key: "EventType", label: "Type" },
    { key: "Criticality", label: "Criticality" },
    { key: "PlannedStartTime", label: "Planned start" },
    { key: "Status", label: "Status" },
  ],
  filters: [
    {
      param: "Criticality",
      label: "Criticality",
      options: [
        { value: "Low", label: "Low" },
        { value: "Medium", label: "Medium" },
        { value: "High", label: "High" },
      ],
    },
    { param: "Status", label: "Status", options: [] },
    { param: "EventType", label: "Event type", options: [] },
  ],
  fields: [
    {
      key: "MissionID",
      label: "Mission",
      type: "fk",
      fk: { entity: "missions", labelField: "MissionName", valueField: "MissionID" },
    },
    {
      key: "AlertID",
      label: "Alert",
      type: "fk",
      fk: { entity: "alerts", labelField: "AlertType", valueField: "AlertID" },
    },
    {
      key: "ExperimentID",
      label: "Experiment",
      type: "fk",
      fk: { entity: "experiments", labelField: "Title", valueField: "ExperimentID" },
    },
    {
      key: "PersonID",
      label: "Ground control",
      type: "fk",
      fk: { entity: "ground_control", labelField: "Role", valueField: "PersonID" },
    },
    {
      key: "PrecedingEventID",
      label: "Preceding event",
      type: "fk",
      fk: { entity: "events", labelField: "EventType", valueField: "EventID" },
    },
    { key: "EventType", label: "Event type", type: "text", required: true },
    { key: "Description", label: "Description", type: "textarea", required: true },
    { key: "PlannedStartTime", label: "Planned start", type: "datetime", required: true },
    { key: "PlannedDuration", label: "Planned duration (hours)", type: "number", required: true },
    { key: "ActualStartTime", label: "Actual start", type: "datetime" },
    { key: "ActualDuration", label: "Actual duration", type: "number" },
    { key: "Criticality", label: "Criticality", type: "text", required: true },
    { key: "Status", label: "Status", type: "text" },
  ],
  validateCreate: (p) => {
    if (!p.EventType?.trim()) return "Event type is required.";
    if (!p.Description?.trim()) return "Description is required.";
    if (!p.PlannedStartTime) return "Planned start time is required.";
    const d = Number(p.PlannedDuration);
    if (!d || d <= 0) return "Planned duration must be greater than 0.";
    return null;
  },
};

export const missionAssignmentsCrud = {
  entityKey: "mission_assignments",
  title: "Mission assignments",
  idField: "AssignmentID",
  defaultSort: { key: "AssignmentID", dir: "desc" },
  columns: [
    { key: "AssignmentID", label: "ID" },
    { key: "MissionID", label: "Mission" },
    { key: "AstronautID", label: "Astronaut" },
    { key: "Role", label: "Role" },
    { key: "AssignmentDate", label: "Assigned" },
    { key: "Status", label: "Status" },
  ],
  fields: [
    {
      key: "MissionID",
      label: "Mission",
      type: "fk",
      fk: { entity: "missions", labelField: "MissionName", valueField: "MissionID" },
      required: true,
    },
    {
      key: "AstronautID",
      label: "Astronaut (person id)",
      type: "fk",
      fk: { entity: "astronauts", labelField: "Role", valueField: "PersonID" },
      required: true,
    },
    { key: "Role", label: "Role", type: "text", required: true },
    { key: "AssignmentDate", label: "Assignment date", type: "date", required: true },
    { key: "EVAHoursPlanned", label: "EVA hours planned", type: "number" },
    { key: "PrimaryResponsibility", label: "Primary responsibility", type: "text" },
    { key: "TrainingCompletionDate", label: "Training completed", type: "date" },
    { key: "Status", label: "Status", type: "text" },
  ],
  validateCreate: (p) => {
    if (!p.MissionID) return "Mission is required.";
    if (!p.AstronautID) return "Astronaut is required.";
    if (!p.Role?.trim()) return "Role is required.";
    if (!p.AssignmentDate) return "Assignment date is required.";
    return null;
  },
};

export const spacecraftMissionsCrud = {
  entityKey: "spacecraft_missions",
  title: "Spacecraft ↔ Mission links",
  idField: "SMCID",
  defaultSort: { key: "SMCID", dir: "desc" },
  columns: [
    { key: "SMCID", label: "ID" },
    { key: "MissionID", label: "Mission" },
    { key: "SpacecraftID", label: "Spacecraft" },
    { key: "RoleInMission", label: "Role" },
  ],
  fields: [
    {
      key: "MissionID",
      label: "Mission",
      type: "fk",
      fk: { entity: "missions", labelField: "MissionName", valueField: "MissionID" },
      required: true,
    },
    {
      key: "SpacecraftID",
      label: "Spacecraft",
      type: "fk",
      fk: { entity: "spacecraft", labelField: "Name", valueField: "SpacecraftID" },
      required: true,
    },
    { key: "RoleInMission", label: "Role in mission", type: "text" },
    { key: "LaunchConfiguration", label: "Launch configuration", type: "text" },
    { key: "ReentryDate", label: "Reentry", type: "datetime" },
    { key: "LandingSite", label: "Landing site", type: "text" },
    { key: "ReturnMass", label: "Return mass", type: "number" },
    { key: "ActualLaunchMass", label: "Actual launch mass", type: "number" },
  ],
  validateCreate: (p) => {
    if (!p.MissionID) return "Mission is required.";
    if (!p.SpacecraftID) return "Spacecraft is required.";
    return null;
  },
};

export const experimentExecutionsCrud = {
  entityKey: "experiment_executions",
  title: "Experiment executions",
  idField: "ExecutionID",
  defaultSort: { key: "ExecutionID", dir: "desc" },
  columns: [
    { key: "ExecutionID", label: "ID" },
    { key: "MissionID", label: "Mission" },
    { key: "ExperimentID", label: "Experiment" },
    { key: "ScheduledStart", label: "Sched. start" },
    { key: "ScheduledEnd", label: "Sched. end" },
  ],
  fields: [
    {
      key: "MissionID",
      label: "Mission",
      type: "fk",
      fk: { entity: "missions", labelField: "MissionName", valueField: "MissionID" },
      required: true,
    },
    {
      key: "ExperimentID",
      label: "Experiment",
      type: "fk",
      fk: { entity: "experiments", labelField: "Title", valueField: "ExperimentID" },
      required: true,
    },
    { key: "ScheduledStart", label: "Scheduled start", type: "datetime", required: true },
    { key: "ScheduledEnd", label: "Scheduled end", type: "datetime", required: true },
    { key: "ActualStart", label: "Actual start", type: "datetime" },
    { key: "ActualEnd", label: "Actual end", type: "datetime" },
    { key: "SuccessRating", label: "Success rating", type: "number" },
    { key: "Notes", label: "Notes", type: "textarea" },
    { key: "EquipmentUsed", label: "Equipment used", type: "textarea" },
    { key: "Location", label: "Location", type: "text" },
    { key: "DataVolumeGenerated", label: "Data volume", type: "number" },
  ],
  validateCreate: (p) => {
    if (!p.MissionID) return "Mission is required.";
    if (!p.ExperimentID) return "Experiment is required.";
    if (!p.ScheduledStart || !p.ScheduledEnd) return "Scheduled start and end are required.";
    if (new Date(p.ScheduledEnd) <= new Date(p.ScheduledStart))
      return "Scheduled end must be after scheduled start.";
    return null;
  },
};

export const moduleIntegrationsCrud = {
  entityKey: "module_integrations",
  title: "Module integrations",
  idField: "IntegrationID",
  defaultSort: { key: "IntegrationID", dir: "desc" },
  columns: [
    { key: "IntegrationID", label: "ID" },
    { key: "ModuleID", label: "Module" },
    { key: "StationID", label: "Station" },
    { key: "DockingPort", label: "Port" },
    { key: "ConnectionType", label: "Connection" },
  ],
  fields: [
    {
      key: "ModuleID",
      label: "Module",
      type: "fk",
      fk: { entity: "modules", labelField: "Name", valueField: "ModuleID" },
      required: true,
    },
    {
      key: "StationID",
      label: "Station",
      type: "fk",
      fk: { entity: "stations", labelField: "StationName", valueField: "StationID" },
      required: true,
    },
    { key: "DockingDate", label: "Docking date", type: "datetime", required: true },
    { key: "UndockingDate", label: "Undocking date", type: "datetime" },
    { key: "DockingPort", label: "Docking port", type: "text", required: true },
    { key: "ConnectionType", label: "Connection type", type: "text", required: true },
    { key: "LifeSupportIntegration", label: "Life support integration", type: "text" },
    { key: "DataLinkStatus", label: "Data link status", type: "text" },
    { key: "PowerIntegrationStatus", label: "Power integration status", type: "text" },
  ],
  validateCreate: (p) => {
    if (!p.ModuleID) return "Module is required.";
    if (!p.StationID) return "Station is required.";
    if (!p.DockingDate) return "Docking date is required.";
    if (!p.DockingPort?.trim()) return "Docking port is required.";
    if (!p.ConnectionType?.trim()) return "Connection type is required.";
    return null;
  },
};

export const missionsCrudBase = {
  entityKey: "missions",
  title: "Missions",
  idField: "MissionID",
  defaultSort: { key: "LaunchDateTime", dir: "desc" },
  columns: [
    { key: "MissionID", label: "ID" },
    { key: "MissionName", label: "Name" },
    { key: "MissionType", label: "Type" },
    { key: "LaunchDateTime", label: "Launch" },
    { key: "MissionStatus", label: "Status" },
    { key: "Budget", label: "Budget" },
    { key: "RiskLevel", label: "Risk" },
  ],
  filters: [
    {
      param: "MissionStatus",
      label: "Status",
      options: missionStatusOptions,
    },
    { param: "MissionType", label: "Mission type", options: [] },
    {
      param: "RiskLevel",
      label: "Risk level",
      options: riskLevelOptions,
    },
  ],
  fields: [
    { key: "MissionName", label: "Mission name", type: "text", required: true },
    { key: "MissionType", label: "Mission type", type: "text", required: true },
    { key: "MissionObjective", label: "Objective", type: "textarea", required: true },
    { key: "LaunchDateTime", label: "Launch date/time", type: "datetime", required: true },
    { key: "EstimatedDuration", label: "Estimated duration (days)", type: "number" },
    { key: "ActualDuration", label: "Actual duration (days)", type: "number" },
    { key: "Budget", label: "Budget", type: "number", required: true },
    {
      key: "RiskLevel",
      label: "Risk level",
      type: "select",
      options: riskLevelOptions,
      required: true,
    },
    {
      key: "MissionStatus",
      label: "Mission status",
      type: "select",
      options: missionStatusOptions,
    },
  ],
  validateCreate: (p) => {
    if (!p.MissionName?.trim()) return "Mission name is required.";
    if (!p.MissionType?.trim()) return "Mission type is required.";
    if (!p.MissionObjective?.trim()) return "Objective is required.";
    if (!p.LaunchDateTime) return "Launch date/time is required.";
    const b = Number(p.Budget);
    if (Number.isNaN(b) || b <= 0) return "Budget must be greater than 0.";
    return null;
  },
  validateUpdate: (p, _id) => {
    if (p.Budget !== undefined && p.Budget !== "") {
      const b = Number(p.Budget);
      if (Number.isNaN(b) || b <= 0) return "Budget must be greater than 0.";
    }
    const allowed = ["Planned", "Active", "Completed", "Aborted"];
    if (p.MissionStatus && !allowed.includes(p.MissionStatus))
      return `Mission status must be one of: ${allowed.join(", ")}.`;
    return null;
  },
};

export const stationsCrud = {
  entityKey: "stations",
  title: "Space stations",
  idField: "StationID",
  defaultSort: { key: "StationID", dir: "desc" },
  columns: [
    { key: "StationID", label: "ID" },
    { key: "StationName", label: "Name" },
    { key: "OrbitAltitude", label: "Altitude (km)" },
    { key: "CurrentStatus", label: "Status" },
    { key: "MaxCrewCapacity", label: "Max crew" },
  ],
  filters: [{ param: "CurrentStatus", label: "Status", options: [] }],
  fields: [
    { key: "StationName", label: "Station name", type: "text", required: true },
    { key: "LaunchDate", label: "Launch date", type: "date", required: true },
    { key: "OrbitAltitude", label: "Orbit altitude (km)", type: "number", required: true },
    { key: "OrbitalInclination", label: "Orbital inclination (°)", type: "number" },
    { key: "PowerGeneration", label: "Power generation (kW)", type: "number" },
    { key: "MaxCrewCapacity", label: "Max crew capacity", type: "number", required: true },
    { key: "InternationalPartners", label: "International partners", type: "text" },
    { key: "CurrentStatus", label: "Current status", type: "text" },
  ],
  validateCreate: (p) => {
    if (!p.StationName?.trim()) return "Station name is required.";
    if (!p.LaunchDate) return "Launch date is required.";
    const alt = Number(p.OrbitAltitude);
    if (Number.isNaN(alt) || alt <= 0) return "Orbit altitude must be greater than 0.";
    const crew = Number(p.MaxCrewCapacity);
    if (Number.isNaN(crew) || crew <= 0) return "Max crew capacity must be greater than 0.";
    return null;
  },
};

export const telemetryCrud = {
  entityKey: "telemetry",
  title: "Telemetry data",
  idField: "TelemetryID",
  defaultSort: { key: "Timestamp", dir: "desc" },
  columns: [
    { key: "TelemetryID", label: "ID" },
    { key: "Timestamp", label: "Timestamp" },
    { key: "SpacecraftID", label: "Spacecraft" },
    { key: "MissionID", label: "Mission" },
    { key: "DataQuality", label: "Quality" },
    { key: "SourceSystem", label: "Source" },
  ],
  filters: [],
  fields: [
    {
      key: "SpacecraftID",
      label: "Spacecraft",
      type: "fk",
      fk: { entity: "spacecraft", labelField: "Name", valueField: "SpacecraftID" },
      required: true,
    },
    {
      key: "MissionID",
      label: "Mission",
      type: "fk",
      fk: { entity: "missions", labelField: "MissionName", valueField: "MissionID" },
      required: true,
    },
    { key: "Timestamp", label: "Timestamp", type: "datetime", required: true },
    { key: "DataQuality", label: "Data quality", type: "text", required: true },
    { key: "SourceSystem", label: "Source system", type: "text", required: true },
  ],
  validateCreate: (p) => {
    if (!p.SpacecraftID) return "Spacecraft is required.";
    if (!p.MissionID) return "Mission is required.";
    if (!p.Timestamp) return "Timestamp is required.";
    if (!p.DataQuality?.trim()) return "Data quality is required.";
    if (!p.SourceSystem?.trim()) return "Source system is required.";
    if (new Date(p.Timestamp) > new Date()) return "Timestamp cannot be in the future.";
    return null;
  },
};

export const alertsCrud = {
  entityKey: "alerts",
  title: "Alerts",
  idField: "AlertID",
  defaultSort: { key: "Timestamp", dir: "desc" },
  columns: [
    { key: "AlertID", label: "ID" },
    { key: "AlertType", label: "Type" },
    { key: "Severity", label: "Severity" },
    { key: "Timestamp", label: "When" },
    { key: "Acknowledged", label: "Ack?" },
    { key: "Message", label: "Message" },
  ],
  filters: [
    {
      param: "Severity",
      label: "Severity",
      options: severityOptions,
    },
    {
      param: "Acknowledged",
      label: "Acknowledged",
      options: [
        { value: "0", label: "No" },
        { value: "1", label: "Yes" },
      ],
    },
  ],
  fields: [
    {
      key: "TelemetryID",
      label: "Telemetry record",
      type: "fk",
      fk: { entity: "telemetry", labelField: "TelemetryID", valueField: "TelemetryID" },
      required: true,
    },
    { key: "AlertType", label: "Alert type", type: "text", required: true },
    {
      key: "Severity",
      label: "Severity",
      type: "select",
      options: severityOptions,
      required: true,
    },
    { key: "Timestamp", label: "Timestamp", type: "datetime", required: true },
    { key: "Message", label: "Message", type: "textarea", required: true },
    { key: "Acknowledged", label: "Acknowledged", type: "checkbox" },
    { key: "RootCause", label: "Root cause", type: "textarea" },
    { key: "ResolutionTime", label: "Resolution time", type: "datetime" },
  ],
  validateCreate: (p) => {
    if (!p.TelemetryID) return "Telemetry record is required.";
    if (!p.AlertType?.trim()) return "Alert type is required.";
    if (!p.Severity) return "Severity is required.";
    if (!p.Timestamp) return "Timestamp is required.";
    if (!p.Message?.trim()) return "Message is required.";
    if (new Date(p.Timestamp) > new Date()) return "Timestamp cannot be in the future.";
    return null;
  },
};
