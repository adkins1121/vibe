/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Cal.com / Calendly booking URL for the discovery call (build-time, public) */
  readonly PUBLIC_BOOKING_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Pages Function bindings (server-side only — never in the client bundle).
// HUBSPOT_PRIVATE_APP_TOKEN is set as a Cloudflare secret; see docs/hubspot-setup.md.
