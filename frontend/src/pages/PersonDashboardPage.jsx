/**
 * PersonDashboardPage.jsx — Premium redesign with glassmorphism + glow accents
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Rocket, Plane, Microscope, AlertTriangle, CalendarDays,
  UserCheck, Headset, Activity, Loader2, WifiOff, LinkIcon,
  CheckCircle2, XCircle, Clock, Shield, RefreshCw, Zap,
  TrendingUp, Star, Globe,
} from "lucide-react";
import { API_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";

/* ── Glowing stat orb ────────────────────────────────────────── */
function StatOrb({ icon: Icon, label, value, hue }) {
  return (
    <div className="pd2-stat" style={{ "--orb-hue": hue }}>
      <div className="pd2-stat-glow" />
      <div className="pd2-stat-icon">
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <div className="pd2-stat-body">
        <span className="pd2-stat-value">{value ?? "—"}</span>
        <span className="pd2-stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ── Glass panel ─────────────────────────────────────────────── */
function GlassPanel({ icon: Icon, title, accent = "#6366f1", children, badge }) {
  return (
    <div className="pd2-panel" style={{ "--panel-accent": accent }}>
      <div className="pd2-panel-header">
        <div className="pd2-panel-icon-wrap">
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <h3 className="pd2-panel-title">{title}</h3>
        {badge != null && <span className="pd2-panel-badge">{badge}</span>}
        <div className="pd2-panel-line" />
      </div>
      <div className="pd2-panel-body">{children}</div>
    </div>
  );
}

/* ── Status pill ─────────────────────────────────────────────── */
function Pill({ text, color }) {
  const colors = {
    active:      "#22d3ee",
    completed:   "#4ade80",
    planned:     "#a78bfa",
    aborted:     "#f87171",
    critical:    "#f87171",
    high:        "#fb923c",
    medium:      "#fbbf24",
    low:         "#4ade80",
    "in progress":"#22d3ee",
    operational: "#4ade80",
    maintenance: "#fbbf24",
  };
  const c = colors[(text || "").toLowerCase()] || "#94a3b8";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 999,
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
      background: `${c}18`, color: c, border: `1px solid ${c}40`,
      textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c, flexShrink: 0 }} />
      {text}
    </span>
  );
}

/* ── Mission row ─────────────────────────────────────────────── */
function MissionRow({ m, role }) {
  return (
    <div className="pd2-mission-row">
      <span className="pd2-mission-id">#{m.MissionID}</span>
      <div className="pd2-mission-info">
        <strong className="pd2-mission-name">{m.MissionName}</strong>
        <span className="pd2-mission-type">{m.MissionType}</span>
      </div>
      <Pill text={m.MissionStatus} />
      {role && <span className="pd2-mission-role">{role}</span>}
      <span className="pd2-mission-date">
        {m.LaunchDateTime ? new Date(m.LaunchDateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBD"}
      </span>
    </div>
  );
}

/* ── Spacecraft card ─────────────────────────────────────────── */
function ScCard({ s }) {
  return (
    <div className="pd2-sc-card">
      <div className="pd2-sc-icon"><Globe size={18} strokeWidth={1.5} /></div>
      <div className="pd2-sc-info">
        <strong>{s.Name}</strong>
        <span className="muted" style={{ fontSize: "0.73rem" }}>{s.Manufacturer}</span>
      </div>
      <Pill text={s.Status} />
    </div>
  );
}

/* ── Event row ───────────────────────────────────────────────── */
function EventRow({ e }) {
  const d = e.PlannedStartTime ? new Date(e.PlannedStartTime) : null;
  return (
    <div className="pd2-event-row">
      <div className="pd2-event-dot" />
      <div className="pd2-event-info">
        <strong style={{ fontSize: "0.82rem" }}>{e.EventType}</strong>
        <span className="muted" style={{ fontSize: "0.71rem" }}>
          {d ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}
        </span>
      </div>
      <Pill text={e.Criticality || e.Status} />
    </div>
  );
}

/* ── Alert row ───────────────────────────────────────────────── */
function AlertRow({ a }) {
  return (
    <div className="pd2-alert-row">
      <Pill text={a.Severity} />
      <span style={{ fontSize: "0.81rem", flex: 1 }}>{a.AlertType}</span>
      <span style={{ color: a.Acknowledged ? "var(--green, #4ade80)" : "#f87171" }}>
        {a.Acknowledged ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      </span>
    </div>
  );
}

/* ── Experiment row ──────────────────────────────────────────── */
function ExpRow({ e }) {
  return (
    <div className="pd2-exp-row">
      <Microscope size={13} style={{ color: "#a78bfa", flexShrink: 0 }} />
      <span style={{ fontSize: "0.81rem", flex: 1 }}>{e.Title || e.ExperimentName || `Exp #${e.ExperimentID}`}</span>
      <Pill text={e.Status} />
      {e.SuccessRating != null && (
        <span style={{ fontSize: "0.73rem", color: e.SuccessRating >= 80 ? "#4ade80" : "#fb923c", fontWeight: 700 }}>
          {e.SuccessRating}%
        </span>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function PersonDashboardPage() {
  const { user, personType } = useAuth();
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [summary,     setSummary]     = useState(null);
  const [missions,    setMissions]    = useState([]);
  const [spacecraft,  setSpacecraft]  = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [events,      setEvents]      = useState([]);

  const isAstronaut     = personType === "astronaut" || personType === "both";
  const isGroundControl = personType === "ground_control" || personType === "both";
  const isUnlinked      = !user?.person_id;

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [sum, mis, sc, exp, al, ev] = await Promise.all([
        axios.get(`${API_BASE}/me/summary`),
        axios.get(`${API_BASE}/me/missions`),
        axios.get(`${API_BASE}/me/spacecraft`),
        axios.get(`${API_BASE}/me/experiments`),
        axios.get(`${API_BASE}/me/alerts`),
        axios.get(`${API_BASE}/me/events`),
      ]);
      setSummary(sum.data.summary);
      setMissions(mis.data.data    || []);
      setSpacecraft(sc.data.data   || []);
      setExperiments(exp.data.data || []);
      setAlerts(al.data.data       || []);
      setEvents(ev.data.data       || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  /* ── Unlinked ── */
  if (isUnlinked) {
    return (
      <div className="page">
        <div className="pd-unlinked-card">
          <LinkIcon size={52} strokeWidth={1.2} className="pd-unlinked-icon" />
          <h3>Account Not Linked</h3>
          <p>Your user account is not linked to a Personnel record. Contact an administrator.</p>
          <Link to="/profile" className="auth-btn" style={{ marginTop: 16, display: "inline-flex", gap: 8 }}>
            <Shield size={15} /> View My Profile
          </Link>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="page">
        <div className="dash-error-card">
          <WifiOff size={48} strokeWidth={1.3} />
          <h3>Connection Error</h3>
          <p className="err">{error}</p>
          <button className="btn btn-secondary" onClick={fetchAll} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={44} className="spin" style={{ color: "#6366f1" }} />
          <p className="muted" style={{ marginTop: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const RoleIcon = isAstronaut ? UserCheck : isGroundControl ? Headset : Shield;
  const roleName = isAstronaut ? "Astronaut" : "Ground Control";

  return (
    <div className="pd2-page">

      {/* ── Hero header ── */}
      <div className="pd2-hero">
        <div className="pd2-hero-glow" />
        <div className="pd2-hero-left">
          <div className="pd2-hero-avatar">
            <RoleIcon size={24} strokeWidth={1.6} />
          </div>
          <div>
            <p className="pd2-hero-greeting">Welcome back,</p>
            <h2 className="pd2-hero-name">{user?.full_name || "Crew Member"}</h2>
            <span className="pd2-hero-role">{roleName}</span>
          </div>
        </div>
        <button className="pd2-refresh-btn" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stat orbs ── */}
      <div className="pd2-stats">
        {isAstronaut ? (
          <>
            <StatOrb icon={Rocket}        label="Missions"    value={summary?.missions}    hue="240" />
            <StatOrb icon={Plane}         label="Spacecraft"  value={summary?.spacecraft}  hue="185" />
            <StatOrb icon={Microscope}    label="Experiments" value={summary?.experiments} hue="270" />
            <StatOrb icon={AlertTriangle} label="Open Alerts" value={summary?.openAlerts}  hue="38"  />
          </>
        ) : (
          <>
            <StatOrb icon={Rocket}        label="Total Missions"  value={summary?.totalMissions}  hue="240" />
            <StatOrb icon={TrendingUp}    label="Active Missions" value={summary?.activeMissions} hue="185" />
            <StatOrb icon={AlertTriangle} label="Critical Alerts" value={summary?.criticalAlerts} hue="0"   />
            <StatOrb icon={Plane}         label="Spacecraft"      value={summary?.spacecraft}     hue="270" />
          </>
        )}
      </div>

      {/* ── Missions ── */}
      <GlassPanel icon={Rocket} title={isAstronaut ? "My Assigned Missions" : "All Missions"} accent="#6366f1" badge={missions.length}>
        {missions.length === 0
          ? <p className="pd2-empty">No missions assigned.</p>
          : missions.slice(0, 8).map((m) => (
              <MissionRow key={m.MissionID} m={m} role={isAstronaut ? (m.PrimaryResponsibility || m.AssignmentStatus) : null} />
            ))}
      </GlassPanel>

      {/* ── Two column ── */}
      <div className="pd2-grid-2">

        {/* Spacecraft */}
        <GlassPanel icon={Plane} title={isAstronaut ? "My Spacecraft" : "Spacecraft Status"} accent="#22d3ee" badge={spacecraft.length}>
          {spacecraft.length === 0
            ? <p className="pd2-empty">No spacecraft linked.</p>
            : spacecraft.slice(0, 6).map((s) => <ScCard key={s.SpacecraftID} s={s} />)}
        </GlassPanel>

        {/* Experiments */}
        <GlassPanel icon={Microscope} title="Experiments" accent="#a78bfa" badge={experiments.length}>
          {experiments.length === 0
            ? <p className="pd2-empty">No experiments found.</p>
            : experiments.slice(0, 6).map((e) => <ExpRow key={e.ExecutionID} e={e} />)}
        </GlassPanel>
      </div>

      {/* ── Two column ── */}
      <div className="pd2-grid-2">

        {/* Alerts */}
        <GlassPanel icon={AlertTriangle} title="Alerts" accent="#fb923c" badge={alerts.length}>
          {alerts.length === 0
            ? <p className="pd2-empty">✅ No alerts.</p>
            : alerts.slice(0, 6).map((a) => <AlertRow key={a.AlertID} a={a} />)}
        </GlassPanel>

        {/* Events */}
        <GlassPanel icon={CalendarDays} title="Scheduled Events" accent="#4ade80" badge={events.length}>
          {events.length === 0
            ? <p className="pd2-empty">No scheduled events.</p>
            : (
              <div className="pd2-timeline">
                {events.slice(0, 6).map((e) => <EventRow key={e.EventID} e={e} />)}
              </div>
            )}
        </GlassPanel>
      </div>

    </div>
  );
}
