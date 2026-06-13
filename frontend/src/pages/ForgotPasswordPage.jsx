import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";

export default function ForgotPasswordPage() {
  const { forgotPassword, isAuthenticated } = useAuth();
  const { notifyError } = useNotify();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [mockLink, setMockLink] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setSuccessMsg("");
    setMockLink("");
    
    const result = await forgotPassword(email.trim());
    if (result.ok) {
      setSuccessMsg(result.message);
      if (result.mockLink) {
        setMockLink(result.mockLink);
      }
    } else {
      notifyError(result.message);
    }
    setSubmitting(false);
  }

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
          <p className="auth-subtitle">Password Recovery</p>
        </div>

        <div className="auth-divider">
          <span><ShieldCheck size={13} /> Secure Access Portal</span>
        </div>

        {successMsg ? (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <CheckCircle2 size={48} color="#22c55e" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: "1.5", marginBottom: "15px" }}>
              {successMsg}
            </p>
            {mockLink && (
              <div style={{ 
                background: "rgba(255,255,255,0.05)", 
                border: "1px solid rgba(255,255,255,0.1)", 
                padding: "12px", 
                borderRadius: "8px",
                wordBreak: "break-all"
              }}>
                <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "8px", fontWeight: "bold" }}>
                  [Mock Email] Click the link below to reset your password:
                </p>
                <a href={mockLink} style={{ color: "#60a5fa", textDecoration: "underline", fontSize: "13px" }}>
                  {mockLink}
                </a>
              </div>
            )}
            <div style={{ marginTop: "24px" }}>
              <Link to="/login" className="auth-btn" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="auth-field">
              <label htmlFor="auth-email" className="auth-label">Email Address</label>
              <input
                id="auth-email"
                ref={inputRef}
                type="email"
                className="auth-input"
                placeholder="astronaut@smms.space"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={submitting || !email}
            >
              {submitting ? (
                <><Loader2 size={17} className="spin" /> Sending Link…</>
              ) : (
                <><Mail size={17} /> Send Reset Link</>
              )}
            </button>
          </form>
        )}

        {!successMsg && (
          <p className="auth-footer-text" style={{ marginTop: "24px" }}>
            <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
