import { useEffect, useState } from "react";
import { X, MapPin, ShieldCheck, MessageCircle, Phone, Heart, Share2, Flag, ShieldAlert } from "lucide-react";
import { api } from "../api";
import { useCampusConfig } from "./useCampusConfig";

export default function ProductDetailModal({
  productId,
  currentUser,
  onClose,
  onToggleFavorite,
  onBuyEscrow,
  onCallSeller,
  onOpenRelated,
  showToast,
}) {
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const config = useCampusConfig();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- productId changed, reset before loading the new one
    setProduct(null);
    setActiveImage(0);
    api.getProduct(productId).then((data) => {
      if (!cancelled) setProduct(data);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#product-${productId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard");
    }
  };

  const submitReport = async () => {
    const reason = reportReason || config?.reportReasons?.[0];
    if (!reason) return;
    try {
      const res = await api.reportProduct(productId, reason);
      showToast(res.message);
      setShowReport(false);
    } catch (err) {
      showToast(err.message);
    }
  };

  const isOwnListing = product && currentUser && product.seller.id === currentUser.id;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Listing details">
      <div className="glass-panel modal-content" style={{ position: "relative", maxWidth: 720 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {!product ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading listing…</div>
        ) : (
          <div className="cv-market">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <div>
                <div style={{ aspectRatio: "16 / 10", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
                  <img
                    src={product.images[activeImage]}
                    alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                {product.images.length > 1 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {product.images.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => setActiveImage(i)}
                        aria-label={`View image ${i + 1}`}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: i === activeImage ? "2px solid var(--market-emerald-bright)" : "1px solid var(--market-border)",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)" }}>{product.category}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>{product.title}</h2>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="market-chip"
                      onClick={share}
                      aria-label="Share listing"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Share2 size={13} /> Share
                    </button>
                    <button
                      className="market-chip"
                      onClick={() => onToggleFavorite(product)}
                      aria-pressed={product.favorited}
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Heart size={13} color={product.favorited ? "#f87171" : undefined} fill={product.favorited ? "#f87171" : "none"} />
                      Save
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 26, fontWeight: 700, margin: "10px 0" }}>₦{product.price.toLocaleString()}</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                  <span className={`market-badge ${product.conditionType === "NEW" ? "market-badge-new" : "market-badge-used"}`}>
                    {product.conditionType === "NEW" ? "New" : "Used"} — {product.condition}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={12} /> {product.location}
                  </span>
                  <span>{product.listingAge}</span>
                  <span>{product.viewCount} views</span>
                </div>

                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>{product.description}</p>

                <div className="glass-panel" style={{ padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src={product.seller.avatarUrl}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                        {product.seller.name}
                        {product.seller.verified && (
                          <span className="market-badge market-badge-verified">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>🛡️ {product.seller.trustScore}% Trust Score</div>
                    </div>
                  </div>
                </div>

                {product.inspectionReport && (
                  <div className="glass-panel" style={{ padding: 14, marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🛡️ Inspection Certificate</h4>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "grid", gap: 4 }}>
                      <span>Condition score: {product.inspectionReport.inspectionScore}/100</span>
                      <span>Battery health: {product.inspectionReport.batteryHealth}</span>
                      <span>Authenticity: {product.inspectionReport.authenticity}</span>
                    </div>
                  </div>
                )}

                {!isOwnListing && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button className="btn market-btn-primary" style={{ flex: 1 }} onClick={() => onBuyEscrow(product)}>
                      Buy Escrow
                    </button>
                    <a
                      href={product.whatsappLink || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: product.whatsappLink ? 1 : 0.5 }}
                      onClick={(e) => !product.whatsappLink && e.preventDefault()}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      disabled={!product.seller.phone}
                      onClick={() => onCallSeller(product)}
                    >
                      <Phone size={14} /> Call
                    </button>
                  </div>
                )}

                {!isOwnListing && (
                  <button
                    onClick={() => setShowReport(true)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                  >
                    <Flag size={12} /> Report this listing
                  </button>
                )}
              </div>
            </div>

            {product.related.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Related listings</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  {product.related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenRelated(r.id)}
                      style={{ textAlign: "left", border: "1px solid var(--market-border)", borderRadius: 10, overflow: "hidden", background: "none", cursor: "pointer" }}
                    >
                      <img src={r.images[0]} alt={r.title} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
                      <div style={{ padding: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>₦{r.price.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showReport && (
              <div className="modal-overlay" style={{ zIndex: 60 }}>
                <div className="glass-panel modal-content" style={{ maxWidth: 380 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldAlert size={16} /> Report listing
                  </h3>
                  <select
                    className="market-input"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="">Choose a reason…</option>
                    {config?.reportReasons?.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReport(false)}>
                      Cancel
                    </button>
                    <button className="btn market-btn-primary" style={{ flex: 1 }} onClick={submitReport} disabled={!reportReason}>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
