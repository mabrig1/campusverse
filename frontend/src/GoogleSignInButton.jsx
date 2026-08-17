import { useEffect, useRef } from "react";
import { api, setAuthToken } from "./api";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onAuthenticated, onError }) {
  const buttonRef = useRef(null);
  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: async ({ credential }) => {
        try {
          const data = await api.loginWithGoogle(credential);
          setAuthToken(data.token);
          const ref = localStorage.getItem("cv_referral_code") || new URLSearchParams(location.search).get("ref");
          if (ref) { try { await api.attachReferral(ref.toUpperCase()); } catch {} localStorage.removeItem("cv_referral_code"); }
          onAuthenticated(data.token, data.user);
        } catch (err) { onError(err.message); }
      }});
      window.google.accounts.id.renderButton(buttonRef.current, { type:"standard", theme:"filled_black", size:"large", shape:"pill", width:340 });
    };
    if (window.google?.accounts?.id) render(); else {
      const interval = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(interval); render(); } }, 100);
      setTimeout(() => clearInterval(interval), 10000);
      return () => clearInterval(interval);
    }
    return () => { cancelled = true; };
  }, []);
  if (!CLIENT_ID) return null;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,margin:"16px 0"}}><div style={{display:"flex",alignItems:"center",gap:10,width:"100%"}}><div style={{flex:1,height:1,background:"var(--border-glass)"}}/><span style={{fontSize:12,color:"var(--text-muted)"}}>or</span><div style={{flex:1,height:1,background:"var(--border-glass)"}}/></div><div ref={buttonRef}/></div>;
}
