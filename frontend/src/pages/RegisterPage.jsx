/**
 * RegisterPage.jsx — Full person registration form
 * Collects all PERSON fields: name, username, email, role, DOB, gender, nationality, contact, password
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, UserPlus, Loader2,
  CheckCircle2, XCircle, Rocket, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";

function PasswordStrengthBar({ password }) {
  const checks = [
    { label: "8+ characters",    pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number",           pass: /[0-9]/.test(password) },
    { label: "Special char",     pass: /[!@#$%^&*]/.test(password) },
  ];
  const score  = checks.filter((c) => c.pass).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4"];
  if (!password) return null;
  return (
    <div className="pw-strength">
      <div className="pw-strength-bar">
        {[1,2,3,4].map((n) => (
          <div key={n} className="pw-strength-seg"
            style={{ background: n <= score ? colors[score] : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <span className="pw-strength-label" style={{ color: colors[score] }}>{labels[score]}</span>
      <ul className="pw-strength-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.pass ? "pw-check-pass" : "pw-check-fail"}>
            {c.pass ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const NATIONALITIES = [
  "Afghan","Albanian","Algerian","American","Argentinian","Australian","Austrian",
  "Bangladeshi","Belgian","Brazilian","British","Canadian","Chilean","Chinese",
  "Colombian","Croatian","Czech","Danish","Dutch","Egyptian","Ethiopian",
  "Finnish","French","German","Greek","Hungarian","Indian","Indonesian",
  "Iranian","Iraqi","Irish","Israeli","Italian","Japanese","Jordanian",
  "Kenyan","Korean","Malaysian","Mexican","Moroccan","Nigerian","Norwegian",
  "Pakistani","Peruvian","Philippine","Polish","Portuguese","Romanian","Russian",
  "Saudi","Serbian","Singaporean","South African","Spanish","Swedish","Swiss",
  "Syrian","Thai","Turkish","Ukrainian","Venezuelan","Vietnamese","Other"
];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { notifySuccess, notifyError } = useNotify();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "", last_name: "", username: "", email: "",
    role: "", date_of_birth: "", gender: "", nationality: "",
    contact_info: "", password: "", confirm: "",
  });
  const [showPw,     setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    let v = e.target.value;
    if (["first_name", "last_name"].includes(key)) v = v.replace(/\d/g, "");
    if (key === "contact_info") v = v.replace(/[^\d\+\-\s\(\)]/g, "");
    setForm((f) => ({ ...f, [key]: v }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { notifyError("Passwords do not match."); return; }
    if (!form.role)       { notifyError("Please select a role."); return; }
    if (!form.gender)     { notifyError("Please select a gender."); return; }
    if (!form.nationality){ notifyError("Please select a nationality."); return; }

    setSubmitting(true);
    const result = await register({
      first_name:   form.first_name.trim(),
      last_name:    form.last_name.trim(),
      username:     form.username.trim(),
      email:        form.email.trim(),
      role:         form.role,
      date_of_birth: form.date_of_birth,
      gender:       form.gender,
      nationality:  form.nationality,
      contact_info: form.contact_info.trim() || undefined,
      password:     form.password,
    });
    if (result.ok) {
      notifySuccess(result.message);
      navigate("/login", { replace: true });
    } else {
      notifyError(result.message);
    }
    setSubmitting(false);
  }

  const busy = submitting || loading;
  const canSubmit = form.first_name && form.last_name && form.username && form.email &&
                    form.role && form.date_of_birth && form.gender && form.nationality &&
                    form.password && form.confirm;

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" aria-hidden />
      <div className="auth-orb auth-orb-2" aria-hidden />
      <div className="auth-orb auth-orb-3" aria-hidden />

      <div className="auth-card auth-card-wide" role="main">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>
            <div className="auth-logo-planet" />
            <div className="auth-logo-ring" />
            <div className="auth-logo-dot" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the SMMS mission team</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form auth-form-grid" noValidate>

          {/* ── Personal Info ── */}
          <div className="auth-section-label auth-field-full">Personal Information</div>

          <div className="auth-field">
            <label htmlFor="reg-fname" className="auth-label">First Name <span className="auth-required">*</span></label>
            <input id="reg-fname" type="text" className="auth-input" placeholder="John"
              value={form.first_name} onChange={set("first_name")} disabled={busy} required />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-lname" className="auth-label">Last Name <span className="auth-required">*</span></label>
            <input id="reg-lname" type="text" className="auth-input" placeholder="Smith"
              value={form.last_name} onChange={set("last_name")} disabled={busy} required />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-dob" className="auth-label">Date of Birth <span className="auth-required">*</span></label>
            <input id="reg-dob" type="date" className="auth-input"
              max={new Date().toISOString().split("T")[0]}
              value={form.date_of_birth} onChange={set("date_of_birth")} disabled={busy} required />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-gender" className="auth-label">Gender <span className="auth-required">*</span></label>
            <select id="reg-gender" className="auth-input auth-select"
              value={form.gender} onChange={set("gender")} disabled={busy} required>
              <option value="">— Select —</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="reg-nationality" className="auth-label">Nationality <span className="auth-required">*</span></label>
            <select id="reg-nationality" className="auth-input auth-select"
              value={form.nationality} onChange={set("nationality")} disabled={busy} required>
              <option value="">— Select nationality —</option>
              {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* ── Mission Role ── */}
          <div className="auth-section-label auth-field-full">Mission Role</div>

          <div className="auth-field auth-field-full">
            <label className="auth-label">Role <span className="auth-required">*</span></label>
            <div className="auth-role-grid">
              <label className={`auth-role-card ${form.role === "astronaut" ? "auth-role-selected" : ""}`}>
                <input type="radio" name="role" value="astronaut"
                  checked={form.role === "astronaut"} onChange={set("role")} disabled={busy} />
                <Rocket size={22} />
                <span className="auth-role-title">Astronaut</span>
                <span className="auth-role-desc">Flight crew member, EVA specialist</span>
              </label>
              <label className={`auth-role-card ${form.role === "ground_control" ? "auth-role-selected" : ""}`}>
                <input type="radio" name="role" value="ground_control"
                  checked={form.role === "ground_control"} onChange={set("role")} disabled={busy} />
                <ShieldCheck size={22} />
                <span className="auth-role-title">Ground Control</span>
                <span className="auth-role-desc">Mission operations, flight director</span>
              </label>
            </div>
          </div>

          {/* ── Account Info ── */}
          <div className="auth-section-label auth-field-full">Account Credentials</div>

          <div className="auth-field">
            <label htmlFor="reg-uname" className="auth-label">Username <span className="auth-required">*</span></label>
            <input id="reg-uname" type="text" className="auth-input" placeholder="jsmith"
              autoComplete="username"
              value={form.username} onChange={set("username")} disabled={busy} required />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">Email <span className="auth-required">*</span></label>
            <input id="reg-email" type="email" className="auth-input" placeholder="jsmith@smms.space"
              autoComplete="email"
              value={form.email} onChange={set("email")} disabled={busy} required />
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="reg-contact" className="auth-label">
              Contact / Phone <span className="auth-optional">(optional)</span>
            </label>
            <input id="reg-contact" type="tel" className="auth-input" placeholder="+1 555 000 0000"
              value={form.contact_info} onChange={set("contact_info")} disabled={busy} />
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="reg-pw" className="auth-label">Password <span className="auth-required">*</span></label>
            <div className="auth-input-wrap">
              <input id="reg-pw" type={showPw ? "text" : "password"}
                className="auth-input auth-input-pw" placeholder="••••••••"
                autoComplete="new-password"
                value={form.password} onChange={set("password")} disabled={busy} required />
              <button type="button" className="auth-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthBar password={form.password} />
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="reg-confirm" className="auth-label">Confirm Password <span className="auth-required">*</span></label>
            <input id="reg-confirm" type={showPw ? "text" : "password"}
              className={`auth-input ${form.confirm && form.confirm !== form.password ? "auth-input-error" : ""}`}
              placeholder="••••••••" autoComplete="new-password"
              value={form.confirm} onChange={set("confirm")} disabled={busy} required />
            {form.confirm && form.confirm !== form.password && (
              <span className="auth-field-error">Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="auth-btn auth-field-full" disabled={busy || !canSubmit}>
            {busy
              ? <><Loader2 size={17} className="spin" /> Creating account…</>
              : <><UserPlus size={17} /> Create Account</>}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
