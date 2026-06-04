// Routing test vectors from build spec §6 (Milestone 2 acceptance).
// Run: node test/score.test.mjs
import { questions } from '../src/data/quiz.js';
import {
  phaseScores, overallScore, gradeFor, routeFor, computeResult, isDisqualified,
} from '../src/lib/score.js';

let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) failed++;
};

// Helpers to build answer maps.
const all = (v) => Object.fromEntries(questions.map((q) => [q.id, v]));
const byPhase = (map) =>
  Object.fromEntries(questions.map((q) => [q.id, map[q.phase] ?? 0]));

// --- Vector 1: all-0s → DIAGNOSTIC / "Engine stalled" ---
{
  const a = all(0);
  const r = computeResult(a);
  eq('all-0s overall', r.overall, 0);
  eq('all-0s grade', r.grade.label, 'Engine stalled');
  eq('all-0s route', r.routeKey, 'DIAGNOSTIC');
}

// --- Vector 2: P6-low / GTM-high → SPRINT ---
// P1..P5 strong (answers=3 → phase 6), P6 weak (answers=0 → phase 0)
{
  const a = byPhase({ P1: 3, P2: 3, P3: 3, P4: 3, P5: 3, P6: 0 });
  const r = computeResult(a);
  eq('sprint scores', r.scores, { P1: 6, P2: 6, P3: 6, P4: 6, P5: 6, P6: 0 });
  eq('sprint route', r.routeKey, 'SPRINT');
}

// --- Vector 3: all-3s → STRONG / "Tuned" ---
{
  const a = all(3);
  const r = computeResult(a);
  eq('all-3s overall', r.overall, 36);
  eq('all-3s grade', r.grade.label, 'Tuned — now scale it');
  eq('all-3s route', r.routeKey, 'STRONG');
}

// --- Grade boundaries (§4.4) ---
eq('grade 12', gradeFor(12).label, 'Engine stalled');
eq('grade 13', gradeFor(13).label, 'Engine leaking');
eq('grade 22', gradeFor(22).label, 'Engine leaking');
eq('grade 23', gradeFor(23).label, 'Running, not compounding');
eq('grade 30', gradeFor(30).label, 'Running, not compounding');
eq('grade 31', gradeFor(31).label, 'Tuned — now scale it');

// --- Routing edge: one weak GTM phase, strong AI → DIAGNOSTIC ---
{
  const a = byPhase({ P1: 1, P2: 3, P3: 3, P4: 3, P5: 3, P6: 3 });
  eq('one-weak-gtm route', routeFor(phaseScores(a)), 'DIAGNOSTIC');
  eq('one-weak-gtm weakest', computeResult(a).weakest.id, 'P1');
}

// --- Routing edge: weak P5 only (not in gtmAvg) → DIAGNOSTIC ---
{
  const a = byPhase({ P1: 3, P2: 3, P3: 3, P4: 3, P5: 1, P6: 3 });
  eq('weak-P5 route', routeFor(phaseScores(a)), 'DIAGNOSTIC');
}

// --- SPRINT requires gtmAvg >= 3 even with low P6 ---
{
  // P6 low but GTM also weak → DIAGNOSTIC, not SPRINT
  const a = byPhase({ P1: 1, P2: 1, P3: 1, P4: 1, P5: 1, P6: 0 });
  eq('low-everything route', routeFor(phaseScores(a)), 'DIAGNOSTIC');
}

// --- Disqualifiers (§4.2) ---
eq('dq pre-revenue', isDisqualified({ revenue_band: 'pre', model: 'b2b' }), true);
eq('dq 50M+', isDisqualified({ revenue_band: '50+', model: 'b2b' }), true);
eq('dq b2c', isDisqualified({ revenue_band: '2-10', model: 'b2c' }), true);
eq('pass 2-10 b2b', isDisqualified({ revenue_band: '2-10', model: 'b2b' }), false);

console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
