/**
 * AdminRoute.jsx — Guards admin-only routes (/admin/*).
 * - Unauthenticated       → redirect to /admin/login
 * - Authenticated as person (not admin) → 403 with link back to /login
 * - Authenticated as admin → render children
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldX, Loader2 } from "lucide-react";

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12 }}>
        <Loader2 size={28} className="spin" style={{ color: "var(--admin-accent, #ef4444)" }} />
        <span style={{ color: "var(--muted)" }}>Verifying admin session…</span>
      </div>
    );
  }

  /* Not logged in at all → admin login page */
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  /* Logged in as a person (not admin) → access denied */
  if (!isAdmin) {
    const userRole = user?.role || user?.role_name || "unknown";
    return (
      <div className="admin-403-page">
        <div className="admin-403-card">
          <ShieldX size={64} strokeWidth={1.2} className="admin-403-icon" />
          <h2>403 — Access Forbidden</h2>
          <p>
            Your account (<strong>{userRole}</strong>) does not have admin privileges.
          </p>
          <p className="admin-403-hint">
            This portal is restricted to the system administrator only.
          </p>
          <a href="/login" className="admin-403-btn">← Return to User Portal</a>
        </div>
      </div>
    );
  }

  return children;
}
