"use server";

import { revalidatePath } from "next/cache";


import {
  clearProfileSlug,
  hideEventFromProfile,
  setProfileBio,
  setProfileSlug,
  unblockUser,
  unfollowUser,
  unhideEventFromProfile,
} from "@/lib/db/mutations/social";
import { isSocialSchemaMissing } from "@/lib/db/queries/social";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bioSchema, profileSlugSchema } from "@/lib/validation/profile";
import { containsProfanity } from "@/lib/validation/profanity";

// The /account social surface's actions (profiles + social slice, profiles-social.md).
// Same shape as account/actions.ts' ActionResult, kept local so the two files
// stay independently readable.
export type SocialActionResult = { ok: true } | { ok: false; message: string };

function fromMutation(result: {
  ok: boolean;
  message?: string;
}): SocialActionResult {
  if (result.ok) return { ok: true };
  return {
    ok: false,
    message:
      ("message" in result && result.message) ||
      "Something went wrong. Please try again.",
  };
}

export async function setProfileSlugAction(
  slug: string,
): Promise<SocialActionResult> {
  const result = await setProfileSlug(slug);
  if (result.ok) revalidatePath("/account");
  return fromMutation(result);
}

/**
 * Save (or clear) the public bio — the one line on /u/[slug].
 *
 * Reads exactly like updateDisplayNameAction, and for the same reasons: parse
 * first (bioSchema collapses the line, caps it and refuses links), then the
 * profanity pass SERVER-SIDE so the obscenity matcher never ships to a browser,
 * then the service-role write. The public page is revalidated by route pattern
 * (the slug isn't in scope here) because a stale bio is a moderation problem,
 * not a caching nicety.
 */
export async function setProfileBioAction(
  rawBio: string,
): Promise<SocialActionResult> {
  const parsed = bioSchema.safeParse(rawBio);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your bio.",
    };
  }
  if (parsed.data && containsProfanity(parsed.data)) {
    return { ok: false, message: "Please choose different wording." };
  }

  const result = await setProfileBio(parsed.data);
  if (result.ok) {
    revalidatePath("/account");
    revalidatePath("/u/[slug]", "page");
  }
  return fromMutation(result);
}

export async function clearProfileSlugAction(): Promise<SocialActionResult> {
  const result = await clearProfileSlug();
  if (result.ok) revalidatePath("/account");
  return fromMutation(result);
}

/**
 * The debounced live availability check behind the handle input (the
 * EventSlugControl pattern; there is no anon RPC for profile slugs, so this is
 * a signed-in server action instead). Availability is the SAME fact a save
 * attempt reveals (23505 = taken), so this leaks nothing extra; requiring
 * getUser() keeps it off the anonymous enumeration surface. Admin read because
 * profiles RLS is own-row. Transient failure reports available=true so a blip
 * never blocks typing (setProfileSlug stays authoritative on save).
 */
export async function checkProfileSlugAction(
  rawSlug: string,
): Promise<{ available: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { available: false };

  const parsed = profileSlugSchema.safeParse(rawSlug);
  if (!parsed.success) return { available: false };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("slug", parsed.data)
    .neq("id", user.id)
    .limit(1);
  if (error) {
    // Pre-apply (no slug column) or a transient blip: don't block the input.
    return { available: !isSocialSchemaMissing(error) };
  }
  return { available: (data ?? []).length === 0 };
}

// Both visibility toggles MUST revalidate, like every sibling action in this
// file. Without it the server tree kept serving the pre-toggle value, so the
// switch visibly snapped back moments after a save that had actually
// succeeded, which reads as "my privacy setting didn't take". The public
// profile is revalidated by route pattern (the slug isn't in scope here) since
// hiding an event is a privacy action and a stale public page is the real harm.
export async function hideEventFromProfileAction(
  eventId: string,
): Promise<SocialActionResult> {
  const result = await hideEventFromProfile(eventId);
  if (result.ok) {
    revalidatePath("/account");
    revalidatePath("/u/[slug]", "page");
  }
  return fromMutation(result);
}

export async function unhideEventFromProfileAction(
  eventId: string,
): Promise<SocialActionResult> {
  const result = await unhideEventFromProfile(eventId);
  if (result.ok) {
    revalidatePath("/account");
    revalidatePath("/u/[slug]", "page");
  }
  return fromMutation(result);
}

export async function unfollowAction(
  profileId: string,
): Promise<SocialActionResult> {
  const result = await unfollowUser(profileId);
  if (result.ok) revalidatePath("/account");
  return fromMutation(result);
}

export async function unblockAction(
  profileId: string,
): Promise<SocialActionResult> {
  const result = await unblockUser(profileId);
  if (result.ok) revalidatePath("/account");
  return fromMutation(result);
}
