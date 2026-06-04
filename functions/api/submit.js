// Cloudflare Pages Function — lead capture for Altus KC.
// Runs at the edge. Receives a JSON POST from the Revenue Engine Check results
// page and the Bench application form, and posts a formatted notification to a
// Slack channel via an Incoming Webhook (URL kept as a Cloudflare secret,
// SLACK_WEBHOOK_URL — never shipped to the browser).
//
// HubSpot capture is stubbed for now (requires a plan upgrade) — see the clearly
// marked block at the bottom to re-enable it alongside, or instead of, Slack.
//
// Setup: docs/capture-setup.md

// Optional separate channel for bench applications; falls back to the main hook.
function webhookFor(kind, env) {
  if (kind === 'bench' && env.SLACK_BENCH_WEBHOOK_URL) return env.SLACK_BENCH_WEBHOOK_URL;
  return env.SLACK_WEBHOOK_URL;
}

// Allowlists — only these keys are ever read off the request, per kind. Anything
// else in the body is ignored.
const ALLOWED = {
  rec: [
    'rec_p1', 'rec_p2', 'rec_p3', 'rec_p4', 'rec_p5', 'rec_p6',
    'rec_overall', 'rec_grade', 'rec_route', 'revenue_band', 'edge_band', 'weakest',
  ],
  bench: ['full_name', 'linkedin', 'specialty', 'day_rate_band', 'availability'],
};

const REVENUE_BAND_LABEL = {
  pre: 'Pre-revenue / <$1M', '1-2': '$1–2M', '2-10': '$2–10M',
  '10-20': '$10–20M', '20-50': '$20–50M', '50+': '$50M+',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

const isEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const { kind, email } = payload || {};
  if (kind !== 'rec' && kind !== 'bench') return json({ ok: false, error: 'bad_kind' }, 400);
  if (!isEmail(email)) return json({ ok: false, error: 'bad_email' }, 400);

  // Pull only allowlisted fields.
  const data = { email: email.trim() };
  for (const key of ALLOWED[kind]) {
    if (payload[key] != null && payload[key] !== '') data[key] = String(payload[key]);
  }

  const webhook = webhookFor(kind, env);
  if (!webhook) {
    console.error('[submit] SLACK_WEBHOOK_URL not set');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const message = kind === 'rec' ? recMessage(data) : benchMessage(data);

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('[submit] Slack error', res.status, detail);
      return json({ ok: false, error: 'slack_error', status: res.status }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[submit] webhook fetch failed', err);
    return json({ ok: false, error: 'upstream_unreachable' }, 502);
  }

  // --- HubSpot capture: STUBBED (re-enable when the plan supports it) ----------
  // await upsertHubSpotContact(env.HUBSPOT_PRIVATE_APP_TOKEN, kind, data);
  // (Implementation kept in git history — commit prior to the Slack switch.)
  // -----------------------------------------------------------------------------
}

export function recMessage(d) {
  const band = REVENUE_BAND_LABEL[d.revenue_band] || d.revenue_band || '—';
  const phases =
    `P1 ${d.rec_p1 ?? '–'} · P2 ${d.rec_p2 ?? '–'} · P3 ${d.rec_p3 ?? '–'} · ` +
    `P4 ${d.rec_p4 ?? '–'} · P5 ${d.rec_p5 ?? '–'} · P6 ${d.rec_p6 ?? '–'}`;
  const edge = d.edge_band === 'true' ? '  •  ⚠️ edge band' : '';
  const text = `New Revenue Engine Check — ${d.rec_grade || ''} (${d.rec_overall || '?'}/36), route ${d.rec_route || '?'}`;

  return {
    text, // fallback / notification text
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '🔧 New Revenue Engine Check', emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Grade:*\n${esc(d.rec_grade)} (${esc(d.rec_overall)}/36)` },
          { type: 'mrkdwn', text: `*Route:*\n${esc(d.rec_route)}` },
          { type: 'mrkdwn', text: `*Weakest phase:*\n${esc(d.weakest) || '—'}` },
          { type: 'mrkdwn', text: `*Revenue band:*\n${esc(band)}${edge}` },
          { type: 'mrkdwn', text: `*Email:*\n${esc(d.email)}` },
        ],
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `Phase scores  ${esc(phases)}` }] },
    ],
  };
}

export function benchMessage(d) {
  const text = `New bench application — ${d.full_name || d.email} (${d.specialty || '—'})`;
  const linkedin = d.linkedin ? `<${esc(d.linkedin)}|${esc(d.linkedin)}>` : '—';
  return {
    text,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '🪑 New bench application', emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${esc(d.full_name) || '—'}` },
          { type: 'mrkdwn', text: `*Email:*\n${esc(d.email)}` },
          { type: 'mrkdwn', text: `*Specialty:*\n${esc(d.specialty) || '—'}` },
          { type: 'mrkdwn', text: `*Day rate:*\n${esc(d.day_rate_band) || '—'}` },
          { type: 'mrkdwn', text: `*Availability:*\n${esc(d.availability) || '—'}` },
        ],
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `LinkedIn  ${linkedin}` }] },
    ],
  };
}

// Anything other than POST.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
