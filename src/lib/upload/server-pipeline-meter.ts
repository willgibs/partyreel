/**
 * THE PRESIGN'S METER (upload-meter, migration 20261003210500): the one call that counts an upload against its host's
 * month, made by the pipeline engine after every gate of the route and before any URL is minted
 * (`server-pipeline.ts`). `meter_upload` counts the DECLARED bytes (the presigned PUT binds its Content-Length to
 * them, so declared is what lands) and the item, under the host's profiles lock, or refuses: past the hour's uploads
 * (the breaker), past the month's allowance, or past the storage the file must fit. `create_media*` no longer count
 * anything, so this is the meter's only writer for an upload, and a file counts once.
 *
 * ★ IT FAILS CLOSED. The limiters fail open because a capability stands behind each; nothing stands behind this one
 * (the complete counts nothing now), so a meter that cannot answer refuses the presign, and the failure is reported
 * every time it happens. It is loud by construction: the uploader sees the refusal.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MediaKind } from "@/lib/media/limits";
import { captureError } from "@/lib/observability/sentry";
import type { createAdminClient } from "@/lib/supabase/admin";

/** Why the meter refused an upload it was able to judge. Each route says it in its own words (`meterRefusal`). */
export type MeterRefusal =
  /** The account's uploads this clock hour reached the breaker; `retryAfterSec` runs to the hour's end. */
  | { reason: "hourly"; retryAfterSec: number }
  /** This file's declared bytes would take the month past its allowance. */
  | { reason: "monthly" }
  /** This file would not fit the storage cap and its 10% write headroom. */
  | { reason: "storage" }
  /** The event was deleted between the route's gates and the count. */
  | { reason: "event_gone" };

export type MeterOutcome =
  | { ok: true }
  | ({ ok: false } & MeterRefusal)
  /** The meter could not answer (an error, an answer it does not know): refused, never let through uncounted. */
  | { ok: false; reason: "unavailable" };

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `meter_upload` arrives with migration 20261003210500, so the call that
 * names it goes through this untyped client (drop the cast then).
 */
function untyped(admin: ReturnType<typeof createAdminClient>): SupabaseClient {
  return admin as unknown as SupabaseClient;
}

/** An hour is the breaker's whole window, so a retry hint past it (or under a second) is not one the meter gave. */
const HOUR_SECONDS = 3600;

/**
 * Read `meter_upload`'s answer. Pure, so the refusal ladder is tested without a database. Anything it does not know
 * (a missing reason, a new one, a malformed hint) reads `unavailable`: the presign refuses rather than guessing.
 */
export function parseMeterAnswer(data: unknown): MeterOutcome {
  if (typeof data !== "object" || data === null) {
    return { ok: false, reason: "unavailable" };
  }
  const answer = data as {
    ok?: unknown;
    reason?: unknown;
    retry_after_sec?: unknown;
  };
  if (answer.ok === true) return { ok: true };
  if (answer.ok !== false) return { ok: false, reason: "unavailable" };
  switch (answer.reason) {
    case "monthly":
    case "storage":
    case "event_gone":
      return { ok: false, reason: answer.reason };
    case "hourly": {
      const secs = Number(answer.retry_after_sec);
      return {
        ok: false,
        reason: "hourly",
        retryAfterSec:
          Number.isFinite(secs) && secs >= 1 && secs <= HOUR_SECONDS
            ? Math.ceil(secs)
            : HOUR_SECONDS,
      };
    }
    default:
      return { ok: false, reason: "unavailable" };
  }
}

/**
 * Count one upload at its presign, or say why not. `eventId` is the event the route's own gates resolved (the guest's
 * from her ticket, the host's from her ownership), never a body field; `bytes` the declared size the PUT will bind.
 */
export async function meterUpload(args: {
  eventId: string;
  kind: MediaKind;
  bytes: number;
}): Promise<MeterOutcome> {
  const { eventId, kind, bytes } = args;
  try {
    // Loaded here, never at the engine's import: the complete shares the engine and never meters, so its routes
    // never load the service-role client for it.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data, error } = await untyped(createAdminClient()).rpc(
      "meter_upload",
      { p_event_id: eventId, p_type: kind, p_bytes: bytes },
    );
    if (error) throw new Error(`meter_upload: ${error.code} ${error.message}`);
    const outcome = parseMeterAnswer(data);
    if (!outcome.ok && outcome.reason === "unavailable") {
      throw new Error(`meter_upload: an answer it does not know`);
    }
    return outcome;
  } catch (e) {
    captureError("upload", e, { seam: "meter_upload", eventId, kind });
    return { ok: false, reason: "unavailable" };
  }
}
