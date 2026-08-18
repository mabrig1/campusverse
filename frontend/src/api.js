const API_BASE = (import.meta.env.VITE_API_URL || "https://api.campusverse.store/api").replace(/\/$/, "");

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
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  loginWithGoogle: (credential) => request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  me: () => request("/me"),

  adminLogin: (payload) => request("/admin/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  adminMe: () => request("/admin/auth/me"),
  adminForgotPassword: (username) => request("/admin/auth/forgot-password", { method: "POST", body: JSON.stringify({ username }) }),
  adminResetPassword: (token, password) => request("/admin/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  // OpenRouter-backed AI. The API key never reaches the browser; the backend
  // keeps OPENROUTER_API_KEY in its server-side environment.
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
