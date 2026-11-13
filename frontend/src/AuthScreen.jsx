import { useState } from "react";
import { api, setAuthToken } from "./api";
import GoogleSignInButton from "./GoogleSignInButton";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", regNo: "", hostel: "", storeIntent: "BUY_FROM_STORE" });

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
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><div className="brand-logo">C</div><div><div className="brand-name">CampusVerse</div><div className="brand-tagline">ONE CAMPUSVERSE SHOP • MANAGED FIRST RELEASE</div></div></div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{mode === "login" ? "Log in to your account" : "Create your account"}</h2>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:20}}>{mode === "login" ? "Buy a used laptop or iPhone from our store, or check your private sell-to-CampusVerse submission." : "Choose whether you want to buy from our store or sell your old device to CampusVerse. Independent shops and peer-to-peer transactions are not available in this pilot."}</p>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode === "register" && <><label style={{display:"grid",gap:7,fontSize:13,color:"var(--text-secondary)"}}>
            I am joining CampusVerse to…
            <select className="form-input" value={form.storeIntent} onChange={update("storeIntent")}>
              <option value="BUY_FROM_STORE">Buy a used laptop or iPhone from CampusVerse</option>
              <option value="SELL_TO_STORE">Sell my used laptop or iPhone to CampusVerse</option>
              <option value="BOTH">Buy from and sell to CampusVerse</option>
            </select>
          </label><input className="form-input" placeholder="Full name" value={form.name} onChange={update("name")} required/><input className="form-input" placeholder="Registration number (e.g. 2023/149819)" value={form.regNo} onChange={update("regNo")}/><input className="form-input" placeholder="Campus / meeting area (optional, not your home address)" value={form.hostel} onChange={update("hostel")}/></>}
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
