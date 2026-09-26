# نمونه‌کد وب‌سرویس نرخ ارز (API نرخ ارز) نِت اَرز

نمونه‌کدهای آماده برای نمایش **نرخ دلار و ارزهای دیگر به تومان** در سایت، اپ، ربات یا صفحه‌گسترده، با
[API نرخ ارز نِت اَرز](https://netarz.ir/fx-api) (وب سرویس نرخ ارز). نرخ‌ها همان اعداد [تابلوی نرخ ارز](https://netarz.ir/rates) هستند:
خرید، فروش و میانگین بازار هر ارز، به‌علاوهٔ مبدل ارز به تومان، تومان به ارز و ارز به ارز.

- نشانی پایه: `https://netarz.ir/api/fx/v1`
- کلید: `Authorization: Bearer fx-ntz-v1-…` (یا هدر `X-API-Key`)
- مستندات: [netarz.ir/docs/fx](https://netarz.ir/docs/fx) · مرجع تعاملی: [netarz.ir/docs/fx/reference](https://netarz.ir/docs/fx/reference)

```bash
curl -4 "https://netarz.ir/api/fx/v1/rates?codes=USD,EUR,AED" \
  -H "Authorization: Bearer $NETARZ_FX_KEY"
```

## راه‌اندازی در سه قدم

1. در [نِت اَرز](https://netarz.ir) ثبت‌نام کنید و از پنل [/fx](https://netarz.ir/fx) یک «اپ» بسازید: یک نام و دامنه‌ای که
   از آن درخواست می‌فرستید. کلید `fx-ntz-v1-…` را فقط همان یک بار می‌بینید.
2. **مالکیت دامنه را تأیید کنید:** رکورد TXT روی `_netarz.<دامنه>`، یا فایل `/.well-known/netarz-fx-verify.txt`.
   فایل آماده را از صفحهٔ اپ دانلود کنید و بدون ویرایش آپلود کنید؛ تایپ دستی کد شایع‌ترین علت تأیید نشدن است.
   برای تست محلی، `localhost` خودکار تأیید می‌شود.
3. **اگر از سرور درخواست می‌فرستید**، IP خروجی سرور را در «IPهای مجاز» اپ بگذارید. درخواست مرورگر با دامنه
   سنجیده می‌شود و درخواست سرور با IP.

اگر سرور شما IP ثابت ندارد (هاست اشتراکی، Cloudflare Workers، Vercel، Google Sheets) یا با وجود ثبت IP خطای
`ip_not_allowed` می‌گیرید، راهنمای [قفل دامنه و IP](guides/domain-and-ip-allow-list.md) را بخوانید؛ دام IPv6 هم همان‌جاست.

## فهرست نمونه‌ها

| پوشه / فایل | کاربرد | راهنمای مربوط |
|---|---|---|
| [`curl/rates.sh`](curl/rates.sh) | نرخ، یک ارز، مبدل، فهرست ارزها، وضعیت کلید و سهمیه | [نرخ‌ها](https://netarz.ir/docs/fx/rates) · [مبدل](https://netarz.ir/docs/fx/convert) |
| [`curl/pro-history.sh`](curl/pro-history.sh) | تاریخچه، آرشیو روزانه (تاریخ شمسی هم پذیرفته می‌شود)، کندل، آمار و استریم؛ طرح پرو | [تاریخچه](https://netarz.ir/docs/fx/history) |
| [`javascript/browser/`](javascript/browser/) | جدول نرخ در صفحهٔ سایت، مستقیم از مرورگر، با کش کوتاه | [قفل دامنه](https://netarz.ir/docs/fx/domain-lock) |
| [`javascript/node/rates.mjs`](javascript/node/rates.mjs) | Node.js بدون وابستگی، با کش | [SDKها](https://netarz.ir/docs/fx/sdks) |
| [`python/netarz_fx.py`](python/netarz_fx.py) | کلاینت پایتون با کش و پیام خطای روشن | [SDKها](https://netarz.ir/docs/fx/sdks) |
| [`php/rates.php`](php/rates.php) | PHP خالص برای هاست اشتراکی، با کش فایل و آخرین مقدار سالم | [نرخ‌ها](https://netarz.ir/docs/fx/rates) |
| [`laravel/app/Services/NetArzFx.php`](laravel/app/Services/NetArzFx.php) | سرویس لاراول با `Cache::remember` و نسخهٔ پشتیبان | [SDKها](https://netarz.ir/docs/fx/sdks) |
| [`wordpress/netarz-fx-snippet.php`](wordpress/netarz-fx-snippet.php) | کد کوتاه `[netarz_usd]` برای functions.php | [افزونهٔ کامل وردپرس](https://github.com/netarz/netarz-fx-wordpress) |
| [`google-sheets/Code.gs`](google-sheets/Code.gs) | تابع `=NETARZ_RATE("USD")` در Google Sheets | [نرخ دلار در اکسل و گوگل شیت](https://netarz.ir/wiki/dollar-rate-excel-google-sheets) |
| [`excel-power-query/netarz-rates.pq`](excel-power-query/netarz-rates.pq) | نرخ در Excel و Power BI با Power Query | [نرخ دلار در اکسل و گوگل شیت](https://netarz.ir/wiki/dollar-rate-excel-google-sheets) |
| [`relay/fx-relay.php`](relay/fx-relay.php) | رله روی یک سرور با IP ثابت، برای جاهایی که IP ثابت ندارند؛ JSON یا CSV | [راهنمای قفل IP](guides/domain-and-ip-allow-list.md) |

## داده‌ای که می‌گیرید

- `buy`، `sell` و `mid` به **تومان** و برای `unit` واحد از آن ارز است. بیشتر ارزها `unit: 1` دارند؛ برای ارزی مثل
  دینار عراق قیمت برای ۱۰۰ واحد است. قیمت یک واحد = مقدار ÷ `unit`.
- `buy` و `sell` از دید صرافی است (buy یعنی صرافی می‌خرد). نرخ‌ها اطلاع‌رسانی‌اند؛ برای تصمیم مالی منبع خودتان را هم داشته باشید.
- `meta.as_of` زمان واقعی نرخ است و `meta.delayed_minutes` تأخیر طرح شما.
- هدرهای `X-FX-Plan`، `X-Quota-Limit`، `X-Quota-Remaining` و `X-Quota-Reset` وضعیت سهمیه را می‌گویند.

## رایگان و پرو

طرح رایگان فقط عضویت می‌خواهد: نرخ همهٔ ارزها با تأخیر، مبدل، فهرست ارزها و ویجت. طرح پرو را برای هر اپ جدا
می‌خرید و نرخ زنده، تاریخچه و آرشیو روزانه، کندل، آمار، هشدار قیمت با وبهوک و استریم زنده دارد. در زمان نوشتن این
راهنما طرح رایگان ۱۵ دقیقه تأخیر، ۶۰ درخواست در دقیقه و ۳٬۰۰۰ درخواست در روز دارد و طرح پرو ۵ دلار در ماه برای هر اپ است.
این اعداد ممکن است تغییر کنند؛ مرجع، صفحهٔ [طرح‌ها](https://netarz.ir/docs/fx/plans) است.

## مصرف را پایین نگه دارید

- **کش کنید.** نرخ هر چند دقیقه یک بار تازه می‌شود (`meta.refresh_interval_minutes`). کش ۱ تا ۵ دقیقه‌ای سمت شما
  کافی است و همهٔ نمونه‌های این مخزن آن را دارند.
- **چند ارز را در یک درخواست بگیرید:** `/rates?codes=USD,EUR,AED` به‌جای سه درخواست جدا.
- اگر پاسخ ۴۲۹ گرفتید، به اندازهٔ `Retry-After` صبر کنید و بعد دوباره بفرستید.

## خطاهای رایج

| کد | یعنی |
|---|---|
| `401 missing_api_key` / `invalid_api_key` | کلید نرسیده یا اشتباه است |
| `403 domain_not_verified` | تأیید مالکیت دامنه انجام نشده |
| `403 origin_not_allowed` | صفحه روی دامنه‌ای است که روی اپ نیست |
| `403 origin_required` / `ip_not_allowed` | درخواست از سروری آمده که IP آن مجاز نیست (پاسخ فیلد `ip` دارد) |
| `402 pro_required` | این امکان فقط در طرح پرو است |
| `429 rate_limit_exceeded` / `daily_quota_exceeded` | سقف دقیقه‌ای یا سهمیهٔ روزانه پر شده |

فهرست کامل: [netarz.ir/docs/fx/errors](https://netarz.ir/docs/fx/errors)

## پشتیبانی

- اشکال در کد همین مخزن: بخش Issues.
- اپ، کلید، تأیید دامنه و طرح پرو: تیکت از پنل نِت اَرز یا ایمیل `support@netarz.ir`. شناسهٔ اپ و متن کامل پاسخ خطا را بفرستید.

مجوز: [MIT](LICENSE)

---

## English

**NetArz FX API examples.** Code for showing exchange rates in Iranian Toman (USD, EUR, AED, TRY and more) on
websites, apps, bots and spreadsheets, using the [NetArz FX API](https://netarz.ir/fx-api). The rates are the
same as on the [NetArz rate board](https://netarz.ir/rates); pegged currencies use a fixed parity and the rest are fetched daily.

- Base URL `https://netarz.ir/api/fx/v1`; auth `Authorization: Bearer fx-ntz-v1-…` or `X-API-Key` (never `?key=`).
- Endpoints: `/rates`, `/rates/{code}`, `/convert`, `/currencies`, `/me`, `/status`; Pro: `/history/{code}`,
  `/archive/{code}` (accepts Gregorian or Jalali dates), `/ohlc/{code}`, `/stats/{code}`, `/snapshot/{code}`,
  `/stream` (SSE), `/alerts` (signed webhooks).
- **Domain lock:** browser calls are checked by `Origin`/`Referer` against the app's verified domains; server calls
  (no `Origin`) by the caller's IP against the app's allowed IPs. See [guides/domain-and-ip-allow-list.md](guides/domain-and-ip-allow-list.md)
  for servers without a fixed IP and the IPv6 trap.
- `buy`/`sell`/`mid` are Toman per `unit` units of the currency; `meta.as_of` is the rate's real time.
- Free plan (membership only): delayed rates, converter, currency list, widget. Pro (per app, monthly): live rates,
  history and daily archive, OHLC, stats, alerts, SSE stream. Current limits: <https://netarz.ir/docs/fx/plans>.
- Cache 1 to 5 minutes on your side; rates refresh every few minutes.

Docs: <https://netarz.ir/docs/fx> · Service: <https://netarz.ir/fx-api> · Live board: <https://netarz.ir/rates>

Rates are informational. Licensed under MIT.
