// Cloudflare Pages Function — lead capture for Altus KC.
// Runs at the edge (not a server you maintain). Receives a JSON POST from the
// Revenue Engine Check results page and the Bench application form, then upserts
// a HubSpot contact via the CRM API using a private-app token kept as a
// Cloudflare secret (HUBSPOT_PRIVATE_APP_TOKEN) — never shipped to the browser.
//
// Setup: see docs/hubspot-setup.md (create the private app + the custom contact
// properties; no marketing forms needed).

const HS_CONTACTS = 'https://api.hubapi.com/crm/v3/objects/contacts';

// Allowlists — only these property keys are ever written, per kind. Anything else
// in the request body is ignored, so the endpoint can't be used to write arbitrary
// contact properties.
const ALLOWED = {
  rec: [
    'rec_p1', 'rec_p2', 'rec_p3', 'rec_p4', 'rec_p5', 'rec_p6',
    'rec_overall', 'rec_grade', 'rec_route', 'revenue_band', 'edge_band',
  ],
  bench: ['linkedin', 'specialty', 'day_rate_band', 'availability'],
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const { kind, email } = payload || {};
  if (kind !== 'rec' && kind !== 'bench') {
    return json({ ok: false, error: 'bad_kind' }, 400);
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: 'bad_email' }, 400);
  }

  // Build a clean properties object from the allowlist only.
  const properties = { email: email.trim().toLowerCase() };
  for (const key of ALLOWED[kind]) {
    if (payload[key] != null && payload[key] !== '') {
      properties[key] = String(payload[key]);
    }
  }

  if (kind === 'bench') {
    // Tag the applicant and split full_name into HubSpot's standard fields.
    properties.bench_applicant = 'true';
    const name = String(payload.full_name || '').trim();
    if (name) {
      const [first, ...rest] = name.split(/\s+/);
      properties.firstname = first;
      if (rest.length) properties.lastname = rest.join(' ');
    }
  }

  const token = env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    // Misconfiguration — log server-side, but don't break the visitor's flow.
    console.error('[submit] HUBSPOT_PRIVATE_APP_TOKEN not set');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  try {
    const res = await upsertContact(token, properties);
    if (!res.ok) {
      const detail = await res.text();
      console.error('[submit] HubSpot error', res.status, detail);
      return json({ ok: false, error: 'hubspot_error', status: res.status }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[submit] fetch failed', err);
    return json({ ok: false, error: 'upstream_unreachable' }, 502);
  }
}

// Create the contact; on 409 (already exists) parse the existing ID and PATCH it.
async function upsertContact(token, properties) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let res = await fetch(HS_CONTACTS, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (res.status === 409) {
    const err = await res.json().catch(() => ({}));
    const id = String(err.message || '').match(/Existing ID:\s*(\d+)/)?.[1];
    if (id) {
      const { email, ...rest } = properties; // don't re-write the identifier
      res = await fetch(`${HS_CONTACTS}/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ properties: rest }),
      });
    }
  }

  return res;
}

// Anything other than POST.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
