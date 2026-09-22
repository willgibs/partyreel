"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type FinishClaimsResult =
  | { ok: true; claimedEvents: number }
  | { ok: false; message: string };

/**
 * Finish the dashboard's claim ticket (the guest identity round, 2026-09-22):
 * claim the named events — or every claimable one, when `claimIds` is null
 * (the "Claim all" shortcut) — then release whatever is left, which is the
 * guest saying "that was not me" (rulings.md "guest identity", his own
 * words: "any unclaimed events should have all of that user's uploaded
 * content deleted ... that's the guest effectively requesting 'get rid of
 * that'"). Both RPCs key on the CALLER'S OWN confirmed address
 * (auth.uid() -> auth.users inside them, never a client-supplied email), so
 * a forged event id reaches nothing beyond rows already typed under that
 * same address.
 *
 * `disownIds` is only sent when non-empty: `disown_guest_rows_by_email`
 * raises on a null/empty array by design (its own "no implicit all on a
 * destructive call" guard), so a plain claim-everything commit — Claim all,
 * or a Finish where every row was explicitly claimed — never calls it at
 * all, rather than calling it with nothing to do.
 */
export async function finishClaimsAction({
  claimIds,
  disownIds,
}: {
  /** Event ids to claim; null claims every row waiting under this address. */
  claimIds: string[] | null;
  /** Event ids to release: their uploads are permanently removed and the
   *  address is detached from that row. */
  disownIds: string[];
}): Promise<FinishClaimsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Sign in and try again." };
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_guest_rows_by_email",
    claimIds ? { p_event_ids: claimIds } : {},
  );
  if (claimError) {
    return {
      ok: false,
      message: "Couldn't claim those photos. Please try again.",
    };
  }

  if (disownIds.length > 0) {
    const { error: disownError } = await supabase.rpc(
      "disown_guest_rows_by_email",
      { p_event_ids: disownIds },
    );
    if (disownError) {
      return {
        ok: false,
        message:
          "Claimed what we could, but couldn't release the rest. Please try again.",
      };
    }
  }

  revalidatePath("/dashboard");
  return { ok: true, claimedEvents: claimed ?? 0 };
}
