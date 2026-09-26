// Tiny browser client for the NetArz FX API.
//
// Runs on a page served from a domain registered (and verified) on your app.
// The key is visible in the page source, but it only works from your domains:
// the browser's Origin header cannot be forged, and CORS headers come back
// only for your own origin. Rotate the key in the panel if you see odd traffic.
//
// Docs: https://netarz.ir/docs/fx/domain-lock
const BASE = "https://netarz.ir/api/fx/v1";
const TTL_MS = 3 * 60 * 1000; // rates change every few minutes; see meta.refresh_interval_minutes

export function netarzFx(key) {
  async function call(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);

    // A short per-visitor cache so page reloads do not spend the app's daily quota.
    const cacheKey = "netarz-fx:" + url.pathname + url.search;
    try {
      const hit = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (hit && Date.now() - hit.t < TTL_MS) return hit.body;
    } catch { /* storage may be blocked; just call the API */ }

    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const body = await res.json();
    if (!res.ok) {
      // Stable codes: origin_not_allowed, domain_not_verified, daily_quota_exceeded, ...
      throw Object.assign(new Error(body.error?.message), { code: body.error?.code, status: res.status });
    }
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), body })); } catch { /* ignore */ }
    return body;
  }

  return {
    rates: (codes) => call("/rates", { codes: codes?.join(",") }),
    rate: (code) => call(`/rates/${code}`),
    convert: (from, to, amount = 1, side = "mid") => call("/convert", { from, to, amount, side }),
    me: () => call("/me"),
  };
}

// Format a Toman amount with Persian digits and separators.
export const toman = (n) => new Intl.NumberFormat("fa-IR").format(n) + " تومان";
