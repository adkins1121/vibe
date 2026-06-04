// Verifies the Slack message builders in functions/api/submit.js produce
// well-formed Slack payloads (valid JSON, required block structure, escaping).
// Run: node test/submit.test.mjs
import { recMessage, benchMessage } from '../functions/api/submit.js';

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

// --- Escaping (no raw angle brackets injected) ---
{
  const m = recMessage({ email: 'x@y.co', rec_grade: '<script>', rec_overall: '0', rec_route: 'DIAGNOSTIC', revenue_band: 'pre' });
  ok('rec: escapes angle brackets', JSON.stringify(m).includes('&lt;script&gt;'));
}

console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
