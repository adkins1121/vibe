# Lead capture setup — Altus KC

Capture runs through a **Cloudflare Pages Function** (`functions/api/submit.js`). The
browser POSTs to `/api/submit`; the function posts a formatted notification to a **Slack
channel** via an Incoming Webhook. The webhook URL is a Cloudflare secret — never shipped
to the browser, no API tokens, no plan upgrade required.

HubSpot capture is **stubbed for now** (it needs a HubSpot plan upgrade for custom
properties). The hook to re-enable it is marked in `functions/api/submit.js`; see the
bottom of this doc.

---

## 1. Create the Slack Incoming Webhook

1. Slack → **Apps** → create (or reuse) an app for your workspace
   (<https://api.slack.com/apps> → *Create New App* → *From scratch*).
2. Turn on **Incoming Webhooks** → **Add New Webhook to Workspace**.
3. Pick the channel for leads (e.g. `#altus-leads`) and authorize.
4. Copy the webhook URL — looks like
   `https://hooks.slack.com/services/T000/B000/xxxxxxxx`.

> Optional: create a second webhook for a different channel (e.g. `#altus-bench`) and set
> it as `SLACK_BENCH_WEBHOOK_URL` to route bench applications separately. If unset, bench
> notifications go to the main channel.

## 2. Set the secret

- **Production** — Cloudflare Pages → project → Settings → Environment variables → add
  `SLACK_WEBHOOK_URL` (value = the webhook URL), click **Encrypt**. Optionally add
  `SLACK_BENCH_WEBHOOK_URL`.
- **Local testing** — put it in `.dev.vars` (gitignored):

  ```
  # .dev.vars
  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T000/B000/xxxxxxxx
  ```
  ```
  npm run build && npx wrangler pages dev ./dist
  ```

That's it. No build-time keys — `.env` only holds `PUBLIC_BOOKING_URL`.

---

## What lands in Slack

**Revenue Engine Check** →

> 🔧 New Revenue Engine Check
> *Grade:* Engine leaking (18/36)  *Route:* DIAGNOSTIC  *Weakest phase:* Pipeline Generation
> *Revenue band:* $2–10M  *Email:* founder@company.com
> Phase scores  P1 4 · P2 2 · P3 3 · P4 3 · P5 3 · P6 3

**Bench application** →

> 🪑 New bench application
> *Name:* Jane Doe  *Email:* …  *Specialty:* RevOps
> *Day rate:* $1,250–2,000  *Availability:* Open now
> LinkedIn  (link)

## How the function behaves

- Validates `email` and `kind` (`rec` | `bench`); reads only allowlisted fields.
- Capture is **best-effort on the client** — if the function is unreachable (e.g. local
  static `npm run preview`, which doesn't run Functions) the visitor still sees their
  report and the payload is logged to the console.
- Missing webhook → 503 + server log; visitor UX is unaffected.

## Test it

1. Webhook secret set (prod or `.dev.vars`).
2. Run the Revenue Engine Check to results → submit email → message in the channel.
3. Submit the bench form → message in the channel.

---

## Re-enabling HubSpot later (deferred)

When the HubSpot plan supports custom properties:

1. Create the custom contact properties — internal names/types/options:

   | name | type | notes |
   |---|---|---|
   | `rec_p1`…`rec_p6` | Number | 0–6 each |
   | `rec_overall` | Number | 0–36 |
   | `rec_grade` | Dropdown | `Engine stalled` / `Engine leaking` / `Running, not compounding` / `Tuned — now scale it` |
   | `rec_route` | Dropdown | `SPRINT` / `DIAGNOSTIC` / `STRONG` |
   | `revenue_band` | Dropdown | `pre` / `1-2` / `2-10` / `10-20` / `20-50` / `50+` |
   | `edge_band` | Checkbox | boolean |
   | `linkedin`, `specialty`, `day_rate_band`, `availability`, `bench_applicant` | text / dropdown / checkbox | bench fields |

2. Create a private app (`crm.objects.contacts.read`/`write`), set
   `HUBSPOT_PRIVATE_APP_TOKEN` as a Cloudflare secret.
3. Restore the `upsertHubSpotContact` call in `functions/api/submit.js` (the full
   implementation is in git history — the commit just before the Slack switch). It can run
   alongside the Slack notification or replace it.

Portal ID for reference: `244733039`.
