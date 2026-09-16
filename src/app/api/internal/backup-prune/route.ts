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
 */
import { z } from "zod";

import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { sendOnce } from "@/lib/email/send";
import { pruneBreakerEmail } from "@/lib/email/templates";
import { assertPruneApiEnv, serverEnv } from "@/lib/env";
import { captureError } from "@/lib/observability/sentry";
import { evaluatePrune } from "@/lib/r2/prune-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// The service-role admin client requires the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bound a single batch — mirrors the Worker's batch size and keeps the `id = any($1)` arg sane.
const MAX_BATCH = 1000;

const bodySchema = z.object({
  mediaIds: z.array(z.uuid()).min(1).max(MAX_BATCH),
  // Backup objects examined so far this run — informational (alert + logs), not a breaker input.
  objectsScanned: z.number().int().nonnegative(),
  // "dryrun" | "live" — informational, surfaced in the breaker alert.
  mode: z.string().min(1).max(20),
});

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

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const admin = createAdminClient();

  // Which of the sent ids STILL have a media row? Anything not returned is gone (the DB half of the
  // dual-gate). Indexed PK lookup — cheap even at the max batch size.
  const { data: existing, error: existErr } = await admin
    .from("media")
    .select("id")
    .in("id", body.mediaIds);
  if (existErr) {
    captureError(
      "cron",
      new Error(`prune confirm select: ${existErr.message}`),
      { job: "backup_prune" },
    );
    return new Response("Confirm query failed", { status: 500 });
  }
  const existingIds = new Set((existing ?? []).map((r) => r.id));
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
      const { subject, html } = pruneBreakerEmail({
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
