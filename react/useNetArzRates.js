// useNetArzRates: a dependency-free React hook (React 18+) for the NetArz FX API.
//
// Two ways to feed it, pick one:
//
// 1. Your own backend (recommended when you have one). Pass `endpoint`, a URL on
//    YOUR site that calls GET https://netarz.ir/api/fx/v1/rates server-side with
//    the key and returns that JSON unchanged (see laravel/, php/ or relay/ in this
//    repo). The key never reaches the browser and one server cache serves every
//    visitor, so the app's daily quota stays low.
//
// 2. Straight from the browser. Pass `apiKey`. This is supported because FX keys
//    are domain-locked: a browser request is accepted only when its Origin is a
//    verified domain of your app, and browsers do not let a page forge Origin.
//    The key is visible in your bundle, but it does not work from another site.
//    Docs: https://netarz.ir/docs/fx/domain-lock
//
//    const { rates, meta, error, loading } = useNetArzRates({
//      codes: ["USD", "EUR", "AED"],
//      endpoint: "/api/fx-rates",          // or: apiKey: import.meta.env.VITE_NETARZ_FX_KEY
//    });
//
// Rows: { code, name, name_en, unit, buy, sell, mid, change_24h_percent, ... }
// Prices are Toman for `unit` units of the currency (unit is 1 for most codes).
import { useEffect, useState } from "react";

const API = "https://netarz.ir/api/fx/v1/rates";
const MIN_REFRESH_MS = 60 * 1000; // rates refresh every few minutes; polling faster only spends quota

// Shared by every component on the page, so two tables do not mean two requests.
const memory = new Map();

function readCache(key, ttl) {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.body;
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) || "null");
    if (stored && Date.now() - stored.t < ttl) {
      memory.set(key, stored);
      return stored.body;
    }
  } catch {
    // sessionStorage may be blocked (private mode, SSR): fall through to the network.
  }
  return null;
}

function writeCache(key, body) {
  const entry = { t: Date.now(), body };
  memory.set(key, entry);
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function fetchNetArzRates({ codes, endpoint, apiKey, ttl, signal }) {
  const query = codes && codes.length ? "?codes=" + encodeURIComponent(codes.join(",").toUpperCase()) : "";
  const url = (endpoint || API) + query;
  const cacheKey = "netarz-fx:" + url;

  const cached = readCache(cacheKey, ttl);
  if (cached) return cached;

  if (!endpoint && !apiKey) throw new Error("useNetArzRates: pass `endpoint` (your backend) or `apiKey` (domain-locked key).");

  const headers = { Accept: "application/json" };
  if (!endpoint) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(url, { headers, signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Stable codes: origin_not_allowed, domain_not_verified, daily_quota_exceeded, pro_required, ...
    const err = new Error(body.error?.message || `HTTP ${res.status}`);
    err.code = body.error?.code;
    err.status = res.status;
    throw err;
  }
  writeCache(cacheKey, body);
  return body;
}

export function useNetArzRates({ codes = ["USD", "EUR", "AED"], endpoint, apiKey, refreshMs = 3 * 60 * 1000 } = {}) {
  const [state, setState] = useState({ rates: [], meta: null, error: null, loading: true });
  const codesKey = codes.join(",");
  const every = Math.max(MIN_REFRESH_MS, refreshMs);

  useEffect(() => {
    let alive = true;
    let controller;

    async function load() {
      controller?.abort();
      controller = new AbortController();
      try {
        const body = await fetchNetArzRates({ codes: codesKey.split(","), endpoint, apiKey, ttl: every, signal: controller.signal });
        if (alive) setState({ rates: body.data || [], meta: body.meta || null, error: null, loading: false });
      } catch (error) {
        if (!alive || error.name === "AbortError") return;
        // Keep the last good rates on screen and report the error beside them.
        setState((s) => ({ ...s, error, loading: false }));
      }
    }

    load();
    const timer = setInterval(load, every);
    return () => {
      alive = false;
      clearInterval(timer);
      controller?.abort();
    };
  }, [codesKey, endpoint, apiKey, every]);

  return state;
}

// Toman with Persian digits and thousands separators, per ONE unit of the currency.
export function formatToman(row, field = "sell") {
  return new Intl.NumberFormat("fa-IR").format(Math.round(row[field] / Math.max(1, row.unit)));
}
