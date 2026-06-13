import { useMemo, useState } from "react";
import EnhancedCrudPage from "../components/EnhancedCrudPage";
import { moduleIntegrationsCrud, stationsCrud } from "../config/entitySchemas";

/** PRD §7.2 — Stations + module integration panel for selected station */
export default function StationsPage() {
  const [stationId, setStationId] = useState(null);

  const stationCfg = useMemo(
    () => ({
      ...stationsCrud,
      onRowClick: (row) => setStationId(row.StationID),
      selectedId: stationId,
    }),
    [stationId]
  );

  const intFields = useMemo(
    () => moduleIntegrationsCrud.fields.map((f) => (f.key === "StationID" ? { ...f, readOnly: true } : f)),
    []
  );

  const integrationsCfg = useMemo(() => {
    if (stationId == null) return null;
    return {
      ...moduleIntegrationsCrud,
      title: `Module integrations — station #${stationId}`,
      presetFilters: { StationID: String(stationId) },
      fields: intFields,
    };
  }, [stationId, intFields]);

  return (
    <div className="stack-pages">
      <EnhancedCrudPage config={stationCfg} />
      {stationId == null && (
        <p className="muted hint-box">Select a station row to add or edit docking integrations for that station.</p>
      )}
      {integrationsCfg && <EnhancedCrudPage key={`int-${stationId}`} config={integrationsCfg} />}
    </div>
  );
}
