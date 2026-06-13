import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import EnhancedCrudPage from "../components/EnhancedCrudPage";
import { API_BASE } from "../config/api";
import { useNotify } from "../context/NotificationContext";
import { telemetryCrud } from "../config/entitySchemas";
import { useAuth } from "../context/AuthContext";

/** PRD §7.2 / §7.4 — Telemetry feed + GET /telemetry/:id/status + optional System Status row */
export default function TelemetryPage() {
  const { isAdmin } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [selectedId, setSelectedId] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [statusForm, setStatusForm] = useState({
    Temperature: "",
    Humidity: "",
    CPUUsage: "",
    PowerLevel: "",
    OxygenLevel: "",
    Pressure: "",
    MemoryUsage: "",
    CommStatus: "",
  });

  const cfg = useMemo(
    () => ({
      ...telemetryCrud,
      onRowClick: (row) => setSelectedId(row.TelemetryID),
      selectedId,
    }),
    [selectedId]
  );

  useEffect(() => {
    if (!selectedId) {
      setStatusRow(null);
      return;
    }
    axios
      .get(`${API_BASE}/telemetry/${selectedId}/status`)
      .then((res) => {
        setStatusRow(res.data);
        if (res.data) {
          setStatusForm({
            Temperature: res.data.Temperature ?? "",
            Humidity: res.data.Humidity ?? "",
            CPUUsage: res.data.CPUUsage ?? "",
            PowerLevel: res.data.PowerLevel ?? "",
            OxygenLevel: res.data.OxygenLevel ?? "",
            Pressure: res.data.Pressure ?? "",
            MemoryUsage: res.data.MemoryUsage ?? "",
            CommStatus: res.data.CommStatus ?? "",
          });
        } else {
          setStatusForm({
            Temperature: "",
            Humidity: "",
            CPUUsage: "",
            PowerLevel: "",
            OxygenLevel: "",
            Pressure: "",
            MemoryUsage: "",
            CommStatus: "",
          });
        }
      })
      .catch(() => setStatusRow(null));
  }, [selectedId]);

  async function saveStatus(e) {
    e.preventDefault();
    if (!selectedId) return;
    const num = (v) => (v === "" || v === undefined ? null : Number(v));
    const payload = {
      TelemetryID: Number(selectedId),
      Temperature: num(statusForm.Temperature),
      Humidity: num(statusForm.Humidity),
      CPUUsage: num(statusForm.CPUUsage),
      PowerLevel: num(statusForm.PowerLevel),
      OxygenLevel: num(statusForm.OxygenLevel),
      Pressure: num(statusForm.Pressure),
      MemoryUsage: num(statusForm.MemoryUsage),
      CommStatus: statusForm.CommStatus === "" ? null : statusForm.CommStatus,
    };
    try {
      if (statusRow) {
        await axios.put(`${API_BASE}/system_status/${selectedId}`, payload);
      } else {
        await axios.post(`${API_BASE}/system_status`, payload);
      }
      notifySuccess("System status saved.");
      const { data } = await axios.get(`${API_BASE}/telemetry/${selectedId}/status`);
      setStatusRow(data);
    } catch (err) {
      notifyError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="stack-pages">
      <EnhancedCrudPage config={cfg} />

      <div className="card telemetry-status-panel">
        <h3>System status (telemetry subtype)</h3>
        {!selectedId && <p className="muted">Click a telemetry row to load or edit system status details.</p>}
        {selectedId && isAdmin && (
          <form className="entity-form" onSubmit={saveStatus}>
            <input type="hidden" value={selectedId} readOnly />
            {Object.keys(statusForm).map((k) => (
              <label key={k}>
                {k}
                <input
                  value={statusForm[k]}
                  onChange={(e) => setStatusForm((s) => ({ ...s, [k]: e.target.value }))}
                />
              </label>
            ))}
            <div className="form-actions">
              <button type="submit">{statusRow ? "Update system status" : "Create system status row"}</button>
            </div>
          </form>
        )}
        {selectedId && !isAdmin && statusRow && (
          <div className="entity-form read-only-status">
            {Object.keys(statusForm).map((k) => (
              <div key={k} className="status-field">
                <strong>{k}:</strong> {statusRow[k] ?? "—"}
              </div>
            ))}
          </div>
        )}
        {selectedId && !isAdmin && !statusRow && (
          <p className="muted">No system status recorded for this telemetry row.</p>
        )}
      </div>
    </div>
  );
}
