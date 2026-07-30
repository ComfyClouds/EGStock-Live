# Economic Group — Google Sheets Schema

This document defines the complete schema for the Google Sheet that powers the Economic Group website as a CMS.

**Spreadsheet name:** `EconomicGroup_CMS`
**Access:** Published via a single Google Apps Script Web App (see `docs/APPS_SCRIPT_BACKEND.md`) that exposes each tab as a JSON endpoint.

General rules for every sheet:
- Row 1 is always the header row with the exact column names below.
- Every bilingual field has a paired `_EN` and `_AR` column.
- `Order` columns are integers used for manual sort order (ascending).
- `Published` / `Active` columns use `TRUE` / `FALSE` (Google Sheets checkbox column).
- `ID` columns must be unique text/number values within their sheet.
- Dates use `YYYY-MM-DD` format.

---

## 1. Markets — ⚠️ Removed, no longer used

> This tab is no longer read anywhere on the site. The "Market Overview" section (EGX 30/70/100 tiles) is
> powered by an official TradingView widget (`docs/TRADINGVIEW_WIDGETS.md`), and the hero section's "Live
> Snapshot" panel — which used to read this tab's primary row for its index value — is now also a
> TradingView widget (see `docs/TRADINGVIEW_WIDGETS.md` → "Live Snapshot"). Safe to delete this tab; run
> `removeLegacyMarketDataSheets` in `Code.gs` to do it in one click.

| Column | Type | Notes |
|---|---|---|
| ID | Text | Unique key, e.g. `EGX30` |
| Name_EN | Text | e.g. "EGX 30" |
| Name_AR | Text | e.g. "إي جي إكس 30" |
| Value | Number | Current value |
| Change | Number | Absolute change |
| ChangePercent | Number | Percentage change |
| Direction | Text | `up` / `down` / `flat` |
| Volume | Number | Traded volume |
| Icon | Text | Icon key (matches `assets/icons`) |
| Order | Number | Sort order |
| Published | Boolean | Show/hide |

---

## 2. News

Powers the News section and the News Modal.

| Column | Type | Notes |
|---|---|---|
| ID | Text | Unique key |
| Image | URL | Card + modal hero image |
| CategoryEN | Text | e.g. "Markets" |
| CategoryAR | Text | e.g. "الأسواق" |
| TitleEN | Text | |
| TitleAR | Text | |
| SummaryEN | Text | Short card excerpt (max ~160 chars) |
| SummaryAR | Text | |
| ContentEN | Rich Text / HTML | Full article body |
| ContentAR | Rich Text / HTML | Full article body |
| Date | Date | `YYYY-MM-DD` |
| Featured | Boolean | Shown in hero/featured slot |
| Published | Boolean | |
| Order | Number | |

---

## 3. Announcements

Powers a scrolling ticker / alerts strip.

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| TitleEN | Text | |
| TitleAR | Text | |
| Type | Text | `info` / `warning` / `alert` |
| LinkURL | URL | Optional |
| StartDate | Date | When it begins showing |
| EndDate | Date | When it stops showing |
| Published | Boolean | |
| Order | Number | |

---

## 4. Banners

Powers promotional banner strips (e.g. "Open an account today").

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| TitleEN | Text | |
| TitleAR | Text | |
| SubtitleEN | Text | |
| SubtitleAR | Text | |
| Image | URL | |
| CTALabelEN | Text | |
| CTALabelAR | Text | |
| CTAUrl | URL | |
| Placement | Text | e.g. `homepage-top`, `homepage-mid` |
| Published | Boolean | |
| Order | Number | |

---

## 5. Sliders

Powers the homepage hero slider.

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| HeadlineEN | Text | |
| HeadlineAR | Text | |
| SubtextEN | Text | |
| SubtextAR | Text | |
| Image | URL | |
| CTALabelEN | Text | |
| CTALabelAR | Text | |
| CTAUrl | URL | |
| Published | Boolean | |
| Order | Number | |

---

## 6. Market Status

Powers the live open/closed indicator in the header and hero.

| Column | Type | Notes |
|---|---|---|
| Market | Text | e.g. `EGX` |
| StatusEN | Text | "Open" / "Closed" / "Pre-Market" |
| StatusAR | Text | "مفتوح" / "مغلق" / "قبل الافتتاح" |
| IsOpen | Boolean | Drives the status dot color |
| OpensAt | Text | e.g. `10:00` |
| ClosesAt | Text | e.g. `14:30` |
| Timezone | Text | e.g. `Africa/Cairo` |
| LastUpdated | Datetime | ISO timestamp |

---

## 7. Stocks — ⚠️ Removed, no longer used

> No longer read anywhere on the site. The searchable "All Stocks" list and "Top Gainers & Losers" are
> powered by official TradingView widgets (`docs/TRADINGVIEW_WIDGETS.md`), and the hero section's "Live
> Snapshot" panel — which used this tab for its top-movers mini-list — is now also a TradingView widget.
> Header search no longer searches stocks either (News only now). Safe to delete this tab; run
> `removeLegacyMarketDataSheets` in `Code.gs` to do it in one click.

Previously powered the ticker table, search, and Top Gainers / Losers directly.

| Column | Type | Notes |
|---|---|---|
| Symbol | Text | Unique, e.g. `COMI` |
| NameEN | Text | |
| NameAR | Text | |
| SectorEN | Text | |
| SectorAR | Text | |
| Price | Number | |
| Change | Number | Absolute |
| ChangePercent | Number | |
| Open | Number | |
| High | Number | |
| Low | Number | |
| PrevClose | Number | |
| Volume | Number | |
| MarketCap | Number | |
| Direction | Text | `up` / `down` / `flat` |
| Published | Boolean | |

---

## 8. Indices — ⚠️ No longer used by the frontend

> **Superseded.** EGX 30/70/100 are now shown via the TradingView Market Overview widget — see
> `docs/TRADINGVIEW_WIDGETS.md`. This sheet tab is not read anywhere on the site anymore. Kept for
> historical reference; safe to delete the tab if you'd like.

Previously powered an indices ticker strip separate from the summary tiles in `Markets`.

| Column | Type | Notes |
|---|---|---|
| Code | Text | e.g. `EGX70` |
| NameEN | Text | |
| NameAR | Text | |
| Value | Number | |
| ChangePercent | Number | |
| Direction | Text | `up` / `down` / `flat` |
| Order | Number | |
| Published | Boolean | |

---

## 9. Currencies — ⚠️ No longer used by the frontend

> **Superseded.** As of the live-data update, Currencies are fetched directly in the browser from
> Frankfurter (a free, keyless, CORS-enabled exchange-rate API) — see `docs/LIVE_MARKET_DATA.md`.
> This sheet tab is no longer read by the site at all. It's kept here only as historical reference /
> in case you want to fall back to Sheet-based currencies later. Safe to delete the tab if you'd like.

Previously powered a currency exchange ticker.

| Column | Type | Notes |
|---|---|---|
| Pair | Text | e.g. `USD/EGP` |
| NameEN | Text | |
| NameAR | Text | |
| Rate | Number | |
| ChangePercent | Number | |
| Direction | Text | `up` / `down` / `flat` |
| Order | Number | |
| Published | Boolean | |

---

## 10. Commodities — ⚠️ Removed, no longer used

> This tab is no longer read anywhere on the site. Gold (`XAU`) and Silver (`XAG`) are fetched live in
> the browser from Frankfurter (see `docs/LIVE_MARKET_DATA.md`); Oil and Natural Gas were dropped from
> the Commodities ticker entirely, since Frankfurter has no data for them and there's no other free,
> CORS-enabled, keyless source to replace this sheet with. Safe to delete this tab; run
> `removeLegacyMarketDataSheets` in `Code.gs` to do it in one click.

| Column | Type | Notes |
|---|---|---|
| Code | Text | e.g. `XAU`, `BRENT` — only non-metal rows (Oil, Gas) are actually read |
| NameEN | Text | |
| NameAR | Text | |
| Price | Number | |
| Unit | Text | e.g. `oz`, `barrel` |
| ChangePercent | Number | |
| Direction | Text | `up` / `down` / `flat` |
| Order | Number | |
| Published | Boolean | |

---

## 11. FAQs

Powers the FAQ accordion.

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| CategoryEN | Text | |
| CategoryAR | Text | |
| QuestionEN | Text | |
| QuestionAR | Text | |
| AnswerEN | Rich Text | |
| AnswerAR | Rich Text | |
| Order | Number | |
| Published | Boolean | |

---

## 12. Footer Links

Powers footer navigation columns.

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| ColumnEN | Text | Column heading, e.g. "Company" |
| ColumnAR | Text | |
| LabelEN | Text | |
| LabelAR | Text | |
| Url | URL | |
| Order | Number | |
| Published | Boolean | |

---

## 13. Navigation

Powers the header's primary navigation.

| Column | Type | Notes |
|---|---|---|
| ID | Text | |
| LabelEN | Text | |
| LabelAR | Text | |
| Url | Text | Anchor or path, e.g. `#markets` |
| ParentID | Text | Empty if top-level; set for dropdown children |
| Order | Number | |
| Published | Boolean | |

---

## 14. Social Links

Powers header/footer social icons.

| Column | Type | Notes |
|---|---|---|
| Platform | Text | e.g. `facebook`, `x`, `linkedin`, `youtube` |
| Url | URL | |
| Order | Number | |
| Published | Boolean | |

---

## 15. Languages

Controls which languages are available and their defaults.

| Column | Type | Notes |
|---|---|---|
| Code | Text | `en` / `ar` |
| LabelNative | Text | "English" / "العربية" |
| Direction | Text | `ltr` / `rtl` |
| IsDefault | Boolean | |
| Published | Boolean | |

---

## 16. Contact Information

Powers the Contact section and footer contact details.

| Column | Type | Notes |
|---|---|---|
| LabelEN | Text | e.g. "Head Office" |
| LabelAR | Text | |
| Type | Text | `phone` / `email` / `address` / `hours` |
| ValueEN | Text | |
| ValueAR | Text | |
| Icon | Text | |
| Order | Number | |

---

## 17. New Clients (write-only)

Populated automatically by the "Open Account" registration form (`pages/signup.html`). Not read by
the frontend — this tab exists purely to collect leads for the operations team. Created automatically
on first submission if it doesn't already exist.

| Column | Type | Notes |
|---|---|---|
| Name | Text | Full name |
| Email | Text | |
| Phone | Text | |
| Address | Text | |
| Language | Text | `ar` / `en` — the language the client used when submitting |
| SubmittedAt | Datetime | Set server-side on insert |

Each submission also triggers two emails from the backend (see `docs/APPS_SCRIPT_BACKEND.md` →
`handleSignup`): one to `ADMIN_EMAIL` with the client's details, and one to the client confirming
their request is being processed and that operations will reach out within 5 business days.

---

## Automated Refresh — ⚠️ Removed

> This used to describe a time-based Apps Script trigger (`refreshMarketData`, driven by a Twelve Data
> API key) that kept the **Markets**, **Stocks**, and **Commodities** (Oil/Gas) sheets updated
> automatically. Since all three tabs have been removed — Markets/Stocks are TradingView widgets now,
> Commodities is Gold/Silver-only via a direct live fetch — there's nothing left for that trigger to
> update. If you have a `createMarketDataTrigger`/`refreshMarketData` setup still running from before
> this change, run `deleteMarketDataTriggers` once in the Apps Script editor to stop it; it would just be
> failing on every run now that the sheets it targets don't exist.

---

## Endpoint Convention

Each tab is exposed at:

```
GET https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?sheet={SheetName}&callback={jsonpCallback}
```

Returns JSONP: `{jsonpCallback}({ "sheet": "News", "rows": [ {...}, {...} ] })`

See `docs/APPS_SCRIPT_BACKEND.md` for the full `Code.gs` implementation.
