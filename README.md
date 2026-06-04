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
  the full *Not a Fit* list (published as a trust weapon), inline TidyCal booking embed.
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

Build-time public config lives in `.env` (copy from `.env.example`):

```
PUBLIC_BOOKING_URL=...   # TidyCal / Cal.com / Calendly discovery-call link
```

**Lead capture** runs through a Cloudflare Pages Function (`functions/api/submit.js`) — the
browser POSTs to `/api/submit`, which fans out to two **server-side, best-effort** sinks
(each optional, configured by secret):

- **Slack** (`SLACK_WEBHOOK_URL`) — formatted Block Kit notification to a channel.
- **HubSpot** (`HUBSPOT_PRIVATE_APP_TOKEN`) — upserts the contact by email and **appends**
  each submission as a JSON entry to the standard `hs_content_membership_notes` property
  (most recent 50 kept). No custom properties, so it works on the current plan.

Secrets never reach the client bundle. Capture is best-effort: on local static
`npm run preview` (Functions don't run) the flow still works and logs the payload to the
console. **See [`docs/capture-setup.md`](docs/capture-setup.md)** for setup.

To exercise the Function locally (real Slack/HubSpot), copy `.dev.vars.example` to
`.dev.vars`, fill in the secrets, and run `npm run dev:functions` (builds + serves via
Wrangler with the Function live). `npm test` runs the scoring + capture test suites.

Also pending from the spec's open-items list: confirm the six phase names against the
paid diagnostic, client-name approval for case studies (anonymized until then), final logo
SVGs (typographic wordmark in place), and exact price bands (placeholders in
`src/data/engagements.js`). The booking link (TidyCal) is wired.

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
