import { SITE_URL } from "@/lib/constants/site";
import { env } from "@/lib/env";

// Interactive demo (polish-arc Round 3). A REAL curated event's qr_token is set in
// NEXT_PUBLIC_DEMO_QR_TOKEN. When present:
//   • marketing renders a real scannable QR + a "Try the live demo" CTA, and
//   • that event's /e/[qr_token] guest page runs in DEMO MODE — a visitor's "upload"
//     is simulated client-side (a local object-URL tile, never written to DB/R2), so
//     the curated media stays pristine.
// Unset → no demo anywhere (decorative QR, no CTA, normal guest behavior). No schema
// change. This module reads `env`, so (like site.ts) it isn't Vitest-importable;
// the demo path is verified end-to-end via the Preview MCP with a seeded event.

export const DEMO_QR_TOKEN = env.NEXT_PUBLIC_DEMO_QR_TOKEN;

/** The demo event's guest URL, or undefined when no demo is configured. */
export const DEMO_EVENT_URL = DEMO_QR_TOKEN
  ? `${SITE_URL}/e/${DEMO_QR_TOKEN}`
  : undefined;

/** True only for the demo event's qr_token (so its guest page simulates uploads). */
export function isDemoToken(token: string): boolean {
  return !!DEMO_QR_TOKEN && token === DEMO_QR_TOKEN;
}
