import { useState } from "react";
import { api } from "./api";

const CATEGORIES = ["Electronics", "Hostel Furniture", "Books & Study Materials", "Fashion", "Other"];

export default function SellModal({ onClose, onCreated, showToast }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: CATEGORIES[0],
    condition: "Used (Good)",
    location: "",
    imageUrl: "",
    inspectionRequired: false,
  });
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const product = await api.createProduct({ ...form, price: Number(form.price) });
      showToast("Listing published to the marketplace!");
      onCreated(product);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ position: "relative" }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>List an Item for Sale</h2>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input className="form-input" placeholder="Title" value={form.title} onChange={update("title")} required />
          <textarea
            className="form-input"
            style={{ minHeight: "80px", resize: "vertical" }}
            placeholder="Description"
            value={form.description}
            onChange={update("description")}
            required
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              className="form-input"
              type="number"
              min="1"
              placeholder="Price (₦)"
              value={form.price}
              onChange={update("price")}
              required
            />
            <select className="form-input" value={form.category} onChange={update("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              className="form-input"
              placeholder="Condition (e.g. Used (Good))"
              value={form.condition}
              onChange={update("condition")}
              required
            />
            <input
              className="form-input"
              placeholder="Location (e.g. Franco Hostel, UNN)"
              value={form.location}
              onChange={update("location")}
              required
            />
          </div>
          <input
            className="form-input"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={update("imageUrl")}
            required
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <input type="checkbox" checked={form.inspectionRequired} onChange={update("inspectionRequired")} />
            Request a CampusVerse Hub inspection (recommended for phones/laptops)
          </label>

          <button className="btn btn-accent" type="submit" disabled={busy} style={{ marginTop: "8px" }}>
            {busy ? "Publishing…" : "Publish Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
