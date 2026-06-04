# Altus KC — website prototype

A working prototype of the Altus KC site, built to the handoff spec
(`altus-website-build-spec.md`) and strategy doc (`altus-website-buildout-plan.md`).

**Altus KC** — a fractional operating partner who fixes broken revenue engines for
founder-led B2B companies. Operator, not advisor. Kansas City.

## Stack

| Concern | Choice |
|---|---|
| Framework | [Astro](https://astro.build) — static output, content collections |
| Styling | Vanilla CSS with design tokens (no Tailwind) — `src/styles/tokens.css` is the spec verbatim |
| Interactivity | One vanilla-JS island (the Revenue Engine Check). Nothing else ships JS |
| Forms | HubSpot Forms API, client-side POST (graceful no-op until portal IDs are set) |
| Hosting target | Cloudflare Pages |

## Run it

```bash
npm install
npm run dev        # local dev at http://localhost:4321
npm run build      # static output to dist/
npm run preview    # serve the build
node test/score.test.mjs   # prove the §6 routing vectors pass
```

## What's here (Milestones 1–3 of the spec)

- **Home** — positioning hero, three engagement cards, proof strip, single accent CTA.
- **How I work** — engagement table + per-engagement sections, pricing philosophy,
  the full *Not a Fit* list (published as a trust weapon), Cal.com embed mount.
- **Proof** — three anonymized case teardowns (situation → broken → built → moved).
- **Field Notes** — content collection grouped by pillar, two seed posts, dynamic `[slug]`.
- **Revenue Engine Check** (`/tools/revenue-engine-check`) — the flagship. Qualifiers →
  12 questions across 6 phases → scored client-side → grade + dual-CTA routing →
  email-gated PDF (print stylesheet). Refresh-safe via `localStorage`. Disqualifiers
  route to `/not-a-fit`.
- **Bench** — two audiences on one page; operator application form → HubSpot.
- **not-a-fit · terms · privacy · 404** — templated, on-voice. Privacy covers the
  diagnostic data capture.

### The Revenue Engine Check — scoring & routing

The scoring/routing logic lives in `src/lib/score.js` (pure, no DOM) so it's shared by
the client island and the test harness. The routing test vectors from spec §6 all pass:

- all-0s → `DIAGNOSTIC` / "Engine stalled"
- P6-low / GTM-high → `SPRINT`
- all-3s → `STRONG` / "Tuned — now scale it"

```
gtmAvg = (P1+P2+P3+P4) / 4
if P6 <= 2 and gtmAvg >= 3:   SPRINT
elif min(P1..P5) <= 2:        DIAGNOSTIC
else:                         STRONG
```

## Configuration

Copy `.env.example` to `.env` (the portal ID is already filled in). Set the same keys in
Cloudflare Pages → Environment variables for production. Until the form GUIDs are present,
forms log their payload to the console and no-op gracefully so the flow is fully demonstrable.

```
PUBLIC_HUBSPOT_PORTAL_ID=244733039    # Altus KC portal (wired)
PUBLIC_HUBSPOT_REC_FORM_ID=...        # Revenue Engine Check results — create form, paste GUID
PUBLIC_HUBSPOT_BENCH_FORM_ID=...      # Bench applications — create form, paste GUID
PUBLIC_BOOKING_URL=...                # Cal.com / Calendly discovery-call link
```

**HubSpot:** the portal ID is wired. The two forms and the custom contact properties
(`rec_p1`–`rec_p6`, `rec_overall`, `rec_grade`, `rec_route`, `revenue_band`, `edge_band`,
plus the bench fields) still need to be created in the HubSpot UI — a HubSpot connector
can't create Forms or property definitions. **See [`docs/hubspot-setup.md`](docs/hubspot-setup.md)**
for the exact, copy-paste recipe (≈10 min). Paste the two GUIDs into `.env` and capture goes live.

Also pending from the spec's open-items list: confirm the six phase names against the
paid diagnostic, the Cal.com booking link (placeholder in `how-i-work.astro`), client-name
approval for case studies (anonymized until then), final logo SVGs (typographic wordmark
in place), and exact price bands (placeholders in `src/data/engagements.js`).

## Brand rules enforced

Cream canvas everywhere; one accent moment per section; 4px max radius; no shadows/bevels;
no gradients except the `--accent-glow` hero wash; sentence-case headings; ALL CAPS only on
the wordmark and eyebrow labels. Tokens in `src/styles/tokens.css` are authoritative.

## Not in this prototype (Phase 2 — separate effort, spec §8)

DocuSeal portal, DocRoom template, the gated bench roster, and the "How engagements run"
page. Scoped but out of the static-site repo.

> Copy is on-voice and assembled from the spec's direction. No metrics, client names, or
> testimonials were invented — case studies are anonymized patterns, and grade/route copy
> is marked for Mike's review before launch.
