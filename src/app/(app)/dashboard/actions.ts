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

function firstIssue(message: string | undefined): ActionResult {
  return {
    ok: false,
    code: "validation",
    message: message ?? "Please check the form and try again.",
  };
}

export async function createEventAction(
  input: CreateEventInput,
): Promise<ActionResult> {
  // Re-parse server-side — never trust the client (it shares this schema, but
  // the action is the enforcement point).
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues[0]?.message);

  const result = await createEvent(parsed.data);
  if (!result.ok) return result;

  // Refresh the list for when the host navigates back, then jump to the new
  // event. redirect() throws — keep it outside any try/catch.
  revalidatePath("/dashboard");
  redirect(`/dashboard/${result.data.id}`);
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
