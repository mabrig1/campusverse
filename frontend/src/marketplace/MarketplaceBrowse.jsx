import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
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

      <section className="glass-panel" aria-label="Graduation sale" style={{padding:"24px",marginBottom:20,background:"linear-gradient(110deg,rgba(16,185,129,.19),rgba(139,92,246,.14))",border:"1px solid rgba(52,211,153,.28)",borderRadius:18}}>
        <span style={{fontSize:12,color:"#6ee7b7",fontWeight:700,letterSpacing:1}}>🎓 FINAL YEAR CLEAR-OUT</span>
        <h2 style={{fontSize:"clamp(22px,3vw,30px)",margin:"9px 0"}}>Graduating? Pass it on, earn something back.</h2>
        <p style={{fontSize:14,color:"var(--text-secondary)",maxWidth:640,lineHeight:1.7}}>Sell your textbooks, reading tables, mini-fridges, mattresses and other useful items to students who need them. Buyers: find affordable pre-loved campus essentials.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
          <button type="button" className="btn market-btn-primary" onClick={()=>setShowSellForm(true)}>+ Sell my old stuff</button>
          <button type="button" className="btn btn-secondary" onClick={()=>setFilters({...EMPTY_FILTERS,category:"Graduation Sale"})}>Browse graduation deals</button>
        </div>
        <p style={{fontSize:12,color:"var(--text-secondary)",marginTop:14}}>When listing, select “Graduation Sale” as the category. Meet in public campus locations, inspect items and avoid advance payments outside trusted channels. Identity and device verification are not currently available.</p>
      </section>

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
