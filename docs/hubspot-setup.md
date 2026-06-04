# HubSpot setup — Altus KC capture

Everything the site needs to send leads into HubSpot. The site posts to the **HubSpot
Forms API** client-side (no backend, per build spec §2). That API needs two things that
must be created in the HubSpot UI — a HubSpot connector/integration **cannot** create
marketing Forms or custom property definitions, so these are manual (one time, ~10 min):

1. **Custom contact properties** (so the scores have somewhere to land)
2. **Two forms** (so the Forms API has GUIDs to post to)

**Portal ID:** `244733039` — already wired into `.env` / `.env.example`.

Once the two forms exist, paste their GUIDs into `.env` (local) and Cloudflare Pages →
Environment variables (prod):

```
PUBLIC_HUBSPOT_REC_FORM_ID=<results form GUID>
PUBLIC_HUBSPOT_BENCH_FORM_ID=<bench form GUID>
```

Until they're set, both forms log their payload to the browser console and no-op — the UX
flow is fully demonstrable without HubSpot.

---

## 1. Custom contact properties

Settings → Properties → Contacts → **Create property**. Create a group "Revenue Engine
Check" to keep them tidy. None of these exist yet (verified June 2026).

### Revenue Engine Check

| Internal name | Label | Field type | Notes / options |
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
| `edge_band` | Edge band | Single checkbox (boolean) | true when band is `1-2` or `20-50` |

> Internal names must match exactly — the site posts these keys (`src/data/quiz.js`,
> `src/pages/tools/revenue-engine-check.astro`). Labels are yours to change.

### Bench application

| Internal name | Label | Field type | Notes / options |
|---|---|---|---|
| `linkedin` | LinkedIn | Single-line text | URL |
| `specialty` | Operator specialty | Dropdown select | `RevOps`, `AI implementation`, `Fractional sales leadership`, `Other` |
| `day_rate_band` | Day rate band | Dropdown select | `Under $750`, `$750–1,250`, `$1,250–2,000`, `$2,000+` |
| `availability` | Availability | Dropdown select | `Open now`, `Within 30 days`, `Selectively / for the right fit`, `Booked, but keep me in mind` |

`full_name`, `email` map to HubSpot's standard contact properties.

Bench applicants are tagged via `lifecyclestage = bench_applicant` in the payload. If you'd
rather not overload `lifecyclestage`, create a single-checkbox `bench_applicant` property
and change the one tag line in `src/pages/bench.astro` to use it.

---

## 2. The two forms

Marketing → Forms → **Create form** → Embedded form. The Forms API submits by GUID; the
form's own fields mainly need to *exist* so HubSpot accepts the mapped properties.

### Form A — "Revenue Engine Check results"

Fields: Email, `rec_p1`–`rec_p6`, `rec_overall`, `rec_grade`, `rec_route`,
`revenue_band`, `edge_band`.
Post-submit: kick off the 3-touch follow-up sequence (sequence copy is a post-launch task,
not in the repo — build spec §4.6).
→ Copy the form **GUID** into `PUBLIC_HUBSPOT_REC_FORM_ID`.

### Form B — "Bench application"

Fields: Email, `full_name` (First/Last or a single field), `linkedin`, `specialty`,
`day_rate_band`, `availability`.
→ Copy the form **GUID** into `PUBLIC_HUBSPOT_BENCH_FORM_ID`.

Find the GUID in the form's embed code (`hbspt.forms.create({ formId: "...." })`) or the
form editor URL.

---

## Test it

1. `.env` has portal ID + both GUIDs → `npm run build && npm run preview`.
2. Run the Revenue Engine Check to results, submit the email → a contact appears in HubSpot
   with the `rec_*` properties populated.
3. Submit the bench form → a contact appears tagged `bench_applicant`.

If a submission 400s, it's almost always a property internal-name mismatch or a property
that wasn't created — the browser network tab shows which field HubSpot rejected.

---

## Optional upgrade — skip the manual forms

If you'd rather not build forms in the UI, the capture can move to a **Cloudflare Pages
Function** (edge, not a server you maintain) that calls the HubSpot CRM API with a
private-app token kept as a Cloudflare secret. That removes the need for form GUIDs and
keeps the token server-side. The custom properties above are still required. Say the word
and I'll add `functions/api/submit.js` and switch both forms to post to it.
