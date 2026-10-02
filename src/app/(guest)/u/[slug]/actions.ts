"use server";

import { revalidatePath } from "next/cache";

import {
  blockUser,
  followUser,
  unblockUser,
  unfollowUser,
} from "@/lib/db/mutations/social";

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
 */
export type ProfileActionResult = { ok: true } | { ok: false; message: string };

function done(result: { ok: boolean; message?: string }): ProfileActionResult {
  if (result.ok) {
    revalidatePath("/u/[slug]", "page");
    revalidatePath("/account");
    return { ok: true };
  }
  return {
    ok: false,
    message:
      ("message" in result && result.message) ||
      "Something went wrong. Please try again.",
  };
}

export async function followProfileAction(
  profileId: string,
): Promise<ProfileActionResult> {
  return done(await followUser(profileId));
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
