const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/me"),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    ).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
  promoteProduct: (id, tier, days) =>
    request(`/products/${id}/promote`, { method: "POST", body: JSON.stringify({ tier, days }) }),
  reportProduct: (id, reason) =>
    request(`/products/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) }),

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
};
