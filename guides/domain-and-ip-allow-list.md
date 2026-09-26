# قفل دامنه و IP در API نرخ ارز: وقتی سرور شما IP ثابت ندارد

بیشتر پیام‌هایی که با «اتصال برقرار نمی‌شود» یا «۴۰۳ می‌گیرم» به ما می‌رسد، از یک جا می‌آید:
کلید API نرخ ارز به دامنه و IP شما قفل است و درخواست از جایی رسیده که روی اپ ثبت نشده.
این راهنما می‌گوید قفل دقیقاً چطور کار می‌کند و برای هر نوع میزبان چه کنید.
مرجع کامل: [netarz.ir/docs/fx/domain-lock](https://netarz.ir/docs/fx/domain-lock?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=guides-domain-and-ip-allow-list)

## قاعده در یک نگاه

هر درخواست یکی از این دو شرط را باید داشته باشد:

| درخواست از کجا آمده | چه چیزی سنجیده می‌شود |
|---|---|
| **مرورگر** (هدر `Origin` یا `Referer` دارد) | هاست صفحه باید دامنهٔ اصلی اپ یا یکی از «دامنه‌های اضافی» باشد |
| **سرور، cURL، ربات، اسکریپت** (بدون `Origin`) | IP فرستنده باید در «IPهای مجاز» اپ باشد |

پیش از هر دو، مالکیت دامنهٔ اصلی باید یک بار تأیید شده باشد (رکورد TXT روی `_netarz.<دامنه>` یا فایل
`/.well-known/netarz-fx-verify.txt`). دامنه‌های توسعه مثل `localhost` خودکار تأیید می‌شوند، ولی اپ روی این دامنه‌ها همیشه در طرح رایگان می‌ماند.

## از خطا شروع کنید

| کد | معنی | کار شما |
|---|---|---|
| `domain_not_verified` | تأیید مالکیت انجام نشده | فایل آماده را از صفحهٔ اپ در پنل [/fx](https://netarz.ir/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=guides-domain-and-ip-allow-list) دانلود و بدون ویرایش آپلود کنید، بعد «بررسی و تأیید» |
| `origin_not_allowed` | صفحه روی دامنه‌ای است که روی اپ نیست | همان دامنه را به «دامنه‌های اضافی» اضافه کنید (پاسخ خطا فیلد `origin` و `allowed` دارد) |
| `origin_required` | درخواست از سرور آمده و اپ هیچ IP مجازی ندارد | IP خروجی سرور را اضافه کنید |
| `ip_not_allowed` | IP فرستنده در فهرست نیست | **همان IPی را اضافه کنید که در فیلد `ip` پاسخ خطا آمده** |

فیلد `ip` در پاسخ خطا همان آدرسی است که ما دیده‌ایم؛ مطمئن‌ترین منبع است. در صفحهٔ اپ در پنل هم بخش
«درخواست‌های ردشده» زمان، علت، IP و دامنهٔ هر درخواست ردشده را نشان می‌دهد. این درخواست‌ها از سهمیهٔ روزانه کم نمی‌شوند.
اگر آن‌جا چیزی ثبت نشده و مصرف هم تکان نخورده، درخواست اصلاً به ما نرسیده و مشکل در شبکهٔ سرور شماست.

## دام IPv6

`netarz.ir` هم آدرس IPv4 دارد و هم IPv6. سروری که هر دو را دارد معمولاً با IPv6 وصل می‌شود، در حالی که
`curl https://api.ipify.org` فقط IPv4 را نشان می‌دهد. نتیجه: IPv4 را ثبت کرده‌اید و باز `ip_not_allowed` می‌گیرید.

دو راه دارید:

1. **درخواست را روی IPv4 نگه دارید** (پیشنهاد ما، چون IPv6 سرورها گاهی عوض می‌شود):
   - cURL: `curl -4 …`
   - PHP cURL: `CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4`
   - Laravel: `Http::withOptions(['force_ip_resolve' => 'v4'])`
   - Node.js: `dns.setDefaultResultOrder("ipv4first")`
   - Python requests: نمونهٔ [`python/netarz_fx.py`](../python/netarz_fx.py)
2. **IPv6 را هم ثبت کنید.** `curl -6 https://api64.ipify.org` آن را نشان می‌دهد. برای IPv6 فقط آدرس دقیق پذیرفته می‌شود؛
   پیشوند و CIDR فقط برای IPv4 کار می‌کند.

## برای هر نوع میزبان

**سرور مجازی یا اختصاصی (VPS) با IP ثابت.** ساده‌ترین حالت. IP خروجی را پیدا کنید (`curl -4 https://api.ipify.org`)
و در «IPهای مجاز» بگذارید.

**سایت پشت Cloudflare یا هر CDN دیگر.** IPی که از دامنهٔ شما دیده می‌شود مال Cloudflare است، نه سرور شما.
درخواستی که سرور شما به ما می‌فرستد از IP خودِ سرور بیرون می‌رود؛ همان را ثبت کنید، نه IP دامنه را.

**هاست اشتراکی.** بیشتر هاست‌ها یک IP خروجی ثابت دارند که با IP سایت یکی نیست. یک بار درخواست بفرستید و
IP را از فیلد `ip` خطا یا بخش «درخواست‌های ردشده» بردارید. اگر هاست آن را عوض می‌کند، یکی از دو راه پایین.

**Cloudflare Workers، Vercel، Netlify، توابع بدون سرور، Google Apps Script، n8n ابری، Zapier و Make.**
IP خروجی این سرویس‌ها ثابت نیست و با مشتری‌های دیگر همان سرویس مشترک است. محدودهٔ IP آن‌ها را ثبت نکنید؛
با این کار هر کس دیگری روی همان سرویس هم می‌تواند با کلید شما درخواست بفرستد. به‌جایش:

- **رله با IP ثابت:** فایل [`relay/fx-relay.php`](../relay/fx-relay.php) را روی یک سرور با IP ثابت بگذارید،
  IP همان سرور را یک بار ثبت کنید و بقیه (Sheets، Excel، Worker) از رله بخوانند. رله کش دارد و CSV هم می‌دهد.
- **فراخوانی از مرورگر:** اگر نرخ را فقط در صفحه نشان می‌دهید، سرور لازم نیست. کد جاوااسکریپت صفحه مستقیم با
  کلید درخواست می‌دهد و قفل دامنه از آن محافظت می‌کند ([`javascript/browser/`](../javascript/browser/)). یا
  [ویجت نرخ ارز](https://netarz.ir/docs/fx/widget?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=guides-domain-and-ip-allow-list) را با یک تگ `script` بگذارید.

**Excel یا اسکریپت روی لپ‌تاپ.** IP خانه و اینترنت همراه معمولاً عوض می‌شود. از رله بخوانید
([`excel-power-query/`](../excel-power-query/)).

**ربات تلگرام یا سرور بدون دامنه.** یک دامنه که مال شماست ثبت و تأیید کنید (لازم نیست ربات روی آن باشد) و IP سرور ربات
را در «IPهای مجاز» بگذارید.

## چند توصیه

- `0.0.0.0/0` یا محدوده‌های خیلی باز قفل را بی‌اثر می‌کنند. محدوده را تا جای ممکن باریک نگه دارید.
- کلید را در نشانی (`?key=`) نفرستید؛ API فقط هدر `Authorization: Bearer` یا `X-API-Key` را می‌پذیرد.
  (`?key=` فقط برای ویجت است.)
- نرخ هر چند دقیقه عوض می‌شود. یک کش ۱ تا ۵ دقیقه‌ای سمت شما مصرف سهمیه را خیلی کم می‌کند.
- اگر هنوز وصل نمی‌شوید، از پنل تیکت بزنید و شناسهٔ اپ و متن کامل پاسخ خطا را بفرستید.

---

## English summary

Every FX API call must satisfy one rule: **browser calls** (with `Origin`/`Referer`) must come from the app's
domains; **server calls** (no `Origin`) must come from an allow-listed IP. The domain must be verified once
(TXT on `_netarz.<domain>` or `/.well-known/netarz-fx-verify.txt`).

- `ip_not_allowed` and `origin_required` error bodies include `ip`: the exact address NetArz saw. Allow-list that.
  The panel's rejected-requests list shows the same, and rejected calls do not use quota.
- **IPv6 trap:** `netarz.ir` has AAAA records, so dual-stack servers often connect over IPv6 while
  `api.ipify.org` reports IPv4. Force IPv4 (`curl -4`, `CURLOPT_IPRESOLVE_V4`, Guzzle `force_ip_resolve`,
  Node `ipv4first`) or allow-list the exact IPv6 address (IPv6 supports exact match only; prefixes and CIDR are IPv4-only).
- Behind Cloudflare, register the origin server's outgoing IP, not the domain's IP.
- Serverless platforms, Google Apps Script and hosted automation tools have shared, changing IPs. Do not allow-list their
  ranges; use a relay on one fixed-IP server (`relay/fx-relay.php`), or call from the browser / use the widget.
- The API never accepts the key as `?key=` (widget only).
