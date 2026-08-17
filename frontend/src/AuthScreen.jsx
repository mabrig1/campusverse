import { useState } from "react";
import { api, setAuthToken } from "./api";
import GoogleSignInButton from "./GoogleSignInButton";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", regNo: "", hostel: "" });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const data = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      setAuthToken(data.token);
      const ref = localStorage.getItem("cv_referral_code") || new URLSearchParams(location.search).get("ref");
      if (ref) { try { await api.attachReferral(ref.toUpperCase()); } catch {} localStorage.removeItem("cv_referral_code"); }
      onAuthenticated(data.token, data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="glass-panel" style={{ padding:40, width:"100%", maxWidth:420 }}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><div className="brand-logo">C</div><div><div className="brand-name">CampusVerse</div><div className="brand-tagline">UNN SECURE HUB</div></div></div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{mode === "login" ? "Log in to your account" : "Create your account"}</h2>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:20}}>{mode === "login" ? "Access your wallet, listings, and escrow transactions." : "Join the UNN student marketplace and social network."}</p>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode === "register" && <><input className="form-input" placeholder="Full name" value={form.name} onChange={update("name")} required/><input className="form-input" placeholder="Registration number (e.g. 2023/149819)" value={form.regNo} onChange={update("regNo")}/><input className="form-input" placeholder="Hostel / address" value={form.hostel} onChange={update("hostel")}/></>}
          <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={update("email")} required/>
          <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={update("password")} minLength={8} required/>
          {error && <div style={{color:"#f87171",fontSize:13}}>{error}</div>}
          <button className="btn" type="submit" disabled={loading} style={{marginTop:8}}>{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <GoogleSignInButton onAuthenticated={onAuthenticated} onError={setError}/>
        <p style={{marginTop:8,fontSize:13,textAlign:"center",color:"var(--text-secondary)"}}>{mode === "login" ? "New to CampusVerse?" : "Already have an account?"}{" "}<button type="button" onClick={()=>setMode(mode === "login" ? "register" : "login")} style={{background:"none",border:0,color:"var(--accent-purple)",cursor:"pointer",padding:0}}>{mode === "login" ? "Create one" : "Log in"}</button></p>
      </div>
    </div>
  );
}
