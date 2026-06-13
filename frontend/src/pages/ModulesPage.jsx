import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";
import { useNotify } from "../context/NotificationContext";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import HologramHeader from "../components/HologramHeader";
import { Box } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SUB = [
  { id: "habitat", label: "Habitat", api: "habitats" },
  { id: "laboratory", label: "Laboratory", api: "laboratories" },
];

/** PRD §7.2 — Modules + Habitat / Laboratory subtype tabs */
export default function ModulesPage() {
  const { isAdmin } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [tab, setTab] = useState("all");
  const [sets, setSets] = useState({ habitat: new Set(), laboratory: new Set() });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("ModuleID");
  const [sortDir, setSortDir] = useState("desc");
  const [form, setForm] = useState({
    StationID: "",
    Name: "",
    Manufacturer: "",
    LaunchMass: "",
    LaunchDate: "",
    Dimensions: "",
    subtype: "habitat",
    SleepingQuarters: "",
    ExerciseEquipment: "",
    GalleyFacilities: "",
    LifeSupportCapacity: "",
    ResearchFocus: "",
    CleanRoomLevel: "",
    SampleStorage: "",
    EquipmentList: "",
  });
  const limit = 25;

  const loadSets = useCallback(async () => {
    const next = { habitat: new Set(), laboratory: new Set() };
    for (const s of SUB) {
      try {
        const { data } = await axios.get(`${API_BASE}/${s.api}`, { params: { limit: 500, page: 1 } });
        for (const r of data.data || []) next[s.id].add(r.ModuleID);
      } catch {
        /* ignore */
      }
    }
    setSets(next);
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/modules`, {
        params: { page, limit, search, sort: sortKey, dir: sortDir },
      });
      setRows(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      notifyError(e.response?.data?.error || e.message);
    }
  }, [page, limit, search, sortKey, sortDir, notifyError]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadSets();
  }, [loadSets, rows]);

  const displayRows = useMemo(() => {
    if (tab === "all") return rows;
    const set = sets[tab] || new Set();
    return rows.filter((r) => set.has(r.ModuleID));
  }, [rows, tab, sets]);

  function typeLabel(mid) {
    if (sets.habitat.has(mid)) return "Habitat";
    if (sets.laboratory.has(mid)) return "Laboratory";
    return "—";
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.Name?.trim()) return notifyError("Module name is required.");
    try {
      const modPayload = {
        StationID: form.StationID === "" ? null : Number(form.StationID),
        Name: form.Name,
        Manufacturer: form.Manufacturer || null,
        LaunchMass: form.LaunchMass === "" ? null : Number(form.LaunchMass),
        LaunchDate: form.LaunchDate || null,
        Dimensions: form.Dimensions || null,
      };
      const { data: mod } = await axios.post(`${API_BASE}/modules`, modPayload);
      const mid = mod.ModuleID;

      if (form.subtype === "habitat") {
        await axios.post(`${API_BASE}/habitats`, {
          ModuleID: mid,
          SleepingQuarters: form.SleepingQuarters === "" ? null : Number(form.SleepingQuarters),
          ExerciseEquipment: form.ExerciseEquipment || null,
          GalleyFacilities: form.GalleyFacilities || null,
          LifeSupportCapacity: form.LifeSupportCapacity === "" ? null : Number(form.LifeSupportCapacity),
        });
      } else {
        await axios.post(`${API_BASE}/laboratories`, {
          ModuleID: mid,
          ResearchFocus: form.ResearchFocus || null,
          CleanRoomLevel: form.CleanRoomLevel || null,
          SampleStorage: form.SampleStorage || null,
          EquipmentList: form.EquipmentList || null,
        });
      }

      notifySuccess("Module created with subtype.");
      setForm((f) => ({
        ...f,
        StationID: "",
        Name: "",
        Manufacturer: "",
        LaunchMass: "",
        LaunchDate: "",
        Dimensions: "",
      }));
      await loadSets();
      await loadRows();
    } catch (err) {
      notifyError(err.response?.data?.error || err.message);
    }
  }

  const columns = [
    { key: "ModuleID", label: "ID" },
    { key: "t", label: "Type", sortable: false, render: (r) => typeLabel(r.ModuleID) },
    { key: "StationID", label: "Station" },
    { key: "Name", label: "Name" },
    { key: "Manufacturer", label: "Manufacturer" },
    { key: "LaunchDate", label: "Launch" },
  ];

  const searchCb = useCallback((q) => {
    setPage(1);
    setSearch(q);
  }, []);

  return (
    <div className="page">
      <HologramHeader 
        icon={Box} 
        title="Modules management" 
        description="Manage space station modules and their operational subtypes (Habitat, Laboratory)." 
      />

      <div className="tab-bar">
        {["all", "habitat", "laboratory"].map((t) => (
          <button key={t} type="button" className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="toolbar toolbar-wrap">
        <SearchBar onDebouncedChange={searchCb} />
      </div>

      {isAdmin && (
        <form className="entity-form" onSubmit={submit}>
          <h3>Create module + subtype</h3>
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
            Station ID (optional FK)
            <input
              type="number"
              value={form.StationID}
              onChange={(e) => setForm((s) => ({ ...s, StationID: e.target.value }))}
            />
          </label>
          <label>
            Name <span className="req-badge">REQ</span>
            <input value={form.Name} onChange={(e) => setForm((s) => ({ ...s, Name: e.target.value }))} />
          </label>
          <label>
            Manufacturer
            <input
              value={form.Manufacturer}
              onChange={(e) => setForm((s) => ({ ...s, Manufacturer: e.target.value }))}
            />
          </label>
          <label>
            Launch mass
            <input
              type="number"
              value={form.LaunchMass}
              onChange={(e) => setForm((s) => ({ ...s, LaunchMass: e.target.value }))}
            />
          </label>
          <label>
            Launch date
            <input
              type="date"
              value={form.LaunchDate}
              onChange={(e) => setForm((s) => ({ ...s, LaunchDate: e.target.value }))}
            />
          </label>
          <label>
            Dimensions
            <input
              value={form.Dimensions}
              onChange={(e) => setForm((s) => ({ ...s, Dimensions: e.target.value }))}
            />
          </label>

          {form.subtype === "habitat" ? (
            <>
              <label>
                Sleeping quarters
                <input
                  type="number"
                  value={form.SleepingQuarters}
                  onChange={(e) => setForm((s) => ({ ...s, SleepingQuarters: e.target.value }))}
                />
              </label>
              <label>
                Exercise equipment
                <input
                  value={form.ExerciseEquipment}
                  onChange={(e) => setForm((s) => ({ ...s, ExerciseEquipment: e.target.value }))}
                />
              </label>
              <label>
                Galley facilities
                <input
                  value={form.GalleyFacilities}
                  onChange={(e) => setForm((s) => ({ ...s, GalleyFacilities: e.target.value }))}
                />
              </label>
              <label>
                Life support capacity
                <input
                  type="number"
                  value={form.LifeSupportCapacity}
                  onChange={(e) => setForm((s) => ({ ...s, LifeSupportCapacity: e.target.value }))}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Research focus
                <input
                  value={form.ResearchFocus}
                  onChange={(e) => setForm((s) => ({ ...s, ResearchFocus: e.target.value }))}
                />
              </label>
              <label>
                Clean room level
                <input
                  value={form.CleanRoomLevel}
                  onChange={(e) => setForm((s) => ({ ...s, CleanRoomLevel: e.target.value }))}
                />
              </label>
              <label>
                Sample storage
                <input
                  value={form.SampleStorage}
                  onChange={(e) => setForm((s) => ({ ...s, SampleStorage: e.target.value }))}
                />
              </label>
              <label>
                Equipment list
                <textarea
                  value={form.EquipmentList}
                  onChange={(e) => setForm((s) => ({ ...s, EquipmentList: e.target.value }))}
                />
              </label>
            </>
          )}

          <div className="form-actions">
            <button type="submit">Create</button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={displayRows}
        idField="ModuleID"
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(k, d) => {
          setSortKey(k);
          setSortDir(d);
        }}
      />

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
