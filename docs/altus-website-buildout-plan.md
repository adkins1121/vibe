# Altus KC — Website Build-Out Plan

**Owner:** Mike Adkins · **Date:** June 2026 · **Status:** Direction locked — all three layers, sequenced

---

## The Thesis

The site is not a brochure and it is not a community. It is a **revenue system with three layers**, each with one job:

| Layer | Job | Revenue line it feeds |
|---|---|---|
| **Authority** | Earn attention, prove pattern recognition | All three engagement types |
| **Tools** | Qualify + capture leads by mirroring the paid product | One-and-Done → Fractional upgrade path |
| **Delivery** | Make Altus feel like a firm, not a freelancer | Retention, referrals, premium pricing |

The networking/jobs idea ships as the **Operator Bench** — private, curated, gated. It is a feature of working with Altus, not a marketplace. You're already building the 1099 bench; the site just gives it a front door and an intake.

Rule that governs every page: if it doesn't draw a line to a diagnostic call, a signed SOW, or a bench placement, it doesn't ship.

---

## Site Architecture

```
altus-kc.com
├── Home ······················ positioning + one CTA (book the call / run the diagnostic)
├── How I Work ················ 3 engagement types, pricing philosophy, "not a fit" list
├── Proof ····················· case studies (Logenix, eShipping, SRY, Briefli lessons)
├── Field Notes ··············· the POV feed (not "blog")
├── Tools
│   └── Revenue Engine Check ·· free self-serve diagnostic incl. AI readiness track (flagship lead magnet)
├── Bench ····················· public-facing teaser + application intake (gated roster)
└── /docs (gated) ············· client portal
    ├── Sign-in ··············· DocuSeal page (built — altus-docuseal-signin)
    ├── Deal Rooms ············ DocRoom template (built — MiiPlan/Walmart is the prototype)
    └── Bench Roster ·········· client-only talent + intro network
```

Seven public surfaces. No "About," no "Services" dropdown with eight items, no resources graveyard.

---

## Layer 1 — Authority

**Home + How I Work + Proof.** Copy already exists in positioning docs — this is assembly, not writing. One accent-green CTA per page per brand rules.

**Field Notes (the "blog"):** Operator field notes, not thought leadership. Three pillars, rotating:

1. **Teardowns** — "What was actually broken at a $8M freight brokerage and what fixed it" (anonymized client patterns)
2. **AI that shipped** — build logs from real sprints: Copilot agents, Power Automate flows, what got adopted vs. abandoned
3. **The KC angle** — logistics/freight/supply chain POV; the intersection nobody else owns

Cadence: **2 posts/month, repurposed to LinkedIn as 3–4 cuts each.** LinkedIn is the distribution; the site is the archive that converts. Don't commit to weekly — a missed weekly cadence reads worse than a kept biweekly one.

**Blog references / curation:** a "What I'm reading" footer block on Field Notes, not a standalone links page. Curation is seasoning, not a surface.

---

## Layer 2 — Tools

### Flagship: The Revenue Engine Check (free diagnostic, AI track built in)

Self-serve version of the paid Altus Revenue Engine diagnostic. ~12 questions across the 6 phases, with **AI adoption as a scored dimension**, scored client-side, branded results page.

One tool, two report tracks — the results page routes the lead:
- **Weak AI score** → AI + Revenue System Sprint CTA ("You bought Copilot seats and nothing changed — here's why")
- **Weak GTM fundamentals** → diagnostic call CTA (One-and-Done / Fractional path)

**Why this is the keystone:** it qualifies the lead (revenue band, founder-led, what's broken), demonstrates the exact thing they'd pay for, and creates the natural CTA — *"Your pipeline phase scored 2/10. Want the full diagnostic?"* Tool, lead magnet, and sales proof in one artifact.

**Mechanics:**
- Email gate on the results PDF, not the quiz (let them play, charge for the takeaway)
- Results feed HubSpot with phase scores as contact properties → triggers a 3-touch follow-up sequence
- Disqualifiers built in: pre-revenue or >$50M routes to a polite "not a fit" page — protects your calendar

**This → then this:** visitor runs the check → scores land in HubSpot → automated sequence references their weakest phase → diagnostic call booked with context already loaded.

**Decided (June 2026):** AI readiness merged into the flagship tool rather than built as a standalone second assessment — one keystone asset, both funnels fed. Executive coaching considered and scratched: conflicts with "operator, not advisor." If exec demand resurfaces, it returns as a paid offer (Operator's Table event or priced advisory tier), never a free lead magnet.

---

## Layer 3 — Delivery (the moat)

The DocRoom and DocuSeal sign-in aren't website features — they're the **engagement operating system**, surfaced.

- **DocuSeal portal** (built as design): every NDA, SOW, and contract flows through `altus-kc.docs`. Self-hosted, audit-trailed. The sign-in page itself sells: "Sign here. Then we get to work."
- **DocRoom** (built as design — MiiPlan/Walmart prototype): every engagement gets a curated room — proposal, business case, methodology, demo, contacts. Print-to-PDF built in. This is what a $25K project *looks like* before it's signed. Use it in the sales process, not just delivery.
- **Template-ize it:** the MiiPlan room becomes `docroom-template`. New engagement = clone, swap content, ship in an hour. That's the repeatable system.

Public-facing payoff: a "How engagements run" page showing a sanitized DocRoom. Prospects see the machine before they buy it.

---

## The Operator Bench (1099 network)

You're building the bench now — the site formalizes both sides:

**Public side (`/bench`):** one page. "Vetted 1099 operators — RevOps, AI implementation, fractional sales leadership — available to Altus clients." Application form for operators who want on. No public roster, no job board, no browsing.

**Gated side (inside /docs):** client-only roster with skills, availability, rate band. Placements happen through you — that's the margin and the quality control.

**Monetization (pick one to start):** placement fee (15–20% of first contract value, mirrors your referral structure) or markup on bench rate. Avoid subscription access until volume justifies it.

This kills the "jobs/networking" itch without the marketplace trap: supply is curated by you, demand is your client base, and every placement deepens an engagement.

---

## Roadmap

### Phase 1 — Pipeline engine (Weeks 1–4)
- Home, How I Work, Proof pages — copy assembled from positioning docs
- **Revenue Engine Check** (incl. AI readiness track + dual-CTA routing) built and wired to HubSpot
- DocuSeal sign-in goes from design → live (self-hosted DocuSeal instance)
- Bench application intake form (start collecting operators now, quietly)
- 2 Field Notes drafted from existing case material (Logenix billing automation is post #1 — it's already done work)

### Phase 2 — Delivery layer (Weeks 5–8)
- DocRoom template productized from MiiPlan prototype
- Client portal shell: sign-in → rooms → documents
- "How engagements run" public page with sanitized room
- Field Notes cadence holding at 2/month

### Phase 3 — Bench + second tool (Weeks 9–16)
- Gated bench roster live for clients
- First 2–3 placements run manually (learn the motion before automating it)
- Quarterly teardown post — the flagship content piece

---

## Build Approach

Keep the stack boring: static site (Astro or plain HTML on Cloudflare Pages/Netlify), DocuSeal self-hosted on a $20/mo VPS, HubSpot free tier for capture, Cal.com for booking. The diagnostic is client-side JS — no backend until something earns one. Everything on-brand per the brand-assets spec (cream canvas, Evergreen ink, one accent moment per section).

---

## Metrics (90 days post-Phase 1)

| Metric | Target |
|---|---|
| Diagnostic completions | 30+ |
| Diagnostic → discovery calls | 5+ |
| Calls → paid engagements | 1–2 |
| Bench applications | 15+ |
| Bench placements | 1 |

Revenue is the only metric — everything above is a leading indicator of the $25K/month target mix. If the diagnostic isn't producing calls by day 60, the fix is traffic (LinkedIn distribution), not more site.
