"use client";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { readTypedName } from "@/lib/guest/confirm-beat";
import { createClient } from "@/lib/supabase/client";

/**
 * THE NAME HER PHOTOGRAPHS CARRY NOW, AFTER A CONFIRMATION, and whether to tell it.
 *
 * `claim_anonymous_uploads` names a nameless profile from the newest row it claimed; this is the
 * belt for a typed name that never reached a row: when the profile still has no name, the name typed
 * here becomes it (the one profanity-checked write path, which never overwrites a name). Then the
 * name is TOLD whenever she had typed one here, whichever name won: a guest who was "Priya" on this
 * album all evening and whose account says "Priya Shah" is now credited as the latter, and saying
 * so is the whole point of `name=told`.
 *
 * Returns the name to tell, or null (no typed name here, no session, or a read that failed: a
 * nudge that cannot be said is simply not said).
 */
export async function settleConfirmedName(
  qrToken: string,
): Promise<string | null> {
  const typed = readTypedName(qrToken);
  if (!typed) return null;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    // Own-row read (profiles_select_own). DELIBERATE swallow: a failed read costs the told line and
    // nothing else, since the confirmation and the claim have both already landed.
    // eslint-disable-next-line partyreel/no-swallowed-db-error
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    const current = data?.display_name?.trim() || null;
    if (current) return current;
    const saved = await updateDisplayNameAction(typed);
    return saved.ok ? typed : null;
  } catch {
    return null;
  }
}
