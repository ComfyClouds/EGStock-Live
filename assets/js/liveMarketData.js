/**
 * Economic Group — Live Market Data (Direct Browser Fetch, No Google Sheets)
 *
 * Fetches Currencies and precious-metal Commodities (Gold, Silver) directly
 * from Frankfurter (api.frankfurter.dev) — a free, keyless, CORS-enabled
 * exchange-rate API. Verified directly against the live API: it supports
 * EGP and SAR, and XAU/XAG (gold/silver) have real ISO 4217 currency codes
 * so it can quote those too. No Google Sheet, no Apps Script, no API key,
 * and nothing to expose in the page's source — the data itself is public.
 *
 * What this does NOT cover: oil, natural gas (not currencies, so
 * Frankfurter has no data for them — dropped from the Commodities tab
 * entirely rather than kept on a Google Sheet), and EGX-specific
 * stocks/indices (no free, CORS-enabled provider exists for the Egyptian
 * Exchange, so those are shown via TradingView's own embeddable widgets —
 * see tradingViewWidgets.js — rather than a custom-rendered table).
 *
 * Frankfurter has no idea what "USD/EGP" should be called in Arabic, or
 * what icon/order/unit it should have — that static display metadata lives
 * right here alongside the fetch logic, since none of it comes from Sheets
 * anymore for these two categories.
 */

(function () {
  const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2';

  const CURRENCY_META = [
    { Pair: 'USD/EGP', NameEN: 'US Dollar', NameAR: 'الدولار الأمريكي', from: 'USD', Order: 1 },
    { Pair: 'EUR/EGP', NameEN: 'Euro', NameAR: 'اليورو', from: 'EUR', Order: 2 },
    { Pair: 'GBP/EGP', NameEN: 'British Pound', NameAR: 'الجنيه الإسترليني', from: 'GBP', Order: 3 },
    { Pair: 'SAR/EGP', NameEN: 'Saudi Riyal', NameAR: 'الريال السعودي', from: 'SAR', Order: 4 }
  ];

  const METAL_META = [
    { Code: 'XAU', NameEN: 'Gold', NameAR: 'الذهب', Unit: 'oz', Order: 1 },
    { Code: 'XAG', NameEN: 'Silver', NameAR: 'الفضة', Unit: 'oz', Order: 2 }
  ];

  function directionOf(percent) {
    if (percent > 0) return 'up';
    if (percent < 0) return 'down';
    return 'flat';
  }

  function daysAgoIso(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Fetches a short daily time series for `quotes` against `base` (last 7
   * days, to comfortably span weekends/holidays where FX doesn't update),
   * and reduces it to the latest and previous available day so callers can
   * compute a real day-over-day percent change instead of showing 0.00%.
   */
  function fetchSeriesWithChange(base, quotes) {
    const url = `${FRANKFURTER_BASE}/rates?base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quotes.join(','))}&from=${daysAgoIso(7)}`;
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Frankfurter request failed: ' + res.status);
        return res.json();
      })
      .then((rows) => {
        // Response is a flat array of { date, base, quote, rate } — one row
        // per quote per date. Group by date, then keep the latest two.
        const byDate = {};
        (rows || []).forEach((row) => {
          byDate[row.date] = byDate[row.date] || {};
          byDate[row.date][row.quote] = row.rate;
        });
        const dates = Object.keys(byDate).sort();
        const latestDate = dates[dates.length - 1];
        const previousDate = dates.length > 1 ? dates[dates.length - 2] : latestDate;
        return {
          latest: (latestDate && byDate[latestDate]) || {},
          previous: (previousDate && byDate[previousDate]) || {}
        };
      });
  }

  /**
   * Fetches USD/EGP, EUR/EGP, GBP/EGP, SAR/EGP directly from Frankfurter.
   * @returns {Promise<Array<Object>>} shaped exactly like Currencies sheet
   *   rows (Pair/NameEN/NameAR/Rate/ChangePercent/Direction/Order/Published)
   *   so the existing render/component code needs zero changes.
   */
  function fetchCurrencies() {
    return fetchSeriesWithChange('EGP', CURRENCY_META.map((c) => c.from))
      .then(({ latest, previous }) => {
        return CURRENCY_META.map((meta) => {
          // Frankfurter quotes EGP→X (e.g. EGP→USD); invert to get X→EGP,
          // the conventional "how many EGP per 1 USD" reading.
          const latestEgpToX = latest[meta.from];
          const previousEgpToX = previous[meta.from];
          const rate = latestEgpToX ? 1 / latestEgpToX : null;
          const prevRate = previousEgpToX ? 1 / previousEgpToX : null;
          const changePercent = rate && prevRate ? ((rate - prevRate) / prevRate) * 100 : 0;

          return {
            Pair: meta.Pair,
            NameEN: meta.NameEN,
            NameAR: meta.NameAR,
            Rate: rate,
            ChangePercent: changePercent,
            Direction: directionOf(changePercent),
            Order: meta.Order,
            Published: rate !== null
          };
        }).filter((row) => row.Published);
      })
      .catch((err) => {
        console.error('LiveMarketData.fetchCurrencies failed:', err);
        return [];
      });
  }

  /**
   * Fetches Gold + Silver spot prices (USD/oz) directly from Frankfurter.
   * Only returns these two — Oil and Natural Gas aren't currencies, so
   * Frankfurter has no data for them. There's no Google Sheet fallback for
   * those anymore either, so the Commodities tab is Gold/Silver only now.
   * @returns {Promise<Array<Object>>} shaped like Commodities sheet rows.
   */
  function fetchMetals() {
    return fetchSeriesWithChange('USD', METAL_META.map((m) => m.Code))
      .then(({ latest, previous }) => {
        return METAL_META.map((meta) => {
          // Frankfurter quotes USD→XAU (oz of gold per dollar); invert to
          // get the conventional "$/oz" spot price.
          const latestUsdToMetal = latest[meta.Code];
          const previousUsdToMetal = previous[meta.Code];
          const price = latestUsdToMetal ? 1 / latestUsdToMetal : null;
          const prevPrice = previousUsdToMetal ? 1 / previousUsdToMetal : null;
          const changePercent = price && prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;

          return {
            Code: meta.Code,
            NameEN: meta.NameEN,
            NameAR: meta.NameAR,
            Price: price,
            Unit: meta.Unit,
            ChangePercent: changePercent,
            Direction: directionOf(changePercent),
            Order: meta.Order,
            Published: price !== null
          };
        }).filter((row) => row.Published);
      })
      .catch((err) => {
        console.error('LiveMarketData.fetchMetals failed:', err);
        return [];
      });
  }

  window.LiveMarketData = { fetchCurrencies, fetchMetals };
})();
