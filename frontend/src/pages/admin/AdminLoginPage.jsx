/**
 * AdminLoginPage.jsx — Dedicated administrator login portal
 * Visually distinct: dark crimson/amber theme with shield branding.
 * Uses adminLogin() from AuthContext which validates role === "admin".
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Loader2, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginPage() {
  const { adminLogin, isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const inputRef = useRef(null);

  /* Redirect if already logged in as admin */
  useEffect(() => {
    if (isAuthenticated && isAdmin) navigate("/admin", { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError("");
    setSubmitting(true);
    const result = await adminLogin(identifier.trim(), password, false);
    if (result.ok) {
      navigate("/admin", { replace: true });
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  }

  const busy = submitting || loading;

  return (
    <div className="admin-login-page">
      {/* Ambient glow orbs */}
      <div className="admin-orb admin-orb-1" aria-hidden />
      <div className="admin-orb admin-orb-2" aria-hidden />
      <div className="admin-orb admin-orb-3" aria-hidden />

      <div className="admin-login-card" role="main">
        {/* Brand header */}
        <div className="admin-login-brand">
          <div className="admin-login-icon-wrap" aria-hidden>
            <ShieldCheck size={36} strokeWidth={1.5} />
          </div>
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">Space Mission Management System</p>
        </div>



        {/* Error banner */}
        {error && (
          <div className="admin-login-error" role="alert">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          {/* Identifier */}
          <div className="admin-login-field">
            <label htmlFor="admin-identifier" className="admin-login-label">
              Administrator Username or Email
            </label>
            <input
              id="admin-identifier"
              ref={inputRef}
              type="text"
              autoComplete="username"
              className="admin-login-input"
              placeholder="admin or admin@smms.space"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              disabled={busy}
              required
            />
          </div>

          {/* Password */}
          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">
              Password
            </label>
            <div className="admin-login-input-wrap">
              <input
                id="admin-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className="admin-login-input admin-login-input-pw"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={busy}
                required
              />
              <button
                type="button"
                className="admin-login-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>



          {/* Submit */}
          <button
            type="submit"
            className="admin-login-btn"
            disabled={busy || !identifier || !password}
          >
            {busy ? (
              <><Loader2 size={17} className="spin" /> Authenticating…</>
            ) : (
              <><ShieldCheck size={17} /> Sign In as Administrator</>
            )}
          </button>
        </form>

        {/* Back link */}
        <p className="admin-login-footer">
          Not an administrator?{" "}
          <Link to="/login" className="admin-login-link">Go to User Login</Link>
        </p>

        {/* Security notice */}
        <div className="admin-login-security-notice">
          <Lock size={11} />
          <span>All admin actions are logged and audited.</span>
        </div>
      </div>
    </div>
  );
}
