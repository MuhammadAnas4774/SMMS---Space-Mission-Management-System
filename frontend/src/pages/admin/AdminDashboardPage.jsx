/**
 * AdminDashboardPage.jsx — Premium admin overview with red-accent pd2 panels
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Users, Rocket, AlertTriangle, Activity, ShieldCheck,
  ClipboardList, Plane, Microscope, Wrench, Building2,
  TrendingUp, RefreshCw, Loader2, CheckCircle2, XCircle,
  UserCog, BarChart3, Zap, WifiOff,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const fmt = (n) => Number(n ?? 0).toLocaleString();

/* ── Stat orb — same as pd2 but red-spectrum hues ── */
function StatOrb({ icon: Icon, label, value, hue, to }) {
  const inner = (
    <div className="pd2-stat" style={{ "--orb-hue": hue }}>
      <div className="pd2-stat-glow" />
      <div className="pd2-stat-icon"><Icon size={22} strokeWidth={1.6} /></div>
      <div className="pd2-stat-body">
        <span className="pd2-stat-value">{value ?? "—"}</span>
        <span className="pd2-stat-label">{label}</span>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

/* ── Glass section panel ── */
function Panel({ icon: Icon, title, accent = "#ef4444", badge, action, children }) {
  return (
    <div className="pd2-panel" style={{ "--panel-accent": accent }}>
      <div className="pd2-panel-header">
        <div className="pd2-panel-icon-wrap"><Icon size={15} strokeWidth={1.8} /></div>
        <h3 className="pd2-panel-title">{title}</h3>
        {badge != null && <span className="pd2-panel-badge">{badge}</span>}
        {action && <span style={{ marginLeft: "auto", fontSize: "0.75rem" }}>{action}</span>}
        <div className="pd2-panel-line" />
      </div>
      <div className="pd2-panel-body">{children}</div>
    </div>
  );
}

/* ── Severity pill ── */
function SevPill({ sev }) {
  const colors = {
    critical: "#f87171", high: "#fb923c", medium: "#fbbf24",
    low: "#4ade80", new: "#22d3ee",
  };
  const c = colors[(sev || "").toLowerCase()] || "#94a3b8";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999,
      fontSize: "0.68rem", fontWeight: 700,
      background: `${c}18`, color: c, border: `1px solid ${c}40`,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />
      {sev}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [audit,   setAudit]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [clock,   setClock]   = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [summaryRes, auditRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/summary`),
        axios.get(`${API_BASE}/auth/audit-log`, { params: { limit: 10 } }),
      ]);
      setData(summaryRes.data);
      setAudit(auditRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tc          = data?.tableCounts    || {};
  const ms          = data?.missionStatus  || [];
  const alerts      = data?.recentAlerts   || [];
  const userStats   = data?.userStats      || {};
  const totalMissions  = ms.reduce((s, r) => s + r.count, 0);
  const activeMissions = ms.find((r) => r.status === "Active")?.count ?? 0;
  const unackedAlerts  = alerts.filter((a) => !a.Acknowledged).length;

  if (loading && !data) {
    return (
      <div className="pd2-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={44} className="spin" style={{ color: "#a5b4fc" }} />
          <p className="muted" style={{ marginTop: 14 }}>Loading system overview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pd2-page">

      {/* ── Hero header ── */}
      <div className="pd2-hero" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}>
        <div className="pd2-hero-glow" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        <div className="pd2-hero-left">
          <div className="pd2-hero-avatar" style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
            border: "1px solid rgba(99,102,241,0.4)",
            boxShadow: "0 0 20px rgba(99,102,241,0.2)",
            color: "#a5b4fc",
          }}>
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="pd2-hero-greeting">System Overview</p>
            <h2 className="pd2-hero-name">Welcome, {user?.full_name}</h2>
            <span className="pd2-hero-role" style={{
              background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
              borderColor: "rgba(99,102,241,0.35)",
            }}>
              <ShieldCheck size={10} /> Administrator · {clock.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button className="pd2-refresh-btn" onClick={loadData} disabled={loading}>
          <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
          color: "#a5b4fc", padding: "12px 16px", borderRadius: 12, fontSize: "0.84rem",
        }}>
          <WifiOff size={15} /> {error}
        </div>
      )}

      {/* ── Stat Orbs ── */}
      <div className="pd2-stats">
        <StatOrb icon={Users}         label="Total Persons"   value={fmt(userStats.total_users)}  hue="0"   to="/admin/persons" />
        <StatOrb icon={Rocket}        label="Total Missions"  value={fmt(totalMissions)}          hue="25"  to="/admin/missions" />
        <StatOrb icon={AlertTriangle} label="Unacked Alerts"  value={fmt(unackedAlerts)}          hue="0"   to="/admin/alerts" />
        <StatOrb icon={Activity}      label="Today's Actions" value={fmt(userStats.today_actions)} hue="270" />
        <StatOrb icon={Plane}         label="Spacecraft"      value={fmt(tc.SPACECRAFT)}          hue="185" to="/admin/spacecraft" />
        <StatOrb icon={Microscope}    label="Experiments"     value={fmt(tc.EXPERIMENT)}          hue="45"  to="/admin/experiments" />
        <StatOrb icon={Wrench}        label="Equipment"       value={fmt(tc.EQUIPMENT)}           hue="215" to="/admin/equipment" />
        <StatOrb icon={Building2}     label="Space Stations"  value={fmt(tc.SPACE_STATION)}       hue="160" to="/admin/stations" />
      </div>

      {/* ── Entity counts ── */}
      <Panel icon={BarChart3} title="Entity Record Counts" accent="#818cf8">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(tc).sort(([a], [b]) => a.localeCompare(b)).map(([table, count]) => (
            <div key={table} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "6px 12px",
            }}>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", textTransform: "uppercase" }}>{table}</span>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#a5b4fc" }}>{fmt(count)}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Two column: Mission + Alerts ── */}
      <div className="pd2-grid-2">

        {/* Mission Status */}
        <Panel
          icon={Rocket} title="Mission Status" accent="#fb923c"
          action={<Link to="/admin/missions" style={{ color: "#fb923c", textDecoration: "none", fontSize: "0.75rem" }}>View all →</Link>}
        >
          {ms.length === 0
            ? <p className="pd2-empty">No mission data.</p>
            : ms.map((r) => {
                const colors = { Active: "#4ade80", Planned: "#a78bfa", Completed: "#22d3ee", Aborted: "#f87171" };
                const c = colors[r.status] || "#94a3b8";
                const pct = totalMissions ? (r.count / totalMissions) * 100 : 0;
                return (
                  <div key={r.status} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{
                      width: 80, flexShrink: 0, fontSize: "0.7rem", fontWeight: 700,
                      padding: "3px 8px", borderRadius: 999, textAlign: "center",
                      background: `${c}20`, color: c, border: `1px solid ${c}40`,
                    }}>{r.status}</span>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0", width: 24, textAlign: "right" }}>{r.count}</span>
                  </div>
                );
              })}
        </Panel>

        {/* Recent Alerts */}
        <Panel
          icon={AlertTriangle} title="Recent Alerts" accent="#ef4444"
          action={<Link to="/admin/alerts" style={{ color: "#ef4444", textDecoration: "none", fontSize: "0.75rem" }}>Manage →</Link>}
        >
          {alerts.length === 0
            ? <p className="pd2-empty">✅ All systems nominal.</p>
            : alerts.slice(0, 8).map((a) => (
                <div key={a.AlertID} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <SevPill sev={a.Severity} />
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.AlertType}</span>
                  <span style={{ color: a.Acknowledged ? "#4ade80" : "#f87171", flexShrink: 0 }}>
                    {a.Acknowledged ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                    {a.Message?.slice(0, 30)}{a.Message?.length > 30 ? "…" : ""}
                  </span>
                </div>
              ))}
        </Panel>
      </div>

      {/* ── Audit Log ── */}
      <Panel icon={ClipboardList} title="Recent Audit Log" accent="#a78bfa"
        action={<Link to="/admin/persons" style={{ color: "#a78bfa", textDecoration: "none", fontSize: "0.75rem" }}>Full log →</Link>}
        badge={audit.length}
      >
        <div style={{ margin: "0 -20px" }}>
          <div className="table-wrap" style={{ background: "transparent", border: "none", margin: 0 }}>
            <table className="data-table" style={{ background: "transparent" }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)" }}>No audit entries.</td></tr>
                )}
                {audit.map((row) => (
                  <tr key={row.log_id}>
                    <td className="muted" style={{ fontSize: "0.73rem" }}>{new Date(row.created_at).toLocaleString()}</td>
                    <td><strong style={{ color: "#a5b4fc" }}>@{row.username || "—"}</strong></td>
                    <td><span style={{ fontFamily: "monospace", fontSize: "0.72rem", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>{row.action}</span></td>
                    <td className="muted" style={{ fontSize: "0.75rem" }}>{row.table_name || "—"}</td>
                    <td><span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{row.record_id || "—"}</span></td>
                    <td>
                      <span style={{ color: row.status === "success" ? "#4ade80" : "#f87171", fontSize: "0.75rem", fontWeight: 700 }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* ── Quick Actions ── */}
      <Panel icon={Zap} title="Quick Actions" accent="#818cf8">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { to: "/admin/persons",     icon: UserCog,       label: "Manage Persons"   },
            { to: "/admin/missions",    icon: Rocket,        label: "View Missions"    },
            { to: "/admin/alerts",      icon: AlertTriangle, label: "Handle Alerts"    },
            { to: "/admin/telemetry",   icon: Activity,      label: "Check Telemetry"  },
            { to: "/admin/experiments", icon: Microscope,    label: "Research Status"  },
            { to: "/admin/equipment",   icon: Wrench,        label: "Equipment"        },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={label} to={to} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
              color: "#a5b4fc", padding: "10px 16px", borderRadius: 10,
              fontSize: "0.82rem", fontWeight: 600, textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
            >
              <Icon size={18} strokeWidth={1.6} /> {label}
            </Link>
          ))}
        </div>
      </Panel>

    </div>
  );
}
