"""A Telegram bot that answers /usd, /eur, /aed ... with Toman rates from the NetArz FX API.

Plain HTTP (requests) and long polling: no bot framework, no webhook, no database.

    pip install -r requirements.txt
    export TELEGRAM_BOT_TOKEN="123456:ABC..."   # from @BotFather
    export NETARZ_FX_KEY="fx-ntz-v1-..."
    python bot.py

Commands:
    /usd  /eur  /aed  /try ...   one currency (any three-letter code on your plan)
    /rates                       a short board
    /convert 100 usd             100 USD in Toman
    /convert 5000000 irt eur     Toman to a currency
    /convert 100 usd aed         currency to currency

The bot runs on a server, so that server's outgoing IP must be in the app's
"IPهای مجاز" list at https://netarz.ir/fx (the app still needs a verified domain
of yours; the bot does not have to live on it).

Quota: the whole board is fetched in ONE request and cached for two minutes, so
a busy group costs at most one API call every two minutes, not one per message.
Docs: https://netarz.ir/docs/fx/rates
"""
from __future__ import annotations

import os
import re
import socket
import time

import requests
import urllib3.util.connection as urllib3_connection

# Force IPv4 so the source IP is the IPv4 address you allow-listed.
# Remove this line if you allow-listed your server's IPv6 address instead.
urllib3_connection.allowed_gai_family = lambda: socket.AF_INET

FX_BASE = "https://netarz.ir/api/fx/v1"
BOARD_TTL = 120  # seconds; rates refresh every few minutes (meta.refresh_interval_minutes)
SHORT_BOARD = ["USD", "EUR", "AED", "GBP", "TRY"]
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

TG_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TG_API = f"https://api.telegram.org/bot{TG_TOKEN}"

fx = requests.Session()
fx.headers["Authorization"] = f"Bearer {os.environ['NETARZ_FX_KEY']}"
tg = requests.Session()

_board: dict = {"at": 0.0, "rates": {}, "meta": {}}


class FxError(RuntimeError):
    pass


def board() -> tuple[dict, dict]:
    """Every currency on the plan, keyed by code, from one cached GET /rates."""
    if time.time() - _board["at"] < BOARD_TTL and _board["rates"]:
        return _board["rates"], _board["meta"]

    try:
        r = fx.get(f"{FX_BASE}/rates", timeout=10)
        body = r.json()
    except (requests.RequestException, ValueError) as e:
        if _board["rates"]:  # stale beats nothing
            return _board["rates"], _board["meta"]
        raise FxError(f"network: {e}") from e

    if not r.ok:
        err = body.get("error", {})
        hint = f" (seen IP: {err['ip']})" if err.get("ip") else ""
        if _board["rates"]:
            print(f"FX API {r.status_code} {err.get('code')}{hint}; serving cached rates")
            return _board["rates"], _board["meta"]
        raise FxError(f"{r.status_code} {err.get('code')}: {err.get('message')}{hint}")

    _board.update(at=time.time(), rates={row["code"]: row for row in body["data"]}, meta=body["meta"])
    return _board["rates"], _board["meta"]


def fa_number(value: float, decimals: int = 0) -> str:
    return f"{value:,.{decimals}f}".replace(",", "٬").replace(".", "٫").translate(FA_DIGITS)


def per_unit(row: dict, field: str) -> float:
    """buy/sell/mid are Toman for `unit` units (e.g. 1000 UZS); this is Toman for one."""
    return row[field] / max(1, row["unit"])


def footer(meta: dict) -> str:
    delay = f" · با {fa_number(meta['delayed_minutes'])} دقیقه تأخیر" if meta.get("is_delayed") else ""
    return f"\nمنبع: نِت اَرز (netarz.ir/rates){delay}"


def rate_line(row: dict) -> str:
    unit = f" (برای {fa_number(row['unit'])} واحد)" if row["unit"] > 1 else ""
    return f"{row['name']} {row['code']}{unit}\nخرید: {fa_number(row['buy'])} تومان\nفروش: {fa_number(row['sell'])} تومان"


def answer_rate(code: str) -> str:
    rates, meta = board()
    row = rates.get(code)
    if not row:
        return f"نرخ {code} را پیدا نکردیم. یا کد اشتباه است یا این ارز در طرح شما نیست (ارزهای ویژه فقط در طرح پرو هستند)."
    return rate_line(row) + footer(meta)


def answer_board() -> str:
    rates, meta = board()
    lines = [f"{r['code']}: خرید {fa_number(r['buy'])} · فروش {fa_number(r['sell'])}" for c in SHORT_BOARD if (r := rates.get(c))]
    return "نرخ به تومان\n" + "\n".join(lines) + footer(meta)


def toman_per(code: str, rates: dict) -> float | None:
    if code in ("IRT", "TOMAN"):
        return 1.0
    if code in ("IRR", "RIAL"):
        return 0.1
    row = rates.get(code)
    return per_unit(row, "mid") if row else None


def answer_convert(args: list[str]) -> str:
    usage = "نمونه: /convert 100 usd یا /convert 5000000 irt eur"
    if len(args) < 2:
        return usage
    try:
        amount = float(args[0].translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")).replace(",", ""))
    except ValueError:
        return usage
    source, target = args[1].upper(), (args[2].upper() if len(args) > 2 else "IRT")

    rates, meta = board()
    a, b = toman_per(source, rates), toman_per(target, rates)
    if a is None or b is None:
        return f"یکی از این ارزها را پیدا نکردیم: {source}، {target}"

    result = amount * a / b
    decimals = 0 if target in ("IRT", "IRR", "TOMAN", "RIAL") else 2
    return f"{fa_number(amount, 2 if amount % 1 else 0)} {source} = {fa_number(result, decimals)} {target}\n(با نرخ میانگین بازار)" + footer(meta)


HELP = (
    "نرخ ارز به تومان.\n"
    "/usd /eur /aed /try: نرخ یک ارز\n"
    "/rates: چند ارز پرکاربرد\n"
    "/convert 100 usd: تبدیل به تومان"
)


def handle(text: str) -> str | None:
    parts = text.strip().split()
    if not parts or not parts[0].startswith("/"):
        return None
    command = parts[0][1:].split("@", 1)[0].lower()  # "/usd@MyBot" in groups

    try:
        if command in ("start", "help"):
            return HELP
        if command == "rates":
            return answer_board()
        if command == "convert":
            return answer_convert(parts[1:])
        if re.fullmatch(r"[a-z]{3}", command):
            return answer_rate(command.upper())
    except FxError as e:
        print("FX API error:", e)  # details for you, not for the chat
        return "الان نرخ در دسترس نیست. چند دقیقهٔ دیگر دوباره امتحان کنید."
    return None


def main() -> None:
    offset = 0
    print("Bot is running. Ctrl+C to stop.")
    while True:
        try:
            r = tg.get(f"{TG_API}/getUpdates", params={"timeout": 50, "offset": offset, "allowed_updates": '["message"]'}, timeout=60)
            updates = r.json().get("result", [])
        except (requests.RequestException, ValueError) as e:
            print("Telegram poll failed:", e)
            time.sleep(5)
            continue

        for update in updates:
            offset = update["update_id"] + 1
            message = update.get("message") or {}
            reply = handle(message.get("text", ""))
            if reply:
                tg.post(
                    f"{TG_API}/sendMessage",
                    json={"chat_id": message["chat"]["id"], "text": reply, "reply_to_message_id": message["message_id"]},
                    timeout=10,
                )


if __name__ == "__main__":
    main()
