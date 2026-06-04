// Three engagement types — referenced across Home, How I Work, Proof, and the
// Revenue Engine Check routing. Copy direction per build spec Section 5.
//
// NOTE: price bands below are PLACEHOLDERS for the prototype. Pull exact
// figures from docs/services-and-pricing.md before launch (build spec §10).

export const engagements = [
  {
    id: 'one-and-done',
    name: 'One-and-Done Diagnostic',
    tagline: 'A fixed-scope teardown of your revenue engine with a prioritized fix list you can run without me.',
    price: 'Fixed project · price band TBD',
    forWho: 'Founders who suspect the engine is leaking but can’t name where.',
    detail:
      'Two to three weeks. I map the six phases of your revenue engine, find where deals and demand actually break, and hand back a sequenced plan. You either run it yourself or we talk about the next tier. No retainer pressure.',
    cta: 'Book the discovery call',
  },
  {
    id: 'fractional',
    name: 'Fractional Revenue Operator',
    tagline: 'I run the fix as an operating partner inside your business — not a deck, a hand on the wheel.',
    price: 'Monthly · scope-based, no discounts',
    forWho: 'Founder-led B2B companies ready to take revenue off the founder’s back.',
    detail:
      'Ongoing. I own the operating cadence, the pipeline math, and the build — RevOps, process, the senior-hire ramp — until the engine runs without me. Fixed monthly fee tied to scope, not hours.',
    cta: 'Book the discovery call',
  },
  {
    id: 'sprint',
    name: 'AI + Revenue System Sprint',
    tagline: 'You bought the AI seats and nothing changed. I ship the workflow that replaces the robot work.',
    price: 'Fixed sprint · price band TBD',
    forWho: 'Teams whose fundamentals hold but who are paying people to do manual, repeatable work.',
    detail:
      'A focused sprint. I find the highest-burn manual workflow — re-keying, reports, reconciliation, repeat documents — and put a real AI system into production, adopted by the team, not shelfware. Built from real sprints, not slideware.',
    cta: 'Book the AI + Revenue System Sprint call',
  },
];

// The "Not a Fit" list — published in full as a trust weapon (build spec §5).
export const notAFit = [
  'Pre-revenue or under $1M — you need customers, not a revenue operator.',
  'Over $50M — you need a VP you hire, not a fractional one.',
  'Pure B2C / consumer — my patterns are built on B2B motions.',
  'Looking for an advisor to nod at your strategy — I operate, I don’t coach.',
  'Wanting to negotiate the fee down — I adjust scope, never price.',
  'Not ready to let revenue work happen outside the founder’s inbox.',
];
