// Verifies the Slack message builders in functions/api/submit.js produce
// well-formed Slack payloads (valid JSON, required block structure, escaping).
// Run: node test/submit.test.mjs
import { recMessage, benchMessage, cardMessage, parseHistory, serializeHistory } from '../functions/api/submit.js';

let failed = 0;
const ok = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed++;
};

// --- REC message ---
{
  const m = recMessage({
    email: 'founder@company.com',
    rec_p1: '4', rec_p2: '2', rec_p3: '3', rec_p4: '3', rec_p5: '3', rec_p6: '3',
    rec_overall: '18', rec_grade: 'Engine leaking', rec_route: 'DIAGNOSTIC',
    weakest: 'Pipeline Generation', revenue_band: '2-10', edge_band: 'false',
  });
  ok('rec: serializes to JSON', typeof JSON.stringify(m) === 'string');
  ok('rec: has fallback text', typeof m.text === 'string' && m.text.includes('DIAGNOSTIC'));
  ok('rec: header block', m.blocks[0].type === 'header');
  ok('rec: maps revenue band label', JSON.stringify(m).includes('$2–10M'));
  ok('rec: shows weakest phase', JSON.stringify(m).includes('Pipeline Generation'));
  ok('rec: phase scores in context', JSON.stringify(m).includes('P1 4 · P2 2'));
}

// --- REC edge band flag ---
{
  const m = recMessage({ email: 'a@b.co', rec_overall: '30', rec_grade: 'x', rec_route: 'SPRINT', revenue_band: '20-50', edge_band: 'true' });
  ok('rec: edge band flagged', JSON.stringify(m).includes('edge band'));
}

// --- Bench message ---
{
  const m = benchMessage({
    email: 'jane@ops.io', full_name: 'Jane Doe', linkedin: 'https://linkedin.com/in/jane',
    specialty: 'RevOps', day_rate_band: '$1,250–2,000', availability: 'Open now',
  });
  ok('bench: serializes to JSON', typeof JSON.stringify(m) === 'string');
  ok('bench: fallback text has name', m.text.includes('Jane Doe'));
  ok('bench: linkedin link rendered', JSON.stringify(m).includes('linkedin.com/in/jane'));
  ok('bench: specialty present', JSON.stringify(m).includes('RevOps'));
}

// --- Card (contact swap) message ---
{
  const m = cardMessage({
    email: 'sam@acme.com', full_name: 'Sam Rivera', company: 'Acme', role: 'VP Sales',
    phone: '816-555-0100', linkedin: 'https://linkedin.com/in/samrivera',
    note: 'Talked GTM at the KC mixer', met_at: 'KC Founders Mixer',
  });
  ok('card: serializes to JSON', typeof JSON.stringify(m) === 'string');
  ok('card: fallback text has name + company', m.text.includes('Sam Rivera') && m.text.includes('Acme'));
  ok('card: header block', m.blocks[0].type === 'header');
  ok('card: email present', JSON.stringify(m).includes('sam@acme.com'));
  ok('card: note rendered when present', JSON.stringify(m).includes('Talked GTM'));
  ok('card: met_at in context', JSON.stringify(m).includes('KC Founders Mixer'));
  ok('card: linkedin link rendered', JSON.stringify(m).includes('linkedin.com/in/samrivera'));
}

// --- Card with only the required field (graceful dashes, no note block) ---
{
  const m = cardMessage({ email: 'lone@solo.io' });
  ok('card: minimal serializes', typeof JSON.stringify(m) === 'string');
  ok('card: minimal falls back to email in text', m.text.includes('lone@solo.io'));
  ok('card: no note section when absent', !JSON.stringify(m).includes('*Note:*'));
}

// --- Card escaping ---
{
  const m = cardMessage({ email: 'x@y.co', full_name: '<img>', note: '<b>hi</b>' });
  ok('card: escapes angle brackets', JSON.stringify(m).includes('&lt;img&gt;') && JSON.stringify(m).includes('&lt;b&gt;'));
}

// --- Escaping (no raw angle brackets injected) ---
{
  const m = recMessage({ email: 'x@y.co', rec_grade: '<script>', rec_overall: '0', rec_route: 'DIAGNOSTIC', revenue_band: 'pre' });
  ok('rec: escapes angle brackets', JSON.stringify(m).includes('&lt;script&gt;'));
}

// --- HubSpot notes history (append / preserve) ---
{
  ok('history: empty value → []', JSON.stringify(parseHistory('')) === '[]');
  ok('history: null value → []', JSON.stringify(parseHistory(null)) === '[]');

  const arr = parseHistory('[{"kind":"rec","rec_overall":"18"}]');
  ok('history: parses JSON array', Array.isArray(arr) && arr.length === 1);

  // A manual note that isn't our JSON is preserved as an entry, not lost.
  const preserved = parseHistory('called him on Tuesday');
  ok('history: preserves manual note', preserved.length === 1 && preserved[0].note === 'called him on Tuesday');

  // Append then round-trip.
  const entry = { ts: '2026-06-04T00:00:00Z', kind: 'rec', email: 'a@b.co', rec_overall: '20' };
  const next = parseHistory(serializeHistory([...arr, entry]));
  ok('history: append round-trips', next.length === 2 && next[1].rec_overall === '20');

  // Caps at 50 most-recent.
  const many = Array.from({ length: 60 }, (_, i) => ({ i }));
  const capped = parseHistory(serializeHistory(many));
  ok('history: caps at 50', capped.length === 50 && capped[0].i === 10 && capped[49].i === 59);
}

console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
