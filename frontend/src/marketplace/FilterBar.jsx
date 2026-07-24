import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const QUICK_CHIPS = [
  { key: "featured", label: "Featured", apply: (f) => ({ ...f, featuredOnly: !f.featuredOnly }) },
  { key: "under5k", label: "Under ₦5,000", apply: (f) => ({ ...f, maxPrice: f.maxPrice === 5000 ? "" : 5000 }) },
  { key: "verified", label: "Verified Sellers", apply: (f) => ({ ...f, verifiedOnly: !f.verifiedOnly }) },
  { key: "newest", label: "Newest", apply: (f) => ({ ...f, sort: f.sort === "newest" ? "" : "newest" }) },
  { key: "popular", label: "Most Popular", apply: (f) => ({ ...f, sort: f.sort === "popular" ? "" : "popular" }) },
];

function isChipActive(key, filters) {
  if (key === "featured") return Boolean(filters.featuredOnly);
  if (key === "under5k") return filters.maxPrice === 5000;
  if (key === "verified") return Boolean(filters.verifiedOnly);
  if (key === "newest") return filters.sort === "newest";
  if (key === "popular") return filters.sort === "popular";
  return false;
}

export default function FilterBar({ filters, onChange, config, currentUser }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="market-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search textbooks, electronics, past questions…"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            aria-label="Search listings"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="market-chip"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px" }}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Quick filters">
        {currentUser && (
          <button
            type="button"
            className={`market-chip ${filters.favoritesOnly ? "active" : ""}`}
            onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
            aria-pressed={Boolean(filters.favoritesOnly)}
          >
            ♥ My Favorites
          </button>
        )}
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`market-chip ${isChipActive(chip.key, filters) ? "active" : ""}`}
            onClick={() => onChange(chip.apply(filters))}
            aria-pressed={isChipActive(chip.key, filters)}
          >
            {chip.label}
          </button>
        ))}
        {config?.categories.slice(0, 4).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`market-chip ${filters.category === cat ? "active" : ""}`}
            onClick={() => onChange({ ...filters, category: filters.category === cat ? "" : cat })}
            aria-pressed={filters.category === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {showAdvanced && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
            padding: 14,
            border: "1px solid var(--market-border)",
            borderRadius: 12,
          }}
        >
          <select
            className="market-input"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {config?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="market-input"
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            aria-label="Campus location"
          >
            <option value="">All locations</option>
            {config?.locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            className="market-input"
            value={filters.condition}
            onChange={(e) => onChange({ ...filters, condition: e.target.value })}
            aria-label="Condition"
          >
            <option value="">New or Used</option>
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>

          <input
            className="market-input"
            type="number"
            min="0"
            placeholder="Min price (₦)"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            aria-label="Minimum price"
          />

          <input
            className="market-input"
            type="number"
            min="0"
            placeholder="Max price (₦)"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            aria-label="Maximum price"
          />
        </div>
      )}
    </div>
  );
}
