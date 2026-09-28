# راهنمای مشارکت

خوشحالیم که می‌خواهید نمونه‌کدهای وب‌سرویس نرخ ارز نِت اَرز را بهتر کنید. این راهنما کوتاه است و کمک می‌کند Pull Request شما زودتر بررسی و ادغام شود.

## چه کمکی به کار می‌آید

- اصلاح کدی که با [مستندات فعلی](https://netarz.ir/docs/fx?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=contributing) جور نیست یا اجرا نمی‌شود
- نمونهٔ تازه برای زبان، فریم‌ورک یا ابزاری که این‌جا نیست
- توضیح روشن‌تر در README یا در توضیح بالای فایل‌ها

## چه چیزی جای این مخزن نیست

- **حساب، اعتبار، پرداخت و کلید:** از پنل نِت اَرز [تیکت بزنید](https://netarz.ir/tickets?utm_source=github&utm_medium=referral&utm_campaign=fx-api-examples&utm_content=contributing) یا به `info@netarz.ir` ایمیل بفرستید.
- **مشکل امنیتی:** در Issue یا Pull Request عمومی ننویسید. طبق [سیاست امنیتی](SECURITY.md) به `dev@netarz.ir` بفرستید.

## پیش از فرستادن Pull Request

1. برای تغییر بزرگ، اول یک Issue باز کنید تا پیش از نوشتن کد دربارهٔ راه‌حل هم‌نظر شویم.
2. کلید واقعی (`fx-ntz-v1-…`)، توکن ربات یا نشانی سرور خصوصی در کد، README یا تاریخچهٔ گیت نگذارید. اگر اشتباهی کلیدی را کامیت کردید، پیش از هر کاری آن را از پنل نِت اَرز باطل کنید؛ پاک کردن کامیت کافی نیست.
3. کلید را فقط از متغیر محیطی `NETARZ_FX_KEY` بخوانید، با هدر `Authorization` بفرستید و هرگز در نشانی (`?key=`) نگذارید.
4. هر نمونه باید کش داشته باشد (۱ تا ۵ دقیقه) و چند ارز را در یک درخواست بگیرد (`/rates?codes=USD,EUR`).
5. اگر نمونه از سرور درخواست می‌فرستد، در توضیح بالای فایل بگویید IP سرور باید در «IPهای مجاز» اپ باشد.
6. کد، نام متغیرها و توضیح‌های داخل کد انگلیسی باشد. README فارسی است و یک بخش English کوتاه دارد.
7. فایل تازه را در جدول «فهرست نمونه‌ها» در README اضافه کنید، با لینک صفحهٔ مستندات مربوط.
8. کد را یک بار واقعاً اجرا کنید. بررسی سریع نحو: `python -m py_compile <file>.py` · `node --check <file>.mjs` · `php -l <file>.php` · `bash -n <file>.sh`
   · `go vet ./...` · `dotnet build`. همین بررسی‌ها در [CI](.github/workflows/ci.yml) روی هر Pull Request اجرا می‌شود و به کلید نیاز ندارد.
9. اگر تغییر شما برای کسی که از نمونه‌ها استفاده می‌کند مهم است، یک خط زیر `[Unreleased]` در [CHANGELOG.md](CHANGELOG.md) اضافه کنید.

## سبک نوشتن متن فارسی

- خواننده را «شما» خطاب کنید و جمله‌ها را کوتاه بنویسید.
- اصطلاح فنی را بار اول با توضیح بیاورید، مثل «کلید دسترسی (API Key)». نام endpoint، پارامتر و کد لاتین می‌ماند.
- ایموجی و علامت تعجب نگذارید. نام برند همیشه «نِت اَرز» (یا NetArz) است.

## مجوز

با فرستادن Pull Request می‌پذیرید که کد شما با مجوز همین مخزن (MIT) منتشر شود.
همه در این مخزن از [آیین رفتار](CODE_OF_CONDUCT.md) پیروی می‌کنند.

---

## Contributing (English)

Thanks for improving the NetArz FX API examples. Open an issue before a large change. Never commit a real key (`fx-ntz-v1-…`) or token;
if you did, revoke it in the NetArz panel first. Read the key from `NETARZ_FX_KEY`, send it in a header (never `?key=`), cache 1 to 5 minutes, batch codes in one call. Run the code once for real before opening a pull request. CI runs syntax and build checks for every language on each pull request (no key needed); add a line under `[Unreleased]` in CHANGELOG.md for user-facing changes.
Account, credit and billing questions go to `info@netarz.ir`, security issues to `dev@netarz.ir` (see [SECURITY.md](SECURITY.md)).
By contributing you agree your work is released under MIT.
