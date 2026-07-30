"use server";

import { revalidatePath } from "next/cache";

import {
  blockUser,
  followUser,
  unblockUser,
  unfollowUser,
} from "@/lib/db/mutations/social";

// The /u/[slug] follow/block actions. Each revalidates the profile path so the
// server-rendered affordances (follow state, the block-hides-follow rule)
// re-derive on the client's router.refresh(). The mutations own auth + the
// block-silent semantics (see lib/db/mutations/social.ts); these are thin.
export type ProfileActionResult = { ok: true } | { ok: false; message: string };

function done(
  slug: string,
  result: { ok: boolean; message?: string },
): ProfileActionResult {
  if (result.ok) {
    revalidatePath(`/u/${slug}`);
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
  slug: string,
): Promise<ProfileActionResult> {
  return done(slug, await followUser(profileId));
}

export async function unfollowProfileAction(
  profileId: string,
  slug: string,
): Promise<ProfileActionResult> {
  return done(slug, await unfollowUser(profileId));
}

export async function blockProfileAction(
  profileId: string,
  slug: string,
): Promise<ProfileActionResult> {
  return done(slug, await blockUser(profileId));
}

export async function unblockProfileAction(
  profileId: string,
  slug: string,
): Promise<ProfileActionResult> {
  return done(slug, await unblockUser(profileId));
}
