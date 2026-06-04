# Altus KC Website — Build Spec (Claude Code Handoff)

**Owner:** Mike Adkins · **Date:** June 2026 · **Status:** Final draft for review
**Companion doc:** `altus-website-buildout-plan.md` (strategy + roadmap). This doc is the execution spec.

---

## 0. Assumptions Made (review these first)

1. **Domain:** `altus-kc.com` is owned and DNS-controllable (inferred from mike@altus-kc.com). Tool lives at `/tools/revenue-engine-check`, portal later at `docs.altus-kc.com`.
2. **The 6 phases of the paid Altus Revenue Engine diagnostic** aren't documented in the brand project, so I defined them (Section 4). If the paid diagnostic uses different phases, swap the labels — the mechanics hold.
3. **HubSpot** is the CRM of record (active domain per Mike's stack). Free tier + Forms API is sufficient for Phase 1. Portal ID needed at build time.
4. **Booking:** Cal.com (or Calendly) embed for the discovery call. Link needed at build time.
5. **Logo files are pending** per brand-assets.md — build uses the typographic wordmark (Montserrat 800, 0.18em tracking, ALTUS evergreen + KC accent) so nothing blocks on assets.
6. **Case studies:** Logenix, eShipping, SRY exist as work; client-name approval unknown. Spec'd as anonymized patterns ("$8M freight brokerage") with a swap-in slot if names clear.
7. **DocuSeal/DocRoom (Phase 2)** deploys to a separate VPS — out of scope for the static-site repo, scoped in Section 8 so Claude Code can build the DocRoom template separately.
8. **No backend in Phase 1.** Diagnostic scores client-side; HubSpot Forms API takes the submission. First backend earns its way in with the gated portal.

---

## 1. Goals & Non-Goals

**Goals (90 days post-launch):** 30+ diagnostic completions → 5+ discovery calls → 1–2 paid engagements; 15+ bench applications → 1 placement.

**Non-goals:** No public job board, no community features, no coaching content, no newsletter (yet), no CMS — content is markdown in the repo.

---

## 2. Stack & Repo

| Concern | Decision |
|---|---|
| Framework | **Astro** (static output, content collections for Field Notes) |
| Hosting | Cloudflare Pages (free, fast, custom domain) |
| Styling | Vanilla CSS with design tokens — no Tailwind (brand is too specific; tokens are cleaner) |
| Interactivity | One vanilla-JS island for the diagnostic. Nothing else ships JS |
| Forms | HubSpot Forms API (diagnostic results + bench intake), client-side POST |
| Booking | Cal.com inline embed on results page + How I Work |
| Fonts | Montserrat (600/700/800) + DM Sans (400/500/600) via Google Fonts, `display=swap` |
| Analytics | Plausible or Cloudflare Web Analytics (no cookie banner needed) |

```
altus-kc-site/
├── astro.config.mjs
├── src/
│   ├── styles/tokens.css        # Section 3 verbatim
│   ├── layouts/Base.astro       # nav, footer, meta, fonts
│   ├── components/              # Wordmark, Eyebrow, Card, CTAButton, PhaseBar
│   ├── content/field-notes/     # markdown, schema: title, date, pillar, summary
│   └── pages/
│       ├── index.astro
│       ├── how-i-work.astro
│       ├── proof.astro
│       ├── field-notes/index.astro + [slug].astro
│       ├── tools/revenue-engine-check.astro
│       ├── bench.astro
│       ├── not-a-fit.astro
│       ├── terms.astro · privacy.astro · 404.astro
```

---

## 3. Design Tokens (from brand-assets.md — authoritative)

```css
:root {
  --evergreen: #1A3C34;      /* primary text, dark surfaces */
  --accent: #3D8C62;         /* CTAs, links — max 1–2 moments per layout */
  --cream: #F6F3EE;          /* default background, never pure white */
  --mid-green: #2B5C4E;
  --near-black: #1A1A1A;
  --white: #FDFCFA;          /* cards only */
  --card-bg: #EDEAE4;
  --card-hover: #E4E0D8;
  --border: rgba(27,46,38,0.10);
  --accent-border: rgba(61,140,98,0.20);
  --accent-glow: rgba(61,140,98,0.06);
  --text-secondary: #5A6B60;
  --text-muted: #8A9690;
  --font-head: 'Montserrat', Arial, sans-serif;
  --font-body: 'DM Sans', Arial, sans-serif;
  --radius: 4px;             /* max — brand is square-leaning */
}
```

Hard rules for the build: cream canvas everywhere; one accent moment per section; no gradients except `--accent-glow` hero wash; no shadows/bevels; sentence-case headings; ALL CAPS only for wordmark + eyebrow labels (14px, 0.08em tracking). Type scale per brand doc (H1 48–64, H2 32–40, H3 24, body 16).

---

## 4. The Revenue Engine Check (flagship tool) — Full Spec

### 4.1 The six phases (assumed — confirm against paid diagnostic)

| # | Phase | What it measures |
|---|---|---|
| P1 | ICP & Positioning | Who you sell to, why you win |
| P2 | Pipeline Generation | Where demand comes from, repeatability |
| P3 | Sales Process & Conversion | How deals move, founder dependence at close |
| P4 | Revenue Operations | CRM truth, forecast discipline |
| P5 | Team & Cadence | Operating rhythm, leadership leverage |
| P6 | AI & Automation Leverage | Tools in production vs. shelfware, manual burn |

### 4.2 Qualifiers (unscored, asked first)

- **Q0a Revenue band:** Pre-revenue / <$1M · $1–2M · $2–10M · $10–20M · $20–50M · $50M+
- **Q0b Model:** B2B · B2C/consumer · Mixed
- **Q0c** Is a founder still running the business day-to-day? Yes / No

**Disqualify route → `/not-a-fit`:** pre-revenue/<$1M, $50M+, or pure B2C. Page is warm, on-voice: "Not what I do — here's what I'd read instead" + Field Notes links. $1–2M and $20–50M pass but tag as edge-band in HubSpot.

### 4.3 The 12 questions (2 per phase, options scored 0–3)

**P1-Q1.** How clearly defined is your ideal customer?
0 We sell to anyone who'll buy · 1 Rough sense — industry and size · 2 Documented ICP the team mostly ignores · 3 Documented ICP that drives lists, messaging, and qualification

**P1-Q2.** A prospect asks why you over the alternatives. What happens?
0 Everyone answers differently · 1 We default to features and price · 2 Decent answer, written nowhere · 3 Crisp positioning every rep delivers the same way

**P2-Q3.** Where does new pipeline actually come from?
0 Referrals and the founder's network, full stop · 1 One channel works, and it's lumpy · 2 Two or more channels, inconsistent · 3 Repeatable multi-channel motion with known math

**P2-Q4.** You need 20 qualified meetings next month. Can you make it happen?
0 No idea how · 1 The founder would grind it out personally · 2 Maybe, with a scramble · 3 Yes — we'd turn dials we already understand

**P3-Q5.** Deals in your pipeline mostly…
0 Stall and die silently · 1 Close, but unpredictably and with discounting · 2 Follow a loose process that depends on who runs them · 3 Move through defined stages with exit criteria

**P3-Q6.** Who closes the deals that matter?
0 Only the founder · 1 Founder plus one person · 2 The team closes, founder rescues · 3 The team closes; founder joins strategic accounts only

**P4-Q7.** How much do you trust your CRM?
0 What CRM / it's a graveyard · 1 Half-right at best · 2 Mostly right, needs cleanup · 3 Trusted and inspected weekly

**P4-Q8.** Can you forecast next quarter within ~15%?
0 Pure guess · 1 Founder gut feel · 2 A forecast exists; it's often wrong · 3 Yes — and when we miss, we know why

**P5-Q9.** What's your revenue operating cadence?
0 None · 1 Ad hoc, when things feel bad · 2 Scheduled, but it drifts into status theater · 3 Weekly, inspected, decisions get made

**P5-Q10.** Your last senior revenue hire…
0 Haven't made one — it's all on me · 1 Didn't work out · 2 Working out, ramping slowly · 3 Ramped and producing

**P6-Q11.** State of AI in the business?
0 Nothing / not allowed · 1 Bought seats (Copilot, ChatGPT) — barely used · 2 Individuals use it ad hoc; nothing in a production workflow · 3 At least one AI workflow in production replacing real manual work

**P6-Q12.** Hours per week your team burns on manual work a system could do (re-keying, reports, reconciliation, repeat documents)?
0 20+ · 1 10–20 · 2 5–10 · 3 Under 5

### 4.4 Scoring & grading

- Phase score = sum of its 2 questions (0–6). Overall = 0–36.
- Grades: **0–12 "Engine stalled"** · **13–22 "Engine leaking"** · **23–30 "Running, not compounding"** · **31–36 "Tuned — now scale it"**
- Each grade gets 2–3 sentences of on-voice copy (direct, no flattery — written at build time, reviewed by Mike).

### 4.5 Routing logic (the dual-CTA decision)

```
gtmAvg = (P1+P2+P3+P4) / 4
if P6 <= 2 and gtmAvg >= 3:        route = SPRINT
  primary CTA: "Book the AI + Revenue System Sprint call"
  hook: "Your engine fundamentals hold. Your leverage doesn't —
         you're paying people to do robot work."
elif min(P1..P5) <= 2:              route = DIAGNOSTIC
  primary CTA: "Book the discovery call" (references weakest phase by name)
  hook: "Your weakest phase is {phase}. That's where revenue is leaking."
else:                               route = STRONG
  primary CTA: discovery call, framed as "pressure-test it"
Secondary CTA is always the other path. Both above the fold on results.
```

### 4.6 Results page & capture

- Six `PhaseBar` components (0–6 each), weakest phase highlighted with `--accent-border`, overall grade headline.
- **No email to take the quiz. Email gates the PDF report** ("Get the full report with fix-first recommendations").
- On email submit → POST to HubSpot Forms API with properties: `rec_p1`–`rec_p6`, `rec_overall`, `rec_grade`, `rec_route`, `revenue_band`, `edge_band` → triggers a 3-touch follow-up sequence (sequence copy is a post-launch task, not in repo).
- PDF: client-side render (browser print stylesheet — same pattern as the DocRoom "Print to PDF" cards). No server.
- State in memory + `localStorage` so a refresh doesn't wipe answers.

---

## 5. Page Specs (copy direction — final copy assembled from positioning docs)

**Home.** Hero: the one-liner — "A fractional operating partner who fixes broken revenue engines for founder-led B2B companies." Sub: operator-not-advisor line. Single accent CTA: "Run the Revenue Engine Check (3 minutes)". Below: 3 engagement cards (name, one sentence, price band) → How I Work; 1 proof strip (anonymized result metrics); footer wordmark block. No carousel, no testimonial wall.

**How I Work.** The three engagements verbatim from services-and-pricing (table + per-engagement sections), pricing philosophy ("fixed > hourly", "no discounts, adjust scope"), the **Not a Fit list published in full** — it's a trust weapon. Cal.com embed at bottom.

**Proof.** 3 case-study cards as pattern teardowns: situation → what was broken → what was built → number that moved. Anonymized per Assumption 6. Each ends with the matching engagement-type link.

**Field Notes.** Index grouped by pillar (Teardowns / AI that shipped / The KC angle). Markdown collection. Launch with 2 seeded posts: (1) Logenix billing automation build log — "An AI workflow that actually shipped: billing reconciliation at a freight forwarder," (2) a teardown from the diagnostic's weakest-phase patterns. "What I'm reading" is a footer block here, not a page.

**Bench (`/bench`).** One page, two audiences: top — for clients: "Vetted 1099 operators — RevOps, AI implementation, fractional sales leadership — available inside Altus engagements. No browsing, no board. Ask me."; bottom — for operators: short pitch + application form (name, LinkedIn, specialty, day rate band, availability) → HubSpot with `bench_applicant` tag. **No public roster.**

**not-a-fit / terms / privacy / 404.** Templated, on-voice. Privacy must cover the diagnostic data capture.

---

## 6. Build Order & Acceptance Criteria

**Milestone 1 — Skeleton + Authority (repo, tokens, Base layout, Home, How I Work, Proof, legal).**
Accept: deploys to Cloudflare Pages; Lighthouse ≥ 90 across the board; zero JS shipped; brand rules pass visual check (cream canvas, single accent per section, 4px max radius).

**Milestone 2 — Revenue Engine Check.**
Accept: full flow qualifiers → 12 questions → results with correct routing on test vectors (all-0s → DIAGNOSTIC/stalled; P6-low/GTM-high → SPRINT; all-3s → STRONG); disqualifiers route to `/not-a-fit`; HubSpot receives properties; PDF prints clean; works on mobile; refresh-safe.

**Milestone 3 — Field Notes + Bench.**
Accept: content collection renders both seed posts; bench form lands in HubSpot tagged; index pages have correct meta/OG tags.

**Milestone 4 (Phase 2, separate effort) — Delivery layer.** See Section 8.

---

## 7. SEO / Meta (minimum viable)

Title pattern: `{Page} — Altus KC · Fractional Revenue Operator, Kansas City`. OG image: wordmark on cream (generate 1200×630 in-repo). Target phrases, worked naturally: *fractional revenue operator*, *AI implementation consultant Kansas City*, *fractional VP sales logistics*. Sitemap + robots via Astro integration. No blog-spam SEO play — distribution is LinkedIn.

---

## 8. Phase 2 Scope — Delivery Layer (separate from static repo)

1. **DocuSeal** self-hosted (Docker on a ~$20/mo VPS) at `docs.altus-kc.com`; sign-in page restyled to the existing `altus-docuseal-signin` design (already on-brand).
2. **DocRoom template:** generalize the MiiPlan/Walmart room into `docroom-template` — single HTML file, slots for: engagement title, 3 document cards with Preview/Print-to-PDF, video card, two-contact block, confidential footer. New engagement = clone + content swap, ≤ 1 hour.
3. **Gated bench roster** page inside the portal (client-auth only) — name, specialty, availability, rate band; placements routed through Mike.
4. Public "How engagements run" page added to the static site with a sanitized DocRoom screenshot walkthrough.

---

## 9. Open Items for Mike (nothing blocks Milestone 1)

| Item | Needed by |
|---|---|
| Confirm the 6 phase names match the paid diagnostic | Milestone 2 |
| HubSpot portal ID + create the two forms | Milestone 2 |
| Cal.com/Calendly link | Milestone 1 polish |
| Client-name approval for case studies (else stay anonymized) | Milestone 1 |
| Final logo SVGs (wordmark fallback in place) | Anytime |
| Bench placement fee final % (spec assumes 15–20% of first contract) | Phase 2 |
| VPS choice for DocuSeal | Phase 2 |

---

## 10. Prompt to Hand Claude Code

> Build the Altus KC website per `altus-website-build-spec.md` in this repo. Work milestone by milestone (Section 6) and stop for review after each. Brand tokens in Section 3 are law — when in doubt, less color, more whitespace, smaller radius. Copy direction is in Section 5; pull exact language from `docs/positioning.md` and `docs/services-and-pricing.md` rather than inventing new claims. Never invent metrics, client names, or testimonials. The Revenue Engine Check must pass the routing test vectors in Section 6 before it ships.
