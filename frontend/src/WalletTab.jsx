import { useEffect, useState } from "react";
import { api } from "./api";

export default function WalletTab({ showToast }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setWallet(await api.getWallet());
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  const submitTopUp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.topUp(Number(topUpAmount));
      setTopUpAmount("");
      showToast(`Wallet topped up with ₦${Number(topUpAmount).toLocaleString()}`);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.transfer({
        toEmail: transferEmail,
        amount: Number(transferAmount),
        note: transferNote || undefined,
      });
      setTransferEmail("");
      setTransferAmount("");
      setTransferNote("");
      showToast(res.message);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "28px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
          Wallet Balance
        </span>
        <div style={{ fontSize: "36px", fontWeight: 700, marginTop: "4px" }}>
          {loading ? "…" : `₦${(wallet?.balance ?? 0).toLocaleString()}`}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
        <form onSubmit={submitTopUp} className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Top Up Wallet</h3>
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="Amount (₦)"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={busy}>
            Top Up
          </button>
        </form>

        <form onSubmit={submitTransfer} className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Send to Another Student</h3>
          <input
            className="form-input"
            type="email"
            placeholder="Recipient email"
            value={transferEmail}
            onChange={(e) => setTransferEmail(e.target.value)}
            required
          />
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="Amount (₦)"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            required
          />
          <input
            className="form-input"
            placeholder="Note (optional)"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            maxLength={200}
          />
          <button className="btn btn-accent" type="submit" disabled={busy}>
            Send
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>Transaction History</h3>
        {(!wallet?.transactions || wallet.transactions.length === 0) && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No transactions yet.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {wallet?.transactions?.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{tx.type.replace("_", " ")}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{tx.note}</div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color: ["TOPUP", "TRANSFER_IN", "ESCROW_RELEASE"].includes(tx.type)
                    ? "var(--accent-emerald)"
                    : "var(--text-primary)",
                }}
              >
                {["TOPUP", "TRANSFER_IN", "ESCROW_RELEASE"].includes(tx.type) ? "+" : "-"}₦
                {tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
