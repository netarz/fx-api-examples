"""A small Python client for the NetArz FX API, with a short in-memory cache.

pip install requests
export NETARZ_FX_KEY="fx-ntz-v1-..."
python netarz_fx.py

Server-side calls must come from an IP listed on the app in https://netarz.ir/fx
Docs: https://netarz.ir/docs/fx/sdks
"""
from __future__ import annotations

import os
import socket
import time

import requests
import urllib3.util.connection as urllib3_connection

# Force IPv4 so the source IP is the IPv4 address you allow-listed.
# Remove these two lines if you allow-listed your server's IPv6 address instead.
urllib3_connection.allowed_gai_family = lambda: socket.AF_INET


class NetArzFxError(RuntimeError):
    def __init__(self, status: int, error: dict):
        self.status = status
        self.code = error.get("code")
        self.seen_ip = error.get("ip")  # present on ip_not_allowed / origin_required
        super().__init__(f"{self.code}: {error.get('message')}")


class NetArzFx:
    BASE = "https://netarz.ir/api/fx/v1"

    def __init__(self, key: str | None = None, ttl: int = 120):
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {key or os.environ['NETARZ_FX_KEY']}"
        self.ttl = ttl
        self._cache: dict[str, tuple[float, dict]] = {}

    def _get(self, path: str, **params) -> dict:
        cache_key = path + repr(sorted(params.items()))
        hit = self._cache.get(cache_key)
        if hit and time.time() - hit[0] < self.ttl:
            return hit[1]

        r = self.session.get(self.BASE + path, params={k: v for k, v in params.items() if v is not None}, timeout=10)
        body = r.json()
        if not r.ok:
            raise NetArzFxError(r.status_code, body.get("error", {}))
        self._cache[cache_key] = (time.time(), body)
        return body

    def rates(self, codes: list[str] | None = None) -> dict:
        return self._get("/rates", codes=",".join(codes) if codes else None)

    def rate(self, code: str) -> dict:
        return self._get(f"/rates/{code.upper()}")["data"]

    def convert(self, source: str, target: str, amount: float = 1, side: str = "mid") -> dict:
        return self._get("/convert", **{"from": source, "to": target, "amount": amount, "side": side})["data"]

    def me(self) -> dict:
        return self._get("/me")["data"]


if __name__ == "__main__":
    fx = NetArzFx()
    try:
        board = fx.rates(["USD", "EUR", "AED"])
    except NetArzFxError as e:
        print(e, f"(add this IP in the panel: {e.seen_ip})" if e.seen_ip else "")
        raise SystemExit(1)

    for row in board["data"]:
        print(row["code"], row["buy"], row["sell"], "per", row["unit"])
    print("as of", board["meta"]["as_of"], "| plan:", board["meta"]["plan"])
    print("250 USD =", fx.convert("USD", "IRT", 250)["result"], "Toman")
