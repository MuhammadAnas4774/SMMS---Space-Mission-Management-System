import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Key, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";

export default function ResetPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
    if (!token) {
      notifyError("Invalid or missing reset token.");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate, token, notifyError]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      notifyError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      notifyError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(token, password);
    if (result.ok) {
      setSuccess(true);
      notifySuccess(result.message);
    } else {
      notifyError(result.message);
    }
    setSubmitting(false);
  }

  if (!token) return null;

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" aria-hidden />
      <div className="auth-orb auth-orb-2" aria-hidden />
      <div className="auth-orb auth-orb-3" aria-hidden />

      <div className="auth-card" role="main">
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>
            <div className="auth-logo-planet" />
            <div className="auth-logo-ring"   />
            <div className="auth-logo-dot"    />
          </div>
          <h1 className="auth-title">SMMS</h1>
          <p className="auth-subtitle">Create New Password</p>
        </div>

        <div className="auth-divider">
          <span><ShieldCheck size={13} /> Secure Access Portal</span>
        </div>

        {success ? (
          <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "20px" }}>
            <CheckCircle2 size={48} color="#22c55e" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: "1.5" }}>
              Your password has been successfully reset.
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link to="/login" className="auth-btn" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="auth-password" className="auth-label">New Password</label>
              <div className="auth-input-wrap">
                <input
                  id="auth-password"
                  ref={inputRef}
                  type={showPw ? "text" : "password"}
                  className="auth-input auth-input-pw"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="auth-confirm" className="auth-label">Confirm New Password</label>
              <div className="auth-input-wrap">
                <input
                  id="auth-confirm"
                  type={showPw ? "text" : "password"}
                  className="auth-input auth-input-pw"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={submitting || !password || !confirmPassword}
              style={{ marginTop: "12px" }}
            >
              {submitting ? (
                <><Loader2 size={17} className="spin" /> Resetting…</>
              ) : (
                <><Key size={17} /> Reset Password</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
