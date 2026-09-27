"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setProfileSlugAction } from "@/app/(app)/account/social-actions";
import { seedFor } from "@/lib/avatar/seed";
import { applyShownEvents } from "@/lib/db/mutations/social";
import { getMyAttendedEvents, getMyProfileSlug } from "@/lib/db/queries/social";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";
import { profileSlugSchema } from "@/lib/validation/profile";

import { PAGE_INVITE_COOKIE, PAGE_INVITE_COOKIE_MAX_AGE } from "./invite";

/**
 * The page setup's two Server Functions (`identity-profile` r1). Each is a public endpoint, so each
 * re-checks `getUser()` and re-derives every fact it acts on rather than taking one from the client.
 */

/** The events step's one-time choice (`default=off`, Will's note: show all, hide all, or choose). */
export type SetupEventsChoice =
  | { mode: "all" }
  | { mode: "none" }
  | { mode: "chosen"; eventIds: string[] };

export type FinishSetupResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      step: "handle" | "events";
      message: string;
      /** The handle was claimed by someone else between screen one and Finish. */
      taken?: true;
    }
  /** A page exists already (a second tab finished first): its choices live in Account. */
  | { ok: false; step: "done"; message: string };

const finishSchema = z.object({
  slug: z.string().max(100),
  events: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("all") }),
    z.object({ mode: z.literal("none") }),
    z.object({
      mode: z.literal("chosen"),
      eventIds: z.array(z.uuid()).max(10_000),
    }),
  ]),
});

/**
 * FINISH: her choices first, the handle last.
 *
 * ★ THE ORDER IS THE PRIVACY. Claiming the handle is what makes the page exist (profiles-social.md:
 * public by existence), so it is the last write: until it lands there is no page for a choice to
 * appear on, and a failure anywhere before it leaves nothing public. A handle refused here (taken
 * between screen one and Finish) sends her back to screen one with her choices already saved,
 * which the next Finish re-applies unchanged.
 *
 * ★ THE ONE-TIME CHOICE IS APPLIED TO THE EVENTS SHE HAS THEN, read here, never taken from the
 * client: `all` publishes every event her page could show at this moment, `none` takes every one of
 * them back, and `chosen` is intersected with that same set, so an id she never attended writes
 * nothing. Events she adds photos to later still start hidden. Both writes are the owner-RLS rows
 * `showEventOnProfile` and `hideEventFromProfile` write one at a time (`applyShownEvents`), and the
 * handle goes through the slug control's own action.
 */
export async function finishProfileSetupAction(
  input: unknown,
): Promise<FinishSetupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      step: "handle",
      message: "Please sign in and try again.",
    };
  }

  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      step: "events",
      message: "Something went wrong. Please try again.",
    };
  }
  const { events } = parsed.data;
  // The handle's own rules first (format, reserved words), so an address that could never be
  // claimed writes no choice either.
  const handle = profileSlugSchema.safeParse(parsed.data.slug);
  if (!handle.success) {
    return {
      ok: false,
      step: "handle",
      message:
        handle.error.issues[0]?.message ?? "That handle isn't available.",
    };
  }
  const slug = handle.data;

  // The two reads Finish acts on. A failed one is answered in words (the wizard keeps her choices
  // on screen to try again) and captured, never thrown into the page.
  let current: string | null;
  let attended: Awaited<ReturnType<typeof getMyAttendedEvents>>;
  try {
    [current, attended] = await Promise.all([
      getMyProfileSlug(),
      getMyAttendedEvents(),
    ]);
  } catch (error) {
    captureError("account", error, { seam: "profile_setup_finish" });
    return {
      ok: false,
      step: "events",
      message: "Couldn't finish just now. Please try again.",
    };
  }

  // A page that exists is set up: its handle changes only with the slug control's warning (the old
  // address stops working), never silently from a stale wizard.
  if (current) {
    return {
      ok: false,
      step: "done",
      message: "Your page is already set up.",
    };
  }

  const mine = new Set(attended.map((e) => e.id));
  const target = new Set(
    events.mode === "all"
      ? mine
      : events.mode === "none"
        ? []
        : events.eventIds.filter((id) => mine.has(id)),
  );
  const applied = await applyShownEvents({
    show: attended
      .filter((e) => target.has(e.id) && !e.shownOnProfile)
      .map((e) => e.id),
    hide: attended
      .filter((e) => !target.has(e.id) && e.shownOnProfile)
      .map((e) => e.id),
  });
  if (!applied.ok) {
    return { ok: false, step: "events", message: applied.message };
  }

  const claimed = await setProfileSlugAction(slug);
  if (!claimed.ok) {
    return {
      ok: false,
      step: "handle",
      message: claimed.message,
      ...(claimed.taken ? { taken: true as const } : {}),
    };
  }

  // The page now exists: the dashboard's invitation leaves, the claims toast points at Account, and
  // /u/ renders (by route pattern, since other handles' pages share the route).
  revalidatePath("/dashboard");
  revalidatePath("/u/[slug]", "page");
  return { ok: true, slug };
}

/**
 * "Not now" on the dashboard's invitation, remembered on this device for this account (the cookie
 * holds the account's seed, a one-way hash). httpOnly: only the server reads it. Setting a cookie
 * in a Server Function re-renders the page it was called from, so the card leaves on its own.
 */
export async function dismissPageInviteAction(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const jar = await cookies();
  jar.set(PAGE_INVITE_COOKIE, seedFor(user.id), {
    maxAge: PAGE_INVITE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}
