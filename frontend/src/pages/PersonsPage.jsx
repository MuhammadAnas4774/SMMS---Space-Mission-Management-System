import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config/api";
import { genderOptions } from "../config/entitySchemas";
import { useNotify } from "../context/NotificationContext";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import HologramHeader from "../components/HologramHeader";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/** PRD §7.2 / §5.1.1 — Persons + subtype flow (Astronaut / Ground Control) */
export default function PersonsPage() {
  const { isAdmin } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("PersonID");
  const [sortDir, setSortDir] = useState("desc");
  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    DateOfBirth: "",
    Gender: "",
    Nationality: "",
    ContactInfo: "",
    subtype: "none",
  });
  const [subtypeExtra, setSubtypeExtra] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [error, setError] = useState("");
  const limit = 25;

  const loadRows = useCallback(async () => {
    try {
      setError("");
      const { data } = await axios.get(`${API_BASE}/persons`, {
        params: { page, limit, search, sort: sortKey, dir: sortDir },
      });
      setRows(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      notifyError(msg);
    }
  }, [page, limit, search, sortKey, sortDir, notifyError]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function clearForm() {
    setEditingId(null);
    setForm({
      FirstName: "",
      LastName: "",
      DateOfBirth: "",
      Gender: "",
      Nationality: "",
      ContactInfo: "",
      subtype: "none",
    });
    setSubtypeExtra({});
  }

  function startEdit(row) {
    setEditingId(row.PersonID);
    setForm({
      FirstName: row.FirstName ?? "",
      LastName: row.LastName ?? "",
      DateOfBirth: row.DateOfBirth?.slice?.(0, 10) ?? row.DateOfBirth ?? "",
      Gender: row.Gender ?? "",
      Nationality: row.Nationality ?? "",
      ContactInfo: row.ContactInfo ?? "",
      subtype: "none",
    });
    setSubtypeExtra({});
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (editingId) {
      const payload = {
        FirstName: form.FirstName,
        LastName: form.LastName,
        ContactInfo: form.ContactInfo,
        Nationality: form.Nationality,
      };
      try {
        await axios.put(`${API_BASE}/persons/${editingId}`, payload);
        notifySuccess("Person updated.");
        clearForm();
        await loadRows();
      } catch (err) {
        const msg = err.response?.data?.error || err.message;
        setError(msg);
        notifyError(msg);
      }
      return;
    }

    if (!form.FirstName?.trim() || !form.LastName?.trim()) {
      const msg = "First and last name are required.";
      setError(msg);
      notifyError(msg);
      return;
    }
    if (!form.DateOfBirth) {
      const msg = "Date of birth is required.";
      setError(msg);
      notifyError(msg);
      return;
    }
    if (!form.Gender) {
      const msg = "Gender is required.";
      setError(msg);
      notifyError(msg);
      return;
    }
    if (!form.Nationality?.trim()) {
      const msg = "Nationality is required.";
      setError(msg);
      notifyError(msg);
      return;
    }

    try {
      const { data: person } = await axios.post(`${API_BASE}/persons`, {
        FirstName: form.FirstName,
        LastName: form.LastName,
        DateOfBirth: form.DateOfBirth,
        Gender: form.Gender,
        Nationality: form.Nationality,
        ContactInfo: form.ContactInfo,
      });
      const pid = person.PersonID;

      if (form.subtype === "astronaut") {
        if (!subtypeExtra.Role?.trim()) {
          const msg = "Astronaut role is required.";
          setError(msg);
          notifyError(msg);
          return;
        }
        await axios.post(`${API_BASE}/astronauts`, {
          PersonID: pid,
          Role: subtypeExtra.Role,
          FlightHours: subtypeExtra.FlightHours || 0,
          Specialization: subtypeExtra.Specialization || null,
          ClearanceLevel: subtypeExtra.ClearanceLevel || null,
          SpaceSuitSize: subtypeExtra.SpaceSuitSize || null,
          Department: subtypeExtra.Department || null,
          Rank: subtypeExtra.Rank || null,
          HealthStatus: subtypeExtra.HealthStatus || null,
          ConsoleAssignment: subtypeExtra.ConsoleAssignment || null,
          ShiftSchedule: subtypeExtra.ShiftSchedule || null,
          MentorID: subtypeExtra.MentorID || null,
        });
      } else if (form.subtype === "ground") {
        if (!subtypeExtra.GCRole?.trim()) {
          const msg = "Ground control role is required.";
          setError(msg);
          notifyError(msg);
          return;
        }
        await axios.post(`${API_BASE}/ground_control`, {
          PersonID: pid,
          Role: subtypeExtra.GCRole,
          Department: subtypeExtra.GCDepartment || null,
          ShiftSchedule: subtypeExtra.GCShift || null,
          ConsoleAssignment: subtypeExtra.GCConsole || null,
          ClearanceLevel: subtypeExtra.GCClearance || null,
        });
      }

      notifySuccess("Person created successfully.");
      clearForm();
      await loadRows();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      notifyError(msg);
    }
  }

  async function openDelete(row) {
    setPendingDelete(row);
    try {
      const { data } = await axios.get(`${API_BASE}/persons/${row.PersonID}/delete-impact`);
      setDeleteImpact(data);
    } catch {
      setDeleteImpact(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await axios.delete(`${API_BASE}/persons/${pendingDelete.PersonID}`);
      notifySuccess("Deleted.");
      setPendingDelete(null);
      setDeleteImpact(null);
      await loadRows();
    } catch (err) {
      notifyError(err.response?.data?.error || err.message);
      setPendingDelete(null);
    }
  }

  const columns = [
    { key: "PersonID", label: "Person ID" },
    {
      key: "FullName",
      label: "Full name",
      sortable: false,
      render: (row) => `${row.FirstName ?? ""} ${row.LastName ?? ""}`.trim(),
    },
    { key: "Nationality", label: "Nationality" },
    { key: "Gender", label: "Gender" },
    { key: "DateOfBirth", label: "DOB" },
    { key: "ContactInfo", label: "Contact" },
  ];

  const searchCb = useCallback((q) => {
    setPage(1);
    setSearch(q);
  }, []);

  return (
    <div className="pd2-page">
      <HologramHeader 
        icon={User} 
        title="Person management" 
        description="Manage personnel records and their respective operational subtypes (Astronaut or Ground Control)." 
      />
      <div className="pd2-panel" style={{ "--panel-accent": "#a78bfa", marginBottom: "16px" }}>
        <div className="pd2-panel-body" style={{ flexDirection: "row", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar placeholder="Search…" onDebouncedChange={searchCb} />
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <button type="button" onClick={clearForm} className="pd2-refresh-btn" style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#a5b4fc" }}>
              + New Person
            </button>
          )}
        </div>
      </div>

      {error && <p className="err">{error}</p>}

      {isAdmin && (
        <form className="entity-form" onSubmit={submit}>
          <fieldset className="fieldset-block">
            <legend>{editingId ? `Edit person #${editingId}` : "New person"}</legend>
            <label>
              First name <span className="req-badge">REQ</span>
              <input
                value={form.FirstName}
                onChange={(e) => setForm((s) => ({ ...s, FirstName: e.target.value.replace(/\d/g, '') }))}
                disabled={Boolean(editingId)}
              />
            </label>
            <label>
              Last name <span className="req-badge">REQ</span>
              <input
                value={form.LastName}
                onChange={(e) => setForm((s) => ({ ...s, LastName: e.target.value.replace(/\d/g, '') }))}
                disabled={Boolean(editingId)}
              />
            </label>
            <label>
              Date of birth <span className="req-badge">REQ</span>
              <input
                type="date"
                value={form.DateOfBirth}
                onChange={(e) => setForm((s) => ({ ...s, DateOfBirth: e.target.value }))}
                disabled={Boolean(editingId)}
              />
            </label>
            <label>
              Gender <span className="req-badge">REQ</span>
              <select
                value={form.Gender}
                disabled={Boolean(editingId)}
                onChange={(e) => setForm((s) => ({ ...s, Gender: e.target.value }))}
              >
                <option value="">—</option>
                {genderOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nationality <span className="req-badge">REQ</span>
              <input
                value={form.Nationality}
                onChange={(e) => setForm((s) => ({ ...s, Nationality: e.target.value.replace(/\d/g, '') }))}
              />
            </label>
            <label>
              Contact info
              <input
                value={form.ContactInfo}
                onChange={(e) => setForm((s) => ({ ...s, ContactInfo: e.target.value.replace(/[^\d\+\-\s\(\)]/g, '') }))}
              />
            </label>
          </fieldset>

          {!editingId && (
            <fieldset className="fieldset-block person-subtype-picker">
              <legend>Person subtype (optional)</legend>
              <div className="person-subtype-options" role="radiogroup" aria-label="Person subtype">
                <label
                  className={`subtype-option${form.subtype === "none" ? " subtype-option--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="subtype"
                    checked={form.subtype === "none"}
                    onChange={() => setForm((s) => ({ ...s, subtype: "none" }))}
                  />
                  <span className="subtype-option-label">Person record only</span>
                </label>
                <label
                  className={`subtype-option${form.subtype === "astronaut" ? " subtype-option--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="subtype"
                    checked={form.subtype === "astronaut"}
                    onChange={() => setForm((s) => ({ ...s, subtype: "astronaut" }))}
                  />
                  <span className="subtype-option-label">Also create Astronaut row</span>
                </label>
                <label
                  className={`subtype-option${form.subtype === "ground" ? " subtype-option--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="subtype"
                    checked={form.subtype === "ground"}
                    onChange={() => setForm((s) => ({ ...s, subtype: "ground" }))}
                  />
                  <span className="subtype-option-label">Also create Ground Control row</span>
                </label>
              </div>
            </fieldset>
          )}

          {!editingId && form.subtype === "astronaut" && (
            <fieldset className="fieldset-block">
              <legend>Astronaut fields</legend>
              <label>
                Role <span className="req-badge">REQ</span>
                <input
                  value={subtypeExtra.Role ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, Role: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
              <label>
                Flight hours
                <input
                  type="number"
                  value={subtypeExtra.FlightHours ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, FlightHours: e.target.value }))}
                />
              </label>
              <label>
                Department
                <input
                  value={subtypeExtra.Department ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, Department: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
              <label>
                Rank
                <input
                  value={subtypeExtra.Rank ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, Rank: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
              <label>
                Health status
                <input
                  value={subtypeExtra.HealthStatus ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, HealthStatus: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
            </fieldset>
          )}

          {!editingId && form.subtype === "ground" && (
            <fieldset className="fieldset-block">
              <legend>Ground control fields</legend>
              <label>
                Role <span className="req-badge">REQ</span>
                <input
                  value={subtypeExtra.GCRole ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, GCRole: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
              <label>
                Department
                <input
                  value={subtypeExtra.GCDepartment ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, GCDepartment: e.target.value.replace(/\d/g, '') }))}
                />
              </label>
              <label>
                Shift schedule
                <input
                  value={subtypeExtra.GCShift ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, GCShift: e.target.value }))}
                />
              </label>
              <label>
                Console assignment
                <input
                  value={subtypeExtra.GCConsole ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, GCConsole: e.target.value }))}
                />
              </label>
              <label>
                Clearance level
                <input
                  value={subtypeExtra.GCClearance ?? ""}
                  onChange={(e) => setSubtypeExtra((s) => ({ ...s, GCClearance: e.target.value }))}
                />
              </label>
            </fieldset>
          )}

          <div className="form-actions">
            <button type="submit">{editingId ? "Save person" : "Create"}</button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={clearForm}>
                Cancel
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
            idField="PersonID"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k, d) => {
              setSortKey(k);
              setSortDir(d);
            }}
            onEdit={isAdmin ? startEdit : null}
            onDelete={isAdmin ? openDelete : null}
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
        title="Delete person?"
        danger
        confirmLabel="Delete"
        onCancel={() => {
          setPendingDelete(null);
          setDeleteImpact(null);
        }}
        onConfirm={confirmDelete}
        message={
          pendingDelete ? (
            <>
              {deleteImpact && (
                <p>
                  Linked rows: <strong>{deleteImpact.astronautRows}</strong> astronaut(s),{" "}
                  <strong>{deleteImpact.groundControlRows}</strong> ground control — deleting the person may fail if
                  RESTRICT blocks apply; subtype rows may CASCADE per schema.
                </p>
              )}
              <p>
                Remove person <strong>{pendingDelete.PersonID}</strong> ({pendingDelete.FirstName}{" "}
                {pendingDelete.LastName})?
              </p>
            </>
          ) : null
        }
      />
    </div>
  );
}
