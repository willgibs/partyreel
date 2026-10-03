/**
 * THE HOST'S COVER, THE SERVER'S HALF: THE ROWS A SWITCH PUT IN THE ROLL (red-team 46's MEDIUM; `host-cover.ts` says why
 * her manifest cannot). An album going from approving each to a develop time approves its held photographs and seals
 * them with the develop (`events_hold_released`, `media_seal_on_approval`) AFTER they were created, so the period the
 * switch stamps (`events.sealed_from`) starts later than they do and her cover read every one as seen: "0 developing"
 * over the 195 her guests read, and her head wearing them. They are approved, sealed now, and created before the
 * period: the one kind of waiting row the period's rule cannot see. A camera turned on after a develop time was
 * already set restamps the period the same way, and its shots between are caught by the same read.
 *
 * ★ ON HER OWN CLIENT, AFTER THE PAGE HAS PROVED HER (the hub reads the event through RLS first; `sealed_until` is
 * granted to `authenticated`, as the dashboard's media reads name it), and only the ids: she is the one person who may
 * read her own album's rows whole.
 *
 * ★ READ WHOLE (the 1,000-row rules, `read-all.ts`): a switch can put thousands in the roll. And READ ONLY WHERE THE COVER
 * STANDS (a develop time ahead and a period stamped): anywhere else it answers none without asking. The ids ride the
 * page with the develop facts, so the cover is as fresh as they are: every save of the develop time reads the page
 * afresh, and nothing can join the roll while a develop time is ahead (approval never stands with one).
 *
 * ★ A ROW IS NEVER WORTH THE PAGE: a failed read answers none (the cover reads as it did before this read) and is
 * captured, where failures are read.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { albumCursorOf, olderThan } from "@/lib/db/queries/guest-events";
import { readAllPages } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import { hubCovered } from "@/lib/disposable/host-cover";
import { nowIso } from "@/lib/disposable/seal";
import { captureError } from "@/lib/observability/sentry";

/** The ids of the approved rows sealed for the develop that were created before its period began, newest first. */
export async function readJoinedIds(
  supabase: SupabaseClient<Database>,
  event: {
    id: string;
    develops_at: string | null;
    sealed_from: string | null;
  },
  nowMs: number = Date.now(),
): Promise<string[]> {
  const sealedFrom = event.sealed_from;
  if (!sealedFrom || !hubCovered(event, nowMs)) return [];
  try {
    const { rows } = await readAllPages(
      "hub cover: rows in the roll",
      (after: { at: string; id: string } | null, limit) => {
        let q = supabase
          .from("media")
          .select("id, created_at")
          .eq("event_id", event.id)
          .eq("status", "approved")
          // Sealed now, and from before the period: held photographs the switch sealed with the develop.
          .gt("sealed_until", nowIso(nowMs))
          .lt("created_at", sealedFrom)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);
        if (after) q = q.or(olderThan(after));
        return q;
      },
      albumCursorOf,
    );
    return rows.map((r) => r.id);
  } catch (error) {
    captureError("db", error, {
      seam: "hub_cover_joined",
      eventId: event.id,
    });
    return [];
  }
}
