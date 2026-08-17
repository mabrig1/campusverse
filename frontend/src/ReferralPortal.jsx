import { useEffect, useState } from "react";
import AuthScreen from "./AuthScreen";
import { api, setAuthToken } from "./api";

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const card = { background: "#fff", border: "1px solid #dce9e3", borderRadius: 20, padding: 22, boxShadow: "0 8px 30px rgba(13,57,45,.05)" };
const button = { border: "1px solid #cfe0d9", borderRadius: 10, padding: "9px 12px", cursor: "pointer", background: "#fff", color: "#34584d" };

export default function ReferralPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("cv_token"));
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState("");

  const show = (text) => { setNotice(text); setTimeout(() => setNotice(""), 3000); };
  const auth = (t, u) => { localStorage.setItem("cv_token", t); setAuthToken(t); setToken(t); setUser(u); };

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref) localStorage.setItem("cv_referral_code", ref.toUpperCase());
  }, []);

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    (async () => {
      try {
        const me = await api.me(); setUser(me);
        const ref = localStorage.getItem("cv_referral_code");
        if (ref) { try { await api.attachReferral(ref); } catch {} localStorage.removeItem("cv_referral_code"); }
        setData(await api.getReferralDashboard());
      } catch { localStorage.removeItem("cv_token"); setToken(null); }
    })();
  }, [token]);

  const refresh = async () => { try { setData(await api.getReferralDashboard()); } catch (e) { show(e.message); } };
  const copy = async (value, label) => { await navigator.clipboard.writeText(value); show(`${label} copied`); };

  if (!token || !user) return <AuthScreen onAuthenticated={auth} />;

  return <div style={{ minHeight:"100vh", background:"#f6faf8", color:"#10201b", fontFamily:"Inter,system-ui,sans-serif" }}>
    <header style={{ background:"#fff", borderBottom:"1px solid #dce9e3", padding:"16px 5vw", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <a href="/" style={{ color:"inherit", textDecoration:"none", fontWeight:800, fontSize:20 }}>CampusVerse</a>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{fontSize:13,color:"#527067"}}>{user.name}</span><button style={button} onClick={()=>{localStorage.removeItem("cv_token");location.href="/"}}>Exit</button></div>
    </header>
    <main style={{ maxWidth:1180, margin:"0 auto", padding:"42px 5vw 80px" }}>
      {notice && <div style={{position:"fixed",top:20,right:20,background:"#063f31",color:"#fff",padding:"12px 16px",borderRadius:12,zIndex:50}}>{notice}</div>}
      <span style={{color:"#078f68",fontWeight:800,letterSpacing:".13em",fontSize:11}}>🚀 EARN WHILE YOU LEARN</span>
      <h1 style={{fontSize:"clamp(34px,5vw,58px)",lineHeight:1.02,margin:"10px 0",letterSpacing:"-.04em"}}>Turn campus connections into <span style={{color:"#07966c"}}>opportunity.</span></h1>
      <p style={{maxWidth:720,color:"#5d756d",fontSize:16,lineHeight:1.7}}>Refer legitimate CampusVerse services and products. The platform records attribution, verifies qualifying orders, and keeps your commission ledger in one place.</p>
      {data && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,margin:"28px 0 20px"}}>
          {[["Referrals",data.stats.referrals,"👥"],["Qualified",data.stats.qualified,"✓"],["Pending",money(data.stats.pending),"⏳"],["Approved",money(data.stats.approved),"🟢"],["Paid",money(data.stats.paid),"💰"]].map(([a,b,c])=><div style={card} key={a}><div style={{fontSize:22}}>{c}</div><div style={{fontSize:12,color:"#668078",marginTop:9}}>{a}</div><strong style={{fontSize:25}}>{b}</strong></div>)}
        </section>
        <section style={{...card,background:"#063f31",color:"#fff",marginBottom:20}}>
          <span style={{color:"#61e7b5",fontWeight:800,letterSpacing:".13em",fontSize:11}}>YOUR PARTNER LINK</span>
          <h2 style={{margin:"8px 0",fontSize:24}}>Earn {Math.round(data.commissionRate*100)}% on qualifying referrals</h2>
          <p style={{color:"#b8d6cc"}}>Commissions become payable only after official verification and approval.</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}><input readOnly value={data.referralLink} style={{flex:1,minWidth:280,padding:12,borderRadius:10,border:0}}/><button onClick={()=>copy(data.referralLink,"Referral link")} style={{background:"#61e7b5",border:0,borderRadius:10,padding:"11px 15px",fontWeight:800}}>Copy link</button><button onClick={()=>copy(data.code,"Referral code")} style={{...button,background:"transparent",color:"#fff",borderColor:"#5aa991"}}>Copy code</button></div>
        </section>
        <section style={{display:"grid",gridTemplateColumns:"minmax(0,1.6fr) minmax(280px,1fr)",gap:18}}>
          <div style={card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h2 style={{margin:0,fontSize:19}}>Referral activity</h2><p style={{color:"#6c827b",fontSize:13}}>Track every referred customer.</p></div><button style={button} onClick={refresh}>Refresh</button></div>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{["Person","Status","Date","Commission"].map(x=><th key={x} style={{textAlign:"left",padding:10,color:"#7b918a",borderBottom:"1px solid #e4eee9}}>{x}</th>)}</tr></thead><tbody>{data.referrals.map(r=><tr key={r.id}><td style={td}><b>{r.referred_name}</b><small style={{display:"block",color:"#7b918a"}}>{r.referred_email}</small></td><td style={td}><span style={badge(r.status)}>{r.status}</span></td><td style={td}>{new Date(r.created_at).toLocaleDateString()}</td><td style={td}>See ledger</td></tr>)}{!data.referrals.length&&<tr><td colSpan="4" style={{padding:28,textAlign:"center",color:"#7b918a"}}>No referrals yet.</td></tr>}</tbody></table></div>
          </div>
          <div style={card}><h2 style={{margin:0,fontSize:19}}>How it works</h2>{[["01","Share","Use your unique link."],["02","Serve","Connect a real campus need to CampusVerse."],["03","Qualify","The order is verified by the platform."],["04","Earn","Approved commissions enter payout." ]].map(([n,t,d])=><div key={n} style={{display:"flex",gap:12,marginTop:18}}><b style={{color:"#07966c"}}>{n}</b><div><strong>{t}</strong><p style={{margin:"4px 0",color:"#6c827b",fontSize:13}}>{d}</p></div></div>)}</div>
        </section>
        <section style={{...card,marginTop:18}}><h2 style={{margin:0,fontSize:19}}>Commission ledger</h2><p style={{color:"#6c827b",fontSize:13}}>Pending is not the same as paid.</p><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{["Referral","Source","Order value","Commission","Status"].map(x=><th key={x} style={{textAlign:"left",padding:10,color:"#7b918a"}}>{x}</th>)}</tr></thead><tbody>{data.commissions.map(c=><tr key={c.id}><td style={td}>{c.referred_name||c.code}</td><td style={td}>{c.source_type}</td><td style={td}>{money(c.base_amount)}</td><td style={td}><b>{money(c.commission_amount)}</b></td><td style={td}><span style={badge(c.status)}>{c.status}</span></td></tr>)}{!data.commissions.length&&<tr><td colSpan="5" style={{padding:28,textAlign:"center",color:"#7b918a"}}>No commission entries yet.</td></tr>}</tbody></table></div></section>
      </>}
    </main>
  </div>;
}
const td={padding:10,borderBottom:"1px solid #eef4f1",verticalAlign:"top"};
const badge=(v)=>({background:v==="PAID"||v==="QUALIFIED"?"#dff8ee":v==="REVERSED"?"#ffe8e8":"#fff4d6",color:v==="PAID"||v==="QUALIFIED"?"#06734f":v==="REVERSED"?"#a22":"#86620a",padding:"5px 8px",borderRadius:999,fontSize:10,fontWeight:800});
