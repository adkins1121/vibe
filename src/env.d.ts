/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** HubSpot portal/account ID. Altus KC: 244733039 */
  readonly PUBLIC_HUBSPOT_PORTAL_ID: string;
  /** Form GUID for Revenue Engine Check results capture */
  readonly PUBLIC_HUBSPOT_REC_FORM_ID: string;
  /** Form GUID for Bench operator applications */
  readonly PUBLIC_HUBSPOT_BENCH_FORM_ID: string;
  /** Cal.com / Calendly booking URL for the discovery call */
  readonly PUBLIC_BOOKING_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
