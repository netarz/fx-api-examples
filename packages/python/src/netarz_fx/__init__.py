"""Python client for the NetArz FX API (Iranian Toman exchange rates).

    from netarz_fx import NetArzFx
    fx = NetArzFx("fx-ntz-v1-...")          # or set NETARZ_FX_KEY
    usd = fx.rate("USD")                     # {"code": "USD", "buy": ..., "sell": ..., ...}
    fx.convert("USD", "IRT", 250)["result"]  # Toman

Standard library only. Docs: https://netarz.ir/docs/fx
"""
from __future__ import annotations

import http.client
import json
import os
import socket
import ssl
import time
from typing import Any, Dict, Iterable, Optional
from urllib.parse import urlencode, urlsplit

__all__ = ["NetArzFx", "NetArzFxError", "__version__"]
__version__ = "0.1.0"

DEFAULT_BASE_URL = "https://netarz.ir/api/fx/v1"


class NetArzFxError(RuntimeError):
    """An error answer from the API (the JSON ``error`` object)."""

    def __init__(self, status: int, error: Dict[str, Any]):
        self.status = status
        self.code = error.get("code")
        self.docs = error.get("docs")
        # Present on ip_not_allowed / origin_required: the address the API saw.
        self.seen_ip = error.get("ip")
        super().__init__(f"{self.code}: {error.get('message')}")


class _IPv4HTTPSConnection(http.client.HTTPSConnection):
    """Connect over IPv4 so the source address is the one you allow-listed."""

    def connect(self) -> None:
        family, socktype, proto, _, addr = socket.getaddrinfo(self.host, self.port, socket.AF_INET, socket.SOCK_STREAM)[0]
        sock = socket.socket(family, socktype, proto)
        sock.settimeout(self.timeout)
        sock.connect(addr)
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


class NetArzFx:
    """A small client with an in-memory cache for GET calls.

    :param key: the app key (``fx-ntz-v1-…``); defaults to ``$NETARZ_FX_KEY``.
    :param ttl: seconds a GET answer is reused; 0 turns the cache off.
    :param ipv4: connect over IPv4 only. Server-side keys are locked to the IPs
        you list on the app; set ``ipv4=False`` if you listed an IPv6 address.
    """

    def __init__(
        self,
        key: Optional[str] = None,
        *,
        base_url: str = DEFAULT_BASE_URL,
        ttl: int = 120,
        timeout: float = 10,
        ipv4: bool = True,
    ):
        key = key or os.environ.get("NETARZ_FX_KEY")
        if not key:
            raise ValueError("Pass an API key or set NETARZ_FX_KEY (create one at https://netarz.ir/fx).")
        self._key = key
        parts = urlsplit(base_url.rstrip("/"))
        self._host, self._port, self._prefix = parts.hostname, parts.port or 443, parts.path
        self._ttl, self._timeout, self._ipv4 = ttl, timeout, ipv4
        self._cache: Dict[str, tuple] = {}

    # -- transport -----------------------------------------------------------

    def _connection(self) -> http.client.HTTPSConnection:
        cls = _IPv4HTTPSConnection if self._ipv4 else http.client.HTTPSConnection
        return cls(self._host, self._port, timeout=self._timeout, context=ssl.create_default_context())

    def request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, body: Any = None) -> Any:
        """Call any endpoint. Returns the decoded JSON (or text for CSV answers)."""
        query = urlencode({k: v for k, v in (params or {}).items() if v is not None})
        target = self._prefix + path + ("?" + query if query else "")

        if method == "GET" and self._ttl:
            hit = self._cache.get(target)
            if hit and time.monotonic() - hit[0] < self._ttl:
                return hit[1]

        headers = {
            "Authorization": f"Bearer {self._key}",
            "Accept": "application/json",
            "User-Agent": f"netarz-fx-python/{__version__}",
        }
        payload = None
        if body is not None:
            payload = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"

        conn = self._connection()
        try:
            conn.request(method, target, body=payload, headers=headers)
            res = conn.getresponse()
            raw = res.read().decode("utf-8")
            ctype = res.getheader("Content-Type", "")
        finally:
            conn.close()

        data: Any = json.loads(raw) if "json" in ctype and raw else raw
        if res.status >= 400:
            error = data.get("error", {}) if isinstance(data, dict) else {"message": raw[:200]}
            raise NetArzFxError(res.status, error)

        if method == "GET" and self._ttl:
            self._cache[target] = (time.monotonic(), data)
        return data

    # -- endpoints -----------------------------------------------------------

    def rates(self, codes: Optional[Iterable[str]] = None) -> Dict[str, Any]:
        """The board: ``{"data": [Rate, …], "meta": {…}}``."""
        return self.request("GET", "/rates", {"codes": ",".join(codes) if codes else None})

    def rate(self, code: str) -> Dict[str, Any]:
        return self.request("GET", f"/rates/{code.upper()}")["data"]

    def currencies(self) -> Dict[str, Any]:
        return self.request("GET", "/currencies")

    def convert(self, source: str, target: str, amount: float = 1, side: str = "mid") -> Dict[str, Any]:
        """Convert between currencies, ``IRT`` (Toman) or ``IRR`` (Rial)."""
        return self.request("GET", "/convert", {"from": source, "to": target, "amount": amount, "side": side})["data"]

    def history(self, code: str, **params: Any) -> Any:
        """``range``, ``from``, ``to``, ``interval``, ``format`` (Pro plan)."""
        return self.request("GET", f"/history/{code.upper()}", params)

    def archive(self, code: str, **params: Any) -> Any:
        """The daily archive: ``date`` or ``from``/``to``, ``format`` (Pro plan)."""
        return self.request("GET", f"/archive/{code.upper()}", params)

    def ohlc(self, code: str, **params: Any) -> Any:
        return self.request("GET", f"/ohlc/{code.upper()}", params)

    def stats(self, code: str, **params: Any) -> Any:
        return self.request("GET", f"/stats/{code.upper()}", params)

    def snapshot(self, code: str, at: str) -> Any:
        return self.request("GET", f"/snapshot/{code.upper()}", {"at": at})

    def status(self) -> Dict[str, Any]:
        return self.request("GET", "/status")

    def me(self) -> Dict[str, Any]:
        """Your app: plan, limits and today's usage."""
        return self.request("GET", "/me")["data"]
