#!/usr/bin/env bash
# FX API basics with cURL. Server-side calls (no Origin header) must come from an
# IP you listed under "IPهای مجاز" for the app in https://netarz.ir/fx
#
# Usage: NETARZ_FX_KEY=fx-ntz-v1-... ./rates.sh
# Docs:  https://netarz.ir/docs/fx/rates , /docs/fx/convert
set -euo pipefail
: "${NETARZ_FX_KEY:?Set NETARZ_FX_KEY first}"
API=https://netarz.ir/api/fx/v1
AUTH="Authorization: Bearer $NETARZ_FX_KEY"

# -4 forces IPv4, so the IP NetArz sees is the IPv4 address you allow-listed.
# Drop it if you allow-listed your server's IPv6 address instead.
CURL="curl -sS -4"

echo "== several currencies in one call (cheaper than one call each)"
$CURL "$API/rates?codes=USD,EUR,AED,TRY" -H "$AUTH"; echo

echo "== one currency (prices are in Toman for 'unit' units of the currency)"
$CURL "$API/rates/USD" -H "$AUTH"; echo

echo "== convert: 250 USD to Toman (side = mid | buy | sell)"
$CURL "$API/convert?from=USD&to=IRT&amount=250" -H "$AUTH"; echo

echo "== currency catalogue (no prices)"
$CURL "$API/currencies" -H "$AUTH" | head -c 600; echo

echo "== which app, plan and quota this key uses"
$CURL "$API/me" -H "$AUTH"; echo

echo "== service status (for your monitoring)"
$CURL "$API/status" -H "$AUTH"; echo

echo "== response headers: plan, delay and quota"
$CURL -D - -o /dev/null "$API/rates/USD" -H "$AUTH" | grep -i -E '^x-(fx|quota)'
