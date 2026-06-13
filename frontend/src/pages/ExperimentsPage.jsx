import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";
import { useNotify } from "../context/NotificationContext";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import HologramHeader from "../components/HologramHeader";
import { Microscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SUB = [
  { id: "biological", api: "biological", label: "Biological" },
  { id: "physical", api: "physical", label: "Physical" },
  { id: "astronomy", api: "astronomy", label: "Astronomy" },
  { id: "engineering_exp", api: "engineering_exp", label: "Engineering" },
];

/** PRD §7.2 — Experiments + subtype tabs (TPT) */
export default function ExperimentsPage() {
  const { isAdmin } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [tab, setTab] = useState("all");
  const [sets, setSets] = useState({
    biological: new Set(),
    physical: new Set(),
    astronomy: new Set(),
    engineering_exp: new Set(),
  });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("ExperimentID");
  const [sortDir, setSortDir] = useState("desc");
  const [form, setForm] = useState({
    Title: "",
    Objective: "",
    StartDate: "",
    EndDate: "",
    Status: "",
    PrincipalInvestigator: "",
    subtype: "biological",
    SpecimenType: "",
    Containment: "",
    CrewImpact: "",
    PhysicsType: "",
    PhysicsPrecision: "",
    DataRate: "",
    SkyRegion: "",
    TelescopeUsed: "",
    Wavelength: "",
    ExposureTime: "",
    TestObjective: "",
    SafetyMargin: "",
    RedundancyLevel: "",
    StressFactors: "",
  });
  const limit = 25;

  const loadSets = useCallback(async () => {
    const next = {
      biological: new Set(),
      physical: new Set(),
      astronomy: new Set(),
      engineering_exp: new Set(),
    };
    for (const s of SUB) {
      try {
        const { data } = await axios.get(`${API_BASE}/${s.api}`, { params: { limit: 500, page: 1 } });
        for (const r of data.data || []) next[s.id].add(r.ExperimentID);
      } catch {
        /* ignore */
      }
    }
    setSets(next);
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const endpoint = isAdmin ? `${API_BASE}/experiments` : `${API_BASE}/me/experiments`;
      const { data } = await axios.get(endpoint, {
        params: { page, limit, search, sort: sortKey, dir: sortDir },
      });
      setRows(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      notifyError(e.response?.data?.error || e.message);
    }
  }, [page, limit, search, sortKey, sortDir, isAdmin, notifyError]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadSets();
  }, [loadSets, rows]);

  const displayRows = useMemo(() => {
    if (tab === "all") return rows;
    const set = sets[tab] || new Set();
    return rows.filter((r) => set.has(r.ExperimentID));
  }, [rows, tab, sets]);

  function typeLabel(eid) {
    for (const s of SUB) {
      if (sets[s.id].has(eid)) return s.label;
    }
    return "—";
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.Title?.trim()) return notifyError("Title is required.");
    if (form.StartDate && form.EndDate && new Date(form.EndDate) <= new Date(form.StartDate))
      return notifyError("End date must be after start date.");

    try {
      const { data: exp } = await axios.post(`${API_BASE}/experiments`, {
        Title: form.Title,
        Objective: form.Objective || null,
        StartDate: form.StartDate || null,
        EndDate: form.EndDate || null,
        Status: form.Status || null,
        PrincipalInvestigator: form.PrincipalInvestigator || null,
      });
      const eid = exp.ExperimentID;

      if (form.subtype === "biological") {
        await axios.post(`${API_BASE}/biological`, {
          ExperimentID: eid,
          SpecimenType: form.SpecimenType || null,
          Containment: form.Containment || null,
          CrewImpact: form.CrewImpact || null,
        });
      } else if (form.subtype === "physical") {
        await axios.post(`${API_BASE}/physical`, {
          ExperimentID: eid,
          PhysicsType: form.PhysicsType || null,
          PhysicsPrecision: form.PhysicsPrecision || null,
          DataRate: form.DataRate || null,
        });
      } else if (form.subtype === "astronomy") {
        await axios.post(`${API_BASE}/astronomy`, {
          ExperimentID: eid,
          SkyRegion: form.SkyRegion || null,
          TelescopeUsed: form.TelescopeUsed || null,
          Wavelength: form.Wavelength || null,
          ExposureTime: form.ExposureTime || null,
        });
      } else {
        await axios.post(`${API_BASE}/engineering_exp`, {
          ExperimentID: eid,
          TestObjective: form.TestObjective || null,
          SafetyMargin: form.SafetyMargin || null,
          RedundancyLevel: form.RedundancyLevel || null,
          StressFactors: form.StressFactors || null,
        });
      }

      notifySuccess("Experiment + subtype created.");
      setForm((f) => ({
        ...f,
        Title: "",
        Objective: "",
        StartDate: "",
        EndDate: "",
        Status: "",
        PrincipalInvestigator: "",
      }));
      await loadSets();
      await loadRows();
    } catch (err) {
      notifyError(err.response?.data?.error || err.message);
    }
  }

  const columns = [
    { key: "ExperimentID", label: "ID" },
    { key: "t", label: "Type", sortable: false, render: (r) => typeLabel(r.ExperimentID) },
    { key: "Title", label: "Title" },
    { key: "Status", label: "Status" },
    { key: "PrincipalInvestigator", label: "PI" },
    { key: "StartDate", label: "Start" },
  ];

  const searchCb = useCallback((q) => {
    setPage(1);
    setSearch(q);
  }, []);

  return (
    <div className="pd2-page">
      <HologramHeader 
        icon={Microscope} 
        title="Experiment database" 
        description="Manage biological, astronomy, and engineering experiments." 
      />

      <div className="pd2-panel" style={{ "--panel-accent": "#a78bfa", marginBottom: "16px" }}>
        <div className="pd2-panel-body" style={{ flexDirection: "row", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar onDebouncedChange={searchCb} />
          <div style={{ flex: 1 }} />
          <div className="tab-bar tab-bar-scroll" style={{ margin: 0 }}>
            {["all", ...SUB.map((s) => s.id)].map((t) => (
              <button key={t} type="button" className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
                {t === "all"
                  ? "All"
                  : SUB.find((s) => s.id === t)?.label ?? t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isAdmin && (
        <form className="entity-form" onSubmit={submit}>
          <h3>Create experiment + subtype</h3>
          <label>
            Subtype <span className="req-badge">REQ</span>
            <select value={form.subtype} onChange={(e) => setForm((s) => ({ ...s, subtype: e.target.value }))}>
              {SUB.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title <span className="req-badge">REQ</span>
            <input value={form.Title} onChange={(e) => setForm((s) => ({ ...s, Title: e.target.value }))} />
          </label>
          <label>
            Objective
            <textarea value={form.Objective} onChange={(e) => setForm((s) => ({ ...s, Objective: e.target.value }))} />
          </label>
          <label>
            Start date
            <input
              type="date"
              value={form.StartDate}
              onChange={(e) => setForm((s) => ({ ...s, StartDate: e.target.value }))}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={form.EndDate}
              onChange={(e) => setForm((s) => ({ ...s, EndDate: e.target.value }))}
            />
          </label>
          <label>
            Status
            <input value={form.Status} onChange={(e) => setForm((s) => ({ ...s, Status: e.target.value }))} />
          </label>
          <label>
            Principal investigator
            <input
              value={form.PrincipalInvestigator}
              onChange={(e) => setForm((s) => ({ ...s, PrincipalInvestigator: e.target.value }))}
            />
          </label>

          {form.subtype === "biological" && (
            <>
              <label>
                Specimen type
                <input
                  value={form.SpecimenType}
                  onChange={(e) => setForm((s) => ({ ...s, SpecimenType: e.target.value }))}
                />
              </label>
              <label>
                Containment
                <input
                  value={form.Containment}
                  onChange={(e) => setForm((s) => ({ ...s, Containment: e.target.value }))}
                />
              </label>
              <label>
                Crew impact
                <input
                  value={form.CrewImpact}
                  onChange={(e) => setForm((s) => ({ ...s, CrewImpact: e.target.value }))}
                />
              </label>
            </>
          )}

          {form.subtype === "physical" && (
            <>
              <label>
                Physics type
                <input
                  value={form.PhysicsType}
                  onChange={(e) => setForm((s) => ({ ...s, PhysicsType: e.target.value }))}
                />
              </label>
              <label>
                Physics precision (PRD “Precision”; DB column PhysicsPrecision)
                <input
                  value={form.PhysicsPrecision}
                  onChange={(e) => setForm((s) => ({ ...s, PhysicsPrecision: e.target.value }))}
                />
              </label>
              <label>
                Data rate
                <input value={form.DataRate} onChange={(e) => setForm((s) => ({ ...s, DataRate: e.target.value }))} />
              </label>
            </>
          )}

          {form.subtype === "astronomy" && (
            <>
              <label>
                Sky region
                <input value={form.SkyRegion} onChange={(e) => setForm((s) => ({ ...s, SkyRegion: e.target.value }))} />
              </label>
              <label>
                Telescope used
                <input
                  value={form.TelescopeUsed}
                  onChange={(e) => setForm((s) => ({ ...s, TelescopeUsed: e.target.value }))}
                />
              </label>
              <label>
                Wavelength
                <input
                  value={form.Wavelength}
                  onChange={(e) => setForm((s) => ({ ...s, Wavelength: e.target.value }))}
                />
              </label>
              <label>
                Exposure time
                <input
                  value={form.ExposureTime}
                  onChange={(e) => setForm((s) => ({ ...s, ExposureTime: e.target.value }))}
                />
              </label>
            </>
          )}

          {form.subtype === "engineering_exp" && (
            <>
              <label>
                Test objective
                <input
                  value={form.TestObjective}
                  onChange={(e) => setForm((s) => ({ ...s, TestObjective: e.target.value }))}
                />
              </label>
              <label>
                Safety margin
                <input
                  value={form.SafetyMargin}
                  onChange={(e) => setForm((s) => ({ ...s, SafetyMargin: e.target.value }))}
                />
              </label>
              <label>
                Redundancy level
                <input
                  value={form.RedundancyLevel}
                  onChange={(e) => setForm((s) => ({ ...s, RedundancyLevel: e.target.value }))}
                />
              </label>
              <label>
                Stress factors
                <input
                  value={form.StressFactors}
                  onChange={(e) => setForm((s) => ({ ...s, StressFactors: e.target.value }))}
                />
              </label>
            </>
          )}

          <div className="form-actions">
            <button type="submit">Create</button>
          </div>
        </form>
      )}

      <div className="pd2-panel" style={{ "--panel-accent": "#22d3ee" }}>
        <div className="pd2-panel-header">
          <div className="pd2-panel-icon-wrap">
            <span style={{ fontSize: 14 }}>❖</span>
          </div>
          <h3 className="pd2-panel-title">Experiments</h3>
          <span className="pd2-panel-badge">{total} total</span>
          <div className="pd2-panel-line" />
        </div>
        <div className="pd2-panel-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            rows={displayRows}
            idField="ExperimentID"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k, d) => {
              setSortKey(k);
              setSortDir(d);
            }}
          />
        </div>
      </div>

      <div className="pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button type="button" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
