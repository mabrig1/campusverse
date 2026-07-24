export function ProductCardSkeleton() {
  return (
    <div className="market-card" aria-hidden="true">
      <div className="market-skeleton" style={{ aspectRatio: "4 / 3" }} />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="market-skeleton" style={{ height: 10, width: "40%" }} />
        <div className="market-skeleton" style={{ height: 14, width: "80%" }} />
        <div className="market-skeleton" style={{ height: 18, width: "50%" }} />
        <div className="market-skeleton" style={{ height: 30, width: "100%", marginTop: 8 }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="market-grid" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
