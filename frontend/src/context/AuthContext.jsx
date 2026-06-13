/**
 * AuthContext.jsx — Global authentication state
 *
 * Two separate login flows:
 *   login()      → POST /api/auth/login        (PERSON: astronaut / ground_control)
 *   adminLogin() → POST /api/auth/admin-login  (hardcoded admin ONLY)
 *
 * Cross-login is rejected server-side. Both flows produce JWT tokens
 * with different role claims.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "smms_token";
const USER_KEY  = "smms_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  /* Keep axios default header in sync */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  /* Silently re-validate token on page load */
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/auth/me`)
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Shared internal helper ─────────────────────────────────── */
  function _persistSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  }

  /* ── PERSON login (astronaut / ground_control) ──────────────── */
  const login = useCallback(async (identifier, password, rememberMe = false) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, {
        identifier, password, rememberMe,
      });

      // Reject if server somehow returned an admin token on this endpoint
      if (data.user?.role_name === "admin" || data.user?.role === "admin") {
        return { ok: false, message: "Invalid credentials." };
      }

      _persistSession(data);
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Login failed." };
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Admin login — separate endpoint, separate flow ─────────── */
  const adminLogin = useCallback(async (identifier, password, rememberMe = false) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/admin-login`, {
        identifier, password, rememberMe,
      });

      // Guard: token must carry admin role
      if (data.user?.role_name !== "admin" && data.user?.role !== "admin") {
        return { ok: false, message: "Access denied. Admin credentials required." };
      }

      _persistSession(data);
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Login failed." };
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Logout ─────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try { await axios.post(`${API_BASE}/auth/logout`); } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  }, []);

  /* ── Public self-registration ───────────────────────────────── */
  const register = useCallback(async (fields) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/register`, fields);
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Registration failed." };
    }
  }, []);

  /* ── Forgot / Reset Password ────────────────────────────────── */
  const forgotPassword = useCallback(async (email) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      return { ok: true, message: data.message, mockLink: data.mockLink };
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Request failed." };
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/reset-password`, { token, new_password: newPassword });
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Reset failed." };
    }
  }, []);

  /* ── Role helpers ───────────────────────────────────────────── */
  const hasRole = useCallback((...roles) => {
    const r = user?.role || user?.role_name;
    return !!r && roles.includes(r);
  }, [user]);

  const isAdmin      = !!(user && (user.role === "admin" || user.role_name === "admin"));
  const isAstronaut  = !!(user && (user.role === "astronaut" || user.role_name === "astronaut"));
  const isGroundCtrl = !!(user && (user.role === "ground_control" || user.role_name === "ground_control"));

  const value = useMemo(() => ({
    user, token, loading,
    isAuthenticated: !!token && !!user,
    isAdmin,
    isAstronaut,
    isGroundCtrl,
    personType: user?.person_type ?? user?.role ?? null,
    login, logout, register, hasRole, adminLogin, forgotPassword, resetPassword
  }), [user, token, loading, isAdmin, isAstronaut, isGroundCtrl, login, logout, register, hasRole, adminLogin, forgotPassword, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
