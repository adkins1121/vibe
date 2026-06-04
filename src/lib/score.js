// ============================================================
// Revenue Engine Check — pure scoring + routing logic (§4.4–4.5).
// No DOM, no side effects. Imported by the client island and by the
// test harness (test/score.test.mjs) that proves the §6 vectors pass.
// ============================================================

import { questions, phases, grades, routes, secondaryFor } from '../data/quiz.js';

/**
 * @param {Record<string, number>} answers map of questionId -> 0..3
 * @returns {{ P1:number,...,P6:number }} phase scores (0..6)
 */
export function phaseScores(answers) {
  const totals = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, P6: 0 };
  for (const q of questions) {
    const v = Number(answers[q.id] ?? 0);
    totals[q.phase] += v;
  }
  return totals;
}

export function overallScore(scores) {
  return phases.reduce((sum, p) => sum + (scores[p.id] ?? 0), 0); // 0..36
}

export function gradeFor(overall) {
  return grades.find((g) => overall >= g.min && overall <= g.max) ?? grades[0];
}

/** Weakest phase by score; ties break to earliest phase (P1 first). */
export function weakestPhase(scores) {
  let weakest = phases[0];
  for (const p of phases) {
    if (scores[p.id] < scores[weakest.id]) weakest = p;
  }
  return weakest;
}

/**
 * Dual-CTA routing decision (§4.5).
 *   gtmAvg = (P1+P2+P3+P4) / 4
 *   if P6 <= 2 and gtmAvg >= 3:   SPRINT
 *   elif min(P1..P5) <= 2:        DIAGNOSTIC
 *   else:                         STRONG
 */
export function routeFor(scores) {
  const gtmAvg = (scores.P1 + scores.P2 + scores.P3 + scores.P4) / 4;
  const minP1to5 = Math.min(scores.P1, scores.P2, scores.P3, scores.P4, scores.P5);

  if (scores.P6 <= 2 && gtmAvg >= 3) return 'SPRINT';
  if (minP1to5 <= 2) return 'DIAGNOSTIC';
  return 'STRONG';
}

/** Full result object used to render the results page + HubSpot payload. */
export function computeResult(answers) {
  const scores = phaseScores(answers);
  const overall = overallScore(scores);
  const grade = gradeFor(overall);
  const routeKey = routeFor(scores);
  const weakest = weakestPhase(scores);

  const route = { ...routes[routeKey] };
  route.hook = route.hook.replace('{phase}', weakest.name);
  const secondary = secondaryFor[routeKey];

  return { scores, overall, grade, routeKey, route, secondary, weakest };
}

/** Disqualify check for qualifiers (§4.2). */
export function isDisqualified(quals) {
  const dq = ['pre', '50+'].includes(quals.revenue_band) || quals.model === 'b2c';
  return dq;
}

export function isEdgeBand(quals) {
  return ['1-2', '20-50'].includes(quals.revenue_band);
}
