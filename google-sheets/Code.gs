/**
 * NetArz FX rates in Google Sheets.
 *
 * Apps Script (UrlFetchApp) sends requests from Google's servers, whose IPs
 * change and are shared with everyone. You cannot allow-list them safely, so
 * this script calls YOUR relay (../relay/fx-relay.php) on a server with a
 * fixed IP; the relay holds the NetArz key.
 *
 * Setup: Extensions > Apps Script, paste this file, then
 *   Project Settings > Script properties:
 *     RELAY_URL   = https://your-server.example/fx-relay.php
 *     RELAY_TOKEN = the FX_RELAY_TOKEN you set on the relay
 *
 * In a cell:
 *   =NETARZ_RATE("USD")            sell rate in Toman
 *   =NETARZ_RATE("EUR"; "buy")     buy | sell | mid
 *   =NETARZ_CONVERT(100; "USD"; "IRT")
 *
 * Without Apps Script: =IMPORTDATA("https://your-server.example/fx-relay.php?token=...&codes=USD,EUR&format=csv")
 */

function relay_(params) {
  const props = PropertiesService.getScriptProperties();
  const base = props.getProperty('RELAY_URL');
  const token = props.getProperty('RELAY_TOKEN');
  if (!base || !token) throw new Error('Set RELAY_URL and RELAY_TOKEN in Script properties.');

  const query = Object.keys(params)
    .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
  const cacheKey = 'fx:' + query;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(cacheKey);
  if (hit) return JSON.parse(hit);

  const res = UrlFetchApp.fetch(base + '?token=' + encodeURIComponent(token) + '&' + query, { muteHttpExceptions: true });
  const body = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error((body.error && body.error.code) || 'relay error');
  cache.put(cacheKey, JSON.stringify(body), 180);
  return body;
}

/**
 * Rate of one currency in Toman (for `unit` units; most currencies have unit 1).
 * @param {string} code ISO code, e.g. "USD"
 * @param {string} side "sell" (default), "buy" or "mid"
 * @customfunction
 */
function NETARZ_RATE(code, side) {
  const body = relay_({ codes: String(code).toUpperCase() });
  const row = body.data[0];
  if (!row) throw new Error('Unknown currency: ' + code);
  return row[side || 'sell'];
}

/**
 * Convert an amount between currencies (IRT = Toman, IRR = Rial).
 * @customfunction
 */
function NETARZ_CONVERT(amount, from, to, side) {
  const body = relay_({ convert: 1, from: from, to: to, amount: amount, side: side || 'mid' });
  return body.data.result;
}
