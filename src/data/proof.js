// Case studies as anonymized pattern teardowns (build spec Assumption 6).
// Client names (Logenix, eShipping, SRY) are spec'd as anonymized until
// name approval clears. Swap `client` in when approved. NO INVENTED METRICS —
// the "moved" lines describe the pattern, not a fabricated number.

export const cases = [
  {
    id: 'freight-billing',
    pattern: '$8M freight forwarder',
    client: null, // e.g. 'Logenix' once approved
    situation:
      'Billing and reconciliation ran on people re-keying numbers between systems every week. Month-end was a fire drill.',
    broken:
      'Revenue operations had no source of truth. Manual document handling ate senior hours and introduced errors the team only caught downstream.',
    built:
      'An AI-assisted billing reconciliation workflow that ships in production — matching, flagging exceptions, and cutting the manual re-keying out of the loop.',
    moved: 'Manual reconciliation hours collapsed; month-end stopped being a fire drill.',
    engagement: 'sprint',
  },
  {
    id: 'founder-dependence',
    pattern: '$12M logistics services firm',
    client: null,
    situation:
      'Every deal that mattered closed because the founder personally rescued it. Pipeline existed; it just didn’t move without him.',
    broken:
      'Sales process was tribal knowledge. No exit criteria, no forecast you could trust, no one but the founder who could close.',
    built:
      'Defined stages with exit criteria, a weekly inspected cadence, and a senior-hire ramp — so the team closes and the founder joins only strategic accounts.',
    moved: 'Close stopped depending on the founder being in the room.',
    engagement: 'fractional',
  },
  {
    id: 'icp-positioning',
    pattern: '$6M B2B supply-chain SaaS',
    client: null,
    situation:
      'They sold to anyone who’d buy. Every rep answered “why you?” differently, and pipeline came entirely from the founder’s network.',
    broken:
      'No documented ICP, no shared positioning, one lumpy referral channel. Growth was capped by the founder’s rolodex.',
    built:
      'A documented ICP that drives lists and qualification, crisp positioning every rep delivers the same way, and a second repeatable channel with known math.',
    moved: 'Demand stopped being hostage to one person’s network.',
    engagement: 'one-and-done',
  },
];
