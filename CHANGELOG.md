# Changelog

All notable changes to this repository are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-28

### Added

- `go/`: Go example on `net/http` (standard library only) with an IPv4 dialer, a two-minute cache and typed errors.
- `dotnet/`: .NET 8 console example with `HttpClient`, IPv4 connect, typed records and a cache; no NuGet packages.
- `react/`: `useNetArzRates` hook and `RatesTable` component. Reads rates through your own backend endpoint,
  or from the browser with a domain-locked key as the docs allow.
- `telegram-bot/`: Telegram bot for `/usd`, `/eur`, `/rates` and `/convert`, on plain HTTP with long polling,
  served from one cached `GET /rates` per two minutes.
- `converter/`: Toman to and from USD, EUR and AED computed locally from one `/rates` response, with the same
  `mid` / `buy` / `sell` rule as `GET /convert`.
- `.github/workflows/ci.yml`: syntax and build checks for every language (never calls the API).
- `.github/dependabot.yml`: monthly update checks for GitHub Actions, pip, Go modules and NuGet.
- This changelog.

### Changed

- README (Persian and English): new examples in the table and the table of contents, CI badge.
- `.gitignore`: ignore `bin/` and `obj/` build output.

## [1.0.0] - 2026-09-26

### Added

- First public release: cURL (free and Pro endpoints), browser JavaScript, Node.js, Python, plain PHP,
  Laravel service, WordPress snippet, Google Sheets, Excel Power Query and a PHP relay for hosts without a fixed IP.
- Guide to the domain and IP allow-list, including the IPv6 trap.
- Community files: contributing guide, code of conduct, security policy, issue and pull request templates.

[Unreleased]: https://github.com/netarz/fx-api-examples/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/netarz/fx-api-examples/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/netarz/fx-api-examples/releases/tag/v1.0.0
