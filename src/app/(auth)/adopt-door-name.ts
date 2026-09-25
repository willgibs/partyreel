/**
 * THE TYPED NAME SURVIVES THE MAGIC LINK (lp/identity-email).
 *
 * A guest who types a name at the door and then taps the emailed link instead of the code lands on
 * `/auth/callback` in a fresh page: the name lived in the door's state and is gone. So the door
 * passes it as `signInWithOtp` data (`user_metadata.door_name`, which GoTrue writes only when that
 * call creates the account), and the callback adopts it after the code exchange, before the album
 * can ask for a name again. Inert until the door sends the field (`door-flow`).
 *
 * The rules are `updateDisplayNameAction`'s (auth-accounts.md, Names and photos):
 *   - a NAMELESS profile only: nothing overwrites a name, and the write itself is conditioned on the
 *     column still being null, so a name set a moment earlier by the in-page path wins;
 *   - `displayNameSchema`, then `containsProfanity`, then the admin client: the metadata is
 *     client-writable (`updateUser({ data })`), so it is untrusted input, validated like any name;
 *   - the stored copy is cleared whether it was adopted or refused: it has done its one job.
 *
 * ★ NOT A SERVER ACTION. Only the callback route calls it, so it is a plain server module rather
 * than an export of `actions.ts`, which client components import (a Server Function is a public
 * endpoint; this needs none). It never throws: a failure is captured and the sign-in goes on.
 */
import "server-only";

import { DOOR_NAME_KEY } from "@/app/(auth)/door-name-key";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { containsProfanity } from "@/lib/validation/profanity";
import { displayNameSchema } from "@/lib/validation/profile";

export async function adoptDoorName(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (!(DOOR_NAME_KEY in metadata)) return;
    const stored = metadata[DOOR_NAME_KEY];

    const admin = createAdminClient();
    const { data: profile, error: readError } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (readError) throw readError;

    if (
      profile &&
      profile.display_name === null &&
      typeof stored === "string"
    ) {
      const parsed = displayNameSchema.safeParse(stored);
      if (parsed.success && !containsProfanity(parsed.data)) {
        const { error: writeError } = await admin
          .from("profiles")
          .update({ display_name: parsed.data })
          .eq("id", user.id)
          .is("display_name", null);
        if (writeError) throw writeError;
      }
    }

    // A null deletes the key (GoTrue merges user_metadata and drops null values).
    const { error: clearError } = await admin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { [DOOR_NAME_KEY]: null } },
    );
    if (clearError) throw clearError;
  } catch (error) {
    captureError("account", error, { step: "adopt_door_name" });
  }
}
