"use server";

/**
 * THE ONE WRITE OF THE REEL'S EVENT-WIDE DEFAULTS.
 *
 * Will, reel-host `style=both` (2026-09-25): a host sets the reel's look and hold for everyone from
 * two places, the view's "Set for everyone" beside a pick and Settings' Highlight reel section
 * (which also holds Show the reel). Both call this, so the two can never disagree about what a
 * default may be or who may set it.
 *
 * ★ THE OWNER CHECK IS THE DATABASE'S. The input is parsed first (a Server Function is a public
 * endpoint and every value here is the client's), then `updateEvent` re-verifies the session with
 * `auth.getUser()` and writes on the user's client, where `events_host_all` matches only the host's
 * own live event and the column grant admits only these columns. A signed-out caller is refused
 * before any write; anyone else's event matches no row and the save is refused.
 *
 * ★ IT CAN WRITE NOTHING BUT THESE THREE. `reelDefaultsInputSchema` strips every other key, and the
 * patch below names the three columns, so a hostile call cannot ride this into the general save.
 *
 * ★ IT REVALIDATES NOTHING. Every page that reads these columns renders per request (the guest page
 * is `force-dynamic`; the host's pages read on the user's client), so there is no cache to clear,
 * and a `revalidatePath` would make the action re-render the page that called it, which from the
 * view is the whole presign-heavy album under a playing reel. Each caller keeps what it just set
 * from the answer below, which is what the row now holds.
 *
 * ★ A PICK THAT LANDS ON THE PLATFORM'S OWN DEFAULT IS STORED AS NULL, NOT THE MATCHING VALUE
 * (build 9 and 10's red-teams: choosing the default hold or look wrote `3` / `'classic'`, so the
 * event stopped following the platform default the moment it moved). Neither control offers a
 * separate "Default" option — a host simply picks the look or step that happens to BE the default
 * today — so this is the one seam that can tell "chose the default" from "chose to pin a value",
 * and it normalizes each column on its own: `resolveHoldSec` already treats NULL as "the default",
 * so a value that already equals it is redundant to store literally.
 */
import { updateEvent } from "@/lib/db/mutations/events";
import { DEFAULT_HOLD_SEC } from "@/lib/reel/defaults";
import { DEFAULT_STYLE_ID } from "@/lib/reel/engine/style-registry";
import {
  reelDefaultsInputSchema,
  type ReelDefaultsInput,
  type UpdateEventValues,
} from "@/lib/validation/event";

/** The three defaults as the row holds them after the save (null: the product's own). */
export type ReelDefaults = {
  showReel: boolean;
  styleId: string | null;
  holdSec: number | null;
};

/**
 * A refusal says which kind: `validation` (the input, nothing was read), `unauthorized` (no
 * session), or `unknown` (the write failed, which is also what anyone else's event answers: RLS
 * matches no row, and the answer never says whether the event exists).
 */
export type SetReelDefaultsResult =
  | { ok: true; defaults: ReelDefaults }
  | {
      ok: false;
      code: "validation" | "unauthorized" | "unknown";
      message: string;
    };

export async function setReelDefaults(
  input: ReelDefaultsInput,
): Promise<SetReelDefaultsResult> {
  const parsed = reelDefaultsInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message:
        parsed.error.issues[0]?.message ??
        "Please check the setting and try again.",
    };
  }

  const { eventId, showReel, styleId, holdSec } = parsed.data;
  const values: UpdateEventValues = {};
  if (showReel !== undefined) values.show_reel = showReel;
  // Each column's own default collapses to NULL (this module's header): the two never disagree on
  // what "the default" is because both read it from the one home (`defaults.ts`, `style-registry.ts`).
  if (styleId !== undefined) {
    values.reel_style_id = styleId === DEFAULT_STYLE_ID ? null : styleId;
  }
  if (holdSec !== undefined) {
    values.reel_hold_sec = holdSec === DEFAULT_HOLD_SEC ? null : holdSec;
  }
  // A call that sets nothing is a caller's bug: refused here, before a session or a row is read.
  if (Object.keys(values).length === 0) {
    return { ok: false, code: "validation", message: "Nothing to save." };
  }

  const result = await updateEvent(eventId, values);
  if (!result.ok) {
    return {
      ok: false,
      code: result.code === "unauthorized" ? "unauthorized" : "unknown",
      message: result.message,
    };
  }

  const row = result.data;
  return {
    ok: true,
    defaults: {
      showReel: row.show_reel,
      styleId: row.reel_style_id,
      holdSec: row.reel_hold_sec,
    },
  };
}
