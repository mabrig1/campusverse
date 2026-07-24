import { useEffect, useState } from "react";
import { api } from "../api";

// Fetched once per page load and shared — configuration data, not user data.
let cached = null;
let inflight = null;

function fetchConfig() {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = Promise.all([
      api.getCampusLocations(),
      api.getMarketplaceCategories(),
      api.getPromotionPricing(),
      api.getReportReasons(),
    ]).then(([locations, categories, pricing, reportReasons]) => {
      cached = { locations, categories, pricing, reportReasons };
      return cached;
    });
  }
  return inflight;
}

export function useCampusConfig() {
  const [config, setConfig] = useState(cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetchConfig().then((result) => {
      if (!cancelled) setConfig(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
