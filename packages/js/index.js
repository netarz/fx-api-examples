// netarz-fx — client for the NetArz FX API (Iranian Toman exchange rates).
// Node 18+, Deno, Bun and browsers: uses the global fetch, no dependencies.
// Docs: https://netarz.ir/docs/fx

export const VERSION = "0.1.0";
export const DEFAULT_BASE_URL = "https://netarz.ir/api/fx/v1";

export class NetArzFxError extends Error {
  constructor(status, error = {}) {
    super(`${error.code}: ${error.message}`);
    this.name = "NetArzFxError";
    this.status = status;
    this.code = error.code;
    this.docs = error.docs;
    this.seenIp = error.ip; // on ip_not_allowed / origin_required
  }
}

/**
 * @param {{ key?: string, baseUrl?: string, ttl?: number, fetch?: typeof fetch }} [options]
 */
export function createClient(options = {}) {
  const env = typeof process !== "undefined" && process.env ? process.env : {};
  const key = options.key ?? env.NETARZ_FX_KEY;
  if (!key) throw new Error("Pass { key } or set NETARZ_FX_KEY (create one at https://netarz.ir/fx).");

  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const ttl = (options.ttl ?? 120) * 1000;
  const doFetch = options.fetch ?? globalThis.fetch;
  const cache = new Map();

  async function request(method, path, params = {}, body) {
    const url = new URL(base + path);
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));

    const cacheKey = url.toString();
    if (method === "GET" && ttl > 0) {
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < ttl) return hit.value;
    }

    const headers = { Authorization: `Bearer ${key}`, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await doFetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const isJson = (res.headers.get("content-type") || "").includes("json");
    const value = isJson ? await res.json() : await res.text();
    if (!res.ok) throw new NetArzFxError(res.status, isJson ? value.error : { message: String(value).slice(0, 200) });

    if (method === "GET" && ttl > 0) cache.set(cacheKey, { at: Date.now(), value });
    return value;
  }

  const up = (code) => encodeURIComponent(String(code).toUpperCase());

  return {
    request,
    rates: (codes) => request("GET", "/rates", { codes: codes?.join(",") }),
    rate: async (code) => (await request("GET", `/rates/${up(code)}`)).data,
    currencies: () => request("GET", "/currencies"),
    /** from/to: a currency code, IRT (Toman) or IRR (Rial). */
    convert: async (from, to, amount = 1, side = "mid") => (await request("GET", "/convert", { from, to, amount, side })).data,
    history: (code, params) => request("GET", `/history/${up(code)}`, params), // Pro plan
    archive: (code, params) => request("GET", `/archive/${up(code)}`, params), // Pro plan
    ohlc: (code, params) => request("GET", `/ohlc/${up(code)}`, params),
    stats: (code, params) => request("GET", `/stats/${up(code)}`, params),
    snapshot: (code, at) => request("GET", `/snapshot/${up(code)}`, { at }),
    status: () => request("GET", "/status"),
    me: async () => (await request("GET", "/me")).data,
  };
}

export default createClient;
