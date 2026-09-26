// Node.js 18+ (no dependencies). Server-side calls carry no Origin header,
// so this machine's outgoing IP must be in the app's "IPهای مجاز" list.
//
// NETARZ_FX_KEY=fx-ntz-v1-... node rates.mjs
// Docs: https://netarz.ir/docs/fx/sdks
import dns from "node:dns";

// Prefer IPv4 so the source address matches the IPv4 you allow-listed.
// (netarz.ir also has IPv6; a dual-stack server would otherwise often use it.)
dns.setDefaultResultOrder("ipv4first");

const BASE = "https://netarz.ir/api/fx/v1";
const headers = { Authorization: `Bearer ${process.env.NETARZ_FX_KEY}` };

let cache = { at: 0, body: null };
const TTL_MS = 2 * 60 * 1000;

export async function board(codes = ["USD", "EUR", "AED"]) {
  if (cache.body && Date.now() - cache.at < TTL_MS) return cache.body;

  const res = await fetch(`${BASE}/rates?codes=${codes.join(",")}`, { headers });
  const body = await res.json();
  if (!res.ok) {
    const { code, message, ip } = body.error ?? {};
    // ip_not_allowed / origin_required include the IP NetArz saw: add exactly that one in the panel.
    throw new Error(`${code}: ${message}${ip ? ` (seen IP: ${ip})` : ""}`);
  }
  cache = { at: Date.now(), body };
  return body;
}

const { data, meta } = await board();
for (const r of data) console.log(`${r.code}\tbuy ${r.buy}\tsell ${r.sell}\t${r.change_24h_percent ?? "-"}%`);
console.log("as of", meta.as_of, meta.is_delayed ? `(delayed ${meta.delayed_minutes} min)` : "(live)");
