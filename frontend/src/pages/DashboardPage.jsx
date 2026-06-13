import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  Circle,
  CircleCheck,
  Database,
  FileStack,
  Rocket,
  Satellite,
  WifiOff,
  X,
} from "lucide-react";
import { API_BASE } from "../config/api";
import { MissionStatusChart, EntityBarChart, TelemetryLineChart } from "../components/Charts";
import OrbitRing from "../components/OrbitRing";
import SystemOverviewCard from "../components/SystemOverviewCard";

const iconStroke = 1.75;

/** PRD §7.2 Dashboard — summary counts, mission status, recent alerts, charts */
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    axios
      .get(`${API_BASE}/dashboard/summary`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, []);

  // Live mission clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (error)
    return (
      <div className="page">
        <div className="dash-error-card">
          <span className="dash-error-icon" aria-hidden>
            <WifiOff size={52} strokeWidth={iconStroke} />
          </span>
          <h3>Connection Error</h3>
          <p className="err">{error}</p>
          <p className="muted">Make sure the backend server is running.</p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="page">
        <div className="dash-loading">
          <div className="orbit-loader">
            <OrbitRing size={100} />
          </div>
          <p>Establishing uplink to mission control…</p>
        </div>
      </div>
    );

  const entries = Object.entries(data.tableCounts || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const totalRows = entries.reduce((sum, [, c]) => sum + c, 0);
  const missionCount = (data.missionStatus || []).reduce((s, r) => s + r.count, 0);

  return (
    <div className="page dashboard">
      <header className="dash-page-heading">
        <h2>Mission Control Dashboard</h2>
        <p className="muted dash-page-tagline">
          Real-time overview of space operations, mission status, and system health
        </p>
      </header>
      <SystemOverviewCard clock={clock} />

      {/* ─── Stat cards ─── */}
      <div className="dash-stat-strip">
        <div className="dash-stat-chip stat-glow-indigo">
          <span className="dash-stat-icon" aria-hidden>
            <Database size={22} strokeWidth={iconStroke} />
          </span>
          <span className="dash-stat-value">{entries.length}</span>
          <span className="dash-stat-label">Database Tables</span>
        </div>
        <div className="dash-stat-chip stat-glow-cyan">
          <span className="dash-stat-icon" aria-hidden>
            <FileStack size={22} strokeWidth={iconStroke} />
          </span>
          <span className="dash-stat-value">{totalRows.toLocaleString()}</span>
          <span className="dash-stat-label">Total Records</span>
        </div>
        <div className="dash-stat-chip stat-glow-emerald">
          <span className="dash-stat-icon" aria-hidden>
            <Rocket size={22} strokeWidth={iconStroke} />
          </span>
          <span className="dash-stat-value">{missionCount}</span>
          <span className="dash-stat-label">Active Missions</span>
        </div>
        <div className="dash-stat-chip stat-glow-amber">
          <span className="dash-stat-icon" aria-hidden>
            <AlertTriangle size={22} strokeWidth={iconStroke} />
          </span>
          <span className="dash-stat-value">{(data.recentAlerts || []).length}</span>
          <span className="dash-stat-label">Recent Alerts</span>
        </div>
      </div>

      {/* ─── Charts Row ─── */}
      <section className="dashboard-grid">
        <div className="card card-3d">
          <div className="card-header">
            <span className="card-icon" aria-hidden>
              <BarChart3 size={20} strokeWidth={iconStroke} />
            </span>
            <h3>Mission Status Breakdown</h3>
          </div>
          {(data.missionStatus || []).length > 0 ? (
            <MissionStatusChart missionStatus={data.missionStatus} />
          ) : (
            <div className="empty-chart-state">
              <span className="empty-chart-state-icon" aria-hidden>
                <Satellite size={44} strokeWidth={iconStroke} />
              </span>
              <p>No mission data yet</p>
            </div>
          )}
          <Link to="/missions">View all missions →</Link>
        </div>

        <div className="card card-3d">
          <div className="card-header">
            <span className="card-icon" aria-hidden>
              <BarChart3 size={20} strokeWidth={iconStroke} />
            </span>
            <h3>Entity Distribution (Top 12)</h3>
          </div>
          <EntityBarChart tableCounts={data.tableCounts} />
        </div>

        <div className="card card-3d span-2">
          <div className="card-header">
            <span className="card-icon" aria-hidden>
              <Activity size={20} strokeWidth={iconStroke} />
            </span>
            <h3>Activity Telemetry</h3>
            <span className="live-badge">
              <Circle size={8} fill="currentColor" stroke="none" aria-hidden />
              LIVE
            </span>
          </div>
          <TelemetryLineChart
            alertCount={(data.recentAlerts || []).length}
            missionCount={missionCount}
          />
        </div>
      </section>

      {/* ─── Data Row ─── */}
      <section className="dashboard-grid" style={{ marginTop: 20 }}>


        <div className="card card-3d span-2 dash-alerts-card">
          <div className="card-header">
            <span className="card-icon" aria-hidden>
              <AlertTriangle size={20} strokeWidth={iconStroke} />
            </span>
            <h3>Recent Alerts</h3>
            <Link to="/alerts" className="card-header-link">
              Manage all →
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>When</th>
                  <th>Ack</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentAlerts || []).map((a) => (
                  <tr key={a.AlertID}>
                    <td><span className="id-badge">{a.AlertID}</span></td>
                    <td>{a.AlertType}</td>
                    <td>
                      <span className={`severity-badge severity-${(a.Severity || "").toLowerCase()}`}>
                        {a.Severity}
                      </span>
                    </td>
                    <td>{String(a.Timestamp ?? "")}</td>
                    <td>
                      <span className={a.Acknowledged ? "ack-yes" : "ack-no"}>
                        {a.Acknowledged ? (
                          <>
                            <Check size={14} strokeWidth={2.5} aria-hidden /> Yes
                          </>
                        ) : (
                          <>
                            <X size={14} strokeWidth={2.5} aria-hidden /> No
                          </>
                        )}
                      </span>
                    </td>
                    <td className="td-msg">{a.Message}</td>
                  </tr>
                ))}
                {!data.recentAlerts?.length && (
                  <tr>
                    <td colSpan={6} className="dash-alerts-empty-cell">
                      <span className="dash-alerts-nominal">
                        <CircleCheck size={18} strokeWidth={iconStroke} aria-hidden />
                        All systems nominal — no alerts
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
