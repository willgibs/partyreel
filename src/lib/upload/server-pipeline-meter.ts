/**
 * THE PRESIGN'S METER (upload-meter, migration 20261003210500): the one call the pipeline engine makes after every gate
 * of the route and before any URL is minted (`server-pipeline.ts`). `meter_upload` refuses, before a byte moves, a file
 * the hour's breaker (an account's uploads a clock hour), the month (its allowance, read as the complete reads it) or
 * the room (the storage cap and its 10%) cannot take, and tallies the hour for one it admits. It counts nothing of the
 * month: the complete does, on the bytes R2 holds, once (`create_media*`), since a single PUT only lands in `events/`
 * through the complete's copy out of staging.
 *
 * ★ IT FAILS OPEN, as the limiters do (the Advisor's Q19): the complete's count and caps stand behind it, so a meter
 * that cannot answer (an outage, a database without its migration) lets the presign through and is reported every
 * time, never silently.
 */
import "server-only";

import type { MediaKind } from "@/lib/media/limits";
import { captureWarning } from "@/lib/observability/sentry";

/** Why the meter refused an upload it was able to judge. Each route says it in its own words (`meterRefusal`). */
export type MeterRefusal =
  /** The account's uploads this clock hour reached the breaker; `retryAfterSec` runs to the hour's end. */
  | { reason: "hourly"; retryAfterSec: number }
  /** This file's declared bytes would take the month past its allowance (read as the complete reads it). */
  | { reason: "monthly" }
  /**
   * This file would not fit the storage cap and its 10% write headroom. ★ With its numbers (trash-in-storage,
   * 20261003220000), each null when the database does not send it: what the file needs freed, what Deleted holds, and
   * whether Deleted could make the room (her setting), for the owner's own words; a guest's never read them.
   */
  | {
      reason: "storage";
      neededBytes: number | null;
      deletedBytes: number | null;
      makesRoom: boolean | null;
    }
  /** The event was deleted between the route's gates and the meter. */
  | { reason: "event_gone" };

export type MeterOutcome =
  | { ok: true }
  | ({ ok: false } & MeterRefusal)
  /** The meter could not answer (an error, an answer it does not know): the presign goes on (it fails OPEN). */
  | { ok: false; reason: "unavailable" };

/** An hour is the breaker's whole window, so a retry hint past it (or under a second) is not one the meter gave. */
const HOUR_SECONDS = 3600;

/** A byte count the meter sent, or null for anything that is not one (a bigint may arrive as text). */
function bytesOrNull(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Read `meter_upload`'s answer. Pure, so the refusal ladder is tested without a database. Anything it does not know
 * (a missing reason, a new one, a malformed hint) reads `unavailable`, which refuses nothing and is reported.
 */
export function parseMeterAnswer(data: unknown): MeterOutcome {
  if (typeof data !== "object" || data === null) {
    return { ok: false, reason: "unavailable" };
  }
  const answer = data as {
    ok?: unknown;
    reason?: unknown;
    retry_after_sec?: unknown;
    needed_bytes?: unknown;
    deleted_bytes?: unknown;
    makes_room?: unknown;
  };
  if (answer.ok === true) return { ok: true };
  if (answer.ok !== false) return { ok: false, reason: "unavailable" };
  switch (answer.reason) {
    case "monthly":
    case "event_gone":
      return { ok: false, reason: answer.reason };
    case "storage":
      return {
        ok: false,
        reason: "storage",
        neededBytes: bytesOrNull(answer.needed_bytes),
        deletedBytes: bytesOrNull(answer.deleted_bytes),
        makesRoom:
          typeof answer.makes_room === "boolean" ? answer.makes_room : null,
      };
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
 * Admit one upload at its presign (its hour tallied), or say why not. `eventId` is the event the route's own gates
 * resolved (the guest's from her ticket, the host's from her ownership), never a body field; `bytes` the declared
 * size the PUT will bind.
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
    const { data, error } = await createAdminClient().rpc("meter_upload", {
      p_event_id: eventId,
      p_type: kind,
      p_bytes: bytes,
    });
    if (error) throw new Error(`meter_upload: ${error.code} ${error.message}`);
    const outcome = parseMeterAnswer(data);
    if (!outcome.ok && outcome.reason === "unavailable") {
      throw new Error(`meter_upload: an answer it does not know`);
    }
    return outcome;
  } catch (e) {
    captureWarning("upload", "meter_unavailable_fail_open", {
      eventId,
      kind,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, reason: "unavailable" };
  }
}
