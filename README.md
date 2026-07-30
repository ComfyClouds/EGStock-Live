# Economic Group — Premium Bilingual Stock Trading Website

A production-ready, fully bilingual (Arabic/English, RTL/LTR) stock trading and brokerage
marketing site. Built with plain HTML5, CSS3, and vanilla ES6+ JavaScript — no frameworks,
no build step. Google Sheets acts as the entire CMS/backend.

## Quick Start

The site uses `fetch()` to load HTML partials, translation files, and sample data, which
requires a local server (opening `index.html` directly via `file://` will not work due to
browser CORS restrictions on local `fetch`).

```bash
# Any static server works. From the project root:
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

By default the site runs in **demo mode** (`STOCK_CONFIG.USE_SAMPLE_DATA = true` in
`assets/js/config.js`), reading from `data/sample-data.json` instead of a live Google Sheet —
so it's fully functional out of the box with realistic bilingual sample content.

## Going Live with Google Sheets

1. Create a Google Sheet named `EconomicGroup_CMS` with one tab per section described in
   `docs/GOOGLE_SHEETS_SCHEMA.md`.
2. Deploy the backend script from `docs/APPS_SCRIPT_BACKEND.md` as a Web App.
3. In `assets/js/config.js`:
   - Set `SHEETS_API_URL` to your deployment URL.
   - Set `USE_SAMPLE_DATA` to `false`.
4. Reload the site — every section now reads live from your spreadsheet.

## Project Structure

```
Stock/
├── index.html                 # Homepage — assembles every section
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/                   # One stylesheet per concern (see below)
│   ├── js/                    # Config, i18n, Sheets API, section modules
│   ├── images/                # Production images (currently placeholder)
│   ├── icons/                 # favicon.svg
│   └── fonts/                 # Optional self-hosted fonts (CDN used by default)
├── components/                # Reusable JS render functions (card/row templates)
├── partials/                  # header.html, footer.html, news-modal.html
├── pages/                     # Reserved for future standalone pages
├── translations/              # en.json, ar.json — static UI strings
├── data/
│   └── sample-data.json       # Demo data mirroring the Sheets schema
└── docs/
    ├── GOOGLE_SHEETS_SCHEMA.md
    ├── APPS_SCRIPT_BACKEND.md
    ├── LIVE_MARKET_DATA.md
    └── TRADINGVIEW_WIDGETS.md
```

### CSS (loaded in this order in `index.html`)

`variables.css` → `base.css` → `animations.css` → `header.css` → `hero.css` →
`market.css` → `news.css` → `faq.css` → `contact.css` → `footer.css` → `responsive.css`

### JS (loaded in this order in `index.html`)

1. `config.js`, `utils.js`, `icons.js`, `i18n.js`, `sheetsApi.js`, `skeleton.js`,
   `lazyload.js`, `partials.js` — shared foundation, no DOM dependency.
2. `components/*.js` — pure render-to-HTML-string functions.
3. `header.js`, `footer.js`, `hero.js`, `liveMarketData.js`, `tradingViewWidgets.js`, `market.js`,
   `news.js`, `newsModal.js`,
   `faq.js`, `contact.js` — one module per section, each self-contained.
4. `main.js` — boots everything in the correct order (partials → i18n → sections).

## How Bilingual Works

- Static UI strings (buttons, labels, headings) live in `translations/en.json` /
  `translations/ar.json` and are bound via `data-i18n="key.path"` attributes.
- Dynamic content (news, stocks, FAQs, etc.) carries its own `_EN` / `_AR` columns in
  every Google Sheet row; each render function picks the right field based on the
  active language.
- Switching language is instant (no page reload): `I18n.setLanguage()` updates
  `<html lang dir>`, re-applies static translations, and dispatches a
  `stock:langchange` event that every section module listens for to re-render its
  already-fetched data in the new language — no re-fetching from Sheets needed.
- The choice persists in `localStorage` across visits.

## Live Data Automation

Four pieces work together to keep market data current — a mix of real external sources and Google
Sheets, depending on what's actually available for each category:

- **EGX 30/70/100, Top Gainers & Losers, and the full Stocks list (official TradingView widgets):**
  TradingView has no public data API — confirmed directly, including from services that scrape it
  admitting as much — so these three sections embed TradingView's own official, free widgets
  (Market Overview, Hotlists, Screener) instead. Real EGX data, but TradingView's own branded UI, not our
  design system. Full write-up, verified symbols, and known caveats in `docs/TRADINGVIEW_WIDGETS.md`.
- **Currencies + Gold/Silver (client-side, no Sheets at all):** `assets/js/liveMarketData.js` fetches
  these directly in the browser from [Frankfurter](https://frankfurter.dev), a free, keyless,
  CORS-enabled exchange-rate API — verified directly against the live API to support EGP, SAR, and
  precious metals. No Google Sheet, no Apps Script, no API key, nothing to configure. Full write-up in
  `docs/LIVE_MARKET_DATA.md`.
- **Sheet auto-refresh (server-side, for what can't be fetched live elsewhere):** Oil/Gas (Frankfurter
  has no commodity-futures data) and the hero panel's small snapshot (still Sheets-backed, see the
  inconsistency note in `docs/TRADINGVIEW_WIDGETS.md`) can be kept current by a time-based Google Apps
  Script trigger pulling from Twelve Data (paid plan needed for EGX-specific coverage). Full setup in
  `docs/APPS_SCRIPT_BACKEND.md` → "Automated Market Data Refresh".
- **Page auto-refresh (client-side):** `assets/js/autoRefresh.js` re-fetches and re-renders on two
  cadences — every `AUTO_REFRESH_INTERVAL_MS` (default 30s) for the hero snapshot (the only remaining
  Sheets-backed piece on this cycle), and every `LIVE_DATA_REFRESH_INTERVAL_MS` (default 5 min) for the
  Currencies/Commodities ticker tabs, since Frankfurter's rates only update once daily. The TradingView
  widgets refresh themselves internally and don't need this. Both cadences pause while the browser tab is
  in the background.

## Performance Notes

- Section data (Market Overview, Movers, Stocks table, News, FAQ, Contact info) is
  fetched lazily via `IntersectionObserver` only once its section approaches the
  viewport (`StockLazy.onEnterViewport`), not on initial page load.
- Skeleton loading states (`StockSkeleton`) render immediately while each fetch is
  in flight.
- All content images use `loading="lazy"` plus a fade-in on load.
- Scroll-reveal animations use a single shared `IntersectionObserver` and respect
  `prefers-reduced-motion`.

## Accessibility Notes

- Semantic landmarks (`header`, `main`, `nav`, `footer`), a skip-to-content link, and
  `aria-live` regions on every dynamically-updated list/table.
- All interactive controls are real `<button>`/`<a>` elements with visible focus
  states (`:focus-visible`), minimum 44×44px touch targets, and keyboard-operable
  dropdowns, modals, and drawers with focus trapping + Escape-to-close.
- The news modal and mobile drawer trap focus and restore it to the trigger element
  on close.

## WhatsApp / Sheets Backend Pattern

Order/lead-style forms (newsletter signup, contact form) submit through
`SheetsAPI.submitToSheet(target, payload)`, which uses a JSONP `<script>` tag against
the Apps Script Web App — avoiding CORS entirely, consistent with the rest of the
Sheets-backed sites in this workspace. `assets/js/config.js` also exposes
`WHATSAPP_NUMBER` for any `wa.me` checkout/contact links you wire up on top of this
foundation via `StockUtils.buildWhatsAppLink()`.
