import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";
import { useNotify } from "../context/NotificationContext";
import ConfirmModal from "./ConfirmModal";
import DataTable from "./DataTable";
import SearchBar from "./SearchBar";
import HologramHeader from "./HologramHeader";
import {
  UserCheck, Headset, Wrench, CalendarDays, ClipboardList, Sparkles,
  FlaskConical, Link2, Building2, Rocket, AlertTriangle, Activity, Box
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const filterableByPerson = [
  "missions", "spacecraft", "experiments", "alerts", "events", "telemetry",
  "mission_assignments", "spacecraft_missions", "experiment_executions",
];

const ICONS = {
  astronauts: UserCheck,
  ground_control: Headset,
  equipment: Wrench,
  events: CalendarDays,
  mission_assignments: ClipboardList,
  spacecraft_missions: Sparkles,
  experiment_executions: FlaskConical,
  module_integrations: Link2,
  stations: Building2,
  missions: Rocket,
  alerts: AlertTriangle,
  telemetry: Activity,
};

async function fetchList(entityKey, params, userRole) {
  const isOperator = userRole === "astronaut" || userRole === "ground_control";
  const useMe = isOperator && filterableByPerson.includes(entityKey);
  const url = useMe ? `${API_BASE}/me/${entityKey}` : `${API_BASE}/${entityKey}`;
  const { data } = await axios.get(url, { params });
  return data;
}

async function fetchOptions(entityKey, labelField, valueField, limit = 500) {
  const { data } = await axios.get(`${API_BASE}/${entityKey}`, { params: { limit, page: 1 } });
  const rows = data.data || [];
  return rows.map((r) => ({
    value: String(r[valueField]),
    label: `${r[valueField]} — ${r[labelField] ?? ""}`.trim(),
  }));
}

const EMPTY_OBJ = {};
const EMPTY_ARR = [];

/** PRD §7.3 EntityForm + DataTable + SearchBar + ConfirmModal + validation hooks */
export default function EnhancedCrudPage({ config }) {
  const {
    entityKey,
    title,
    idField,
    columns,
    fields,
    filters = EMPTY_ARR,
    presetFilters = EMPTY_OBJ,
    defaultSort,
    validateCreate,
    validateUpdate,
    deleteIntro,
    onRowClick,
    selectedId,
  } = config;

  const { isAdmin, user } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(defaultSort?.key || idField);
  const [sortDir, setSortDir] = useState(defaultSort?.dir || "desc");
  const [filterState, setFilterState] = useState({});
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [fkOptions, setFkOptions] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState("");

  const limit = 25;

  useEffect(() => {
    let cancelled = false;
    async function loadAllFk() {
      const next = {};
      for (const f of fields.filter((x) => x.fk)) {
        try {
          next[f.key] = await fetchOptions(f.fk.entity, f.fk.labelField, f.fk.valueField);
        } catch {
          next[f.key] = [];
        }
      }
      if (!cancelled) setFkOptions(next);
    }
    loadAllFk();
    return () => {
      cancelled = true;
    };
  }, [entityKey, fields]);

  const loadRows = useCallback(async () => {
    try {
      setError("");
      const params = {
        page,
        limit,
        search: search || undefined,
        sort: sortKey,
        dir: sortDir,
        ...presetFilters,
        ...Object.fromEntries(
          Object.entries(filterState).filter(([, v]) => v !== undefined && v !== "")
        ),
      };
      const data = await fetchList(entityKey, params, user?.role || user?.role_name);
      setRows(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      notifyError(msg);
    }
  }, [entityKey, page, limit, search, sortKey, sortDir, filterState, presetFilters, notifyError]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const visibleFields = useMemo(() => {
    return fields.filter((f) => !(editingId && f.hideOnEdit));
  }, [fields, editingId]);

  function startEdit(row) {
    setEditingId(row[idField]);
    const next = {};
    for (const f of fields) {
      const v = row[f.key];
      next[f.key] = v === null || v === undefined ? "" : f.type === "checkbox" ? Boolean(v) : v;
    }
    setForm(next);
    setError("");
  }

  function clearForm() {
    setEditingId(null);
    const next = {};
    for (const f of fields) {
      const preset = presetFilters[f.key];
      if (preset !== undefined && preset !== null && preset !== "")
        next[f.key] = f.type === "checkbox" ? Boolean(preset) : String(preset);
      else next[f.key] = f.type === "checkbox" ? false : "";
    }
    setForm(next);
  }

  const presetSig = JSON.stringify(presetFilters ?? {});
  useEffect(() => {
    setEditingId(null);
    const next = {};
    for (const f of fields) {
      const preset = presetFilters[f.key];
      if (preset !== undefined && preset !== null && preset !== "")
        next[f.key] = f.type === "checkbox" ? Boolean(preset) : String(preset);
      else next[f.key] = f.type === "checkbox" ? false : "";
    }
    setForm(next);
  }, [entityKey, presetSig, fields]);

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form };
    for (const f of fields) {
      if (f.readOnlyOnEdit && editingId) delete payload[f.key];
      if (f.type === "number" && payload[f.key] === "") delete payload[f.key];
      if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== "")
        payload[f.key] = Number(payload[f.key]);
      if (f.type === "fk" && payload[f.key] !== "" && payload[f.key] !== undefined)
        payload[f.key] = Number(payload[f.key]);
    }

    if (editingId) {
      const err = validateUpdate?.(payload, editingId);
      if (err) {
        setError(err);
        notifyError(err);
        return;
      }
      try {
        await axios.put(`${API_BASE}/${entityKey}/${editingId}`, payload);
        notifySuccess("Updated successfully.");
        clearForm();
        await loadRows();
      } catch (err) {
        const msg = err.response?.data?.error || err.message;
        setError(msg);
        notifyError(msg);
      }
      return;
    }

    const err = validateCreate?.(payload);
    if (err) {
      setError(err);
      notifyError(err);
      return;
    }
    try {
      await axios.post(`${API_BASE}/${entityKey}`, payload);
      notifySuccess("Created successfully.");
      clearForm();
      await loadRows();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      notifyError(msg);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete[idField];
    try {
      await axios.delete(`${API_BASE}/${entityKey}/${id}`);
      notifySuccess("Deleted successfully.");
      setPendingDelete(null);
      await loadRows();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      notifyError(msg);
      setPendingDelete(null);
    }
  }

  function fieldWidget(f) {
    const disabled = Boolean((editingId && f.readOnlyOnEdit) || f.readOnly);
    const val = form[f.key];

    if (f.type === "select") {
      return (
        <select
          disabled={disabled}
          value={val ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
        >
          <option value="">— Select —</option>
          {(f.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === "fk") {
      const opts = fkOptions[f.key] || [];
      return (
        <select
          disabled={disabled}
          value={val ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
        >
          <option value="">— Select —</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === "checkbox") {
      return (
        <input
          type="checkbox"
          disabled={disabled}
          checked={Boolean(val)}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.checked }))}
        />
      );
    }

    if (f.type === "textarea") {
      return (
        <textarea
          disabled={disabled}
          value={val ?? ""}
          rows={3}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
        />
      );
    }

    const inputType =
      f.type === "number"
        ? "number"
        : f.type === "date"
          ? "date"
          : f.type === "datetime"
            ? "datetime-local"
            : "text";

    return (
      <input
        type={inputType}
        disabled={disabled}
        value={val ?? ""}
        onChange={(e) => {
          let v = e.target.value;
          if (["FirstName", "LastName", "Nationality", "Role", "Department", "Rank", "HealthStatus", "GCRole", "GCDepartment"].includes(f.key)) {
            v = v.replace(/\d/g, "");
          } else if (f.key === "ContactInfo") {
            v = v.replace(/[^\d\+\-\s\(\)]/g, "");
          }
          setForm((s) => ({ ...s, [f.key]: v }));
        }}
      />
    );
  }

  const searchCb = useCallback((q) => {
    setPage(1);
    setSearch(q);
  }, []);

  return (
    <div className="pd2-page">
      <HologramHeader 
        icon={ICONS[entityKey] || Box} 
        title={title} 
        description={`Manage ${title.toLowerCase()} and track related operational data.`} 
      />

      <div className="pd2-panel" style={{ "--panel-accent": "#a78bfa", marginBottom: "16px" }}>
        <div className="pd2-panel-body" style={{ flexDirection: "row", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar placeholder="Search…" onDebouncedChange={searchCb} />
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <button type="button" onClick={clearForm} className="pd2-refresh-btn" style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a5b4fc" }}>
              + New Record
            </button>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="filter-row">
          {filters.map((fl) => (
            <label key={fl.param}>
              {fl.label}
              <select
                value={filterState[fl.param] ?? ""}
                onChange={(e) => {
                  setPage(1);
                  setFilterState((s) => ({ ...s, [fl.param]: e.target.value }));
                }}
              >
                <option value="">All</option>
                {(fl.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {error && <p className="err">{error}</p>}

      {isAdmin && (
        <form className="entity-form" onSubmit={submit}>
          {visibleFields.map((f) => (
            <label key={f.key}>
              {f.label}
              {f.required ? <span className="req-badge">REQ</span> : ""}
              {fieldWidget(f)}
            </label>
          ))}
          <div className="form-actions">
            <button type="submit">{editingId ? "Update" : "Create"}</button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={clearForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}

      <div className="pd2-panel" style={{ "--panel-accent": "#22d3ee" }}>
        <div className="pd2-panel-header">
          <div className="pd2-panel-icon-wrap">
            <span style={{ fontSize: 14 }}>❖</span>
          </div>
          <h3 className="pd2-panel-title">Data Records</h3>
          <span className="pd2-panel-badge">{total} total</span>
          <div className="pd2-panel-line" />
        </div>
        <div className="pd2-panel-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            idField={idField}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k, d) => {
              setSortKey(k);
              setSortDir(d);
            }}
            onEdit={isAdmin ? startEdit : null}
            onDelete={isAdmin ? (row) => setPendingDelete(row) : null}
            onRowClick={onRowClick}
            selectedId={selectedId}
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

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Confirm delete"
        message={
          pendingDelete ? (
            <>
              {deleteIntro && <p>{deleteIntro}</p>}
              <p>
                Delete this row (<strong>{String(pendingDelete[idField])}</strong>)?
              </p>
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
