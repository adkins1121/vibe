// Cloudflare Pages Function — lead capture for Altus KC.
// Runs at the edge. Receives a JSON POST from the Revenue Engine Check results
// page and the Bench application form, then fans out to two best-effort sinks:
//
//   1. Slack  — formatted Block Kit notification via an Incoming Webhook
//               (SLACK_WEBHOOK_URL secret). Real-time alert.
//   2. HubSpot — upserts the contact by email and APPENDS this submission as a
//               JSON entry to the standard `hs_content_membership_notes` property
//               (HUBSPOT_PRIVATE_APP_TOKEN secret). Historical record, no custom
//               properties required (works on the current plan).
//
// Both are optional: whichever secret is set runs. Capture is best-effort — a
// downstream failure is logged server-side and never blocks the visitor.
//
// Setup: docs/capture-setup.md

// Optional separate Slack channels per kind; each falls back to the main hook.
function slackHookFor(kind, env) {
  if (kind === 'bench' && env.SLACK_BENCH_WEBHOOK_URL) return env.SLACK_BENCH_WEBHOOK_URL;
  if (kind === 'card' && env.SLACK_CARD_WEBHOOK_URL) return env.SLACK_CARD_WEBHOOK_URL;
  return env.SLACK_WEBHOOK_URL;
}

// Allowlists — only these keys are ever read off the request, per kind.
const ALLOWED = {
  rec: [
    'rec_p1', 'rec_p2', 'rec_p3', 'rec_p4', 'rec_p5', 'rec_p6',
    'rec_overall', 'rec_grade', 'rec_route', 'revenue_band', 'edge_band', 'weakest',
  ],
  bench: ['full_name', 'linkedin', 'specialty', 'day_rate_band', 'availability'],
  // Contact swapped from the digital business card (/card).
  card: ['full_name', 'company', 'role', 'phone', 'linkedin', 'note', 'met_at'],
};

const HS_CONTACTS = 'https://api.hubapi.com/crm/v3/objects/contacts';
const HS_NOTES_PROP = 'hs_content_membership_notes';
const HISTORY_CAP = 50; // keep the most recent N submissions per contact

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
  if (kind !== 'rec' && kind !== 'bench' && kind !== 'card') return json({ ok: false, error: 'bad_kind' }, 400);
  if (!isEmail(email)) return json({ ok: false, error: 'bad_email' }, 400);

  // Pull only allowlisted fields.
  const data = { email: email.trim().toLowerCase() };
  for (const key of ALLOWED[kind]) {
    if (payload[key] != null && payload[key] !== '') data[key] = String(payload[key]);
  }

  const slackHook = slackHookFor(kind, env);
  const hsToken = env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!slackHook && !hsToken) {
    console.error('[submit] no sink configured (SLACK_WEBHOOK_URL / HUBSPOT_PRIVATE_APP_TOKEN)');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  // Fan out — independent and best-effort.
  const results = {};
  const tasks = [];
  if (slackHook) {
    const message =
      kind === 'rec' ? recMessage(data) : kind === 'bench' ? benchMessage(data) : cardMessage(data);
    tasks.push(postSlack(slackHook, message).then((r) => (results.slack = r)));
  }
  if (hsToken) {
    const entry = { ts: new Date().toISOString(), kind, ...data };
    tasks.push(upsertHubSpot(hsToken, data.email, entry).then((r) => (results.hubspot = r)));
  }
  await Promise.all(tasks);

  // 200 as long as the request was well-formed; per-sink status is in the body
  // and any failure is logged server-side. Retrying client-side wouldn't help.
  return json({ ok: true, results });
}

// ---- Slack ----------------------------------------------------------------

async function postSlack(webhook, message) {
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      console.error('[submit] Slack error', res.status, await res.text());
      return 'error';
    }
    return 'ok';
  } catch (err) {
    console.error('[submit] Slack fetch failed', err);
    return 'unreachable';
  }
}

export function recMessage(d) {
  const band = REVENUE_BAND_LABEL[d.revenue_band] || d.revenue_band || '—';
  const phases =
    `P1 ${d.rec_p1 ?? '–'} · P2 ${d.rec_p2 ?? '–'} · P3 ${d.rec_p3 ?? '–'} · ` +
    `P4 ${d.rec_p4 ?? '–'} · P5 ${d.rec_p5 ?? '–'} · P6 ${d.rec_p6 ?? '–'}`;
  const edge = d.edge_band === 'true' ? '  •  ⚠️ edge band' : '';
  const text = `New Revenue Engine Check — ${d.rec_grade || ''} (${d.rec_overall || '?'}/36), route ${d.rec_route || '?'}`;

  return {
    text,
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

export function cardMessage(d) {
  const who = d.full_name || d.email;
  const text = `New contact swapped — ${who}${d.company ? ` (${d.company})` : ''}`;
  const linkedin = d.linkedin ? `<${esc(d.linkedin)}|${esc(d.linkedin)}>` : '—';
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: '🤝 New contact — from your card', emoji: true } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${esc(d.full_name) || '—'}` },
        { type: 'mrkdwn', text: `*Email:*\n${esc(d.email)}` },
        { type: 'mrkdwn', text: `*Company:*\n${esc(d.company) || '—'}` },
        { type: 'mrkdwn', text: `*Role:*\n${esc(d.role) || '—'}` },
        { type: 'mrkdwn', text: `*Phone:*\n${esc(d.phone) || '—'}` },
      ],
    },
  ];
  if (d.note) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Note:*\n${esc(d.note)}` } });
  const context = d.met_at ? `Met at  ${esc(d.met_at)}  ·  LinkedIn  ${linkedin}` : `LinkedIn  ${linkedin}`;
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: context }] });
  return { text, blocks };
}

// ---- HubSpot --------------------------------------------------------------
// Upsert contact by email; append `entry` to the JSON array stored in
// hs_content_membership_notes. No custom properties required.

async function upsertHubSpot(token, email, entry) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    // Try to create with a fresh one-entry history.
    let res = await fetch(HS_CONTACTS, {
      method: 'POST',
      headers,
      body: JSON.stringify({ properties: { email, [HS_NOTES_PROP]: serializeHistory([entry]) } }),
    });

    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      const id = String(err.message || '').match(/Existing ID:\s*(\d+)/)?.[1];
      if (!id) {
        console.error('[submit] HubSpot 409 without ID', err);
        return 'error';
      }
      // Read existing notes, append, write back.
      const getRes = await fetch(`${HS_CONTACTS}/${id}?properties=${HS_NOTES_PROP}`, { headers });
      const existing = getRes.ok
        ? parseHistory((await getRes.json())?.properties?.[HS_NOTES_PROP])
        : [];
      existing.push(entry);
      res = await fetch(`${HS_CONTACTS}/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ properties: { [HS_NOTES_PROP]: serializeHistory(existing) } }),
      });
    }

    if (!res.ok) {
      console.error('[submit] HubSpot error', res.status, await res.text());
      return 'error';
    }
    return 'ok';
  } catch (err) {
    console.error('[submit] HubSpot fetch failed', err);
    return 'unreachable';
  }
}

// Parse the stored notes into an array of entries. If it isn't our JSON array
// (e.g. someone typed a manual note), preserve that text as the first entry so
// nothing is lost.
export function parseHistory(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }
  return [{ ts: null, note: String(value) }];
}

export function serializeHistory(entries) {
  const trimmed = entries.slice(-HISTORY_CAP); // keep most recent N
  return JSON.stringify(trimmed);
}

// Anything other than POST.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
