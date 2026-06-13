import { useMemo, useState } from "react";
import EnhancedCrudPage from "../components/EnhancedCrudPage";
import {
  experimentExecutionsCrud,
  missionAssignmentsCrud,
  missionsCrudBase,
} from "../config/entitySchemas";

/** PRD §7.2 — Missions + assignments + experiment executions for selected mission */
export default function MissionsPage() {
  const [selectedMissionId, setSelectedMissionId] = useState(null);

  const missionsConfig = useMemo(
    () => ({
      ...missionsCrudBase,
      onRowClick: (row) => setSelectedMissionId(row.MissionID),
      selectedId: selectedMissionId,
    }),
    [selectedMissionId]
  );

  const assignFields = useMemo(
    () =>
      missionAssignmentsCrud.fields.map((f) =>
        f.key === "MissionID" ? { ...f, readOnly: true } : f
      ),
    []
  );

  const execFields = useMemo(
    () =>
      experimentExecutionsCrud.fields.map((f) =>
        f.key === "MissionID" ? { ...f, readOnly: true } : f
      ),
    []
  );

  const assignmentsConfig = useMemo(() => {
    if (selectedMissionId == null) return null;
    return {
      ...missionAssignmentsCrud,
      title: `Mission assignments (mission #${selectedMissionId})`,
      presetFilters: { MissionID: String(selectedMissionId) },
      fields: assignFields,
    };
  }, [selectedMissionId, assignFields]);

  const executionsConfig = useMemo(() => {
    if (selectedMissionId == null) return null;
    return {
      ...experimentExecutionsCrud,
      title: `Experiment executions (mission #${selectedMissionId})`,
      presetFilters: { MissionID: String(selectedMissionId) },
      fields: execFields,
    };
  }, [selectedMissionId, execFields]);

  return (
    <div className="pd2-page">
      <EnhancedCrudPage config={missionsConfig} />
    </div>
  );
}
