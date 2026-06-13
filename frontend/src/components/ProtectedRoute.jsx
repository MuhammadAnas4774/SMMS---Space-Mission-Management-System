/**
 * ProtectedRoute.jsx — Redirects unauthenticated users to /login.
 * Also blocks admin from entering the person app (redirect to /admin).
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12 }}>
        <Loader2 size={28} className="spin" style={{ color: "var(--cyan)" }} />
        <span style={{ color: "var(--muted)" }}>Verifying session…</span>
      </div>
    );
  }

  /* Not logged in → redirect preserving the attempted URL */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* Admin must use /admin/* — redirect away from person app */
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  /* Optional role check */
  const userRole = user?.role || user?.role_name;
  if (roles && !roles.includes(userRole)) {
    return (
      <div className="page">
        <div className="dash-error-card">
          <Shield size={52} strokeWidth={1.5} />
          <h3>Access Denied</h3>
          <p className="muted">
            Your role (<strong>{userRole}</strong>) does not have permission to access this page.
          </p>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            Required: {roles.join(" or ")}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
