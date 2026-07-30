# Economic Group — TradingView Widgets (EGX Indices, Movers, Stocks)

Market Overview (EGX 30/70/100), Top Gainers & Losers, and the full Stocks list are now powered by
**official TradingView widgets** — real EGX data, but rendered as TradingView's own branded UI rather
than our custom design system. This document explains why, exactly what's embedded, and what to know
about it.

## Why widgets, not an API

TradingView does not have a public data API. This isn't an assumption — it was checked directly: even
services that sell "TradingView API" access describe their product as a **scraper**, and say outright:

> *"No, there is no official TradingView API for accessing stock data programmatically. TradingView
> primarily operates as a charting platform without providing public API access to their stock
> information."*

Scraping TradingView's internal endpoints (what those third-party services actually do) violates their
Terms of Service and can break without warning, since it isn't a supported interface — not something to
build into a real financial services website. TradingView's own widget FAQ confirms the intended path:
*"We provide widgets as a technology piece for FREE with default TradingView branding... We don't have an
API that gives access to data."*

So the only legitimate way to show real TradingView-sourced EGX data is their official embeddable
widgets — which means these three sections show TradingView's own UI (their fonts, colors, layout,
branding/copyright line), not ours. That trade-off was discussed and accepted before building this.

## What's embedded, and where

| Site section | TradingView widget | Scope |
|---|---|---|
| Market Overview (`#tv-indices-widget`) | Market Overview | Custom tab with exactly `EGX:EGX30`, `EGX:EGX70EWI`, `EGX:EGX100EWI` |
| Top Gainers & Losers (`#tv-movers-widget`) | Hotlists | `"exchange": "EGX"` — shows Gainers/Losers/Most Active as tabs within one widget |
| All Stocks (`#tv-stocks-widget`) | Screener | `"market": "egypt"` — has its own built-in search/sort/filter toolbar |
| Hero "Live Snapshot" (`#hero-tv-widget`) | Symbol Overview | Fixed list: `EGX:EGX30`, `EGX:COMI`, `EGX:TMGH`, `EGX:HRHO`, `EGX:SWDY` — dark/transparent theme to sit inside the hero's glass panel |

All four are wired up in `assets/js/tradingViewWidgets.js`, lazy-loaded or eagerly loaded depending on
section (the hero widget loads immediately since it's above the fold), and re-injected on language switch
(`locale: "ar"` / `"en"` passed to each widget).

### Symbol accuracy — verified, not guessed

EGX 30, 70, and 100 don't all follow the same naming pattern on TradingView. This was checked directly
against TradingView's own symbol pages rather than assumed:

- EGX 30 → `EGX:EGX30`
- EGX 70 → `EGX:EGX70EWI` (**not** `EGX70`)
- EGX 100 → `EGX:EGX100EWI` (**not** `EGX100`)

The `EWI` suffix stands for "Equal-Weight Index," which matches how EGX itself defines these two indices.
Guessing the plain `EGX70`/`EGX100` symbols would have silently shown "symbol not found" in the widget.

### Things worth verifying once live

Two parameters (`"exchange": "EGX"` on Hotlists, `"market": "egypt"` on Screener) are based on
TradingView's own URL conventions (`tradingview.com/markets/egypt/` exists as a real page) and their
documented config format, but weren't directly confirmed as accepted values for these two specific
widgets the way the index symbols were — TradingView's own widget FAQ notes *"some exchanges are not yet
supported"* for widget-level market filtering specifically. Load the page once deployed and confirm both
widgets populate with EGX-specific data; if either falls back to a default/global list, that's the signal
to adjust the config value.

### Data freshness caveat

Same honest caveat as the rest of this project's live data: TradingView's free widgets are not
guaranteed real-time for every exchange. Their own FAQ: *"To get real-time data on your website, contact
the exchange directly."* Treat this as delayed/reference data, not something to quote a client a binding
price from.

## What this replaced

The old custom-rendered Market Overview tiles, Gainers/Losers panels, and searchable Stocks table (all
backed by the `Markets` and `Stocks` Google Sheets, optionally auto-filled by the Twelve Data Apps Script
trigger) are gone from these three sections. `components/marketTile.js` and `components/stockRow.js`
were removed as dead code since nothing renders them anymore.

## The hero snapshot panel

The hero section's small "Live Snapshot" panel (index value + a short list of major EGX stocks) used to
read from the `Markets`/`Stocks` Google Sheets independently of everything above, which meant its numbers
could disagree with the real TradingView numbers shown further down the same page. It's now a TradingView
**Symbol Overview** widget too (`#hero-tv-widget`, wired up in `assets/js/hero.js` +
`assets/js/tradingViewWidgets.js`), configured dark/transparent to fit the panel's existing glass
styling. One real difference from before: the old panel showed a dynamically-computed "top movers" list
(sorted by whichever stocks moved most that day); TradingView has no data API to compute that from, so
this widget shows a fixed list of symbols (`EGX:EGX30`, `COMI`, `TMGH`, `HRHO`, `SWDY`) instead — live
prices, but not dynamically re-ranked.

This widget's exact config keys weren't independently re-verified against a live page the way the index
symbols were (see "Symbol accuracy" above) — worth confirming it renders as expected once deployed.

## Google Sheets tabs — none of these are used for market data anymore

`Markets`, `Stocks`, `Indices`, `Currencies`, and `Commodities` are all fully retired — nothing on the
site reads any of them. Market Overview/Movers/Stocks and the hero snapshot are TradingView widgets;
Currencies and Commodities (Gold/Silver only — Oil/Gas were dropped, see `docs/LIVE_MARKET_DATA.md`) are
fetched live from Frankfurter. If any of these tabs still exist in your spreadsheet from before this
change, run `removeLegacyMarketDataSheets` once in the Apps Script editor to delete them — see
`docs/GOOGLE_SHEETS_SCHEMA.md`. The old Twelve Data `refreshMarketData` trigger (if you ever set one up)
has nothing left to update and should be removed too — run `deleteMarketDataTriggers` once.
