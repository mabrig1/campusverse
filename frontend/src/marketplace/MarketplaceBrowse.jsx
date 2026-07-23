import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ShieldQuestion } from "lucide-react";
import { api } from "../api";
import { useCampusConfig } from "./useCampusConfig";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "./Skeletons";
import ProductDetailModal from "./ProductDetailModal";
import SellListingForm from "./SellListingForm";
import FAB from "./FAB";
import "./theme.css";

const EMPTY_FILTERS = {
  q: "",
  category: "",
  location: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  featuredOnly: false,
  verifiedOnly: false,
  favoritesOnly: false,
  sort: "",
};

export default function MarketplaceBrowse({ user, showToast, onBuyEscrow }) {
  const config = useCampusConfig();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [imeiInput, setImeiInput] = useState("");
  const [imeiReport, setImeiReport] = useState(null);
  const sentinelRef = useRef(null);
  const debounceRef = useRef(null);

  const loadPage = useCallback(
    async (pageToLoad, replace) => {
      const res = await api.getProducts({
        q: filters.q,
        category: filters.category,
        location: filters.location,
        condition: filters.condition,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        verifiedOnly: filters.verifiedOnly || undefined,
        featuredOnly: filters.featuredOnly || undefined,
        favoritesOnly: filters.favoritesOnly || undefined,
        sort: filters.sort,
        page: pageToLoad,
        limit: 12,
      });
      setProducts((prev) => (replace ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPage(pageToLoad);
    },
    [filters]
  );

  // Debounced re-fetch from page 1 whenever filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- filters changed, refetch from page 1
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPage(1, true)
        .catch((err) => showToast(err.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Infinite scroll: observe a sentinel at the bottom of the grid.
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          loadPage(page + 1, false)
            .catch((err) => showToast(err.message))
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPage, showToast]);

  const toggleFavorite = async (product) => {
    const wasFavorited = product.favorited;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, favorited: !wasFavorited } : p)));
    try {
      if (wasFavorited) await api.removeFavorite(product.id);
      else await api.addFavorite(product.id);
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, favorited: wasFavorited } : p)));
      showToast(err.message);
    }
  };

  const callSeller = (product) => {
    if (!product.seller.phone) return;
    window.location.href = `tel:${product.seller.phone}`;
  };

  const checkImei = async () => {
    if (!imeiInput) {
      showToast("Enter a device IMEI or serial number");
      return;
    }
    try {
      const data = await api.verifyImei(imeiInput);
      setImeiReport(data);
      showToast(data.clean ? "IMEI Clean! Device safe for buy/sell." : "WARNING: This device is flagged as stolen/blacklisted!");
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="cv-market" style={{ paddingBottom: 100 }}>
      <div className="glass-panel" style={{ padding: 20, marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>List something for sale</h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Reach verified students on your campus. Promoted listings get seen first.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 16, marginBottom: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}>
          <ShieldQuestion size={16} /> Anti-theft device check
        </div>
        <input
          className="market-input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Enter IMEI or serial number…"
          value={imeiInput}
          onChange={(e) => setImeiInput(e.target.value)}
        />
        <button className="btn market-btn-primary" onClick={checkImei}>
          Verify
        </button>
        {imeiReport && (
          <span style={{ fontSize: 12, color: imeiReport.clean ? "#34d399" : "#f87171" }}>{imeiReport.status}</span>
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} config={config} currentUser={user} />

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="market-empty-state">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No listings match your filters</h3>
          <p style={{ fontSize: 13 }}>Try a different search or category, or be the first to list something.</p>
          <button className="btn market-btn-primary" onClick={() => setShowSellForm(true)}>
            Sell an item
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            <AnimatePresence>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOwnListing={user && product.seller.id === user.id}
                  onOpen={(p) => setSelectedProductId(p.id)}
                  onToggleFavorite={toggleFavorite}
                  onCallSeller={callSeller}
                />
              ))}
            </AnimatePresence>
          </div>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <ProductGridSkeleton count={4} />}
        </>
      )}

      <FAB
        onSellProduct={() => setShowSellForm(true)}
        onOfferService={() => showToast("Student Services listings are coming in a future update.")}
      />

      {showSellForm && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>List an Item for Sale</h2>
            <SellListingForm
              showToast={showToast}
              onClose={() => setShowSellForm(false)}
              onCreated={(product) => {
                setProducts((prev) => [product, ...prev]);
                setShowSellForm(false);
              }}
            />
          </div>
        </div>
      )}

      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          currentUser={user}
          onClose={() => setSelectedProductId(null)}
          onOpenRelated={(id) => setSelectedProductId(id)}
          onToggleFavorite={toggleFavorite}
          onBuyEscrow={(product) => {
            setSelectedProductId(null);
            onBuyEscrow(product);
          }}
          onCallSeller={callSeller}
          showToast={showToast}
        />
      )}
    </div>
  );
}
