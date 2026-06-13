/**
 * AdminLayout.jsx — Premium red-accent admin shell matching the person panel design
 */
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, UserCheck, Headset, Rocket, Plane,
  Building2, Box, Microscope, Activity, AlertTriangle, Wrench,
  CalendarDays, ClipboardList, Sparkles, FlaskConical, Link2,
  LogOut, ShieldCheck, Settings, Shield, ChevronDown, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/Starfield";

/* ── page imports ─────────────────────────────────────────────── */
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import PersonsPage        from "../pages/PersonsPage";
import AstronautsPage     from "../pages/AstronautsPage";
import GroundControlPage  from "../pages/GroundControlPage";
import MissionsPage       from "../pages/MissionsPage";
import SpacecraftPage     from "../pages/SpacecraftPage";
import StationsPage       from "../pages/StationsPage";
import ModulesPage        from "../pages/ModulesPage";
import ExperimentsPage    from "../pages/ExperimentsPage";
import TelemetryPage      from "../pages/TelemetryPage";
import ProfilePage        from "../pages/ProfilePage";
import EnhancedCrudPage   from "../components/EnhancedCrudPage";
import {
  alertsCrud, equipmentCrud, eventsCrud,
  experimentExecutionsCrud, missionAssignmentsCrud,
  moduleIntegrationsCrud, spacecraftMissionsCrud,
} from "../config/entitySchemas";

/* ── Admin nav items ──────────────────────────────────────────── */
const adminNav = [
  { to: "/admin",                      label: "Dashboard",           icon: <LayoutDashboard size={19} />, exact: true },
  { divider: "Personnel" },
  { to: "/admin/persons",              label: "Persons",             icon: <Users size={19} /> },
  { to: "/admin/astronauts",           label: "Astronauts",          icon: <UserCheck size={19} /> },
  { to: "/admin/ground-control",       label: "Ground Control",      icon: <Headset size={19} /> },
  { divider: "Missions" },
  { to: "/admin/missions",             label: "Missions",            icon: <Rocket size={19} /> },
  { to: "/admin/mission-assignments",  label: "Assignments",         icon: <ClipboardList size={19} /> },
  { to: "/admin/events",               label: "Scheduled Events",    icon: <CalendarDays size={19} /> },
  { divider: "Space Assets" },
  { to: "/admin/spacecraft",           label: "Spacecraft",          icon: <Plane size={19} /> },
  { to: "/admin/spacecraft-missions",  label: "Spacecraft Missions", icon: <Sparkles size={19} /> },
  { to: "/admin/stations",             label: "Space Stations",      icon: <Building2 size={19} /> },
  { to: "/admin/modules",              label: "Modules",             icon: <Box size={19} /> },
  { divider: "Research" },
  { to: "/admin/experiments",          label: "Experiments",         icon: <Microscope size={19} /> },
  { to: "/admin/experiment-executions",label: "Exp. Executions",     icon: <FlaskConical size={19} /> },
  { to: "/admin/equipment",            label: "Equipment",           icon: <Wrench size={19} /> },
  { to: "/admin/module-integrations",  label: "Module Integrations", icon: <Link2 size={19} /> },
  { divider: "Monitoring" },
  { to: "/admin/telemetry",            label: "Telemetry",           icon: <Activity size={19} /> },
  { to: "/admin/alerts",               label: "Alerts",              icon: <AlertTriangle size={19} /> },
];

/* ── Admin user card ──────────────────────────────────────────── */
function AdminUserMenu({ collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="asb-user-wrap">
      <button className="asb-user-btn" onClick={() => setOpen((v) => !v)}>
        <div className="asb-avatar">
          {user.full_name?.charAt(0)?.toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="asb-user-info">
              <span className="asb-user-name">{user.full_name}</span>
              <span className="asb-user-role">
                <ShieldCheck size={9} /> {user.role_name}
              </span>
            </div>
            <ChevronDown size={13} style={{
              color: "rgba(255,255,255,0.4)",
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }} />
          </>
        )}
      </button>

      {open && (
        <div className="asb-dropdown">
          <button className="asb-dd-item" onClick={() => { navigate("/admin"); setOpen(false); }}>
            <Settings size={13} /> Admin Dashboard
          </button>
          <button className="asb-dd-item" onClick={() => { navigate("/"); setOpen(false); }}>
            <Shield size={13} /> Switch to User App
          </button>
          <button className="asb-dd-item asb-dd-danger" onClick={() => { logout(); navigate("/admin/login"); setOpen(false); }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Nav link ─────────────────────────────────────────────────── */
function AdminNavLink({ item, isActive, collapsed }) {
  return (
    <Link
      to={item.to}
      className={`asb-nav-link ${isActive ? "asb-nav-link--active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="asb-nav-icon">{item.icon}</span>
      {!collapsed && <span className="asb-nav-label">{item.label}</span>}
      {isActive && <span className="asb-nav-pip" />}
    </Link>
  );
}

/* ── Main Admin Layout ────────────────────────────────────────── */
export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(item) {
    if (item.exact) return location.pathname === "/admin" || location.pathname === "/admin/";
    return location.pathname.startsWith(item.to);
  }

  return (
    <div className={`admin-layout ${collapsed ? "admin-layout-collapsed" : ""}`}>
      <Starfield />

      {/* ── Admin Sidebar ── */}
      <aside className={`asb-sidebar ${collapsed ? "asb-sidebar--collapsed" : ""}`}>

        {/* Brand */}
        <div className="asb-brand">
          <div className="asb-brand-logo">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="asb-brand-text">
              <h1 className="asb-brand-name">SMMS Admin</h1>
              <span className="asb-brand-sub">Mission Control</span>
            </div>
          )}
          <button
            className="asb-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={14} /> : <X size={14} />}
          </button>
        </div>

        {/* Divider */}
        <div className="asb-divider" />

        {/* Nav */}
        <nav className="asb-nav">
          {adminNav.map((item, i) => {
            if (item.divider) {
              return collapsed ? (
                <div key={i} className="asb-section-dot" />
              ) : (
                <div key={i} className="asb-section-label">{item.divider}</div>
              );
            }
            return (
              <AdminNavLink
                key={item.to}
                item={item}
                isActive={isActive(item)}
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div className="asb-footer">
          <AdminUserMenu collapsed={collapsed} />
          {!collapsed && (
            <div className="asb-version">SMMS Admin v2.0</div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        <Routes>
          <Route path="/"                      element={<AdminDashboardPage />} />
          <Route path="/persons"               element={<PersonsPage />} />
          <Route path="/astronauts"            element={<AstronautsPage />} />
          <Route path="/ground-control"        element={<GroundControlPage />} />
          <Route path="/missions"              element={<MissionsPage />} />
          <Route path="/spacecraft"            element={<SpacecraftPage />} />
          <Route path="/stations"              element={<StationsPage />} />
          <Route path="/modules"               element={<ModulesPage />} />
          <Route path="/experiments"           element={<ExperimentsPage />} />
          <Route path="/telemetry"             element={<TelemetryPage />} />
          <Route path="/alerts"                element={<EnhancedCrudPage config={alertsCrud} />} />
          <Route path="/equipment"             element={<EnhancedCrudPage config={equipmentCrud} />} />
          <Route path="/events"                element={<EnhancedCrudPage config={eventsCrud} />} />
          <Route path="/mission-assignments"   element={<EnhancedCrudPage config={missionAssignmentsCrud} />} />
          <Route path="/spacecraft-missions"   element={<EnhancedCrudPage config={spacecraftMissionsCrud} />} />
          <Route path="/experiment-executions" element={<EnhancedCrudPage config={experimentExecutionsCrud} />} />
          <Route path="/module-integrations"   element={<EnhancedCrudPage config={moduleIntegrationsCrud} />} />
          <Route path="/profile"               element={<ProfilePage />} />
          <Route path="*"                      element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
