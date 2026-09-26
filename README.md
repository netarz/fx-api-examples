<div align="center">

# نمونه‌کد وب‌سرویس نرخ ارز (API نرخ ارز) نِت اَرز

**نرخ دلار، یورو، درهم، لیر و ارزهای دیگر به تومان، برای سایت، اپ، ربات و صفحه‌گسترده.**

Iranian Toman exchange rate API examples: USD, EUR, AED, TRY and more in PHP, JavaScript, Python, Laravel, WordPress, Google Sheets and Excel.

[![License: MIT](https://img.shields.io/badge/license-MIT-ffc700?style=flat-square&labelColor=14161f)](LICENSE)
[![Free plan](https://img.shields.io/badge/free%20plan-membership%20only-ffc700?style=flat-square&labelColor=14161f)](https://netarz.ir/docs/fx/plans?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header)
[![PHP](https://img.shields.io/badge/PHP-ffc700?style=flat-square&labelColor=14161f&logo=php&logoColor=white)](php/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ffc700?style=flat-square&labelColor=14161f&logo=javascript&logoColor=white)](javascript/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-ffc700?style=flat-square&labelColor=14161f&logo=python&logoColor=white)](python/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-ffc700?style=flat-square&labelColor=14161f&logo=googlesheets&logoColor=white)](google-sheets/)
[![Docs](https://img.shields.io/badge/docs-netarz.ir%2Fdocs%2Ffx-ffc700?style=flat-square&labelColor=14161f)](https://netarz.ir/docs/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header)

[معرفی سرویس](https://netarz.ir/fx-api?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header) · [مستندات](https://netarz.ir/docs/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header) · [تابلوی نرخ ارز](https://netarz.ir/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header) · [ساخت کلید](https://netarz.ir/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=header) · [English](#english)

</div>

<a id="intro"></a>

این مخزن نمونه‌کدهای آماده برای **API نرخ ارز نِت اَرز** (وب سرویس نرخ ارز) را دارد. نرخ‌ها همان اعداد
[تابلوی نرخ ارز](https://netarz.ir/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=intro) هستند: خرید، فروش و میانگین بازار هر ارز، به‌علاوهٔ مبدل ارز به تومان،
تومان به ارز و ارز به ارز. طرح رایگان فقط عضویت می‌خواهد.

- نشانی پایه: `https://netarz.ir/api/fx/v1`
- کلید: `Authorization: Bearer fx-ntz-v1-…` (یا هدر `X-API-Key`)
- مستندات: [netarz.ir/docs/fx](https://netarz.ir/docs/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=intro) · مرجع تعاملی: [netarz.ir/docs/fx/reference](https://netarz.ir/docs/fx/reference?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=intro)

## فهرست

- [شروع در دو دقیقه](#quickstart)
- [راه‌اندازی در سه قدم](#setup)
- [فهرست نمونه‌ها](#examples)
- [داده‌ای که می‌گیرید](#data)
- [رایگان و پرو](#plans)
- [مصرف را پایین نگه دارید](#usage)
- [خطاهای رایج](#errors)
- [مخزن‌های دیگر نِت اَرز](#related)
- [مشارکت و پشتیبانی](#support)
- [English](#english)

<a id="quickstart"></a>

## شروع در دو دقیقه

**۱. کلید بسازید.** در [پنل API نرخ ارز](https://netarz.ir/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=quickstart) یک «اپ» با دامنهٔ خودتان بسازید و کلید `fx-ntz-v1-…` را کپی کنید.
برای آزمایش روی رایانهٔ خودتان، دامنهٔ `localhost` خودکار تأیید می‌شود.

**۲. اولین درخواست را بفرستید.** اگر از سرور می‌فرستید، IP خروجی همان سرور باید در «IPهای مجاز» اپ باشد:

```bash
export NETARZ_FX_KEY="fx-ntz-v1-..."
curl -4 "https://netarz.ir/api/fx/v1/rates?codes=USD,EUR,AED" \
  -H "Authorization: Bearer $NETARZ_FX_KEY"
```

**۳. یکی از نمونه‌ها را اجرا کنید:**

```bash
git clone https://github.com/netarz/fx-api-examples.git
cd fx-api-examples
./curl/rates.sh                      # cURL
php php/rates.php                    # PHP خالص، با کش فایل
node javascript/node/rates.mjs       # Node.js 18+، بدون وابستگی
python3 python/netarz_fx.py          # Python (pip install requests)
```

فقط می‌خواهید نرخ را در سایتتان نشان بدهید و کد نمی‌نویسید؟ [ویجت نرخ ارز](https://netarz.ir/docs/fx/widget?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=quickstart) با یک تگ
`<script>` کار می‌کند، و برای وردپرس [افزونهٔ آماده](https://github.com/netarz/netarz-fx-wordpress) داریم.

<a id="setup"></a>

## راه‌اندازی در سه قدم

1. در [نِت اَرز](https://netarz.ir/?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=setup) ثبت‌نام کنید و از پنل [/fx](https://netarz.ir/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=setup) یک «اپ» بسازید: یک نام و دامنه‌ای که
   از آن درخواست می‌فرستید. کلید `fx-ntz-v1-…` را فقط همان یک بار می‌بینید.
2. **مالکیت دامنه را تأیید کنید:** رکورد TXT روی `_netarz.<دامنه>`، یا فایل `/.well-known/netarz-fx-verify.txt`.
   فایل آماده را از صفحهٔ اپ دانلود کنید و بدون ویرایش آپلود کنید؛ تایپ دستی کد شایع‌ترین علت تأیید نشدن است.
   برای تست محلی، `localhost` خودکار تأیید می‌شود.
3. **اگر از سرور درخواست می‌فرستید**، IP خروجی سرور را در «IPهای مجاز» اپ بگذارید. درخواست مرورگر با دامنه
   سنجیده می‌شود و درخواست سرور با IP.

اگر سرور شما IP ثابت ندارد (هاست اشتراکی، Cloudflare Workers، Vercel، Google Sheets) یا با وجود ثبت IP خطای
`ip_not_allowed` می‌گیرید، راهنمای [قفل دامنه و IP](guides/domain-and-ip-allow-list.md) را بخوانید؛ دام IPv6 هم همان‌جاست.

<a id="examples"></a>

## فهرست نمونه‌ها

| پوشه / فایل | کاربرد | راهنمای مربوط |
|---|---|---|
| [`curl/rates.sh`](curl/rates.sh) | نرخ، یک ارز، مبدل، فهرست ارزها، وضعیت کلید و سهمیه | [نرخ‌ها](https://netarz.ir/docs/fx/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) · [مبدل](https://netarz.ir/docs/fx/convert?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`curl/pro-history.sh`](curl/pro-history.sh) | تاریخچه، آرشیو روزانه (تاریخ شمسی هم پذیرفته می‌شود)، کندل، آمار و استریم؛ طرح پرو | [تاریخچه](https://netarz.ir/docs/fx/history?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`javascript/browser/`](javascript/browser/) | جدول نرخ در صفحهٔ سایت، مستقیم از مرورگر، با کش کوتاه | [قفل دامنه](https://netarz.ir/docs/fx/domain-lock?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`javascript/node/rates.mjs`](javascript/node/rates.mjs) | Node.js بدون وابستگی، با کش | [SDKها](https://netarz.ir/docs/fx/sdks?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`python/netarz_fx.py`](python/netarz_fx.py) | کلاینت پایتون با کش و پیام خطای روشن | [SDKها](https://netarz.ir/docs/fx/sdks?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`php/rates.php`](php/rates.php) | PHP خالص برای هاست اشتراکی، با کش فایل و آخرین مقدار سالم | [نرخ‌ها](https://netarz.ir/docs/fx/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`laravel/app/Services/NetArzFx.php`](laravel/app/Services/NetArzFx.php) | سرویس لاراول با `Cache::remember` و نسخهٔ پشتیبان | [SDKها](https://netarz.ir/docs/fx/sdks?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`wordpress/netarz-fx-snippet.php`](wordpress/netarz-fx-snippet.php) | کد کوتاه `[netarz_usd]` برای functions.php | [افزونهٔ کامل وردپرس](https://github.com/netarz/netarz-fx-wordpress) |
| [`google-sheets/Code.gs`](google-sheets/Code.gs) | تابع `=NETARZ_RATE("USD")` در Google Sheets | [نرخ دلار در اکسل و گوگل شیت](https://netarz.ir/wiki/dollar-rate-excel-google-sheets?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`excel-power-query/netarz-rates.pq`](excel-power-query/netarz-rates.pq) | نرخ در Excel و Power BI با Power Query | [نرخ دلار در اکسل و گوگل شیت](https://netarz.ir/wiki/dollar-rate-excel-google-sheets?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=examples) |
| [`relay/fx-relay.php`](relay/fx-relay.php) | رله روی یک سرور با IP ثابت، برای جاهایی که IP ثابت ندارند؛ JSON یا CSV | [راهنمای قفل IP](guides/domain-and-ip-allow-list.md) |

<a id="data"></a>

## داده‌ای که می‌گیرید

- `buy`، `sell` و `mid` به **تومان** و برای `unit` واحد از آن ارز است. بیشتر ارزها `unit: 1` دارند؛ برای ارزی مثل
  دینار عراق قیمت برای ۱۰۰ واحد است. قیمت یک واحد = مقدار ÷ `unit`.
- `buy` و `sell` از دید صرافی است (buy یعنی صرافی می‌خرد). نرخ‌ها اطلاع‌رسانی‌اند؛ برای تصمیم مالی منبع خودتان را هم داشته باشید.
- `meta.as_of` زمان واقعی نرخ است و `meta.delayed_minutes` تأخیر طرح شما.
- هدرهای `X-FX-Plan`، `X-Quota-Limit`، `X-Quota-Remaining` و `X-Quota-Reset` وضعیت سهمیه را می‌گویند.

<a id="plans"></a>

## رایگان و پرو

طرح رایگان فقط عضویت می‌خواهد: نرخ همهٔ ارزها با تأخیر، مبدل، فهرست ارزها و ویجت. طرح پرو را برای هر اپ جدا
می‌خرید و نرخ زنده، تاریخچه و آرشیو روزانه، کندل، آمار، هشدار قیمت با وبهوک و استریم زنده دارد. در زمان نوشتن این
راهنما طرح رایگان ۱۵ دقیقه تأخیر، ۶۰ درخواست در دقیقه و ۳٬۰۰۰ درخواست در روز دارد و طرح پرو ۵ دلار در ماه برای هر اپ است.
این اعداد ممکن است تغییر کنند؛ مرجع، صفحهٔ [طرح‌ها](https://netarz.ir/docs/fx/plans?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=plans) است.

<a id="usage"></a>

## مصرف را پایین نگه دارید

- **کش کنید.** نرخ هر چند دقیقه یک بار تازه می‌شود (`meta.refresh_interval_minutes`). کش ۱ تا ۵ دقیقه‌ای سمت شما
  کافی است و همهٔ نمونه‌های این مخزن آن را دارند.
- **چند ارز را در یک درخواست بگیرید:** `/rates?codes=USD,EUR,AED` به‌جای سه درخواست جدا.
- اگر پاسخ ۴۲۹ گرفتید، به اندازهٔ `Retry-After` صبر کنید و بعد دوباره بفرستید.

<a id="errors"></a>

## خطاهای رایج

| کد | یعنی |
|---|---|
| `401 missing_api_key` / `invalid_api_key` | کلید نرسیده یا اشتباه است |
| `403 domain_not_verified` | تأیید مالکیت دامنه انجام نشده |
| `403 origin_not_allowed` | صفحه روی دامنه‌ای است که روی اپ نیست |
| `403 origin_required` / `ip_not_allowed` | درخواست از سروری آمده که IP آن مجاز نیست (پاسخ فیلد `ip` دارد) |
| `402 pro_required` | این امکان فقط در طرح پرو است |
| `429 rate_limit_exceeded` / `daily_quota_exceeded` | سقف دقیقه‌ای یا سهمیهٔ روزانه پر شده |

فهرست کامل: [netarz.ir/docs/fx/errors](https://netarz.ir/docs/fx/errors?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=errors)

<a id="related"></a>

## مخزن‌های دیگر نِت اَرز

| مخزن | چیست |
|---|---|
| [netarz-fx-wordpress](https://github.com/netarz/netarz-fx-wordpress) | افزونهٔ وردپرس همین API: شورت‌کد `[netarz_rate currency="usd"]`، ابزارک، کش و ترجمهٔ فارسی |
| [ai-api-examples](https://github.com/netarz/ai-api-examples) | نمونه‌کد وب‌سرویس هوش مصنوعی: GPT، Claude، Gemini و DeepSeek با یک کلید سازگار با OpenAI |
| [netarz](https://github.com/netarz/netarz) | معرفی همهٔ وب‌سرویس‌ها و مخزن‌های نِت اَرز |

همهٔ پروژه‌های متن‌باز ما یک‌جا: [netarz.ir/open-source](https://netarz.ir/open-source?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=related) · همهٔ مستندات فنی: [netarz.ir/docs](https://netarz.ir/docs?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=related)

<a id="support"></a>

## مشارکت و پشتیبانی

- **اشکال در کد همین مخزن:** یک [Issue](https://github.com/netarz/fx-api-examples/issues/new/choose) باز کنید.
- **نمونهٔ تازه یا اصلاح:** Pull Request بفرستید. پیش از آن [راهنمای مشارکت](CONTRIBUTING.md) را ببینید.
- **اپ، کلید، تأیید دامنه و طرح پرو:** از پنل نِت اَرز تیکت بزنید یا به `info@netarz.ir` ایمیل بفرستید. شناسهٔ اپ و متن کامل پاسخ خطا را هم بفرستید.
- **مشکل امنیتی:** در Issue عمومی ننویسید؛ طبق [سیاست امنیتی](SECURITY.md) به `dev@netarz.ir` بفرستید.

مجوز: [MIT](LICENSE) · [آیین رفتار](CODE_OF_CONDUCT.md)

---

<a id="english"></a>

## English

**NetArz FX API examples.** Code for showing exchange rates in Iranian Toman (USD, EUR, AED, TRY and more) on
websites, apps, bots and spreadsheets, using the [NetArz FX API](https://netarz.ir/fx-api?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english). The rates are the
same as on the [NetArz rate board](https://netarz.ir/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english); every currency is priced from the live USD market rate through its dollar parity (fixed for pegged currencies, updated daily for the rest).

### Quick start

```bash
# Create an app and key at https://netarz.ir/fx (localhost is verified automatically), then:
export NETARZ_FX_KEY="fx-ntz-v1-..."
curl -4 "https://netarz.ir/api/fx/v1/rates?codes=USD,EUR,AED" -H "Authorization: Bearer $NETARZ_FX_KEY"
```

### Facts

- Base URL `https://netarz.ir/api/fx/v1`; auth `Authorization: Bearer fx-ntz-v1-…` or `X-API-Key` (never `?key=`).
- Endpoints: `/rates`, `/rates/{code}`, `/convert`, `/currencies`, `/me`, `/status`; Pro: `/history/{code}`,
  `/archive/{code}` (accepts Gregorian or Jalali dates), `/ohlc/{code}`, `/stats/{code}`, `/snapshot/{code}`,
  `/stream` (SSE), `/alerts` (signed webhooks).
- **Domain lock:** browser calls are checked by `Origin`/`Referer` against the app's verified domains; server calls
  (no `Origin`) by the caller's IP against the app's allowed IPs. See [guides/domain-and-ip-allow-list.md](guides/domain-and-ip-allow-list.md)
  for servers without a fixed IP and the IPv6 trap.
- `buy`/`sell`/`mid` are Toman per `unit` units of the currency; `meta.as_of` is the rate's real time.
- Free plan (membership only): delayed rates, converter, currency list, widget. Pro (per app, monthly): live rates,
  history and daily archive, OHLC, stats, alerts, SSE stream. Current limits: [netarz.ir/docs/fx/plans](https://netarz.ir/docs/fx/plans?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english)
- Cache 1 to 5 minutes on your side; rates refresh every few minutes.

### Links

- Service overview: [netarz.ir/fx-api](https://netarz.ir/fx-api?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english) · Live rate board: [netarz.ir/rates](https://netarz.ir/rates?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english)
- Docs: [netarz.ir/docs/fx](https://netarz.ir/docs/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english) · Interactive reference: [netarz.ir/docs/fx/reference](https://netarz.ir/docs/fx/reference?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english)
- All NetArz open-source projects: [netarz.ir/open-source](https://netarz.ir/open-source?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=english)
- Related repos: [netarz-fx-wordpress](https://github.com/netarz/netarz-fx-wordpress) (WordPress plugin) ·
  [ai-api-examples](https://github.com/netarz/ai-api-examples) (OpenAI-compatible AI API)

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately to `dev@netarz.ir`
([SECURITY.md](SECURITY.md)). Rates are informational. Licensed under MIT.
