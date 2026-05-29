/**
 * Event writes for the authenticated host (create / update / soft-delete), via
 * the RLS-scoped server client. `events_host_all` enforces ownership; we also
 * re-check `getUser()` in every function (RLS is the boundary, the proxy is not).
 *
 * Plain module — these are imported and awaited by the `'use server'` actions,
 * which own redirect/revalidate. Each function returns a discriminated
 * `MutationResult` so the action can map failures to friendly toasts and only
 * redirect on success.
 */
import "server-only";

import { isSettingLocked, toBillingTier } from "@/lib/constants/tiers";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateEventValues,
  UpdateEventValues,
} from "@/lib/validation/event";

export type EventRow = Tables<"events">;

export type MutationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "limit_reached" | "unauthorized" | "unknown";
      message: string;
    };

// Postgres check_violation SQLSTATE. The `enforce_event_limit` before-insert
// trigger raises it when the host is already at their tier's maxEvents. Match
// the CODE, not the message — messages drift, the code is stable.
const CHECK_VIOLATION = "23514";

const UNAUTHORIZED = {
  ok: false as const,
  code: "unauthorized" as const,
  message: "Please sign in and try again.",
};

export async function createEvent(
  values: CreateEventValues,
): Promise<MutationResult<EventRow>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // NEVER set qr_token/share_token: the DB defaults generate the unguessable
  // capability tokens. Empty strings normalize to null for the nullable columns.
  const insert: TablesInsert<"events"> = {
    host_id: user.id,
    name: values.name,
    description: values.description || null,
    event_date: values.event_date || null,
    is_public: values.is_public,
    accepting_uploads: values.accepting_uploads,
    require_display_name: values.require_display_name,
    require_email: values.require_email,
    moderation_mode: values.moderation_mode,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    if (error.code === CHECK_VIOLATION) {
      return {
        ok: false,
        code: "limit_reached",
        message: "You've reached the event limit for your plan.",
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't create the event. Please try again.",
    };
  }
  return { ok: true, data };
}

export async function updateEvent(
  id: string,
  values: UpdateEventValues,
): Promise<MutationResult<EventRow>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // Tier gate (defense-in-depth — the settings UI also disables this toggle on
  // Free). require_email is paid-only; never trust the client to honor the lock.
  if (values.require_email === true) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();
    if (
      isSettingLocked("require_email", toBillingTier(profile?.tier ?? "free"))
    ) {
      return {
        ok: false,
        code: "limit_reached",
        message:
          "Requiring an email is available on paid plans — upgrade to enable it.",
      };
    }
  }

  // Only patch keys that were provided (updateEventSchema is partial). Nullable
  // text columns take null when cleared.
  const patch: TablesUpdate<"events"> = {};
  if (values.name !== undefined) patch.name = values.name;
  if (values.description !== undefined)
    patch.description = values.description || null;
  if (values.event_date !== undefined)
    patch.event_date = values.event_date || null;
  if (values.is_public !== undefined) patch.is_public = values.is_public;
  if (values.accepting_uploads !== undefined)
    patch.accepting_uploads = values.accepting_uploads;
  if (values.require_display_name !== undefined)
    patch.require_display_name = values.require_display_name;
  if (values.require_email !== undefined)
    patch.require_email = values.require_email;
  if (values.moderation_mode !== undefined)
    patch.moderation_mode = values.moderation_mode;

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save your changes. Please try again.",
    };
  }
  return { ok: true, data };
}

export async function softDeleteEvent(
  id: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // Soft delete — stamp deleted_at AND schedule the hard purge 60 days out. Freeing
  // the slot is immediate (every read filters deleted_at IS NULL); the row + its R2
  // objects persist until the purge cron hard-deletes them after purge_at, giving the
  // host a recoverable tail (PRD "Data retention & lifecycle"). There is deliberately
  // NO "end event" path that keeps media accessible without freeing the slot
  // (anti-abuse — see tiers.ts).
  const now = new Date();
  const purgeAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from("events")
    .update({
      deleted_at: now.toISOString(),
      purge_at: purgeAt.toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't delete the event. Please try again.",
    };
  }
  return { ok: true, data: { id } };
}
