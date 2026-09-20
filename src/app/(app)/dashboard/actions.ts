"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  EVENTS_VIEW_COOKIE,
  EVENTS_VIEW_COOKIE_MAX_AGE,
  resolveEventsView,
} from "@/lib/dashboard/events-view";
import {
  clearEventPassword,
  clearEventSlug,
  createEvent,
  setEventPassword,
  setEventSlug,
  softDeleteEvent,
  updateEvent,
} from "@/lib/db/mutations/events";
import { approveAllPending } from "@/lib/db/mutations/media";
import { removeMyUpload } from "@/lib/db/mutations/my-uploads";
import { setEventSocialSettings } from "@/lib/db/mutations/social";
import { captureError } from "@/lib/observability/sentry";
import {
  createEventSchema,
  eventPasswordSchema,
  eventSlugSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validation/event";

type ActionErrorCode =
  | "validation"
  | "limit_reached"
  | "unauthorized"
  | "unknown"
  | "insufficient_space"
  | "event_limit"
  | "event_deleted";

// What the client form receives. Success that navigates (create/delete) never
// returns — redirect() throws NEXT_REDIRECT. updateEventAction stays on the page
// and resolves { ok: true } so the form can toast "Saved".
export type ActionResult =
  | { ok: true }
  | { ok: false; code: ActionErrorCode; message: string };

// The created event's host-facing essentials, returned to the create wizard so
// its share step can build the real (scannable) QR + event link. The qr_token is
// already shown to the host on the event page — safe to hand back here.
export type CreatedEvent = {
  id: string;
  name: string;
  qr_token: string;
  qr_style: string;
};

export type CreateEventWizardResult =
  | { ok: true; event: CreatedEvent }
  | { ok: false; code: ActionErrorCode; message: string };

function firstIssue(message: string | undefined): ActionResult {
  return {
    ok: false,
    code: "validation",
    message: message ?? "Please check the form and try again.",
  };
}

// The create wizard (Phase 6 cut #2) is the sole create path: it RETURNS the new
// event (no redirect) so the wizard's share step can render the real QR + event
// link. The wizard owns navigation ("Go to your event").
export async function createEventInWizard(
  input: CreateEventInput,
): Promise<CreateEventWizardResult> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message:
        parsed.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const result = await createEvent(parsed.data);
  if (!result.ok) return result;

  revalidatePath("/dashboard");
  const e = result.data;
  return {
    ok: true,
    event: {
      id: e.id,
      name: e.name,
      qr_token: e.qr_token,
      qr_style: e.qr_style,
    },
  };
}

export async function updateEventAction(
  id: string,
  input: UpdateEventInput,
): Promise<ActionResult> {
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues[0]?.message);

  const result = await updateEvent(id, parsed.data);
  if (!result.ok) return result;

  // Invariant: live mode never holds pending media. When moderation is (or becomes) live, auto-approve
  // any under-review uploads. The settings confirm is the host's CONSENT; this is the server enforcing
  // it - idempotent (a no-op when nothing's pending), so it's safe to run on every live-mode save.
  // approveAllPending re-checks auth (getUser) + is RLS-scoped to the host's own event.
  if (parsed.data.moderation_mode === "live") {
    const approved = await approveAllPending(id);
    if (!approved.ok) return approved;
  }

  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// Password set/change — its own action (NOT the general save) so the raw password
// rides a dedicated path. Setting a password also flips the event to visibility=
// 'password' (atomic in the RPC); the form re-syncs the selector after this resolves.
export async function setEventPasswordAction(
  eventId: string,
  password: string,
): Promise<ActionResult> {
  const parsed = eventPasswordSchema.safeParse({ password });
  if (!parsed.success) return firstIssue(parsed.error.issues[0]?.message);

  const result = await setEventPassword(eventId, parsed.data.password);
  if (!result.ok) return result;

  // Event-detail only: the dashboard card badge derives from the visibility
  // ENUM (updateEventAction's concern), never from the password hash.
  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function clearEventPasswordAction(
  eventId: string,
): Promise<ActionResult> {
  const result = await clearEventPassword(eventId);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

// Custom slug set/change — its own action (NOT the general save). The slug is an
// alias to the one /e/[token] link; the RPC enforces tier + format + uniqueness, and
// changing it FREES the old slug for other events (no old->new redirect; host-app.md).
export async function setEventSlugAction(
  eventId: string,
  slug: string,
): Promise<ActionResult> {
  const parsed = eventSlugSchema.safeParse({ slug });
  if (!parsed.success) return firstIssue(parsed.error.issues[0]?.message);

  const result = await setEventSlug(eventId, parsed.data.slug);
  if (!result.ok) return result;

  // Event-detail only: dashboard cards never render the slug.
  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function clearEventSlugAction(
  eventId: string,
): Promise<ActionResult> {
  const result = await clearEventSlug(eventId);
  if (!result.ok) return result;

  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

// The profiles-social.md event keys (profile display + the named guest list), persisted
// per-toggle from the settings card (instant switches, not the RHF save flow —
// each key is its own deliberate act, like the password/slug commits).
export async function updateEventSocialSettingsAction(
  eventId: string,
  patch: { displayInProfile?: boolean; showGuestList?: boolean },
): Promise<ActionResult> {
  const result = await setEventSocialSettings(eventId, patch);
  if (!result.ok) return result;

  // The event page (its Guests section) + settings both re-derive.
  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const result = await softDeleteEvent(id);
  if (!result.ok) return result;

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Delete-own from the viewer's own uploads gallery. Mirrors removeMediaAction, but goes through the
// cross-event remove_my_upload RPC (the caller may own a guest upload in another host's event, where
// they hold no RLS write). captureError only on 'unknown' (a 'no longer available' refusal is
// expected, not a bug). Area "media" (no "dashboard" Sentry area exists).
//
// ★ IT REVALIDATES TWO PATHS NOW, AND THE SECOND ONE IS THE POINT. The gallery
// MOVED to the profile's owner mode this round (`you=?`, Will 2026-09-20: "Your
// own photos, likes, connections, etc should be on your profile page"), so a
// delete performed there was reconciling a route the user was no longer on: the
// optimistic removal held, then the next real navigation to /u/<handle> brought
// the deleted item back. The gallery keeps its own optimistic drop; this makes
// the server agree with it.
export async function removeMyUploadAction(
  mediaId: string,
): Promise<ActionResult> {
  const result = await removeMyUpload(mediaId);
  if (!result.ok) {
    if (result.code === "unknown") {
      captureError("media", new Error(result.message), {
        action: "remove_my_upload",
        mediaId,
      });
    }
    return result;
  }

  revalidatePath("/dashboard");
  // The handle is not known here and does not need to be: a layout-level
  // revalidate covers every /u/<slug>, and the only one this user can be
  // looking at their own uploads on is their own.
  revalidatePath("/u/[slug]", "page");
  return { ok: true };
}

/**
 * THE EVENTS LIST'S VIEW, PERSISTED (`density=cover`, "let's do both").
 *
 * A Server Action rather than localStorage, because the view must be known
 * BEFORE the first byte: a local preference renders cover cards on the server
 * and swaps to rows after hydration on every load, so the host watches their
 * whole list re-lay-out each time they open the app. Writing a cookie here
 * makes Next re-render the page and its layouts server-side (the documented
 * behaviour of setting a cookie in a Server Function), so the toggle needs no
 * router.refresh() of its own and the next cold load paints the right view.
 *
 * `resolveEventsView` narrows whatever arrives to the two legal values, so a
 * hand-forged call can only ever set "cards" or "rows" — a preference cookie
 * is not a trust boundary, but it is still a value this app will read back.
 */
export async function setEventsViewAction(view: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(EVENTS_VIEW_COOKIE, resolveEventsView(view), {
    maxAge: EVENTS_VIEW_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: false,
  });
}
