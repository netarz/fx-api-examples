#!/usr/bin/env bash
# Pro-plan endpoints. On the free plan these answer 402 pro_required (with upgrade_url).
# Docs: https://netarz.ir/docs/fx/history , /docs/fx/ohlc-and-stats , /docs/fx/streaming
set -euo pipefail
: "${NETARZ_FX_KEY:?Set NETARZ_FX_KEY first}"
API=https://netarz.ir/api/fx/v1
AUTH="Authorization: Bearer $NETARZ_FX_KEY"

echo "== last 30 days of USD, one point per day"
curl -sS -4 "$API/history/USD?range=30d&interval=1d" -H "$AUTH" | head -c 800; echo

echo "== the same as CSV (for Excel / Sheets)"
curl -sS -4 "$API/history/USD?range=30d&interval=1d&format=csv" -H "$AUTH" | head -5

echo "== daily archive for a date range (Gregorian or Jalali YYYY-MM-DD)"
curl -sS -4 "$API/archive/USD?from=1404-01-01&to=1404-01-31" -H "$AUTH" | head -c 600; echo

echo "== daily candles and range stats"
curl -sS -4 "$API/ohlc/EUR?range=90d&period=1d" -H "$AUTH" | head -c 400; echo
curl -sS -4 "$API/stats/EUR?range=90d" -H "$AUTH"; echo

echo "== live stream (Server-Sent Events); Ctrl+C to stop"
curl -sS -4 -N "$API/stream?codes=USD,EUR" -H "$AUTH"
