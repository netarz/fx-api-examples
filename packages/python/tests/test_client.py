"""Offline tests: no network, no key. Run with `python -m unittest discover -s tests`."""
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import netarz_fx  # noqa: E402
from netarz_fx import NetArzFx, NetArzFxError  # noqa: E402


class FakeResponse:
    def __init__(self, status, body, ctype="application/json"):
        self.status, self._body, self._ctype = status, body, ctype

    def read(self):
        return self._body.encode()

    def getheader(self, name, default=None):
        return self._ctype if name == "Content-Type" else default


class FakeConnection:
    calls = []
    answer = FakeResponse(200, json.dumps({"data": {"code": "USD", "buy": 1, "sell": 2}, "meta": {}}))

    def __init__(self, *a, **kw):
        pass

    def request(self, method, target, body=None, headers=None):
        FakeConnection.calls.append((method, target, headers))

    def getresponse(self):
        return FakeConnection.answer

    def close(self):
        pass


class ClientTest(unittest.TestCase):
    def setUp(self):
        FakeConnection.calls = []
        patcher = mock.patch.object(NetArzFx, "_connection", lambda self: FakeConnection())
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_requires_a_key(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(ValueError):
                NetArzFx()

    def test_builds_the_url_and_sends_the_bearer_key(self):
        fx = NetArzFx("fx-ntz-v1-test")
        self.assertEqual(fx.rate("usd")["code"], "USD")
        method, target, headers = FakeConnection.calls[0]
        self.assertEqual((method, target), ("GET", "/api/fx/v1/rates/USD"))
        self.assertEqual(headers["Authorization"], "Bearer fx-ntz-v1-test")
        self.assertIn(netarz_fx.__version__, headers["User-Agent"])

    def test_convert_maps_from_and_to(self):
        NetArzFx("k", ttl=0).convert("USD", "IRT", 250)
        self.assertEqual(FakeConnection.calls[0][1], "/api/fx/v1/convert?from=USD&to=IRT&amount=250&side=mid")

    def test_get_answers_are_cached(self):
        fx = NetArzFx("k", ttl=60)
        fx.rate("USD")
        fx.rate("USD")
        self.assertEqual(len(FakeConnection.calls), 1)

    def test_error_answers_raise_with_the_code(self):
        FakeConnection.answer = FakeResponse(403, json.dumps({"error": {"code": "ip_not_allowed", "message": "x", "ip": "203.0.113.7"}}))
        try:
            with self.assertRaises(NetArzFxError) as caught:
                NetArzFx("k", ttl=0).rates(["USD"])
            self.assertEqual((caught.exception.status, caught.exception.code, caught.exception.seen_ip), (403, "ip_not_allowed", "203.0.113.7"))
        finally:
            FakeConnection.answer = FakeResponse(200, json.dumps({"data": {"code": "USD"}, "meta": {}}))


if __name__ == "__main__":
    unittest.main()
