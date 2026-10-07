"use server";

import { revalidatePath } from "next/cache";

import {
  blockUser,
  followUser,
  unblockUser,
  unfollowUser,
} from "@/lib/db/mutations/social";
import { followsNoOne } from "@/lib/db/queries/first-follow";
import { captureError } from "@/lib/observability/sentry";

/**
 * THE RELATION'S FOUR SERVER FUNCTIONS, the only writes behind every face of a follow or a block
 * (`components/social/relation-toggle.tsx`: the profile's Follow, the quieter Follow beside an album,
 * the profile menu's Block row, the Connections card's rows). The mutations own auth and the
 * block-silent semantics (lib/db/mutations/social.ts); these are thin.
 *
 * ★ A LANDED WRITE REVALIDATES EVERY PAGE A RELATION SHAPES, and that is the whole refresh: each
 * profile (the follow state, and a block in either direction hides Follow) by its route pattern, so a
 * profile reached at any casing of its handle is covered, and Account (the Connections lists). Next
 * renders the page the press came from into this function's response, so the control's page re-reads
 * in the same round trip and no face calls `router.refresh()` (which rendered it a second time).
 * Account kept its own unfollow and unblock until crumbs-44: one write, two contracts.
 *
 * ★ A FIRST FOLLOW SAYS SO (`account-moments` r2, `follow=once`): `first` on a landed follow means her list was empty
 * before the press, so the control draws the private line once ("Only you see who you follow") and every follow after is
 * the button alone. It is read HERE, on the server, before the write (`followsNoOne`: no column, every device alike),
 * so it is the same on her phone, her laptop and every seat she follows from, and no face has to remember it.
 */
export type ProfileActionResult =
  | { ok: true; first?: boolean }
  | { ok: false; message: string };

function done(
  result: { ok: boolean; message?: string },
  first = false,
): ProfileActionResult {
  if (result.ok) {
    revalidatePath("/u/[slug]", "page");
    revalidatePath("/account");
    return first ? { ok: true, first: true } : { ok: true };
  }
  return {
    ok: false,
    message:
      ("message" in result && result.message) ||
      "Something went wrong. Please try again.",
  };
}

/**
 * ★ THE LINE IS A COURTESY, NEVER A GATE: a read that fails is "not her first" (the follow is the act, the line a
 * nicety), and it is recorded, since a line that quietly never shows is a silent failure.
 */
async function herListIsEmpty(): Promise<boolean> {
  try {
    return await followsNoOne();
  } catch (error) {
    captureError("account", error, { seam: "first_follow_read" });
    return false;
  }
}

export async function followProfileAction(
  profileId: string,
): Promise<ProfileActionResult> {
  // Before the write: afterwards her list would hold the follow just made, and every first would read as not.
  const first = await herListIsEmpty();
  return done(await followUser(profileId), first);
}

export async function unfollowProfileAction(
  profileId: string,
): Promise<ProfileActionResult> {
  return done(await unfollowUser(profileId));
}

export async function blockProfileAction(
  profileId: string,
): Promise<ProfileActionResult> {
  return done(await blockUser(profileId));
}

export async function unblockProfileAction(
  profileId: string,
): Promise<ProfileActionResult> {
  return done(await unblockUser(profileId));
}
