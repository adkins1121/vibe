# Lead capture setup — Altus KC

Capture runs through a **Cloudflare Pages Function** (`functions/api/submit.js`). The
browser POSTs to `/api/submit`, and the function fans out to two **independent, best-effort**
sinks. Set whichever secrets you want; each runs if configured:

1. **Slack** — a formatted Block Kit notification via an Incoming Webhook
   (`SLACK_WEBHOOK_URL`). Real-time alert.
2. **HubSpot** — upserts the contact by email and **appends** each submission as a JSON
   entry to the standard `hs_content_membership_notes` property (`HUBSPOT_PRIVATE_APP_TOKEN`).
   Historical record. **No custom properties** — works on the current plan.

Both secrets are server-side — never shipped to the browser.

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

## 2. (Optional) HubSpot historical record

Writes go into the standard **`hs_content_membership_notes`** property — no custom
properties, so no plan upgrade.

1. Settings → Integrations → **Private Apps** → create one ("Altus site capture").
2. Scopes: `crm.objects.contacts.read` and `crm.objects.contacts.write`.
3. Copy the access token → set it as the secret `HUBSPOT_PRIVATE_APP_TOKEN`.

Each submission is appended to a JSON array in that property (most recent 50 kept), so a
contact accumulates their history — e.g. someone who re-takes the Revenue Engine Check shows
both runs. A pre-existing manual note in the field is preserved as the first entry, never
overwritten. Portal ID for reference: `244733039`.

## 3. Set the secrets

- **Production** — Cloudflare Pages → project → Settings → Environment variables → add the
  secret(s) and click **Encrypt**:
  - `SLACK_WEBHOOK_URL` (and optionally `SLACK_BENCH_WEBHOOK_URL`)
  - `HUBSPOT_PRIVATE_APP_TOKEN`
- **Local testing** — put them in `.dev.vars` (gitignored):

  ```
  # .dev.vars
  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T000/B000/xxxxxxxx
  HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx
  ```
  ```
  npm run build && npx wrangler pages dev ./dist
  ```

No build-time keys — `.env` only holds `PUBLIC_BOOKING_URL`. If neither secret is set the
function returns 503 (logged), and the visitor still sees their report.

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

## What lands in HubSpot

The contact's **Membership Notes** (`hs_content_membership_notes`) holds a JSON array, one
object per submission, e.g.:

```json
[
  {
    "ts": "2026-06-04T15:12:09.114Z",
    "kind": "rec",
    "email": "founder@company.com",
    "rec_p1": "4", "rec_p2": "2", "rec_p3": "3",
    "rec_p4": "3", "rec_p5": "3", "rec_p6": "3",
    "rec_overall": "18", "rec_grade": "Engine leaking",
    "rec_route": "DIAGNOSTIC", "weakest": "Pipeline Generation",
    "revenue_band": "2-10", "edge_band": "false"
  }
]
```

## How the function behaves

- Validates `email` and `kind` (`rec` | `bench`); reads only allowlisted fields.
- Slack and HubSpot run independently — one failing doesn't stop the other.
- Capture is **best-effort on the client** — if the function is unreachable (e.g. local
  static `npm run preview`, which doesn't run Functions) the visitor still sees their
  report and the payload is logged to the console.
- No sink configured → 503 + server log; visitor UX is unaffected.

## Test it

1. Secret(s) set (prod or `.dev.vars`).
2. Run the Revenue Engine Check to results → submit email → Slack message and/or a contact
   in HubSpot with the JSON in Membership Notes.
3. Re-take it with the same email → a second entry appends to the same contact's notes.
4. Submit the bench form → Slack message and/or the contact's notes gain a `bench` entry.

---

## Custom properties (optional, later)

Storing everything as JSON in one property is deliberate — it needs no plan upgrade and keeps
history in one place. If/when you want the scores as **structured, reportable** HubSpot
properties (to drive workflows or list segmentation), create custom contact properties
(`rec_p1`…`rec_p6`, `rec_overall`, `rec_grade`, `rec_route`, `revenue_band`, `edge_band`, and
the bench fields) and we can also write the flat values alongside the JSON. Not required for
capture to work.
