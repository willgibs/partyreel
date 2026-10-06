/**
 * Backup-prune confirm endpoint (durability-backups.md, Pillar B) — the DB half of the deletion-aware prune.
 *
 * The media-backup Worker (workers/backup, the weekly `prune` branch) cannot reach the database, so it
 * POSTs the mediaIds of age-eligible backup objects here (batched <=1000). This route is the
 * AUTHORITATIVE oracle for "is this media gone?": it returns which of the sent ids no longer have a
 * `media` row, and it runs the prune circuit-breaker (evaluatePrune) using the real row count. The
 * Worker then HEAD-confirms the primary object is ALSO absent (the dual-gate) before deleting from the
 * last-resort backup.
 *
 * AUTH: the Worker sends `Authorization: Bearer $PRUNE_API_SECRET`; we fail CLOSED (500 if unset, 401
 * on mismatch), timing-safe. SECURITY: this is the gate in front of deletions from the backup of last
 * resort — an unauthenticated caller could fabricate "these are gone" and trigger deletes, so a missing
 * secret must never pass.
 *
 * The per-RUN delete cap (PRUNE_DELETE_CAP_PER_RUN) is enforced WORKER-SIDE across batches; this route
 * is stateless per batch and returns the raw gone set for the Worker to accumulate, clamp, and
 * HEAD-confirm. If ANY batch trips the breaker, the Worker aborts the whole run (deletes nothing).
 *
 * ITS SECOND QUESTION, `{ loneKeys }` → `{ named }` (durability-backups.md, "The restore"): which of these keys the
 * backup alone holds does a live row still NAME, as its original, its preview or its phone copy (`mediaKeysOf`, the
 * one home of "every object a row owns")? The prune asks it before it counts a lone copy, and the restore before it
 * copies one back, so neither ever counts or restores a key its row let go of (a phone copy dropped at an upload's
 * complete for being over its cap): restored, such a key would be an object no row names, which no sweep reclaims
 * (the orphan sweep keys on the row's id). A key outside our layout is never named, and a read that fails answers
 * nothing (500), so the Worker copies nothing on a question it could not get answered.
 */
import { z } from "zod";

import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks, MAX_ROWS } from "@/lib/db/read-all";
import {
  MEDIA_KEY_COLUMNS,
  mediaKeysOf,
  type MediaKeyRow,
} from "@/lib/lifecycle/reclaim";
import { sendOnce } from "@/lib/email/send";
import { pruneBreakerEmail } from "@/lib/email/templates";
import { assertPruneApiEnv, serverEnv } from "@/lib/env";
import { captureError } from "@/lib/observability/sentry";
import { parseMediaIdFromKey } from "@/lib/r2/keys";
import { evaluatePrune } from "@/lib/r2/prune-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// The service-role admin client requires the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bound a single batch: mirrors the Worker's batch size (1,000), pinned to `MAX_ROWS` by construction
// so a batch can never ask for more rows than one read could answer. The existence check below
// chunks it for the URL all the same: a thousand ids in one `.in()` ride a URL of about 39 KB, which
// the live API refuses outright (400, measured 2026-09-23), so a full batch could never be confirmed.
const MAX_BATCH = MAX_ROWS;

const bodySchema = z.object({
  mediaIds: z.array(z.uuid()).min(1).max(MAX_BATCH),
  // Backup objects examined so far this run — informational (alert + logs), not a breaker input.
  objectsScanned: z.number().int().nonnegative(),
  // "dryrun" | "live" — informational, surfaced in the breaker alert.
  mode: z.string().min(1).max(20),
});

// The second question (the header): a batch of lone keys, each at most R2's 1,024-byte key length.
const namedSchema = z.object({
  loneKeys: z.array(z.string().min(1).max(1024)).min(1).max(MAX_BATCH),
});

/**
 * Which of these keys a live row still names. A key that is not exactly our layout names no row; the rows are read
 * by the ids the keys carry, in `IN_CHUNK`-id chunks, and ANY failed chunk fails the whole answer, so a key whose row
 * was never read is never answered as named or as not.
 */
async function answerNamed(
  admin: ReturnType<typeof createAdminClient>,
  keys: string[],
): Promise<Response> {
  const ids = new Set<string>();
  for (const key of keys) {
    const id = parseMediaIdFromKey(key);
    if (id) ids.add(id);
  }
  let rows: MediaKeyRow[] = [];
  if (ids.size > 0) {
    try {
      rows = await inChunks(
        "prune confirm named",
        [...ids],
        async (chunk) =>
          (await mustQuery(
            admin.from("media").select(MEDIA_KEY_COLUMNS).in("id", chunk),
            "prune confirm named",
          )) ?? [],
      );
    } catch (e) {
      captureError("cron", e, { job: "backup_restore", phase: "named" });
      return new Response("Named query failed", { status: 500 });
    }
  }
  const owned = new Set(mediaKeysOf(rows));
  return Response.json({
    named: keys.filter((key) => parseMediaIdFromKey(key) && owned.has(key)),
  });
}

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = assertPruneApiEnv().PRUNE_API_SECRET;
  } catch {
    // Fail closed — better a broken prune than an unauthenticated confirm of backup deletions.
    return new Response("Prune API not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const admin = createAdminClient();

  if (raw && typeof raw === "object" && "loneKeys" in raw) {
    const named = namedSchema.safeParse(raw);
    if (!named.success) return new Response("Bad request", { status: 400 });
    return answerNamed(admin, named.data.loneKeys);
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Which of the sent ids STILL have a media row? Anything not returned is gone (the DB half of the
  // dual-gate). Indexed PK lookups in `IN_CHUNK`-id chunks (`inChunks`). ★ FAIL CLOSED: an id this
  // check never asked about would read as GONE and its backup copy as prunable, so ANY failed chunk
  // fails the whole confirm (inChunks throws on the first), never a partial answer.
  let existing: { id: string }[];
  try {
    existing = await inChunks(
      "prune confirm select",
      body.mediaIds,
      async (chunk) =>
        (await mustQuery(
          admin.from("media").select("id").in("id", chunk),
          "prune confirm select",
        )) ?? [],
    );
  } catch (e) {
    captureError("cron", e, { job: "backup_prune" });
    return new Response("Confirm query failed", { status: 500 });
  }
  const existingIds = new Set(existing.map((r) => r.id));
  const goneIds = body.mediaIds.filter((id) => !existingIds.has(id));

  // Authoritative row count for the breaker (mirrors the orphan sweep's `media_table_empty` guard).
  const { count: mediaCount, error: countErr } = await admin
    .from("media")
    .select("id", { count: "exact", head: true });
  if (countErr) {
    captureError(
      "cron",
      new Error(`prune confirm count: ${countErr.message}`),
      { job: "backup_prune" },
    );
    return new Response("Count query failed", { status: 500 });
  }

  const { trip, reason } = evaluatePrune({
    mediaCount: mediaCount ?? 0,
    candidateCount: goneIds.length,
  });

  if (trip) {
    captureError(
      "cron",
      new Error(`backup prune circuit-breaker tripped: ${reason}`),
      {
        job: "backup_prune",
        reason,
        media_count: mediaCount ?? 0,
        prune_candidates: goneIds.length,
        objects_scanned: body.objectsScanned,
        mode: body.mode,
      },
    );
    // Deduped per (reason, day) so a stuck breaker pages once a day, not every batch/run. A failure to
    // SEND the alert must never become a delete, so swallow it — the Sentry capture above is the primary
    // signal, and we still return trip:true so the Worker deletes nothing.
    try {
      const { subject, html, text } = pruneBreakerEmail({
        reason: reason ?? "unknown",
        candidates: goneIds.length,
        mediaCount: mediaCount ?? 0,
        objectsScanned: body.objectsScanned,
        mode: body.mode,
      });
      await sendOnce({
        kind: "prune_breaker",
        dedupeKey: `${reason}:${new Date().toISOString().slice(0, 10)}`,
        to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
        subject,
        html,
        text,
      });
    } catch (e) {
      captureError("cron", e, { job: "backup_prune", phase: "breaker_alert" });
    }

    return Response.json({ trip: true, reason });
  }

  // No trip: return the raw gone set. The Worker accumulates across batches, clamps to the per-run cap
  // (PRUNE_DELETE_CAP_PER_RUN), HEAD-confirms the primary object is also gone, then deletes (live mode).
  return Response.json({ trip: false, goneIds, mediaCount: mediaCount ?? 0 });
}
