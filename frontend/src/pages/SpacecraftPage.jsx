import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";
import { useNotify } from "../context/NotificationContext";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import HologramHeader from "../components/HologramHeader";
import { Plane } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SUBTYPES = [
  { id: "capsule", label: "Capsule", api: "capsules" },
  { id: "shuttle", label: "Shuttle", api: "shuttles" },
  { id: "rocket", label: "Rocket", api: "rockets" },
];

/** PRD §7.2 — Spacecraft with subtype tabs + two-step create */
export default function SpacecraftPage() {
  const { isAdmin } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [idSets, setIdSets] = useState({ capsule: new Set(), shuttle: new Set(), rocket: new Set() });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("SpacecraftID");
  const [sortDir, setSortDir] = useState("desc");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    Name: "",
    Manufacturer: "",
    Status: "",
    MaxCrewCapacity: "",
    MaxPayloadMass: "",
    LaunchDate: "",
    subtype: "capsule",
    DockingPorts: "",
    LandingGear: "",
    HeatShieldType: "",
    CrewCapacity: "",
    CargoBaySize: "",
    Wingspan: "",
    ShuttleCrew: "",
    StageCount: "",
    BoosterCount: "",
    Reusable: false,
  });
  const limit = 25;

  async function loadSubtypeIds() {
    const next = { capsule: new Set(), shuttle: new Set(), rocket: new Set() };
    for (const s of SUBTYPES) {
      try {
        const { data } = await axios.get(`${API_BASE}/${s.api}`, { params: { limit: 500, page: 1 } });
        for (const r of data.data || []) next[s.id].add(r.SpacecraftID);
      } catch {
        /* ignore */
      }
    }
    setIdSets(next);
  }

  const loadRows = useCallback(async () => {
    try {
      const endpoint = isAdmin ? `${API_BASE}/spacecraft` : `${API_BASE}/me/spacecraft`;
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
    loadSubtypeIds();
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayRows = useMemo(() => {
    if (tab === "all") return rows;
    const set = idSets[tab] || new Set();
    return rows.filter((r) => set.has(r.SpacecraftID));
  }, [rows, tab, idSets]);

  function subtypeLabel(id) {
    if (idSets.capsule.has(id)) return "Capsule";
    if (idSets.shuttle.has(id)) return "Shuttle";
    if (idSets.rocket.has(id)) return "Rocket";
    return "—";
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!form.Name?.trim()) return notifyError("Name is required.");
    setError("");
    try {
      const basePayload = {
        Name: form.Name,
        Manufacturer: form.Manufacturer || null,
        Status: form.Status || null,
        MaxCrewCapacity: form.MaxCrewCapacity === "" ? null : Number(form.MaxCrewCapacity),
        MaxPayloadMass: form.MaxPayloadMass === "" ? null : Number(form.MaxPayloadMass),
        LaunchDate: form.LaunchDate || null,
      };
      const { data: sc } = await axios.post(`${API_BASE}/spacecraft`, basePayload);
      const sid = sc.SpacecraftID;

      if (form.subtype === "capsule") {
        await axios.post(`${API_BASE}/capsules`, {
          SpacecraftID: sid,
          DockingPorts: form.DockingPorts === "" ? null : Number(form.DockingPorts),
          LandingGear: form.LandingGear || null,
          HeatShieldType: form.HeatShieldType || null,
          CrewCapacity: form.CrewCapacity === "" ? null : Number(form.CrewCapacity),
        });
      } else if (form.subtype === "shuttle") {
        await axios.post(`${API_BASE}/shuttles`, {
          SpacecraftID: sid,
          CargoBaySize: form.CargoBaySize === "" ? null : Number(form.CargoBaySize),
          Wingspan: form.Wingspan === "" ? null : Number(form.Wingspan),
          CrewCapacity: form.ShuttleCrew === "" ? null : Number(form.ShuttleCrew),
        });
      } else {
        await axios.post(`${API_BASE}/rockets`, {
          SpacecraftID: sid,
          StageCount: form.StageCount === "" ? null : Number(form.StageCount),
          BoosterCount: form.BoosterCount === "" ? null : Number(form.BoosterCount),
          Reusable: Boolean(form.Reusable),
        });
      }

      notifySuccess("Spacecraft and subtype created.");
      setForm((f) => ({
        ...f,
        Name: "",
        Manufacturer: "",
        Status: "",
        MaxCrewCapacity: "",
        MaxPayloadMass: "",
        LaunchDate: "",
      }));
      await loadSubtypeIds();
      await loadRows();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      notifyError(msg);
    }
  }

  const columns = [
    { key: "SpacecraftID", label: "ID" },
    { key: "subtype", label: "Type", sortable: false, render: (r) => subtypeLabel(r.SpacecraftID) },
    { key: "Name", label: "Name" },
    { key: "Manufacturer", label: "Manufacturer" },
    { key: "Status", label: "Status" },
    { key: "MaxCrewCapacity", label: "Max Crew" },
    { key: "LaunchDate", label: "Launch" },
  ];

  const searchCb = useCallback((q) => {
    setPage(1);
    setSearch(q);
  }, []);

  return (
    <div className="pd2-page">
      <HologramHeader
        icon={Plane}
        title="Spacecraft Fleet"
        description="Manage spacecraft records and their operational subtypes (Capsule, Shuttle, Rocket)."
      />

      {/* ── Toolbar ── */}
      <div className="pd2-panel" style={{ "--panel-accent": "#a78bfa", marginBottom: "16px" }}>
        <div className="pd2-panel-body" style={{ flexDirection: "row", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar onDebouncedChange={searchCb} />
          <div style={{ flex: 1 }} />
          <div className="tab-bar" style={{ margin: 0 }}>
            {["all", "capsule", "shuttle", "rocket"].map((t) => (
              <button key={t} type="button" className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
                {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Admin create form ── */}
      {isAdmin && (
        <form className="entity-form" onSubmit={submitCreate}>
          <h3>Create spacecraft + subtype</h3>
          <label>
            Subtype <span className="req-badge">REQ</span>
            <select value={form.subtype} onChange={(e) => setForm((s) => ({ ...s, subtype: e.target.value }))}>
              {SUBTYPES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label>
            Name <span className="req-badge">REQ</span>
            <input value={form.Name} onChange={(e) => setForm((s) => ({ ...s, Name: e.target.value }))} />
          </label>
          <label>
            Manufacturer
            <input value={form.Manufacturer} onChange={(e) => setForm((s) => ({ ...s, Manufacturer: e.target.value }))} />
          </label>
          <label>
            Status
            <input value={form.Status} onChange={(e) => setForm((s) => ({ ...s, Status: e.target.value }))} />
          </label>
          <label>
            Max crew
            <input type="number" value={form.MaxCrewCapacity} onChange={(e) => setForm((s) => ({ ...s, MaxCrewCapacity: e.target.value }))} />
          </label>
          <label>
            Max payload mass
            <input type="number" value={form.MaxPayloadMass} onChange={(e) => setForm((s) => ({ ...s, MaxPayloadMass: e.target.value }))} />
          </label>
          <label>
            Launch date
            <input type="date" value={form.LaunchDate} onChange={(e) => setForm((s) => ({ ...s, LaunchDate: e.target.value }))} />
          </label>

          {form.subtype === "capsule" && (
            <>
              <label>Docking ports<input type="number" value={form.DockingPorts} onChange={(e) => setForm((s) => ({ ...s, DockingPorts: e.target.value }))} /></label>
              <label>Landing gear<input value={form.LandingGear} onChange={(e) => setForm((s) => ({ ...s, LandingGear: e.target.value }))} /></label>
              <label>Heat shield type<input value={form.HeatShieldType} onChange={(e) => setForm((s) => ({ ...s, HeatShieldType: e.target.value }))} /></label>
              <label>Crew capacity<input type="number" value={form.CrewCapacity} onChange={(e) => setForm((s) => ({ ...s, CrewCapacity: e.target.value }))} /></label>
            </>
          )}

          {form.subtype === "shuttle" && (
            <>
              <label>Cargo bay size<input type="number" value={form.CargoBaySize} onChange={(e) => setForm((s) => ({ ...s, CargoBaySize: e.target.value }))} /></label>
              <label>Wingspan<input type="number" value={form.Wingspan} onChange={(e) => setForm((s) => ({ ...s, Wingspan: e.target.value }))} /></label>
              <label>Crew capacity<input type="number" value={form.ShuttleCrew} onChange={(e) => setForm((s) => ({ ...s, ShuttleCrew: e.target.value }))} /></label>
            </>
          )}

          {form.subtype === "rocket" && (
            <>
              <label>Stage count<input type="number" value={form.StageCount} onChange={(e) => setForm((s) => ({ ...s, StageCount: e.target.value }))} /></label>
              <label>Booster count<input type="number" value={form.BoosterCount} onChange={(e) => setForm((s) => ({ ...s, BoosterCount: e.target.value }))} /></label>
              <label className="checkbox-inline">
                <input type="checkbox" checked={form.Reusable} onChange={(e) => setForm((s) => ({ ...s, Reusable: e.target.checked }))} />{" "}
                Reusable
              </label>
            </>
          )}

          {error && <p className="err">{error}</p>}
          <div className="form-actions">
            <button type="submit">Create</button>
          </div>
        </form>
      )}

      {/* ── Data table panel ── */}
      <div className="pd2-panel" style={{ "--panel-accent": "#22d3ee" }}>
        <div className="pd2-panel-header">
          <div className="pd2-panel-icon-wrap">
            <span style={{ fontSize: 14 }}>❖</span>
          </div>
          <h3 className="pd2-panel-title">Spacecraft Fleet</h3>
          <span className="pd2-panel-badge">{total} total</span>
          <div className="pd2-panel-line" />
        </div>
        <div className="pd2-panel-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            rows={displayRows}
            idField="SpacecraftID"
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
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} / {Math.max(1, Math.ceil(total / limit))}</span>
        <button type="button" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
