import { useMemo, useState } from "react";
import { api, setAuthToken } from "./api";

const panel = { width: "100%", maxWidth: 430, background: "#fff", border: "1px solid #dbe9e3", borderRadius: 22, padding: 34, boxShadow: "0 24px 70px rgba(4,65,48,.12)" };
const input = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d7e5df", borderRadius: 11, fontSize: 14, outline: "none" };
const button = { width: "100%", border: 0, borderRadius: 11, padding: "13px 16px", background: "#087f5b", color: "#fff", fontWeight: 800, cursor: "pointer" };

export default function AdminAuthScreen({ onAuthenticated }) {
  const resetToken = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitLogin = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const data = await api.adminLogin({ username, password });
      localStorage.setItem("cv_admin_token", data.token);
      setAuthToken(data.token);
      onAuthenticated(data.token, data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitForgot = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const data = await api.adminForgotPassword(username);
      setMessage(data.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault(); setError(""); setMessage("");
    if (password.length < 12) return setError("Use at least 12 characters for the new password.");
    if (password !== confirm) return setError("The passwords do not match.");
    setLoading(true);
    try {
      const data = await api.adminResetPassword(resetToken, password);
      setMessage(data.message);
      setPassword(""); setConfirm("");
      window.history.replaceState({}, "", "/admin");
      setMode("login");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(135deg,#f4faf7,#e9f5f0 55%,#fff)" }}>
      <section style={panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 25 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, fontSize: 22, background: "linear-gradient(135deg,#087f5b,#20a876)" }}>C</div>
          <div><strong style={{ display: "block", fontSize: 20 }}>CampusVerse</strong><span style={{ fontSize: 11, color: "#087f5b", fontWeight: 800, letterSpacing: 1.1 }}>ADMIN PORTAL</span></div>
        </div>

        {mode === "login" && <>
          <h1 style={{ margin: 0, fontSize: 27, color: "#10201b" }}>Administrator sign in</h1>
          <p style={{ color: "#667b74", lineHeight: 1.55 }}>Secure access to marketplace, referrals, commissions, images and operations.</p>
          <form onSubmit={submitLogin} style={{ display: "grid", gap: 12 }}>
            <input style={input} value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin username or email" autoComplete="username" required />
            <input style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete="current-password" required />
            {error && <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div>}
            {message && <div style={{ color: "#087f5b", fontSize: 13 }}>{message}</div>}
            <button style={button} disabled={loading}>{loading ? "Signing in…" : "Sign in to Admin Dashboard"}</button>
          </form>
          <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} style={{ marginTop: 16, background: "none", border: 0, color: "#087f5b", fontWeight: 700, cursor: "pointer" }}>Forgot admin password?</button>
        </>}

        {mode === "forgot" && <>
          <h1 style={{ margin: 0, fontSize: 27 }}>Reset administrator password</h1>
          <p style={{ color: "#667b74", lineHeight: 1.55 }}>Enter your admin username or email. If it matches an administrator account, we'll send a secure one-time reset link.</p>
          <form onSubmit={submitForgot} style={{ display: "grid", gap: 12 }}>
            <input style={input} value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin username or email" autoComplete="username" required />
            {error && <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div>}
            {message && <div style={{ color: "#087f5b", fontSize: 13, lineHeight: 1.5 }}>{message}</div>}
            <button style={button} disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
          </form>
          <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{ marginTop: 16, background: "none", border: 0, color: "#087f5b", fontWeight: 700, cursor: "pointer" }}>Back to admin sign in</button>
        </>}

        {mode === "reset" && <>
          <h1 style={{ margin: 0, fontSize: 27 }}>Create a new password</h1>
          <p style={{ color: "#667b74", lineHeight: 1.55 }}>Choose a strong password with at least 12 characters. The reset link can only be used once.</p>
          <form onSubmit={submitReset} style={{ display: "grid", gap: 12 }}>
            <input style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password" autoComplete="new-password" minLength={12} required />
            <input style={input} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" type="password" autoComplete="new-password" minLength={12} required />
            {error && <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div>}
            {message && <div style={{ color: "#087f5b", fontSize: 13 }}>{message}</div>}
            <button style={button} disabled={loading}>{loading ? "Updating…" : "Update admin password"}</button>
          </form>
        </>}

        <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid #e5efeb", fontSize: 11, color: "#7a8c86" }}>Protected administrator area • Short-lived session • Role verified server-side</div>
      </section>
    </main>
  );
}
