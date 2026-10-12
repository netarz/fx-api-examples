# netarz-fx

JavaScript client for the [NetArz FX API](https://netarz.ir/fx-api): Tehran open-market exchange rates in Iranian Toman for USD, EUR, AED, TRY, GBP and the other currencies on the [NetArz rate board](https://netarz.ir/rates), with buy/sell prices, a converter and, on the Pro plan, history and the daily archive.

No dependencies. Works in Node 18+, Deno, Bun and the browser (global `fetch`). TypeScript types included.

```bash
# npm release coming soon (npm install netarz-fx). Until then, copy index.js and index.d.ts
# from this folder into your project; they have no dependencies.
export NETARZ_FX_KEY="fx-ntz-v1-..."   # create a free key at https://netarz.ir/fx
```

```js
import { createClient, NetArzFxError } from "./index.js";   // "netarz-fx" once it is on npm

const fx = createClient(); // reads NETARZ_FX_KEY, or createClient({ key })
const usd = await fx.rate("USD");
console.log(usd.buy, usd.sell); // Toman

console.log((await fx.convert("USD", "IRT", 250)).result); // 250 dollars in Toman

try {
  await fx.history("USD", { range: "30d", interval: "1d" }); // Pro plan
} catch (e) {
  if (e instanceof NetArzFxError) console.log(e.status, e.code, e.docs);
}
```

## Things to know

- **Keys are locked.** A browser key works only on the domain registered on the app; a server-side key only from the IP addresses you list. When the API refuses an address, `error.seenIp` tells you which one it saw. In Node, if your server has both IPv4 and IPv6, list the address it actually leaves from.
- **Free and Pro.** The free plan needs only an account and returns delayed rates. Pro returns live rates and unlocks history, OHLC, stats and the archive. See [plans](https://netarz.ir/docs/fx/plans).
- **Cache.** GET answers are reused for `ttl` seconds (default 120) to keep you inside your quota. `ttl: 0` turns it off.
- Want a ready-made board instead of code? Use the [widget](https://netarz.ir/docs/fx/widget).
- Rates are for information; NetArz does not buy or sell these currencies.

Docs: [netarz.ir/docs/fx](https://netarz.ir/docs/fx) · Reference: [netarz.ir/docs/fx/reference](https://netarz.ir/docs/fx/reference) · More examples: [github.com/netarz/fx-api-examples](https://github.com/netarz/fx-api-examples)

## فارسی

کتابخانهٔ جاوااسکریپت برای [API نرخ ارز نِت اَرز](https://netarz.ir/fx-api): نرخ خرید و فروش دلار، یورو، درهم، لیر و ارزهای دیگر به تومان، همراه مبدل ارز. وابستگی ندارد و در Node.js، مرورگر، Deno و Bun کار می‌کند. کلید رایگان را از [پنل API نرخ ارز](https://netarz.ir/fx) بگیرید.

MIT License · NetArz
