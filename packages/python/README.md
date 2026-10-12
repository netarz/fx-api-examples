# netarz-fx

Python client for the [NetArz FX API](https://netarz.ir/fx-api): Tehran open-market exchange rates in Iranian Toman for USD, EUR, AED, TRY, GBP and the other currencies on the [NetArz rate board](https://netarz.ir/rates), with buy/sell prices, a converter and, on the Pro plan, history and the daily archive.

Standard library only (no `requests`), Python 3.8+.

```bash
pip install "git+https://github.com/netarz/fx-api-examples#subdirectory=packages/python"
# PyPI release coming soon: pip install netarz-fx
export NETARZ_FX_KEY="fx-ntz-v1-..."   # create a free key at https://netarz.ir/fx
```

```python
from netarz_fx import NetArzFx, NetArzFxError

fx = NetArzFx()                      # reads NETARZ_FX_KEY
usd = fx.rate("USD")
print(usd["buy"], usd["sell"])       # Toman

print(fx.convert("USD", "IRT", 250)["result"])    # 250 dollars in Toman
board = fx.rates(["USD", "EUR", "AED"])
print(board["meta"]["as_of"], board["meta"]["plan"])

try:
    fx.history("USD", range="30d", interval="1d")  # Pro plan
except NetArzFxError as e:
    print(e.status, e.code, e.docs)
```

## Things to know

- **Keys are locked.** A server-side key answers only from the IP addresses you list on the app; a browser key only on your registered domain. The client connects over IPv4 by default so the source address matches what you listed. Pass `ipv4=False` if you listed an IPv6 address. When the API refuses an address, `NetArzFxError.seen_ip` tells you which one it saw.
- **Free and Pro.** The free plan needs only an account and returns delayed rates. Pro returns live rates and unlocks history, OHLC, stats and the archive. See [plans](https://netarz.ir/docs/fx/plans).
- **Cache.** GET answers are reused for `ttl` seconds (default 120) to keep you inside your quota. `ttl=0` turns it off.
- Rates are for information; NetArz does not buy or sell these currencies.

Docs: [netarz.ir/docs/fx](https://netarz.ir/docs/fx) · Reference: [netarz.ir/docs/fx/reference](https://netarz.ir/docs/fx/reference) · More examples: [github.com/netarz/fx-api-examples](https://github.com/netarz/fx-api-examples)

## فارسی

کتابخانهٔ پایتون برای [API نرخ ارز نِت اَرز](https://netarz.ir/fx-api): نرخ خرید و فروش دلار، یورو، درهم، لیر و ارزهای دیگر به تومان، همراه مبدل ارز. فقط کتابخانه‌های استاندارد پایتون را لازم دارد. کلید رایگان را از [پنل API نرخ ارز](https://netarz.ir/fx) بگیرید. کلید سمت سرور فقط از IP‌هایی که در پنل ثبت کرده‌اید جواب می‌گیرد.

MIT License · NetArz
