import { MapPin, ShieldCheck, MessageCircle, Phone, Heart, Pin, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

const TIER_BADGE = {
  FEATURED: { label: "Featured", icon: Sparkles, className: "market-badge-featured" },
  PINNED: { label: "Pinned", icon: Pin, className: "market-badge-pinned" },
  HIGHLIGHTED: { label: "Highlighted", icon: Star, className: "market-badge-highlighted" },
};

export default function ProductCard({ product, onOpen, onToggleFavorite, onCallSeller, isOwnListing }) {
  const tier = TIER_BADGE[product.promotionTier];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`market-card ${tier ? "is-promoted" : ""}`}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "rgba(255,255,255,0.03)" }}>
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          onClick={() => onOpen(product)}
          style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
        />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tier && (
            <span className={`market-badge ${tier.className}`}>
              <tier.icon size={11} /> {tier.label}
            </span>
          )}
          <span className={`market-badge ${product.conditionType === "NEW" ? "market-badge-new" : "market-badge-used"}`}>
            {product.conditionType === "NEW" ? "New" : "Used"}
          </span>
        </div>
        <button
          type="button"
          aria-label={product.favorited ? "Remove from favorites" : "Save to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Heart size={16} color={product.favorited ? "#f87171" : "#fff"} fill={product.favorited ? "#f87171" : "none"} />
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(product)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(product)}
        style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1, cursor: "pointer" }}
      >
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
          {product.category}
        </span>
        <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{product.title}</h3>
        <div style={{ fontSize: 18, fontWeight: 700 }}>₦{product.price.toLocaleString()}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
          <MapPin size={12} /> {product.location} <span>·</span> {product.listingAge}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span>{product.seller.name}</span>
            {product.seller.verified && (
              <span className="market-badge market-badge-verified">
                <ShieldCheck size={10} /> Verified
              </span>
            )}
          </div>
        </div>

        {isOwnListing ? (
          <span className="market-chip" style={{ textAlign: "center", marginTop: "auto" }}>
            Your listing
          </span>
        ) : (
          <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 4 }}>
            <a
              href={product.whatsappLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!product.whatsappLink}
              onClick={(e) => {
                e.stopPropagation();
                if (!product.whatsappLink) e.preventDefault();
              }}
              className="market-btn-primary"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderRadius: 8,
                padding: "8px",
                fontSize: 12,
                textDecoration: "none",
                opacity: product.whatsappLink ? 1 : 0.5,
              }}
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCallSeller(product);
              }}
              disabled={!product.seller.phone}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderRadius: 8,
                padding: "8px",
                fontSize: 12,
                border: "1px solid var(--market-border)",
                background: "transparent",
                color: "var(--text-primary)",
                cursor: product.seller.phone ? "pointer" : "not-allowed",
                opacity: product.seller.phone ? 1 : 0.5,
              }}
            >
              <Phone size={13} /> Call
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
