"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  clearProfileSlug,
  hideEventFromProfile,
  setProfileSlug,
  unblockUser,
  unfollowUser,
  unhideEventFromProfile,
} from "@/lib/db/mutations/social";
import { isSocialSchemaMissing } from "@/lib/db/queries/social";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { profileSlugSchema } from "@/lib/validation/profile";

// The /account social surface's actions (profiles + social slice, ADR-0019).
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

  // The same pre-regen typing seam as lib/db/queries/social.ts (types.ts has no
  // slug column until the orchestrator regenerates it post-apply).
  const admin = createAdminClient() as unknown as SupabaseClient;
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
