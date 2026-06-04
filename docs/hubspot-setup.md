# HubSpot setup — Altus KC capture

Lead capture runs through a **Cloudflare Pages Function** (`functions/api/submit.js`),
not the HubSpot Forms API. The browser POSTs to `/api/submit`; the function upserts a
HubSpot contact via the CRM API using a **private-app token** kept server-side. The token
never reaches the browser, and there are **no marketing forms to build**.

Two one-time setup steps (a HubSpot connector can't do either for you):

1. **Custom contact properties** — so the scores have somewhere to land.
2. **A private app + token** — so the function can write to HubSpot.

**Portal ID:** `244733039` (reference only — the function authenticates with the token).

---

## 1. Custom contact properties

Settings → Properties → Contacts → **Create property**. Make a group "Revenue Engine Check"
to keep them tidy. None of these exist yet (verified June 2026). **Internal names must match
exactly** — the function writes these keys (`functions/api/submit.js`, allowlist).

### Revenue Engine Check

| Internal name | Label | Field type | Options |
|---|---|---|---|
| `rec_p1` | REC · P1 ICP & Positioning | Number | 0–6 |
| `rec_p2` | REC · P2 Pipeline Generation | Number | 0–6 |
| `rec_p3` | REC · P3 Sales Process & Conversion | Number | 0–6 |
| `rec_p4` | REC · P4 Revenue Operations | Number | 0–6 |
| `rec_p5` | REC · P5 Team & Cadence | Number | 0–6 |
| `rec_p6` | REC · P6 AI & Automation Leverage | Number | 0–6 |
| `rec_overall` | REC · Overall score | Number | 0–36 |
| `rec_grade` | REC · Grade | Dropdown select | `Engine stalled`, `Engine leaking`, `Running, not compounding`, `Tuned — now scale it` |
| `rec_route` | REC · Route | Dropdown select | `SPRINT`, `DIAGNOSTIC`, `STRONG` |
| `revenue_band` | Revenue band | Dropdown select | `pre`, `1-2`, `2-10`, `10-20`, `20-50`, `50+` |
| `edge_band` | Edge band | Single checkbox (boolean) | true for bands `1-2` / `20-50` |

### Bench application

| Internal name | Label | Field type | Options |
|---|---|---|---|
| `linkedin` | LinkedIn | Single-line text | URL |
| `specialty` | Operator specialty | Dropdown select | `RevOps`, `AI implementation`, `Fractional sales leadership`, `Other` |
| `day_rate_band` | Day rate band | Dropdown select | `Under $750`, `$750–1,250`, `$1,250–2,000`, `$2,000+` |
| `availability` | Availability | Dropdown select | `Open now`, `Within 30 days`, `Selectively / for the right fit`, `Booked, but keep me in mind` |
| `bench_applicant` | Bench applicant | Single checkbox (boolean) | function sets `true` |

`full_name` is split into HubSpot's standard `firstname` / `lastname`; `email` is standard.

---

## 2. Private app + token

Settings → Integrations → **Private Apps** → Create a private app ("Altus site capture").
Scopes (CRM):

- `crm.objects.contacts.read`
- `crm.objects.contacts.write`

Create it, copy the **access token**, then set it as a secret (never commit it):

- **Production** — Cloudflare Pages → your project → Settings → Environment variables →
  add `HUBSPOT_PRIVATE_APP_TOKEN`, value = the token, and click **Encrypt**.
- **Local testing** — put it in `.dev.vars` (gitignored) and run the function locally:

  ```
  # .dev.vars
  HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx
  ```
  ```
  npx wrangler pages dev -- npm run preview      # or: wrangler pages dev ./dist
  ```

That's it — no form GUIDs, no `PUBLIC_HUBSPOT_*` keys.

---

## How the function behaves

- Validates the email and the `kind` (`rec` | `bench`); writes **only allowlisted**
  properties, so the endpoint can't be abused to set arbitrary contact fields.
- Upserts by email: `POST` a new contact, or on a 409 conflict parse the existing ID and
  `PATCH` it. So re-taking the check updates the same contact instead of duplicating.
- Capture is **best-effort on the client** — if the function is unreachable (e.g. local
  static `npm run preview`, which doesn't run Functions) the visitor still sees their
  report; the browser console logs the payload that would have been sent.
- If the token is missing the function returns 503 and logs server-side — visitor UX is
  unaffected.

---

## Test it

1. Properties created + token set (prod or `.dev.vars`).
2. Run the Revenue Engine Check to results → submit email → a contact appears with the
   `rec_*` properties populated; re-take it and confirm the same contact updates.
3. Submit the bench form → a contact appears with `bench_applicant = true`.

A 502 from `/api/submit` with a HubSpot 400 in the Function logs almost always means a
property internal-name mismatch or a property that wasn't created — the log names the field.

---

## Post-launch (not in repo)

The 3-touch follow-up sequence that references the contact's weakest phase (build spec §4.6)
is configured in HubSpot against the `rec_*` properties once contacts start landing.
