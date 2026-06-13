import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { navItems } from "./config/nav";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute     from "./components/AdminRoute";
import EnhancedCrudPage from "./components/EnhancedCrudPage";
import Starfield from "./components/Starfield";
import {
  alertsCrud, equipmentCrud, eventsCrud,
  experimentExecutionsCrud, missionAssignmentsCrud,
  moduleIntegrationsCrud, spacecraftMissionsCrud,
} from "./config/entitySchemas";

/* Pages — regular user app */
import DashboardPage       from "./pages/DashboardPage";
import PersonDashboardPage from "./pages/PersonDashboardPage";
import PersonsPage         from "./pages/PersonsPage";
import AstronautsPage      from "./pages/AstronautsPage";
import GroundControlPage   from "./pages/GroundControlPage";
import MissionsPage        from "./pages/MissionsPage";
import SpacecraftPage      from "./pages/SpacecraftPage";
import StationsPage        from "./pages/StationsPage";
import ModulesPage         from "./pages/ModulesPage";
import ExperimentsPage     from "./pages/ExperimentsPage";
import TelemetryPage       from "./pages/TelemetryPage";
import LoginPage           from "./pages/LoginPage";
import RegisterPage        from "./pages/RegisterPage";
import ForgotPasswordPage  from "./pages/ForgotPasswordPage";
import ResetPasswordPage   from "./pages/ResetPasswordPage";
import ProfilePage         from "./pages/ProfilePage";

/* Admin pages */
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminLayout    from "./layouts/AdminLayout";

import "./App.css";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";

/* ── Role helpers ─────────────────────────────────────────────── */
const ROLE_HUE = {
  admin:          "0",
  astronaut:      "185",
  ground_control: "140",
  staff:          "265",
  operator:       "45",
};

/* ── User card at sidebar bottom ──────────────────────────────── */
function SidebarUserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const roleLabel = (user.role || user.role_name || "user").replace("_", " ");
  const hue = ROLE_HUE[user.role || user.role_name] || "215";

  return (
    <div className="sb2-user-wrap">
      <button className="sb2-user-btn" onClick={() => setOpen((v) => !v)}>
        {/* Avatar */}
        <div className="sb2-avatar" style={{
          background: `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${hue},80%,45%))`,
          boxShadow: `0 0 12px hsl(${hue},70%,50%,0.35)`,
        }}>
          {user.full_name?.charAt(0)?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="sb2-user-info">
          <span className="sb2-user-name">{user.full_name}</span>
          <span className="sb2-user-role" style={{ color: `hsl(${hue},70%,65%)` }}>
            {roleLabel}
          </span>
        </div>

        <ChevronDown size={14} style={{
          color: "rgba(255,255,255,0.4)",
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }} />
      </button>

      {open && (
        <div className="sb2-dropdown">
          <button className="sb2-dd-item" onClick={() => { navigate("/profile"); setOpen(false); }}>
            <User size={13} /> My Profile
          </button>
          <button className="sb2-dd-item sb2-dd-danger" onClick={() => { logout(); setOpen(false); }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Nav link ─────────────────────────────────────────────────── */
function NavLink({ item, isActive }) {
  return (
    <Link to={item.to} className={`sb2-nav-link ${isActive ? "sb2-nav-link--active" : ""}`}>
      <span className="sb2-nav-icon">{item.icon}</span>
      <span className="sb2-nav-label">{item.label}</span>
      {isActive && <span className="sb2-nav-pip" />}
    </Link>
  );
}

/* ── Main layout (sidebar + content) ────────────────────────── */
function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  /* Public routes don't show the sidebar */
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (publicPaths.includes(location.pathname)) return null;

  const adminOnlyPages = [
    "/persons", "/astronauts", "/ground-control",
    "/stations", "/modules", "/module-integrations",
    "/spacecraft-missions", "/equipment",
  ];

  const visibleItems = navItems.filter((item) =>
    isAdmin ? true : !adminOnlyPages.includes(item.to)
  );

  return (
    <div className="layout">
      <aside className="sb2-sidebar">

        {/* ── Brand ── */}
        <div className="sb2-brand">
          <div className="sb2-brand-logo">
            <div className="logo-planet" />
            <div className="logo-ring"   />
          </div>
          <div className="sb2-brand-text">
            <h1 className="sb2-brand-name">SMMS</h1>
            <span className="sb2-brand-sub">Space Mission Management</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="sb2-divider" />

        {/* ── Navigation ── */}
        <nav className="sb2-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div className="sb2-footer">
          {isAuthenticated ? (
            <SidebarUserMenu />
          ) : (
            <div className="footer-status">
              <span className="status-dot" /> Systems Online
            </div>
          )}
          <div className="sb2-version">SMMS v2.0 · {new Date().getFullYear()}</div>
        </div>
      </aside>

      <main>
        <AppRoutes />
      </main>
    </div>
  );
}

/* ── Route definitions ───────────────────────────────────────── */
function AppRoutes() {
  const { isAdmin, isAstronaut, isGroundCtrl } = useAuth();

  /* Role-aware dashboard */
  function SmartDashboard() {
    if (isAdmin)      return <DashboardPage />;
    if (isAstronaut || isGroundCtrl) return <PersonDashboardPage />;
    return <PersonDashboardPage />;
  }

  return (
    <Routes>
      {/* ── Smart dashboard ── */}
      <Route path="/" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />

      {/* ── Protected person routes ── */}
      <Route path="/persons"           element={<AdminRoute><PersonsPage /></AdminRoute>} />
      <Route path="/astronauts"        element={<AdminRoute><AstronautsPage /></AdminRoute>} />
      <Route path="/ground-control"    element={<AdminRoute><GroundControlPage /></AdminRoute>} />
      <Route path="/missions"          element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
      <Route path="/spacecraft"        element={<ProtectedRoute><SpacecraftPage /></ProtectedRoute>} />
      <Route path="/stations"          element={<AdminRoute><StationsPage /></AdminRoute>} />
      <Route path="/modules"           element={<AdminRoute><ModulesPage /></AdminRoute>} />
      <Route path="/experiments"       element={<ProtectedRoute><ExperimentsPage /></ProtectedRoute>} />
      <Route path="/telemetry"         element={<ProtectedRoute><TelemetryPage /></ProtectedRoute>} />
      <Route path="/alerts"            element={<ProtectedRoute><EnhancedCrudPage config={alertsCrud} /></ProtectedRoute>} />
      <Route path="/equipment"         element={<ProtectedRoute><EnhancedCrudPage config={equipmentCrud} /></ProtectedRoute>} />
      <Route path="/events"            element={<ProtectedRoute><EnhancedCrudPage config={eventsCrud} /></ProtectedRoute>} />
      <Route path="/mission-assignments"   element={<ProtectedRoute><EnhancedCrudPage config={missionAssignmentsCrud} /></ProtectedRoute>} />
      <Route path="/spacecraft-missions"   element={<ProtectedRoute><EnhancedCrudPage config={spacecraftMissionsCrud} /></ProtectedRoute>} />
      <Route path="/experiment-executions" element={<ProtectedRoute><EnhancedCrudPage config={experimentExecutionsCrud} /></ProtectedRoute>} />
      <Route path="/module-integrations"   element={<AdminRoute><EnhancedCrudPage config={moduleIntegrationsCrud} /></AdminRoute>} />

      {/* ── Profile ── */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* ── Public auth route (person login ONLY) ── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ── Root — wrap with providers, then decide layout ─────────── */
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Starfield />
        <PublicOrApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

function PublicOrApp() {
  const location    = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  /* ── Admin section (/admin/login + /admin/*) ── */
  if (isAdminPath) {
    return (
      <Routes>
        {/* public admin login page — completely separate from /login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* all other /admin/* routes → guarded by AdminRoute → AdminLayout */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />
      </Routes>
    );
  }

  /* ── Person login & registration ── */
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (publicPaths.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppLayout />;
}
