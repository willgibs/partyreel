import { redirect } from "next/navigation";

import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";

/**
 * `/demo` — THE SHORT WAY INTO THE LIVE DEMO EVENT.
 *
 * Will ruled it on river-card round one (`opens=short`, 2026-09-19): the QR
 * door's code encodes this path rather than the demo event's own link, because
 * the value IS the code's size. `https://partyreel.com/demo` is 25 modules and
 * scans at a 99 px plate; the event link is 33 modules and needs 123, which is
 * a quarter more card spent on the object the album is supposed to be falling
 * out of. "The redirect ships with the wiring."
 *
 * ★ A ROUTE HANDLER, NOT A `next.config.ts` REDIRECT. The destination is
 * COMPOSED — `SITE_URL` plus the demo event's `qr_token` — and `lib/demo.ts` is
 * the one place that composition lives; a redirect table would have to spell it
 * a second time in the config, and then the demo would have two addresses that
 * could drift. It also has to branch: `redirects()` has no way to say "and
 * nothing at all when the token is unset" without repeating the same read.
 * (Measured, so the comment does not overclaim: `NEXT_PUBLIC_*` is INLINED at
 * build, here as everywhere else it is read, so re-pointing the demo still
 * takes a redeploy either way. The single source is the reason; a runtime read
 * is not.)
 *
 * ★ 307, NEVER 308, and never cached. The demo event is a real row that can be
 * re-seeded or retired, and a permanent redirect is an entry in the CDN and in
 * every phone that ever scanned the code. `redirect()` answers 307, and
 * `force-dynamic` keeps a build from folding this into a static answer.
 *
 * With no demo configured (`NEXT_PUBLIC_DEMO_QR_TOKEN` unset — local checkouts,
 * a preview with the variable missing) the code still has to lead somewhere
 * honest, so it lands on the home page rather than a 404: a scanner is holding
 * a phone, not a debugger. The rest of the site takes the same "no demo, no
 * demo affordance" line (cinema-hero.tsx, footer-demo.tsx).
 */
export const dynamic = "force-dynamic";

export function GET() {
  redirect(DEMO_EVENT_URL ?? SITE_URL);
}
