# Altus KC — Product Requirements Document (PRD)

**Product:** Altus KC marketing site + Revenue Engine Check
**Owner:** Mike Adkins (mike@altus-kc.com)
**Status:** Prototype — Milestones 1–3 built, capture wired, pre-deploy
**Last updated:** June 2026
**Source specs:** `docs/altus-website-build-spec.md`, `docs/altus-website-buildout-plan.md`
**This document describes the site as actually built**, and supersedes the original
spec where the build has moved on (notably: capture now runs through a Cloudflare Pages
Function to Slack + HubSpot Notes, not the HubSpot Forms API; booking is TidyCal).

---

## 1. Summary

Altus KC is the web presence for a fractional revenue operator who fixes broken revenue
engines for founder-led B2B companies. The site is not a brochure — it is a lead engine
built around one flagship interactive tool, the **Revenue Engine Check**, a free 3-minute
self-diagnostic that scores six phases of a company's revenue engine, names the weakest one,
and routes the visitor to the right engagement via a dual CTA.

The site is a fast, static Astro build with a single client-side JavaScript island (the
diagnostic) and one edge function (lead capture). No CMS, no backend database.

## 2. Goals & non-goals

### Goals (90 days post-launch, from strategy doc)
| Metric | Target |
|---|---|
| Diagnostic completions | 30+ |
| Diagnostic → discovery calls | 5+ |
| Calls → paid engagements | 1–2 |
| Bench applications | 15+ |
| Bench placements | 1 |

Governing rule: **if a page doesn't draw a line to a diagnostic call, a signed SOW, or a
bench placement, it doesn't ship.**

### Non-goals
Public job board, community features, coaching content, newsletter, CMS, public bench
roster, and any backend beyond the single capture function. Phase-2 delivery layer
(DocuSeal portal, DocRoom, gated roster) is explicitly out of scope for this repo.

## 3. Audience / personas

1. **Founder-led B2B company, $1–50M (primary).** Suspects revenue is leaking, can't name
   where. Runs the diagnostic, books a call. Logistics / freight / supply-chain lean.
2. **Operator (1099 bench applicant).** RevOps / AI implementation / fractional sales
   leader who wants into the Altus network. Applies via the Bench page.
3. **Disqualified visitor.** Pre-revenue/<$1M, $50M+, or pure B2C. Routed warmly off to
   `/not-a-fit` — protects the calendar, preserves goodwill.

## 4. Tech stack & architecture

| Concern | Decision |
|---|---|
| Framework | Astro 4 (static output) + `@astrojs/sitemap` |
| Hosting (target) | Cloudflare Pages |
| Styling | Vanilla CSS with design tokens (`src/styles/tokens.css`) — no Tailwind |
| Interactivity | One vanilla-JS island: the Revenue Engine Check. No other JS ships |
| Lead capture | Cloudflare Pages Function (`functions/api/submit.js`) → Slack + HubSpot |
| Booking | TidyCal inline iframe embed (`PUBLIC_BOOKING_URL`) |
| Fonts | Montserrat (600/700/800) + DM Sans (400/500/600), Google Fonts, `display=swap` |
| Content | Markdown content collection for Field Notes; JS data modules for the rest |
| Analytics | Plausible / Cloudflare Web Analytics (cookieless) — not yet added |

### Repository layout
```
src/
  styles/        tokens.css (brand source of truth), global.css
  layouts/       Base.astro (nav, footer, meta, fonts)
  components/    Wordmark, CTAButton, Card, PhaseBar
  data/          engagements.js, proof.js, quiz.js
  lib/           score.js (pure scoring/routing — shared by island + tests)
  content/       config.ts + field-notes/*.md (2 seed posts)
  pages/         index, how-i-work, proof, bench, not-a-fit, terms, privacy, 404,
                 field-notes/{index,[slug]}, tools/revenue-engine-check
functions/api/   submit.js (edge capture)
test/            score.test.mjs, submit.test.mjs
docs/            specs, capture-setup.md, this PRD
public/          favicon.svg, og-default.svg, robots.txt
```

## 5. Pages / routes

| Route | Purpose | Key elements |
|---|---|---|
| `/` | Positioning + single CTA | Hero one-liner, 3 engagement cards, proof strip, closing CTA |
| `/how-i-work` | Offers + trust | Engagement table, per-engagement sections, pricing philosophy, **full Not-a-Fit list**, TidyCal embed |
| `/proof` | Credibility | 3 anonymized case teardowns (situation → broken → built → moved) |
| `/field-notes` | POV archive | Grouped by pillar (Teardowns / AI that shipped / The KC angle); "What I'm reading" block |
| `/field-notes/[slug]` | Article | Markdown render + end-of-post diagnostic CTA |
| `/tools/revenue-engine-check` | **Flagship tool** | Qualifiers → 12 questions → scored results → dual CTA + email-gated PDF |
| `/bench` | Operator network | Client teaser (top) + operator application form (bottom) → capture |
| `/not-a-fit` | Warm off-ramp | Honest "not for you" + Field Notes links |
| `/terms`, `/privacy` | Legal | Privacy covers the diagnostic data capture |
| `/404` | Not found | On-voice, routes back to the diagnostic |

Global chrome (`Base.astro`): sticky header with wordmark + nav + persistent "Revenue
Engine Check" CTA; dark evergreen footer with link columns; skip-link, OG/canonical/meta,
font preconnect. Mobile nav collapses to a toggle.

## 6. The Revenue Engine Check (flagship) — functional spec

### 6.1 Flow
Intro → Qualifiers → 6 phase screens (2 questions each) → Results. State persists to
`localStorage` (key `altus-rec-v1`); a refresh resumes via a "Resume where you left off"
prompt. Progress bar across qualifiers + 6 phases. Fully keyboard-operable; styled radios.

### 6.2 Qualifiers (unscored)
- **Revenue band:** pre/<$1M · $1–2M · $2–10M · $10–20M · $20–50M · $50M+
- **Model:** B2B · B2C/consumer · Mixed
- **Founder-led day-to-day:** Yes / No

**Disqualify** (→ `/not-a-fit` in-flow, with a reason): band `pre` or `50+`, or model
`b2c`. **Edge bands** `1-2` / `20-50` pass but are flagged (`edge_band`).

### 6.3 Questions & scoring
6 phases × 2 questions, each option scored 0–3 (verbatim from spec §4.3):
P1 ICP & Positioning · P2 Pipeline Generation · P3 Sales Process & Conversion ·
P4 Revenue Operations · P5 Team & Cadence · P6 AI & Automation Leverage.

- Phase score = sum of its 2 questions (0–6). Overall = 0–36.
- **Grades:** 0–12 *Engine stalled* · 13–22 *Engine leaking* · 23–30 *Running, not
  compounding* · 31–36 *Tuned — now scale it*. Each has on-voice copy (review-flagged).

### 6.4 Routing (dual CTA)
```
gtmAvg = (P1+P2+P3+P4) / 4
if P6 <= 2 and gtmAvg >= 3:   SPRINT      → "Book the AI + Revenue System Sprint call"
elif min(P1..P5) <= 2:        DIAGNOSTIC  → "Book the discovery call" (names weakest phase)
else:                         STRONG      → "Book the call to pressure-test it"
```
Secondary CTA is always the other path. Both above the fold on results.

### 6.5 Results page
Six segmented phase bars (0–6), weakest highlighted in accent with a "weakest phase" flag;
grade headline + overall score + grade copy; routing card (hook + primary/secondary CTA);
**email-gated PDF** ("Get the full report") via browser print stylesheet; "Print to PDF"
and "Start over" controls. Email gates the report, **never** the quiz.

### 6.6 Logic location & tests
Pure scoring/routing in `src/lib/score.js`, imported by both the island and
`test/score.test.mjs`. The §6 acceptance vectors pass: all-0s → DIAGNOSTIC/stalled;
P6-low/GTM-high → SPRINT; all-3s → STRONG/tuned; plus grade boundaries and disqualifiers.

## 7. Lead capture

Browser POSTs JSON to `/api/submit` (the Pages Function). The function validates
`email` + `kind` (`rec` | `bench`), reads only allowlisted fields, and fans out to two
independent, best-effort sinks (each optional, enabled by its secret):

1. **Slack** (`SLACK_WEBHOOK_URL`, optional `SLACK_BENCH_WEBHOOK_URL`) — formatted Block
   Kit message to **#gtm-signals**. REC: grade, score, route, weakest phase, revenue band
   (edge flag), email, phase scores. Bench: name, email, specialty, day rate, availability,
   LinkedIn.
2. **HubSpot** (`HUBSPOT_PRIVATE_APP_TOKEN`) — upserts the contact by email and **appends**
   the submission as a JSON entry to the standard `hs_content_membership_notes` property
   (most recent 50 kept; pre-existing manual notes preserved). No custom properties → works
   on the current plan. Portal `244733039`.

Capture is best-effort: if the function is unreachable (e.g. local static preview) or a
sink fails, the visitor still gets their report; failures are logged server-side. Returns
`200` with a per-sink status; `503` only if no sink is configured. Tested in
`test/submit.test.mjs` (message shape, band-label mapping, escaping, notes history
append/preserve/cap).

> Deferred: HubSpot **structured/custom properties** (for list segmentation & sequences)
> need a plan upgrade; the JSON-notes approach is the interim. The 3-touch follow-up
> sequence is a post-launch HubSpot task.

## 8. Design system

Tokens in `src/styles/tokens.css` are authoritative (brand-assets.md). Palette: evergreen
`#1A3C34`, accent `#3D8C62`, cream `#F6F3EE` canvas, mid-green, card surfaces, muted text.
Type: Montserrat headings, DM Sans body; scale H1 48–64 / H2 32–40 / H3 24 / body 16.

**Hard rules (enforced):** cream canvas everywhere (never pure white except cards); one
accent moment per section; 4px max radius; no shadows/bevels; no gradients except the
`--accent-glow` hero wash; sentence-case headings; ALL CAPS only on the wordmark and
eyebrow labels. Logo is the typographic wordmark (ALTUS evergreen + KC accent) pending SVGs.

## 9. SEO / meta
Title pattern `{Page} — Altus KC · Fractional Revenue Operator, Kansas City`; per-page
description; canonical; Open Graph + Twitter card; OG image `public/og-default.svg`
(wordmark on cream, 1200×630); `sitemap-index.xml` via integration; `robots.txt`.

## 10. Configuration

| Key | Where | Purpose |
|---|---|---|
| `PUBLIC_BOOKING_URL` | `.env` / Pages env (build-time, public) | TidyCal booking link (currently `tidycal.com/madkins/60-min-mike-adkins`) |
| `SLACK_WEBHOOK_URL` | Cloudflare secret | Slack capture channel (#gtm-signals) |
| `SLACK_BENCH_WEBHOOK_URL` | Cloudflare secret (optional) | Separate bench channel |
| `HUBSPOT_PRIVATE_APP_TOKEN` | Cloudflare secret | HubSpot contact upsert |

Local: copy `.env.example`→`.env` and `.dev.vars.example`→`.dev.vars`. Scripts:
`npm run dev` (static), `npm run dev:functions` (build + wrangler, Function live),
`npm run build`, `npm run deploy`, `npm test`. Full capture setup in `docs/capture-setup.md`.

## 11. Quality / acceptance

- Build is clean; 12 routes generate; sitemap emits.
- Zero JS ships except the diagnostic island.
- Brand rules pass visual check (cream canvas, single accent/section, 4px radius).
- Routing test vectors pass; capture payload/history tests pass.
- Refresh-safe diagnostic; disqualifiers route correctly; print stylesheet renders.
- Known fix applied: phase bars are styled via an `is:global` block because they're built
  at runtime (scoped CSS wouldn't reach them).

## 12. Open items (pre-launch)

| Item | Status |
|---|---|
| Confirm 6 phase names vs. paid diagnostic | Open (Mike) |
| Slack webhook (#gtm-signals) | ✅ created |
| HubSpot Service Key / token | ✅ created (set as Cloudflare secret at deploy) |
| TidyCal booking link | ✅ wired |
| Price bands (currently placeholders) | Open — polish |
| Grade / route copy review | Open — polish |
| Case-study client-name approval (anonymized until then) | Open |
| Final logo SVGs (wordmark fallback in place) | Open |
| Analytics (Plausible/CF) | Not yet added |
| Cloudflare Pages deploy + env vars | Not yet done |
| TidyCal iframe embed check on real domain | Verify post-deploy |

## 13. Out of scope (Phase 2 — separate effort)
DocuSeal portal (`docs.altus-kc.com`), DocRoom template, gated client bench roster, and the
public "How engagements run" page. Scoped in the build spec §8; not in this repo.

## 14. Risks
- **Iframe embedding:** some schedulers block being framed cross-origin; TidyCal fallback
  button mitigates. Verify on the live domain.
- **HubSpot Notes-as-JSON** isn't queryable/segmentable — acceptable as an interim log;
  revisit with custom properties when the plan allows.
- **Distribution, not the site, is the growth lever** (per strategy doc): if the diagnostic
  isn't producing calls by day 60, the fix is LinkedIn traffic, not more pages.
