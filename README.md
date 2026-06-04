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

## Configuration (open items — see spec §9)

Set these as build-time env vars (e.g. `.env` or Cloudflare Pages) to wire up capture.
Until they're present, forms log their payload to the console and no-op gracefully so the
flow is fully demonstrable.

```
PUBLIC_HUBSPOT_PORTAL_ID=...
PUBLIC_HUBSPOT_REC_FORM_ID=...        # Revenue Engine Check results
PUBLIC_HUBSPOT_BENCH_FORM_ID=...      # Bench applications
```

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
