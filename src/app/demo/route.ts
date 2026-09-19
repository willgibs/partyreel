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
 * ★ A ROUTE HANDLER, NOT A `next.config.ts` REDIRECT, and that is not a style
 * choice: the destination is `DEMO_EVENT_URL`, built from the demo event's
 * `qr_token` in a runtime env var, so a static rewrite table written at build
 * time cannot carry it. Route handlers are uncached by default; `force-dynamic`
 * says so out loud, because this one answers from the environment and a build
 * that folded it into a static 307 would pin whatever token that build saw.
 *
 * ★ 307, NEVER 308. The demo event is a real row that can be re-seeded or
 * retired, and a permanent redirect is a cache entry in every phone that ever
 * scanned the code. `redirect()` answers 307 by default.
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
