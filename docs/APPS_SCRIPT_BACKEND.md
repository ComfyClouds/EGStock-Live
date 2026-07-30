# Economic Group — Google Apps Script Backend

Deploy this as the Web App backend for the `EconomicGroup_CMS` spreadsheet. It reads every tab described in
`GOOGLE_SHEETS_SCHEMA.md` and serves it as JSONP so the static frontend can call it cross-origin with a
plain `<script>` tag (no CORS preflight, no server needed).

## Setup

1. Open the `EconomicGroup_CMS` Google Sheet.
2. `Extensions → Apps Script`.
3. Replace the contents of `Code.gs` with the script below.
4. Set `SPREADSHEET_ID` to your sheet's ID (from its URL) and `ADMIN_EMAIL` to the
   address that should receive new-account notifications.
5. If your frontend ever needs to read a sheet that isn't in `READ_ALLOWLIST`, or
   submit a form to a target that isn't in `SUBMIT_ALLOWLIST`, add it there — the
   endpoint refuses anything not explicitly listed, by design (see the security
   notes at the top of `Code.gs`).
6. `Deploy → New deployment → Web app`.
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the deployment URL into `assets/js/config.js` as `SHEETS_API_URL`.

> ⚠️ **If you had a previous deployment of the old (un-allowlisted) script live**,
> its URL should be treated as already compromised — anyone who viewed your page
> source had it, and the old code would let them read any sheet by name,
> including "New Clients". Don't just update the code on the existing
> deployment; create a **new deployment** (which gets a new URL), point
> `config.js` at the new URL, and disable/archive the old deployment from
> `Deploy → Manage deployments`. If you've been running the old version in
> production, treat any data in "New Clients" and other write-only sheets as
> potentially already exposed.

> **Note on email quotas:** `MailApp.sendEmail` runs under the quota of the Google
> account that deployed the script (100 emails/day on a free Gmail account, higher on
> Google Workspace). Each signup sends 2 emails (1 admin + 1 client), so this is
> generous for typical signup volume. The "New Clients" sheet tab is created
> automatically on first submission — no manual setup needed.

## Code.gs

```javascript
/**
 * Economic Group — Google Sheets JSONP API
 * Exposes an ALLOWLISTED set of tabs in this spreadsheet as a JSONP endpoint:
 *   ?sheet=News&callback=cb
 *   ?sheet=FAQs&callback=cb
 * Also supports fetching multiple sheets in one call:
 *   ?sheets=News,Navigation&callback=cb
 * Accepts generic form submissions (newsletter, contact) into an ALLOWLISTED
 * set of target sheets:
 *   ?action=submit&target=NewsletterSignups&callback=cb&payload={...}
 * Accepts new-account signups — appends a row to "New Clients" AND emails
 * both the admin and the client:
 *   ?action=signup&callback=cb&payload={...}
 *
 * SECURITY NOTES (read before deploying):
 * - READ_ALLOWLIST and SUBMIT_ALLOWLIST are the only tabs this endpoint will
 *   ever read from or write to, respectively — everything else (including
 *   "New Clients", which is meant to be write-only) is unreachable via
 *   ?sheet=/?sheets=/?target=. If you add a sheet the frontend needs to
 *   read, add its exact name to READ_ALLOWLIST; if you add a new form that
 *   submits via `action=submit`, add its target sheet name to
 *   SUBMIT_ALLOWLIST. Never widen these to "read/write any sheet."
 * - sanitizeForSheets() defuses Google Sheets formula injection: a payload
 *   field like Name="=IMPORTXML(...)" would otherwise become a live formula
 *   the moment you open the spreadsheet. Any string starting with
 *   = + - @ (or a tab/CR) gets a leading apostrophe so Sheets stores it as
 *   plain text instead of evaluating it.
 * - checkRateLimit() is a coarse, script-wide throttle (not per-IP — Apps
 *   Script Web Apps don't expose the caller's IP) that caps total write
 *   requests per minute across all users. It stops naive flooding but is
 *   not a substitute for a CAPTCHA if you start seeing targeted abuse.
 */

var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Where the "a new client just signed up" notification email is sent.
var ADMIN_EMAIL = 'you@example.com';

// The only tabs this endpoint will ever return via ?sheet=/?sheets=.
// Keep this in sync with what assets/js actually calls (see sheetsApi.js
// call sites) — do NOT default to "allow everything."
var READ_ALLOWLIST = [
  'ContactInformation',
  'FAQs',
  'FooterLinks',
  'SocialLinks',
  'Navigation',
  'MarketStatus',
  'News',
  'Sliders',
  'Announcements'
];

// The only tabs a generic ?action=submit can write to. "New Clients" is
// intentionally NOT here — it's only reachable via ?action=signup, which
// runs its own dedicated handler (handleSignup) below.
var SUBMIT_ALLOWLIST = ['ContactSubmissions', 'NewsletterSignups'];

// Max ?action=submit / ?action=signup requests accepted per rolling minute,
// script-wide. Adjust if legitimate traffic ever gets close to this.
var WRITE_RATE_LIMIT_PER_MINUTE = 20;

function doGet(e) {
  var params = e.parameter;
  var callback = params.callback || 'callback';
  var output;

  try {
    if (params.action === 'signup') {
      output = withRateLimit(function () { return handleSignup(params); });
    } else if (params.action === 'submit') {
      output = withRateLimit(function () { return handleSubmit(params); });
    } else if (params.sheets) {
      var names = params.sheets.split(',').map(function (n) { return n.trim(); });
      var disallowed = names.filter(function (n) { return READ_ALLOWLIST.indexOf(n) === -1; });
      if (disallowed.length) {
        output = { success: false, error: 'Sheet(s) not available: ' + disallowed.join(', ') };
      } else {
        var result = {};
        names.forEach(function (name) {
          result[name] = readSheet(name);
        });
        output = { success: true, data: result };
      }
    } else if (params.sheet) {
      if (READ_ALLOWLIST.indexOf(params.sheet) === -1) {
        output = { success: false, error: 'Sheet not available: ' + params.sheet };
      } else {
        output = { success: true, sheet: params.sheet, rows: readSheet(params.sheet) };
      }
    } else {
      output = { success: false, error: 'Missing "sheet" or "sheets" parameter.' };
    }
  } catch (err) {
    output = { success: false, error: err.message };
  }

  var body = callback + '(' + JSON.stringify(output) + ');';
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Coarse script-wide rate limit for write actions (submit/signup), using
 * CacheService since Web Apps don't expose the caller's IP to key a
 * per-client limit on. Buckets by the current minute.
 */
function withRateLimit(fn) {
  if (!checkRateLimit()) {
    return { success: false, error: 'Too many requests — please try again in a minute.' };
  }
  return fn();
}

function checkRateLimit() {
  var cache = CacheService.getScriptCache();
  var bucketKey = 'writes_' + Math.floor(Date.now() / 60000);
  var current = Number(cache.get(bucketKey) || '0');
  if (current >= WRITE_RATE_LIMIT_PER_MINUTE) return false;
  cache.put(bucketKey, String(current + 1), 70); // expire a little after the minute rolls over
  return true;
}

/**
 * Prevents Google Sheets formula injection: if a payload value is a string
 * starting with a character Sheets treats as a formula/command trigger
 * (= + - @, or a leading tab/CR), prefix it with an apostrophe so Sheets
 * stores it as literal text instead of evaluating it.
 */
function sanitizeForSheets(value) {
  if (typeof value !== 'string') return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}

function readSheet(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  var values = sheet.getDataRange().getValues();
  var headers = values.shift();

  return values
    .filter(function (row) {
      return row.join('').trim() !== '';
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        var key = String(header).trim();
        var value = row[i];
        if (value instanceof Date) {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[key] = value;
      });
      return obj;
    });
}

/**
 * Handles JSONP form submissions and appends a row to an allowlisted
 * target sheet. payload is a URL-encoded JSON string of { field: value, ... }
 */
function handleSubmit(params) {
  var target = params.target;

  if (SUBMIT_ALLOWLIST.indexOf(target) === -1) {
    return { success: false, error: 'Submissions to "' + target + '" are not accepted.' };
  }

  var payload = JSON.parse(params.payload || '{}');
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(target);

  if (!sheet) {
    sheet = ss.insertSheet(target);
    var headers = Object.keys(payload).concat(['SubmittedAt']);
    sheet.appendRow(headers);
  }

  var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = existingHeaders.map(function (header) {
    if (header === 'SubmittedAt') return new Date();
    return sanitizeForSheets(payload[header] !== undefined ? payload[header] : '');
  });

  sheet.appendRow(row);
  return { success: true, message: 'Saved to ' + target };
}

/**
 * Handles new-account signups from the "Open Account" registration form:
 *  1. Appends the client's details to the "New Clients" sheet tab
 *     (creates the tab with headers on first use).
 *  2. Emails ADMIN_EMAIL a notification with the client's details.
 *  3. Emails the client a confirmation that their request is being processed.
 * payload fields: Name, Email, Phone, Address, Language ("ar" | "en")
 */
function handleSignup(params) {
  var payload = JSON.parse(params.payload || '{}');
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetName = 'New Clients';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Name', 'Email', 'Phone', 'Address', 'Language', 'SubmittedAt']);
  }

  sheet.appendRow([
    sanitizeForSheets(payload.Name || ''),
    sanitizeForSheets(payload.Email || ''),
    sanitizeForSheets(payload.Phone || ''),
    sanitizeForSheets(payload.Address || ''),
    sanitizeForSheets(payload.Language || ''),
    new Date()
  ]);

  sendAdminNotificationEmail(payload);
  sendClientConfirmationEmail(payload);

  return { success: true, message: 'Signup received' };
}

function sendAdminNotificationEmail(payload) {
  var subject = 'New Account Request — ' + (payload.Name || 'Unknown');
  var body =
    'A new account request was submitted on the Economic Group website:\n\n' +
    'Name: ' + (payload.Name || '') + '\n' +
    'Email: ' + (payload.Email || '') + '\n' +
    'Phone: ' + (payload.Phone || '') + '\n' +
    'Address: ' + (payload.Address || '') + '\n' +
    'Preferred language: ' + (payload.Language || '') + '\n' +
    'Submitted at: ' + new Date().toString();

  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

function sendClientConfirmationEmail(payload) {
  var isArabic = payload.Language === 'ar';

  var subject = isArabic
    ? 'تم استلام طلب فتح حسابك في المجموعة الاقتصادية'
    : 'Your Economic Group account request has been received';

  var body = isArabic
    ? 'مرحباً ' + (payload.Name || '') + '،\n\n' +
      'شكراً لتقديم طلب فتح حساب لدى المجموعة الاقتصادية. جارٍ حالياً مراجعة بياناتك، ' +
      'وسيتواصل معك أحد أعضاء فريق العمليات لدينا خلال الخمسة أيام العمل القادمة.\n\n' +
      'مع تحيات فريق المجموعة الاقتصادية'
    : 'Hi ' + (payload.Name || '') + ',\n\n' +
      'Thank you for requesting an Economic Group trading account. Your details are ' +
      'currently being processed, and one of our operations team members ' +
      'will contact you within the next 5 business days.\n\n' +
      'Best regards,\nThe Economic Group Team';

  if (payload.Email) {
    MailApp.sendEmail(payload.Email, subject, body);
  }
}
```

## Frontend usage pattern (JSONP, matches `assets/js/sheetsApi.js`)

```html
<script>
  function handleNews(response) { console.log(response.rows); }
</script>
<script src="https://script.google.com/macros/s/DEPLOYMENT_ID/exec?sheet=News&callback=handleNews"></script>
```

This is exactly what `sheetsApi.js` does dynamically (injects a `<script>` tag per call, cleans it up after
the callback fires, and rejects on a timeout).

## Account signup flow

`pages/signup.html` → `assets/js/signup.js` calls `SheetsAPI.submitSignup(payload)`, which hits
`?action=signup` instead of `?action=submit`. This distinction matters: `submit` only appends a row,
while `signup` appends a row to **New Clients** *and* triggers both emails via `handleSignup` above.
On success the client is redirected to `pages/thank-you.html`.

---

## Automated Market Data Refresh — ⚠️ Removed

This section used to describe a time-based Apps Script trigger (`refreshMarketData`, via a paid Twelve
Data API plan) that kept the **Markets**, **Stocks**, and **Commodities** (Oil/Gas) sheets updated
automatically. All three of those sheets have since been removed — Market Overview, Top Movers, the
Stocks list, and the hero "Live Snapshot" panel are now official TradingView widgets (see
`docs/TRADINGVIEW_WIDGETS.md`), and the Commodities ticker is Gold/Silver only, fetched live from
Frankfurter (see `docs/LIVE_MARKET_DATA.md`) with no sheet involved at all.

If you still have a `createMarketDataTrigger` / `refreshMarketData` setup running in Apps Script from
before this change, run `deleteMarketDataTriggers` once (select it in the function dropdown, click Run)
to stop it — with the target sheets gone, it would otherwise keep firing and logging errors every 30
minutes for no benefit. If the sheets themselves still exist in your spreadsheet, `Code.gs` now includes
`removeLegacyMarketDataSheets` to delete them in one click — see `docs/GOOGLE_SHEETS_SCHEMA.md`.
