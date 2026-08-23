import { useMemo, useState } from 'react';

const EMPTY_PRODUCT = {
  title: '', description: '', price: '', category: '', stock: 1,
  condition: 'NEW', images: [], deliveryNote: ''
};

export default function RetailerStorefrontTemplate({ retailer, products = [], onCreateProduct, onEditProduct, onDeleteProduct }) {
  const [draft, setDraft] = useState(EMPTY_PRODUCT);
  const [query, setQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const visible = useMemo(() => products.filter((p) =>
    `${p.title} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  const chooseImages = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 8);
    setDraft((current) => ({ ...current, images: files }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.description.trim() || !draft.price || !draft.images.length) return;
    await onCreateProduct?.(draft);
    setDraft(EMPTY_PRODUCT);
    setShowUpload(false);
  };

  return (
    <div className="retailer-store">
      <header className="retailer-cover">
        <div className="retailer-logo">{retailer?.logoUrl ? <img src={retailer.logoUrl} alt="" /> : (retailer?.name?.[0] || 'S')}</div>
        <div className="retailer-identity">
          <span className="retailer-kicker">CAMPUSVERSE VERIFIED RETAILER</span>
          <h1>{retailer?.name || 'My Campus Store'}</h1>
          <p>{retailer?.description || 'Products and essentials available to the CampusVerse community.'}</p>
          <div className="retailer-meta"><span>📍 {retailer?.location || 'Campus'}</span>{retailer?.verified && <span>✓ Verified retailer</span>}<span>{products.length} products</span></div>
        </div>
        <button className="retailer-upload-btn" onClick={() => setShowUpload(true)}>+ Upload product</button>
      </header>

      <section className="retailer-toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${retailer?.name || 'this store'}...`} />
        <button onClick={() => setShowUpload(true)}>Add new product</button>
      </section>

      <section className="retailer-product-grid">
        {visible.map((product) => (
          <article className="retailer-product-card" key={product.id || product.title}>
            <div className="retailer-product-image">
              {product.imageUrl || product.images?.[0]?.url
                ? <img src={product.imageUrl || product.images[0].url} alt={product.title} />
                : <span>Product image</span>}
              {product.stock <= 0 && <b className="retailer-stock-badge">Out of stock</b>}
            </div>
            <div className="retailer-product-copy">
              <small>{product.category || 'Retail'}</small>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <strong>₦{Number(product.price || 0).toLocaleString()}</strong>
              <div className="retailer-card-actions">
                <button onClick={() => onEditProduct?.(product)}>Edit</button>
                <button onClick={() => onDeleteProduct?.(product)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
        {!visible.length && <div className="retailer-empty">No products found. Upload your first product to open your CampusVerse storefront.</div>}
      </section>

      {showUpload && <div className="retailer-modal-backdrop" role="presentation">
        <form className="retailer-product-form" onSubmit={submit}>
          <header><div><span>RETAILER PRODUCT MANAGER</span><h2>Upload a product</h2></div><button type="button" onClick={() => setShowUpload(false)}>×</button></header>
          <label>Product images <small>Up to 8 clear images</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} required /></label>
          {!!draft.images.length && <div className="retailer-image-preview">{draft.images.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}</span>)}</div>}
          <label>Product name<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Oraimo 20,000mAh Power Bank" required /></label>
          <label>Description<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Describe features, size, model, warranty, what's included and other useful details." rows="5" required /></label>
          <div className="retailer-form-row"><label>Price (₦)<input type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} required /></label><label>Stock<input type="number" min="0" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} required /></label></div>
          <div className="retailer-form-row"><label>Category<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Phones, Fashion, Food..." required /></label><label>Condition<select value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })}><option value="NEW">New</option><option value="USED">Used</option></select></label></div>
          <label>Delivery / pickup information<textarea value={draft.deliveryNote} onChange={(e) => setDraft({ ...draft, deliveryNote: e.target.value })} placeholder="Where buyers can collect it, delivery areas, estimated fulfilment time..." rows="3" /></label>
          <div className="retailer-form-actions"><button type="button" onClick={() => setShowUpload(false)}>Cancel</button><button className="retailer-publish" type="submit">Publish product</button></div>
        </form>
      </div>}
    </div>
  );
}
