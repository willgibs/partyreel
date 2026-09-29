/**
 * A Supabase client with NO IDENTITY: the publishable key, no session, no cookie. It asks the way an
 * unfurler or a signed-out visitor asks, so what it reads is what everyone may read.
 *
 * WHY IT EXISTS: a response the edge SHARES between viewers (a public `Cache-Control`) must be
 * computed from nothing that differs between them. The request client (`server.ts`) carries the
 * viewer's session, and the database answers a session personally (an account an event blocked reads
 * that event as private, `get_event_by_qr_token`), so a shared response built on it hands one viewer's
 * answer to the next. This one cannot: it has no session to answer.
 *
 * ★ ONLY FOR A READ THAT MUST ANSWER THE SAME TO EVERYONE (the event's share card,
 * `db/queries/event-card.ts`). It holds `anon`'s grants and nothing more, so it can call only the anon
 * capability reads (database-security.md) and never authorizes anything: a per-viewer read uses
 * `server.ts` and `getUser()`, a privileged one `admin.ts`.
 */
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";
import { withRowCapTripwire } from "@/lib/supabase/row-cap-tripwire";

export function createAnonClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // A read clipped at PostgREST's 1,000 rows warns in Sentry once (row-cap-tripwire.ts).
      global: { fetch: withRowCapTripwire() },
    },
  );
}
