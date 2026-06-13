/**
 * LoginPage.jsx — Futuristic glassmorphism login page
 * Features: credentials form, remember me, forgot password link,
 *           animated starfield, neon accents, toast errors
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const { notifySuccess, notifyError }      = useNotify();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  /* Redirect if already logged in */
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setSubmitting(true);
    const result = await login(identifier.trim(), password, false);
    if (result.ok) {
      notifySuccess(result.message || "Welcome back!");
      navigate("/", { replace: true });
    } else {
      notifyError(result.message);
    }
    setSubmitting(false);
  }

  const busy = submitting || loading;

  return (
    <div className="auth-page">
      {/* Ambient glow orbs */}
      <div className="auth-orb auth-orb-1" aria-hidden />
      <div className="auth-orb auth-orb-2" aria-hidden />
      <div className="auth-orb auth-orb-3" aria-hidden />

      <div className="auth-card" role="main">
        {/* Brand header */}
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>
            <div className="auth-logo-planet" />
            <div className="auth-logo-ring"   />
            <div className="auth-logo-dot"    />
          </div>
          <h1 className="auth-title">SMMS</h1>
          <p className="auth-subtitle">Space Mission Management System</p>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span><ShieldCheck size={13} /> Secure Access Portal</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Identifier field */}
          <div className="auth-field">
            <label htmlFor="auth-identifier" className="auth-label">
              Username or Email
            </label>
            <input
              id="auth-identifier"
              ref={inputRef}
              type="text"
              autoComplete="username"
              className="auth-input"
              placeholder="admin or admin@smms.space"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={busy}
              required
            />
          </div>

          {/* Password field */}
          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrap">
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className="auth-input auth-input-pw"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="auth-row" style={{ justifyContent: "flex-end" }}>
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="auth-btn"
            disabled={busy || !identifier || !password}
          >
            {busy ? (
              <><Loader2 size={17} className="spin" /> Authenticating…</>
            ) : (
              <><LogIn size={17} /> Sign In</>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="auth-link">Create account</Link>
        </p>


        {/* Link to Admin Portal */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link to="/admin/login" style={{ color: "#ef4444", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} /> Go to Secure Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
