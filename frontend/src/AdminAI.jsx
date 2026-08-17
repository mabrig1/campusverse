import { useState } from "react";
import { api } from "./api";

const suggestions = [
  "Give me a summary of today's CampusVerse operations.",
  "Write a WhatsApp promotion for phone accessories on CampusVerse.",
  "Create a customer-service response for a delayed order.",
  "Suggest 5 ways to increase legitimate referral conversions on campus.",
];

export default function AdminAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("openrouter/free");

  const send = async (text = input) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const result = await api.adminAiChat(next, { model });
      setMessages((current) => [...current, { role: "assistant", content: result.content }]);
    } catch (err) {
      setMessages((current) => [...current, { role: "assistant", content: `AI error: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "linear-gradient(135deg,#063f31,#087f5b)", color: "#fff", borderRadius: 18, padding: 22 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.4, fontWeight: 800, color: "#8ff0c9" }}>CAMPUSVERSE AI</div>
        <h2 style={{ margin: "7px 0" }}>Your OpenRouter-powered operations assistant</h2>
        <p style={{ margin: 0, color: "#d4f4e8", lineHeight: 1.55 }}>Draft campaigns, customer responses, service copy, referral strategies and operational ideas without exposing your OpenRouter key to the browser.</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #dce9e3", borderRadius: 18, padding: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#526d64", marginBottom: 7 }}>Model</label>
        <input value={model} onChange={(e) => setModel(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d6e5df", borderRadius: 10, padding: 11 }} placeholder="openrouter/free or a specific model slug" />
      </div>

      <div style={{ background: "#fff", border: "1px solid #dce9e3", borderRadius: 18, padding: 18, minHeight: 360 }}>
        {messages.length === 0 ? (
          <div>
            <h3 style={{ marginTop: 0 }}>What should I help you do?</h3>
            <div style={{ display: "grid", gap: 9 }}>
              {suggestions.map((item) => <button key={item} onClick={() => send(item)} style={{ textAlign: "left", border: "1px solid #dce9e3", background: "#f7fbf9", borderRadius: 12, padding: 12, cursor: "pointer", color: "#17372d" }}>{item}</button>)}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {messages.map((m, i) => <div key={`${m.role}-${i}`} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "82%", whiteSpace: "pre-wrap", lineHeight: 1.55, background: m.role === "user" ? "#07966c" : "#f1f6f3", color: m.role === "user" ? "#fff" : "#17372d", borderRadius: 14, padding: "11px 14px" }}>{m.content}</div></div>)}
            {busy && <div style={{ color: "#6c827b", fontSize: 13 }}>CampusVerse AI is thinking…</div>}
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: "flex", gap: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask CampusVerse AI…" style={{ flex: 1, border: "1px solid #d6e5df", borderRadius: 12, padding: 13 }} />
        <button disabled={busy || !input.trim()} style={{ border: 0, borderRadius: 12, padding: "0 20px", background: busy ? "#9db6ad" : "#07966c", color: "#fff", fontWeight: 800, cursor: busy ? "default" : "pointer" }}>{busy ? "Sending…" : "Ask AI"}</button>
      </form>
    </div>
  );
}
