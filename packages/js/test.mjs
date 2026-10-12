// Offline tests: no network, no key. `node --test test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient, NetArzFxError } from "./index.js";

function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}

test("requires a key", () => {
  const saved = process.env.NETARZ_FX_KEY;
  delete process.env.NETARZ_FX_KEY;
  assert.throws(() => createClient());
  if (saved !== undefined) process.env.NETARZ_FX_KEY = saved;
});

test("builds the url and sends the bearer key", async () => {
  const f = fakeFetch(200, { data: { code: "USD", buy: 1, sell: 2 }, meta: {} });
  const fx = createClient({ key: "fx-ntz-v1-test", fetch: f });
  assert.equal((await fx.rate("usd")).code, "USD");
  assert.equal(f.calls[0].url, "https://netarz.ir/api/fx/v1/rates/USD");
  assert.equal(f.calls[0].init.headers.Authorization, "Bearer fx-ntz-v1-test");
});

test("convert maps from and to, and GET answers are cached", async () => {
  const f = fakeFetch(200, { data: { result: 25600000 }, meta: {} });
  const fx = createClient({ key: "k", fetch: f });
  await fx.convert("USD", "IRT", 250);
  await fx.convert("USD", "IRT", 250);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "https://netarz.ir/api/fx/v1/convert?from=USD&to=IRT&amount=250&side=mid");
});

test("error answers throw with the code and the seen ip", async () => {
  const f = fakeFetch(403, { error: { code: "ip_not_allowed", message: "x", ip: "203.0.113.7" } });
  const fx = createClient({ key: "k", ttl: 0, fetch: f });
  await assert.rejects(fx.rates(["USD"]), (e) => e instanceof NetArzFxError && e.status === 403 && e.code === "ip_not_allowed" && e.seenIp === "203.0.113.7");
});
