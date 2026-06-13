/**
 * ProfilePage.jsx — Premium redesign with pd2 glassmorphism system
 */
import { useEffect, useState } from "react";
import {
  User, Mail, Phone, Shield, Calendar, Clock,
  Edit3, Save, X, KeyRound, Loader2, CheckCircle2,
  Fingerprint, Star, Activity,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { API_BASE } from "../config/api";

/* ── Role colour mapping ────────────────────────────────────────── */
const ROLE_META = {
  admin:         { color: "#f87171", label: "Admin",         hue: "0"   },
  astronaut:     { color: "#22d3ee", label: "Astronaut",     hue: "185" },
  ground_control:{ color: "#4ade80", label: "Ground Control",hue: "140" },
  staff:         { color: "#a78bfa", label: "Staff",         hue: "265" },
  operator:      { color: "#fbbf24", label: "Operator",      hue: "45"  },
};

function roleMeta(role) {
  return ROLE_META[role] || { color: "#94a3b8", label: role || "User", hue: "215" };
}

/* ── Info row inside identity card ─────────────────────────────── */
function InfoRow({ icon: Icon, label, value, hue = "215" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, marginBottom: 8,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `hsla(${hue},80%,60%,0.12)`,
        color: `hsl(${hue},80%,70%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} strokeWidth={1.8} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: "0.82rem", color: "#e2e8f0", fontWeight: 500 }}>{value || "—"}</span>
      </div>
    </div>
  );
}

/* ── Glass form card ────────────────────────────────────────────── */
function FormCard({ icon: Icon, title, accent, onClose, children }) {
  return (
    <div className="pd2-panel" style={{ "--panel-accent": accent }}>
      <div className="pd2-panel-header">
        <div className="pd2-panel-icon-wrap"><Icon size={15} strokeWidth={1.8} /></div>
        <h3 className="pd2-panel-title">{title}</h3>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
          cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
        }}>
          <X size={15} />
        </button>
        <div className="pd2-panel-line" />
      </div>
      <div className="pd2-panel-body">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { notifySuccess, notifyError } = useNotify();

  const [profile,    setProfile]    = useState(null);
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState({ full_name: "", email: "", phone: "" });
  const [saving,     setSaving]     = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm,     setPwForm]     = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingPw,   setSavingPw]   = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/auth/me`)
      .then((r) => {
        setProfile(r.data);
        setForm({ full_name: r.data.full_name, email: r.data.email, phone: r.data.phone || "" });
      })
      .catch((e) => notifyError(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const { data } = await axios.put(`${API_BASE}/auth/profile`, {
        full_name: form.full_name, email: form.email, phone: form.phone || null,
      });
      setProfile((p) => ({ ...p, ...data }));
      notifySuccess("Profile updated successfully.");
      setEditing(false);
    } catch (e) {
      notifyError(e.response?.data?.error || "Update failed.");
    } finally { setSaving(false); }
  }

  async function changePassword() {
    if (pwForm.new_password !== pwForm.confirm) {
      notifyError("New passwords do not match."); return;
    }
    setSavingPw(true);
    try {
      await axios.put(`${API_BASE}/auth/change-password`, {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      notifySuccess("Password changed successfully.");
      setShowPwForm(false);
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      notifyError(e.response?.data?.error || "Password change failed.");
    } finally { setSavingPw(false); }
  }

  const meta = roleMeta(profile?.role_name);

  if (!profile) {
    return (
      <div className="pd2-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={44} className="spin" style={{ color: "#6366f1" }} />
          <p className="muted" style={{ marginTop: 14 }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pd2-page">

      {/* ── Hero banner ── */}
      <div className="pd2-hero" style={{ marginBottom: 0 }}>
        <div className="pd2-hero-glow" />
        <div className="pd2-hero-left">
          {/* Avatar orb */}
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, hsl(${meta.hue},60%,30%), hsl(${meta.hue},80%,45%))`,
            border: `2px solid hsl(${meta.hue},70%,50%,0.5)`,
            boxShadow: `0 0 30px hsl(${meta.hue},70%,50%,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>
            {profile.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="pd2-hero-greeting">My Profile</p>
            <h2 className="pd2-hero-name">{profile.full_name}</h2>
            <span className="pd2-hero-role" style={{
              background: `hsl(${meta.hue},70%,50%,0.2)`,
              color: `hsl(${meta.hue},80%,70%)`,
              borderColor: `hsl(${meta.hue},70%,50%,0.35)`,
            }}>
              <Shield size={10} /> {meta.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1 }}>
          <button
            className="pd2-refresh-btn"
            style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" }}
            onClick={() => { setEditing(true); setShowPwForm(false); }}
          >
            <Edit3 size={13} /> Edit Profile
          </button>
          <button
            className="pd2-refresh-btn"
            onClick={() => { setShowPwForm(true); setEditing(false); }}
          >
            <KeyRound size={13} /> Change Password
          </button>
        </div>
      </div>

      {/* ── Two column layout ── */}
      <div className="pd2-grid-2" style={{ alignItems: "start" }}>

        {/* ── Left: Identity card ── */}
        <div className="pd2-panel" style={{ "--panel-accent": meta.color }}>
          <div className="pd2-panel-header">
            <div className="pd2-panel-icon-wrap"><Fingerprint size={15} strokeWidth={1.8} /></div>
            <h3 className="pd2-panel-title">Account Details</h3>
            <div className="pd2-panel-line" />
          </div>
          <div className="pd2-panel-body">
            {/* Username pill */}
            <div style={{
              textAlign: "center", marginBottom: 20,
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{
                fontFamily: "monospace", fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
              }}>@{profile.username}</span>
            </div>

            <InfoRow icon={Mail}     label="Email"        value={profile.email}    hue="240" />
            <InfoRow icon={Phone}    label="Phone"         value={profile.phone}    hue="185" />
            <InfoRow icon={Calendar} label="Member Since"  value={new Date(profile.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} hue="140" />
            <InfoRow icon={Clock}    label="Last Login"    value={profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Never"} hue="38" />
            <InfoRow icon={Star}     label="Role"          value={meta.label}       hue={meta.hue} />
            <InfoRow icon={Activity} label="Status"        value="Active"           hue="140" />
          </div>
        </div>

        {/* ── Right: Forms or empty state ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Edit Profile form */}
          {editing && (
            <FormCard icon={Edit3} title="Edit Profile" accent="#6366f1" onClose={() => setEditing(false)}>
              {[
                { id: "pf-name",  label: "Full Name", key: "full_name", type: "text"  },
                { id: "pf-email", label: "Email",      key: "email",     type: "email" },
                { id: "pf-phone", label: "Phone",      key: "phone",     type: "tel"   },
              ].map(({ id, label, key, type }) => (
                <div key={key} className="auth-field" style={{ marginBottom: 16 }}>
                  <label htmlFor={id} className="auth-label">{label}</label>
                  <input
                    id={id} type={type} className="auth-input"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="auth-btn" onClick={saveProfile} disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                </button>
                <button
                  className="pd2-refresh-btn"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <X size={13} /> Cancel
                </button>
              </div>
            </FormCard>
          )}

          {/* Change Password form */}
          {showPwForm && (
            <FormCard icon={KeyRound} title="Change Password" accent="#f59e0b" onClose={() => setShowPwForm(false)}>
              {[
                { id: "cp-cur", label: "Current Password", key: "current_password" },
                { id: "cp-new", label: "New Password",      key: "new_password"     },
                { id: "cp-con", label: "Confirm New",       key: "confirm"          },
              ].map(({ id, label, key }) => (
                <div key={key} className="auth-field" style={{ marginBottom: 16 }}>
                  <label htmlFor={id} className="auth-label">{label}</label>
                  <input
                    id={id} type="password" className="auth-input"
                    value={pwForm[key]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                    disabled={savingPw}
                  />
                </div>
              ))}
              <button className="auth-btn" onClick={changePassword} disabled={savingPw} style={{ marginTop: 8 }}>
                {savingPw
                  ? <><Loader2 size={15} className="spin" /> Saving…</>
                  : <><CheckCircle2 size={15} /> Update Password</>}
              </button>
            </FormCard>
          )}

          {/* Empty state */}
          {!editing && !showPwForm && (
            <div className="pd2-panel" style={{ "--panel-accent": "#475569" }}>
              <div className="pd2-panel-body" style={{ textAlign: "center", padding: "48px 20px" }}>
                <User size={48} strokeWidth={1.2} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 16 }} />
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", margin: 0 }}>
                  Use the buttons above to edit your profile or change your password.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
