"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEvent,
  softDeleteEvent,
  updateEvent,
} from "@/lib/db/mutations/events";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validation/event";

type ActionErrorCode =
  | "validation"
  | "limit_reached"
  | "unauthorized"
  | "unknown";

// What the client form receives. Success that navigates (create/delete) never
// returns — redirect() throws NEXT_REDIRECT. updateEventAction stays on the page
// and resolves { ok: true } so the form can toast "Saved".
export type ActionResult =
  | { ok: true }
  | { ok: false; code: ActionErrorCode; message: string };

// The created event's host-facing essentials, returned to the create wizard so
// its share step can build the real (scannable) QR + album URL. These tokens are
// already shown to the host on the event page — safe to hand back here.
export type CreatedEvent = {
  id: string;
  name: string;
  qr_token: string;
  share_token: string;
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
// event (no redirect) so the wizard's share step can render the real QR + album
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
      share_token: e.share_token,
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

  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const result = await softDeleteEvent(id);
  if (!result.ok) return result;

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
