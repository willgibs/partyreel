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
      code:
        | "limit_reached"
        | "unauthorized"
        | "unknown"
        | "insufficient_space"
        | "event_limit"
        | "event_deleted";
      message: string;
    };

// Postgres check_violation SQLSTATE. The `enforce_event_limit` before-insert
// trigger raises it when the host is already at their tier's maxEvents. Match
// the CODE, not the message — messages drift, the code is stable.
const CHECK_VIOLATION = "23514";

// Postgres unique_violation SQLSTATE. set_event_slug pre-checks availability with a
// friendly message, but a same-instant race can still trip the partial unique index —
// treat it as "taken" too (don't only handle 23514).
const UNIQUE_VIOLATION = "23505";

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

  // Tier gate (defense-in-depth). require_email is paid-only. The create wizard doesn't expose
  // it and the enforce_event_pro_gates DB trigger is the hard backstop, but if a require_email
  // ever reaches createEvent on Free, return a friendly message instead of a raw trigger error.
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
          "Requiring an email is available on paid plans. Upgrade to enable it.",
      };
    }
  }

  // NEVER set qr_token: the DB default generates the unguessable capability token.
  // Empty strings normalize to null for the nullable columns.
  const insert: TablesInsert<"events"> = {
    host_id: user.id,
    name: values.name,
    description: values.description || null,
    event_date: values.event_date || null,
    // A brand-new event can't be password-protected (no hash exists yet; the password
    // is set later via set_event_password). Clamp defensively — the wizard sends 'open'.
    visibility: values.visibility === "password" ? "open" : values.visibility,
    accepting_uploads: values.accepting_uploads,
    require_email: values.require_email,
    moderation_mode: values.moderation_mode,
    qr_style: values.qr_style,
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
          "Requiring an email is available on paid plans. Upgrade to enable it.",
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
  // open/private patch freely; 'password' is reachable ONLY when a hash already
  // exists (set_event_password is the sole creator). This allows editing an existing
  // password event (which resubmits visibility='password' unchanged) and re-activating
  // a dormant password, while blocking a bare open->password transition here. Reading
  // the hash is server-side only (never returned to the client).
  if (values.visibility !== undefined) {
    if (values.visibility === "password") {
      const { data: existing } = await supabase
        .from("events")
        .select("event_password_hash")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!existing?.event_password_hash) {
        return {
          ok: false,
          code: "unknown",
          message: "Set a password to protect this album.",
        };
      }
    }
    patch.visibility = values.visibility;
  }
  if (values.accepting_uploads !== undefined)
    patch.accepting_uploads = values.accepting_uploads;
  if (values.require_email !== undefined)
    patch.require_email = values.require_email;
  if (values.moderation_mode !== undefined)
    patch.moderation_mode = values.moderation_mode;
  if (values.qr_style !== undefined) patch.qr_style = values.qr_style;
  // Host per-upload cap (guests only). A direct granted-column write — the column grant
  // plus the events_max_upload_bytes_range CHECK are the DB boundary. null clears the cap
  // (back to the universal 10 GB). No tier gate: it's available to every plan.
  if (values.max_upload_bytes !== undefined)
    patch.max_upload_bytes = values.max_upload_bytes;

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

  // Soft delete — stamp deleted_at to free the event slot immediately (every read filters
  // deleted_at IS NULL). purge_at (the 30-day hard-purge deadline) is DERIVED by the
  // set_event_purge_at BEFORE trigger from deleted_at, so it is NOT written here and is NOT in
  // the host's column grant (un-spoofable, single-sourced — mirrors media.purge_at). The row +
  // its R2 objects persist until the purge cron hard-deletes them after purge_at, giving the
  // host a recoverable tail (PRD "Data retention & lifecycle"). There is deliberately NO "end
  // event" path that keeps media accessible without freeing the slot (anti-abuse — see tiers.ts).
  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
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

// Password set/change + clear go through their own SECURITY DEFINER RPCs (NOT the
// updateEvent patch) so the raw password never rides the general write and the hash
// column stays revoked from the host's direct UPDATE grant.

export async function setEventPassword(
  eventId: string,
  password: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // The RPC verifies ownership + non-free tier + min length, bcrypt-hashes, and flips
  // visibility='password' atomically. It is the ONLY writer of event_password_hash.
  const { error } = await supabase.rpc("set_event_password", {
    p_event_id: eventId,
    p_password: password,
  });
  if (error) {
    // check_violation (23514) = Free tier / too short — the RPC's message is friendly.
    if (error.code === CHECK_VIOLATION) {
      return { ok: false, code: "limit_reached", message: error.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't set the password. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}

export async function clearEventPassword(
  eventId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // Clears the hash and reverts visibility to 'open' ONLY when it was 'password' (a
  // private event stays private — never silently exposed).
  const { error } = await supabase.rpc("clear_event_password", {
    p_event_id: eventId,
  });
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove the password. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}

// Custom slug set/change + clear go through their own SECURITY DEFINER RPCs (NOT the
// updateEvent patch) so tier + format + case-insensitive uniqueness are enforced
// atomically and custom_slug stays revoked from the host's direct UPDATE grant. The slug
// is an ALIAS to the one /e/[token] link (ADR-0010 + ADR-0012), not a second capability.

export async function setEventSlug(
  eventId: string,
  slug: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // The RPC verifies ownership + non-free tier + format + uniqueness, then writes the
  // normalized (lowercased) slug. It is one of the only two writers of custom_slug.
  const { error } = await supabase.rpc("set_event_slug", {
    p_event_id: eventId,
    p_slug: slug,
  });
  if (error) {
    // check_violation (23514) = Free tier / bad format / already taken — the RPC's
    // message is friendly. unique_violation (23505) = a race past the pre-check.
    if (error.code === CHECK_VIOLATION) {
      return { ok: false, code: "limit_reached", message: error.message };
    }
    if (error.code === UNIQUE_VIOLATION) {
      return {
        ok: false,
        code: "limit_reached",
        message: "That custom link is already taken.",
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't set the custom link. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}

export async function clearEventSlug(
  eventId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  // Frees the slug (sets null) so another event can claim it. No tier check — a
  // downgraded host can still remove a dormant slug (mirrors clear_event_password).
  const { error } = await supabase.rpc("clear_event_slug", {
    p_event_id: eventId,
  });
  if (error) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove the custom link. Please try again.",
    };
  }
  return { ok: true, data: { id: eventId } };
}
