// Vercel hosts the backend now; Railway is no longer required.
// VITE_API_URL may opt into a reviewed Cloudflare gateway at https://edge-api.campusverse.store/api.
// Keep it unset during staging to continue using the Vercel API origin.
const API_BASE = (import.meta.env.VITE_API_URL || "https://campusverse-backend.vercel.app/api").replace(/\/$/, "");

let authToken = null;
export function setAuthToken(token) { authToken = token; }

async function request(path, options = {}) {
  const isBinary = options.body instanceof Blob || options.body instanceof ArrayBuffer;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isBinary ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  uploadLaptopOwnershipProof: (id, file, type) => request("/laptops/" + encodeURIComponent(id) + "/ownership-proof", {
    method: "POST", body: file, headers: { "Content-Type": "application/octet-stream", "X-Ownership-Document-Type": type },
  }),
  removeLaptopOwnershipProof: (id) => request("/laptops/" + encodeURIComponent(id) + "/ownership-proof", { method: "DELETE" }),
  getPilotShopMode: () => request("/store/pilot"),
  sellerRespondStoreQuote: (id, decision) => request("/laptops/" + encodeURIComponent(id) + "/store-quote", {
    method: "PATCH", body: JSON.stringify({decision}),
  }),
  adminGetStoreIntakes: () => request("/admin/v2/store-intake"),
  adminGetStoreInventory: () => request("/admin/v2/store-inventory"),
  adminOfferStorePurchase: (id, payload) => request("/admin/v2/store-intake/" + encodeURIComponent(id) + "/quote", {
    method: "POST", body: JSON.stringify(payload),
  }),
  adminAcquireIntoStore: (id, payload) => request("/admin/v2/store-intake/" + encodeURIComponent(id) + "/acquire", {
    method: "POST", body: JSON.stringify(payload),
  }),
  adminActivateOwnStock: (id,payload) => request("/admin/v2/store-inventory/" + encodeURIComponent(id) + "/activate", {
    method: "POST", body: JSON.stringify(payload),
  }),
  adminSetStorePrice: (id, price) => request("/admin/v2/store-inventory/" + encodeURIComponent(id) + "/price", {
    method: "PATCH", body: JSON.stringify({price}),
  }),
  adminSetStoreStatus: (id,status) => request("/admin/v2/store-inventory/" + encodeURIComponent(id) + "/status", {
    method: "PATCH", body: JSON.stringify({status}),
  }),
  issueSellerVideoChallenge: (id) => request("/laptops/" + encodeURIComponent(id) + "/seller-video-challenge", { method: "POST", body: "{}" }),
  uploadSellerIntentVideo: (id, blob, challenge) => request("/laptops/" + encodeURIComponent(id) + "/seller-video", {
    method: "POST", body: blob,
    headers: { "Content-Type": "application/octet-stream", "X-Seller-Video-Challenge": challenge,
      "X-Seller-Video-Consent": "yes", "X-Seller-Video-Mime": blob.type.split(";")[0] },
  }),
  removeSellerIntentVideo: (id) => request("/laptops/" + encodeURIComponent(id) + "/seller-video", { method: "DELETE" }),
  adminDownloadSellerIntentVideo: async id => {
    const res = await fetch(API_BASE + "/admin/v2/laptop-ownership/" + encodeURIComponent(id) + "/seller-video", {
      headers: authToken ? { Authorization: "Bearer " + authToken } : {}, cache: "no-store",
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Unable to retrieve the seller video"); }
    return res.blob();
  },
  reportLaptopSafety: (id, payload) => request("/laptops/" + encodeURIComponent(id) + "/safety-report", { method: "POST", body: JSON.stringify(payload) }),
  adminGetOwnershipQueue: () => request("/admin/v2/laptop-ownership"),
  adminMatchDeviceIdentifier: (id,identifier) => request("/admin/v2/laptop-ownership/" + encodeURIComponent(id) + "/match-identifier", { method: "POST", body: JSON.stringify({identifier}) }),
  adminGetLaptopReports: () => request("/admin/v2/laptop-reports"),
  adminGetDeviceOffers: () => request("/admin/v2/device-offers"),
  adminDecideDeviceOffer: (id, payload) => request("/admin/v2/device-offers/" + encodeURIComponent(id) + "/decision", { method: "POST", body: JSON.stringify(payload) }),
  adminReviewLaptopOwnership: (id, payload) => request("/admin/v2/laptop-ownership/" + encodeURIComponent(id) + "/review", { method: "POST", body: JSON.stringify(payload) }),
  adminResolveLaptopReport: (id) => request("/admin/v2/laptop-reports/" + encodeURIComponent(id) + "/resolve", { method: "POST", body: "{}" }),
  adminDownloadLaptopEvidence: async (id) => {
    const res = await fetch(API_BASE + "/admin/v2/laptop-ownership/" + encodeURIComponent(id) + "/document",
      { headers: authToken ? { Authorization: "Bearer " + authToken } : {}, cache: "no-store" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Unable to download private document"); }
    return res.blob();
  },
  getLaptopListings: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))).toString();
    return request("/laptops" + (qs ? "?" + qs : ""));
  },
  getMyLaptops: () => request("/laptops/mine"),
  getMyLaptopOffers: () => request("/laptops/offers"),
  createLaptopListing: (payload) => request("/laptops", { method: "POST", body: JSON.stringify(payload) }),
  setLaptopStatus: (id, status) => request("/laptops/" + encodeURIComponent(id) + "/status", { method: "PATCH", body: JSON.stringify({ status }) }),
  createLaptopOffer: (id, payload) => request("/laptops/" + encodeURIComponent(id) + "/offers", { method: "POST", body: JSON.stringify(payload) }),
  decideLaptopOffer: (id, status) => request("/laptops/offers/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ status }) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  loginWithGoogle: (credential) => request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  me: () => request("/me"),

  // New isolated administrator API. It is deliberately separate from the
  // normal student login token and requires an admin-scoped JWT server-side.
  adminLogin: (payload) => request("/admin/v2/login", { method: "POST", body: JSON.stringify(payload) }),
  adminMe: () => request("/admin/v2/me"),
  adminForgotPassword: (username) => request("/admin/v2/forgot-password", { method: "POST", body: JSON.stringify({ username }) }),
  adminResetPassword: (token, password) => request("/admin/v2/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  getAdminOverviewV2: () => request("/admin/v2/overview"),
  getAdminProductsV2: () => request("/admin/v2/products"),

  aiChat: (messages, options = {}) => request("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages, ...options }),
  }),
  adminAiChat: (messages, options = {}) => request("/admin/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages, ...options }),
  }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
  promoteProduct: (id, tier, days) => request(`/products/${id}/promote`, { method: "POST", body: JSON.stringify({ tier, days }) }),
  reportProduct: (id, reason) => request(`/products/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
  getFavorites: () => request("/favorites"),
  addFavorite: (productId) => request(`/favorites/${productId}`, { method: "POST" }),
  removeFavorite: (productId) => request(`/favorites/${productId}`, { method: "DELETE" }),
  getCampusLocations: () => request("/campus-locations"),
  getMarketplaceCategories: () => request("/marketplace-categories"),
  getPromotionPricing: () => request("/promotion-pricing"),
  getReportReasons: () => request("/report-reasons"),
  getServices: () => request("/services"),
  getDirectory: () => request("/directory"),
  getWallet: () => request("/wallet"),
  topUp: (amount) => request("/wallet/topup", { method: "POST", body: JSON.stringify({ amount }) }),
  transfer: (payload) => request("/wallet/transfer", { method: "POST", body: JSON.stringify(payload) }),
  startEscrow: (productId) => request("/escrow", { method: "POST", body: JSON.stringify({ productId }) }),
  escrowAction: (id, action) => request(`/escrow/${id}/action`, { method: "POST", body: JSON.stringify({ action }) }),
  verifyStudentId: (regNo) => request("/verify/student-id", { method: "POST", body: JSON.stringify({ regNo }) }),
  verifySelfie: () => request("/verify/selfie", { method: "POST", body: JSON.stringify({ selfieBase64: "mock_base64_data" }) }),
  verifyNin: (nin) => request("/verify/nin", { method: "POST", body: JSON.stringify({ nin }) }),
  verifyBvn: (bvn) => request("/verify/bvn", { method: "POST", body: JSON.stringify({ bvn }) }),
  verifyImei: (imei) => request("/verify/imei", { method: "POST", body: JSON.stringify({ imei }) }),

  getReferralDashboard: () => request("/referrals/me"),
  attachReferral: (code) => request("/referrals/attach", { method: "POST", body: JSON.stringify({ code }) }),
  getAdminOverview: () => request("/referrals/admin/overview"),
  getAdminReferrals: () => request("/referrals/admin/referrals"),
  addReferralConversion: (payload) => request("/referrals/admin/conversions", { method: "POST", body: JSON.stringify(payload) }),
  updateReferralCommission: (id, status) => request(`/referrals/admin/commissions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getAdminImages: () => request("/referrals/admin/images"),
  uploadAdminImage: (file) => request("/referrals/admin/images", { method: "POST", body: file, headers: { "Content-Type": "application/octet-stream", "X-File-Type": file.type, "X-File-Name": file.name } }),
};
