// Toman <-> USD / EUR / AED converter that works from ONE GET /rates response.
//
// Why not call /convert for every amount? You can, and for a single conversion
// it is the simplest route. But a price list, a checkout page or a calculator
// that converts many amounts should fetch the board once, cache it, and do the
// arithmetic locally: one API call instead of hundreds.
//
// Node.js 18+, no dependencies. Server-side, so this machine's outgoing IP must
// be in the app's "IPهای مجاز" list at https://netarz.ir/fx
//
//   export NETARZ_FX_KEY=fx-ntz-v1-...
//   node toman-converter.mjs 250 USD              # 250 USD in Toman
//   node toman-converter.mjs 10000000 IRT EUR     # 10,000,000 Toman in EUR
//   node toman-converter.mjs 100 AED USD sell     # side: mid (default) | buy | sell
//
// Docs: https://netarz.ir/docs/fx/convert , https://netarz.ir/docs/fx/rates
import dns from "node:dns";
import { pathToFileURL } from "node:url";

dns.setDefaultResultOrder("ipv4first"); // match the IPv4 address you allow-listed

const BASE = "https://netarz.ir/api/fx/v1";
const TTL_MS = 2 * 60 * 1000;
let cache = { at: 0, key: "", body: null };

/** GET /rates for the given codes, cached for two minutes. */
export async function fetchBoard(codes = ["USD", "EUR", "AED"], key = process.env.NETARZ_FX_KEY) {
  const url = `${BASE}/rates?codes=${codes.join(",")}`;
  if (cache.body && cache.key === url && Date.now() - cache.at < TTL_MS) return cache.body;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
  const body = await res.json();
  if (!res.ok) {
    const { code, message, ip } = body.error ?? {};
    throw new Error(`${res.status} ${code}: ${message}${ip ? ` (seen IP: ${ip})` : ""}`);
  }
  cache = { at: Date.now(), key: url, body };
  return body;
}

/**
 * Toman for ONE unit of `code` on the given side. `buy`/`sell` are from the
 * exchange's point of view and, like every price in the response, are quoted
 * for `unit` units of the currency (e.g. 1000 for UZS), so divide by `unit`.
 */
function tomanPerUnit(board, code, side) {
  if (code === "IRT") return 1;
  if (code === "IRR") return 0.1; // 1 Toman = 10 Rial
  const row = board.data.find((r) => r.code === code);
  if (!row) throw new Error(`${code} is not in this board: add it to the codes you fetch`);
  return row[side] / Math.max(1, row.unit);
}

/**
 * Same rule as GET /convert:
 * - side "mid": the market mid on both legs.
 * - side "buy": the exchange BUYS `from` from you (its buy price) and SELLS you `to` (its sell price).
 * - side "sell": the reverse.
 * So "I have 100 USD, how many Toman do I get?" is side "buy"; "how many
 * Toman do I need for 100 USD?" is 100 USD with side "sell".
 */
export function convert(board, amount, from, to = "IRT", side = "mid") {
  if (!["mid", "buy", "sell"].includes(side)) throw new Error("side must be mid, buy or sell");
  const opposite = { mid: "mid", buy: "sell", sell: "buy" }[side];
  const rate = tomanPerUnit(board, from.toUpperCase(), side) / tomanPerUnit(board, to.toUpperCase(), opposite);
  const result = amount * rate;
  const whole = ["IRT", "IRR"].includes(to.toUpperCase());
  return { from: from.toUpperCase(), to: to.toUpperCase(), amount, side, rate, result: whole ? Math.round(result) : Math.round(result * 10000) / 10000 };
}

// Run as a script (not when imported).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [amountArg = "1", from = "USD", to = "IRT", side = "mid"] = process.argv.slice(2);
  if (!process.env.NETARZ_FX_KEY) {
    console.error("Set NETARZ_FX_KEY first (create an app at https://netarz.ir/fx).");
    process.exit(2);
  }
  const codes = [...new Set(["USD", "EUR", "AED", from.toUpperCase(), to.toUpperCase()])].filter((c) => !["IRT", "IRR"].includes(c));

  try {
    const board = await fetchBoard(codes);
    const out = convert(board, Number(amountArg), from, to, side);
    const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
    console.log(`${fmt.format(out.amount)} ${out.from} = ${fmt.format(out.result)} ${out.to}  (side: ${out.side})`);

    // The same board answers any other pair without another request:
    console.log("1 USD =", fmt.format(convert(board, 1, "USD").result), "Toman |",
      "1 EUR =", fmt.format(convert(board, 1, "EUR").result), "Toman |",
      "1 AED =", fmt.format(convert(board, 1, "AED").result), "Toman");
    console.log("as of", board.meta.as_of, board.meta.is_delayed ? `(delayed ${board.meta.delayed_minutes} min)` : "(live)");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
