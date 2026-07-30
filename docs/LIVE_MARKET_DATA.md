# Economic Group — Live Market Data (Direct Browser Fetch)

Currencies, and the Gold/Silver rows of Commodities, are fetched **directly in the visitor's browser**
from a live public API — **no Google Sheet, no Apps Script, no API key, nothing to configure.** This
document explains what's covered, what isn't, why, and how it fits together with the rest of the site.

## What's live now

| Category | Source | Live? |
|---|---|---|
| Currencies (USD/EGP, EUR/EGP, GBP/EGP, SAR/EGP) | Frankfurter API, direct browser fetch | **Yes, fully.** No Sheet involved at all. |
| Commodities — Gold (XAU), Silver (XAG) | Frankfurter API, direct browser fetch | **Yes, fully.** |
| Commodities — Brent Crude, Natural Gas | Google Sheet (`Commodities` tab), optionally auto-filled by the Apps Script trigger | No free live-fetch option exists — see below. |
| Markets, Indices, Stocks (EGX-specific) | Google Sheet | No free live-fetch option exists — see below. |

## Why Frankfurter

[Frankfurter](https://frankfurter.dev) (`api.frankfurter.dev`) was chosen after directly verifying three
things against the live API, not just its marketing copy:

1. **CORS is genuinely open.** Frankfurter's own docs state plainly: *"CORS is open and there's no key
   to leak, so you can call the API straight from client code."* This is the one property that makes a
   true "no backend at all" architecture possible — most financial data APIs (including the one used for
   the Apps Script automation) either block direct browser requests outright or require a key that would
   sit exposed in your page's source if called client-side.
2. **EGP and SAR are both supported.** Fetched `https://api.frankfurter.dev/v2/currencies` directly and
   confirmed both `EGP` (Egyptian Pound) and `SAR` (Saudi Riyal) are in the live catalog — this isn't
   guaranteed with every "free currency API" (some only cover ~30 major currencies).
3. **Gold and Silver are covered too.** `XAU` and `XAG` are real ISO 4217 currency codes for troy ounces
   of gold and silver respectively, so a currency-rate API can quote them like any other pair — confirmed
   both are in Frankfurter's catalog.

No API key, no signup, no cost, no quota to run out of ("no monthly or daily caps" per their docs, just
anti-abuse rate limiting on excessive request volume, which this integration stays well under).

## What's NOT covered, and why

- **Oil and natural gas** aren't currencies — they have no ISO 4217 code, so a currency-rate API
  fundamentally cannot quote them, no matter how good its coverage otherwise is. These stay on the
  `Commodities` Google Sheet tab, which the Apps Script automation can optionally auto-fill from Twelve
  Data (paid tier — see `docs/APPS_SCRIPT_BACKEND.md`), or you can edit by hand.
- **Individual EGX stocks and EGX indices (EGX 30/70/100)** have no free, CORS-enabled, direct-browser
  data source anywhere — this was checked directly rather than assumed. Real-time Egyptian Exchange data
  is licensed/paid at every provider found (Twelve Data's Grow plan and above, EODHD, or an
  exchange-licensed feed). These stay on Google Sheets, same as before.

## How it works technically

`assets/js/liveMarketData.js` calls two Frankfurter endpoints directly from the browser:

- **Currencies:** `GET /v2/rates?base=EGP&quotes=USD,EUR,GBP,SAR&from=<7 days ago>` — Frankfurter quotes
  EGP→X, so the code inverts each rate to get the conventional "how many EGP per 1 USD" reading. The
  7-day window (instead of just "today") exists so a day-over-day percent change can be computed even
  across weekends/holidays when rates don't update.
- **Metals:** `GET /v2/rates?base=USD&quotes=XAU,XAG&from=<7 days ago>` — same idea, inverted to the
  conventional "$/oz" spot price quote.

`assets/js/market.js` then merges the live Gold/Silver rows into whatever is fetched from the
`Commodities` sheet (which still supplies Oil/Gas), and treats the live Currencies array as the complete
Currencies dataset — no merge needed there since nothing else contributes to it. The rest of the render
pipeline (`components/miniTickerCard.js`, etc.) needed zero changes, since the live-fetched data is
shaped to look exactly like a Sheet row.

## Refresh cadence

This is on its own, slower auto-refresh cycle (`LIVE_DATA_REFRESH_INTERVAL_MS` in `config.js`, default 5
minutes) — separate from the 30-second cycle used for the Sheets-backed sections. Frankfurter's
underlying rates only update once daily from central bank sources, so polling every 30 seconds would be
both pointless and inconsiderate of a free public service. See `assets/js/autoRefresh.js`.

## Bilingual display metadata

Frankfurter only returns numbers — it has no idea "USD/EGP" should display as "الدولار الأمريكي" in
Arabic, or what order/icon a row should have. That static metadata lives directly in
`liveMarketData.js` (`CURRENCY_META` / `METAL_META`) rather than in a Sheet, since it rarely changes and
keeping it next to the fetch logic that uses it is simpler than round-tripping through Sheets for
display-only text.

## If you ever need to swap providers

`fetchSeriesWithChange()` in `liveMarketData.js` is the only place that talks to Frankfurter. If Egypt's
central bank, EGX, or a licensed provider ever offers a free CORS-enabled feed for EGX stocks/indices,
you'd add a parallel fetch function there (or a new file following the same pattern) rather than routing
it back through Google Sheets.
