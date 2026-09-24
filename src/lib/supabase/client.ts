/**
 * Supabase client for Client Components (browser). Uses the PUBLISHABLE key, so
 * every query is constrained by RLS — safe to ship to the browser.
 *
 * Server Components / Route Handlers / Server Functions → use ./server.
 * Privileged server-only work that must bypass RLS      → use ./admin.
 */
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";
import { withRowCapTripwire } from "@/lib/supabase/row-cap-tripwire";

/**
 * PASSKEYS, BEHIND A FLAG (Will, 2026-09-20, `app-door` r1 `return=tap`, with
 * his "If this is a bad idea, please flag it" answered in one sentence: a press
 * that signs anyone in without a credential is never acceptable, and a passkey
 * IS a credential, so the option is right exactly as far as passkeys reach).
 *
 * ★ TWO THINGS OUTSIDE THIS REPO MUST BE TRUE BEFORE THE FLAG GOES ON, and
 * neither fails loudly: Supabase Auth must have passkeys enabled for the
 * project, and the WebAuthn Relying Party id must match the apex the door is
 * served from (a passkey registered against one RP id is invisible on another).
 * Both are dashboard settings, routed to Will; until he sets them the flag stays
 * unset and every passkey affordance is simply absent.
 *
 * ★ AND THE OPTION IS ONLY PASSED WHEN THE FLAG IS SET. `auth-js` 2.106 gates
 * its whole passkey surface on `auth.experimental.passkey` and THROWS a
 * descriptive error from every passkey method while it is off, which is the
 * behaviour we want: unset means unreachable rather than half-working.
 */
export const PASSKEYS_ENABLED = env.NEXT_PUBLIC_PASSKEYS === "1";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    // ★ `createBrowserClient` is a SINGLETON by default, so these options are
    // read once per document, on the first call. The flag is a build-time
    // constant so that is exactly right — but it is why this cannot become a
    // per-call option later without also passing `isSingleton: false`. ONE
    // options object: the tripwire (a read clipped at PostgREST's 1,000 rows
    // warns in Sentry once, row-cap-tripwire.ts) rides every document, and the
    // passkey flag joins it only when set. The object carries no `isSingleton`,
    // so the singleton default holds exactly as it did with no options at all.
    {
      global: { fetch: withRowCapTripwire() },
      ...(PASSKEYS_ENABLED ? { auth: { experimental: { passkey: true } } } : {}),
    },
  );
}
