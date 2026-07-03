/**
 * Request-scoped dedupe for the cookie-bound server client + its getUser()
 * JWT validation, via React cache().
 *
 * WHY: every host query module defensively re-checks getUser() ("RLS is the
 * boundary; the proxy is not"). That re-check is CORRECT and must stay, but
 * getUser() is a NETWORK round-trip to the Supabase Auth server, so one
 * dashboard render (the layout gate + ~8 parallel queries) was paying ~9
 * identical validations. Routing them through this cached helper keeps the
 * security semantics (the JWT is still re-validated on every request, and
 * every caller still branches on `user`) while running the network hop ONCE
 * per request.
 *
 * WHY cache() cannot leak across users: React's cache() memoizes into a store
 * scoped to the CURRENT server request's render pass (Next 16 docs: "scoped to
 * the current request only. Each request gets its own memoization scope with
 * no sharing between requests"). A different request carries different cookies
 * AND a fresh store, so these zero-arg cached reads can never serve another
 * user's client or identity. Outside a render pass (route handlers, server
 * actions), cache() simply calls through uncached: identical behavior to the
 * old per-call code, so a post-mutation re-read in an action is never stale.
 *
 * RULES for extending this pattern: cache() READS only, never mutations; never
 * the service-role admin client (pages expect those reads fresh + un-scoped
 * reads must stay deliberate); array/object-arg queries gain nothing (cache()
 * keys args by reference), so leave them uncached rather than pretend.
 */
import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** ONE cookie-bound, RLS-scoped server client per request (safe to share:
 *  each query is an independent fetch; the client holds no per-call state). */
export const getRequestClient = cache(createClient);

export type RequestAuth = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  /** null = unauthenticated; every caller must keep failing closed on it. */
  user: User | null;
};

/** The (app) layout gate + every query module share ONE getUser() validation
 *  per request. */
export const getRequestAuth = cache(async (): Promise<RequestAuth> => {
  const supabase = await getRequestClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});
