/**
 * Next 16 renamed Middleware → Proxy. This file MUST be named `proxy.ts` and
 * export a function named `proxy` (the old `middleware` name no longer runs).
 * It runs on the Node.js runtime by default — do NOT add a `runtime` config;
 * Next 16 doesn't allow setting it here.
 *
 * All it does is refresh the Supabase session cookie on every matched request.
 * It is NOT an auth gate: route protection lives in the (app) layout via
 * getUser(), and each Server Function must re-verify authz itself. Treating the
 * proxy as the security boundary is a known footgun — don't.
 */
import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Match everything except Next internals and static image assets, so the auth
  // cookie stays fresh app-wide. The matcher only skips work that never needs a
  // session; route-level protection is enforced in the (app) layout.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
