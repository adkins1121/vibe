// ============================================================
// The Revenue Engine Check — content + scoring model.
// Build spec Section 4 (verbatim questions). Single source of truth:
// imported by the page for server-render AND by the client island for scoring.
// ============================================================

export const phases = [
  { id: 'P1', name: 'ICP & Positioning', measures: 'Who you sell to, why you win' },
  { id: 'P2', name: 'Pipeline Generation', measures: 'Where demand comes from, repeatability' },
  { id: 'P3', name: 'Sales Process & Conversion', measures: 'How deals move, founder dependence at close' },
  { id: 'P4', name: 'Revenue Operations', measures: 'CRM truth, forecast discipline' },
  { id: 'P5', name: 'Team & Cadence', measures: 'Operating rhythm, leadership leverage' },
  { id: 'P6', name: 'AI & Automation Leverage', measures: 'Tools in production vs. shelfware, manual burn' },
];

// Qualifiers (unscored, asked first) — §4.2
export const qualifiers = {
  band: {
    id: 'revenue_band',
    label: 'Where’s your revenue today?',
    options: [
      { value: 'pre', label: 'Pre-revenue / under $1M', disqualify: true },
      { value: '1-2', label: '$1–2M', edge: true },
      { value: '2-10', label: '$2–10M' },
      { value: '10-20', label: '$10–20M' },
      { value: '20-50', label: '$20–50M', edge: true },
      { value: '50+', label: '$50M+', disqualify: true },
    ],
  },
  model: {
    id: 'model',
    label: 'What’s your model?',
    options: [
      { value: 'b2b', label: 'B2B' },
      { value: 'b2c', label: 'B2C / consumer', disqualify: true },
      { value: 'mixed', label: 'Mixed' },
    ],
  },
  founder: {
    id: 'founder_led',
    label: 'Is a founder still running the business day-to-day?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
};

// The 12 questions — 2 per phase, options scored 0–3 (§4.3).
export const questions = [
  {
    id: 'P1-Q1', phase: 'P1',
    text: 'How clearly defined is your ideal customer?',
    options: [
      'We sell to anyone who’ll buy',
      'Rough sense — industry and size',
      'Documented ICP the team mostly ignores',
      'Documented ICP that drives lists, messaging, and qualification',
    ],
  },
  {
    id: 'P1-Q2', phase: 'P1',
    text: 'A prospect asks why you over the alternatives. What happens?',
    options: [
      'Everyone answers differently',
      'We default to features and price',
      'Decent answer, written nowhere',
      'Crisp positioning every rep delivers the same way',
    ],
  },
  {
    id: 'P2-Q3', phase: 'P2',
    text: 'Where does new pipeline actually come from?',
    options: [
      'Referrals and the founder’s network, full stop',
      'One channel works, and it’s lumpy',
      'Two or more channels, inconsistent',
      'Repeatable multi-channel motion with known math',
    ],
  },
  {
    id: 'P2-Q4', phase: 'P2',
    text: 'You need 20 qualified meetings next month. Can you make it happen?',
    options: [
      'No idea how',
      'The founder would grind it out personally',
      'Maybe, with a scramble',
      'Yes — we’d turn dials we already understand',
    ],
  },
  {
    id: 'P3-Q5', phase: 'P3',
    text: 'Deals in your pipeline mostly…',
    options: [
      'Stall and die silently',
      'Close, but unpredictably and with discounting',
      'Follow a loose process that depends on who runs them',
      'Move through defined stages with exit criteria',
    ],
  },
  {
    id: 'P3-Q6', phase: 'P3',
    text: 'Who closes the deals that matter?',
    options: [
      'Only the founder',
      'Founder plus one person',
      'The team closes, founder rescues',
      'The team closes; founder joins strategic accounts only',
    ],
  },
  {
    id: 'P4-Q7', phase: 'P4',
    text: 'How much do you trust your CRM?',
    options: [
      'What CRM / it’s a graveyard',
      'Half-right at best',
      'Mostly right, needs cleanup',
      'Trusted and inspected weekly',
    ],
  },
  {
    id: 'P4-Q8', phase: 'P4',
    text: 'Can you forecast next quarter within ~15%?',
    options: [
      'Pure guess',
      'Founder gut feel',
      'A forecast exists; it’s often wrong',
      'Yes — and when we miss, we know why',
    ],
  },
  {
    id: 'P5-Q9', phase: 'P5',
    text: 'What’s your revenue operating cadence?',
    options: [
      'None',
      'Ad hoc, when things feel bad',
      'Scheduled, but it drifts into status theater',
      'Weekly, inspected, decisions get made',
    ],
  },
  {
    id: 'P5-Q10', phase: 'P5',
    text: 'Your last senior revenue hire…',
    options: [
      'Haven’t made one — it’s all on me',
      'Didn’t work out',
      'Working out, ramping slowly',
      'Ramped and producing',
    ],
  },
  {
    id: 'P6-Q11', phase: 'P6',
    text: 'State of AI in the business?',
    options: [
      'Nothing / not allowed',
      'Bought seats (Copilot, ChatGPT) — barely used',
      'Individuals use it ad hoc; nothing in a production workflow',
      'At least one AI workflow in production replacing real manual work',
    ],
  },
  {
    id: 'P6-Q12', phase: 'P6',
    text: 'Hours per week your team burns on manual work a system could do (re-keying, reports, reconciliation, repeat documents)?',
    options: ['20+', '10–20', '5–10', 'Under 5'],
  },
];

// Grades (§4.4). Copy is on-voice — reviewed by Mike before launch.
export const grades = [
  {
    min: 0, max: 12, label: 'Engine stalled',
    copy: 'The engine isn’t leaking — it’s not running. Revenue is happening to you, not because of a system. That’s not a criticism; it’s the most common place a founder-led company sits right before it either breaks out or stays stuck. The good news: there’s nothing subtle to untangle here. We’d build the basics, in order.',
  },
  {
    min: 13, max: 22, label: 'Engine leaking',
    copy: 'You’ve got real motion, but it’s leaking in named places — and you can probably feel where. Deals, demand, or forecast discipline are costing you more than they should. This is the band where a focused diagnostic pays for itself fastest, because the fixes are specific, not structural.',
  },
  {
    min: 23, max: 30, label: 'Running, not compounding',
    copy: 'The engine runs. It just doesn’t compound — each quarter takes about as much founder force as the last. The fundamentals are mostly there; what’s missing is leverage and the operating discipline that makes growth repeatable instead of heroic. This is where most of my fractional work lives.',
  },
  {
    min: 31, max: 36, label: 'Tuned — now scale it',
    copy: 'Your engine is genuinely tuned — most companies your size aren’t close. At this point the risk isn’t a broken phase; it’s complacency and the leverage you’re leaving on the table. Worth a pressure-test to find the one or two seams before you pour fuel on it.',
  },
];

// Route copy (§4.5). {phase} is filled client-side.
export const routes = {
  SPRINT: {
    key: 'SPRINT',
    hook: 'Your engine fundamentals hold. Your leverage doesn’t — you’re paying people to do robot work.',
    primaryLabel: 'Book the AI + Revenue System Sprint call',
    primaryHref: '/how-i-work#sprint',
  },
  DIAGNOSTIC: {
    key: 'DIAGNOSTIC',
    hook: 'Your weakest phase is {phase}. That’s where revenue is leaking.',
    primaryLabel: 'Book the discovery call',
    primaryHref: '/how-i-work#book',
  },
  STRONG: {
    key: 'STRONG',
    hook: 'No obvious leak. The value now is a pressure-test — finding the seam before you scale into it.',
    primaryLabel: 'Book the call to pressure-test it',
    primaryHref: '/how-i-work#book',
  },
};

// Secondary CTA is always the "other" path (§4.5). Defaults defined here.
export const secondaryFor = {
  SPRINT: { label: 'Or book the revenue discovery call', href: '/how-i-work#book' },
  DIAGNOSTIC: { label: 'Or book the AI + Revenue System Sprint call', href: '/how-i-work#sprint' },
  STRONG: { label: 'Or run the AI + Revenue System Sprint instead', href: '/how-i-work#sprint' },
};
