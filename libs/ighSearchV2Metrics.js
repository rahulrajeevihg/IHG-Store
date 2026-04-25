const STORAGE_KEY = "igh_search_v2_metrics";
const MAX_EVENTS = 75;

export function logV2Event(type, payload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const next = Array.isArray(current) ? current : [];
    next.unshift({
      type,
      payload,
      ts: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_EVENTS)));
  } catch (error) {
    // Ignore metrics persistence issues so search UX stays resilient.
  }
}

export function getV2Events() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}
