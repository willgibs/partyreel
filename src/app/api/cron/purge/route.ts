/**
 * Phase 3 purge sweeper — Vercel Cron (daily, see vercel.json). Reclaims storage
 * by HARD-deleting media that has aged out of its recoverable tail, plus orphaned
 * R2 objects. This is the ONLY path that frees real bytes (R2 + DB rows +
 * profiles.storage_used_bytes); everything upstream is soft state.
 *
 * AUTH: Vercel auto-sends `Authorization: Bearer $CRON_SECRET`. We fail CLOSED —
 * no secret configured, or a mismatch, returns 401 and runs nothing. The compare
 * is timing-safe (sha256 + timingSafeEqual) so it leaks neither value nor length.
 *
 * ORDERING (load-bearing): for each batch we delete R2 OBJECTS FIRST, then the DB
 * rows. WHY: deleting an event row cascades (FK) to its media rows — which would
 * destroy the original_key/preview_key we still need to delete from R2. R2-then-DB
 * also makes a crash recoverable: leftover rows whose objects are gone get retried
 * (R2 delete of an absent key is a no-op success), and leftover objects whose rows
 * are gone get caught by the orphan sweep.
 *
 * Each sweep is independently try/caught so one failure doesn't abort the rest.
 */
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import {
  capWithWriteHeadroom,
  effectiveStorageCap,
  toBillingTier,
} from "@/lib/constants/tiers";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  inactivityRemovedEmail,
  inactivityWarningEmail,
  orphanBreakerEmail,
  overCapGraceStartEmail,
  overCapReducedEmail,
  overCapReminderEmail,
  renewalNudgeEmail,
} from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import { assertCronEnv, serverEnv } from "@/lib/env";
import {
  INACTIVE_DAYS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";
import {
  RECENTLY_DELETED_BUDGET_MULTIPLIER,
  RECENTLY_DELETED_WINDOW_DAYS,
  selectForStandbyEviction,
} from "@/lib/lifecycle/recently-deleted";
import { RENEWAL_NUDGE_DAYS } from "@/lib/lifecycle/renewal";
import { selectForAutoReduce } from "@/lib/media/auto-reduce";
import { partitionEventsByHold } from "@/lib/forensics/legal-hold";
import { captureError } from "@/lib/observability/sentry";
import { deleteR2Objects, listR2Objects } from "@/lib/r2/delete";
import { parseMediaIdFromKey, reelOutputKey } from "@/lib/r2/keys";
import { evaluateOrphanSweep } from "@/lib/r2/orphan-guard";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBytes } from "@/lib/utils";

// node:crypto + the service-role admin client require the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// R2 list/delete + DB deletes can take a while on a large backlog.
export const maxDuration = 60;

// Soft-deleted media + events share ONE recoverable window: RECENTLY_DELETED_WINDOW_DAYS
// (src/lib/lifecycle/recently-deleted.ts). Media: purge_at is trigger-derived (= removed_at +
// window); events: purge_at is stamped on soft-delete, with the window as the legacy fallback for
// rows that predate purge_at. On top of the time window, sweepStandbyBudget caps the TOTAL
// recently-deleted bytes per account (the anti-abuse backstop).
// An orphan candidate must be older than this — well past the 15-min presign TTL —
// so we never race an in-flight upload (presigned, PUT in progress, create_media
// not yet called) and delete a brand-new object.
const ORPHAN_MIN_AGE_HOURS = 24;
// Cap R2 list pages per run so one invocation stays bounded (≤1000 objects/page).
const ORPHAN_PAGE_CAP = 20;
const MEDIA_PREFIX = "events/";

// Over-capacity grace: a lapsed account over its cap gets this long to upgrade/remove
// before auto-reduce; we email a reminder this many days before the deadline.
const OVER_CAP_GRACE_DAYS = 45;
const OVER_CAP_REMINDER_DAYS = 7;
// Candidate floor: storage_used_bytes ≤ the smallest cap (Free 2 GB) can't exceed any
// tier's cap, so only profiles above it (or already in grace) are over-capacity candidates.
const FREE_CAP_BYTES = 2 * 1024 ** 3;

type AdminClient = ReturnType<typeof createAdminClient>;
type MediaRow = {
  id: string;
  original_key: string;
  preview_key: string | null;
};

function keysOf(rows: MediaRow[]): string[] {
  const keys: string[] = [];
  for (const r of rows) {
    keys.push(r.original_key);
    if (r.preview_key) keys.push(r.preview_key);
  }
  return keys;
}

/** Earlier of two ISO timestamps (nulls ignored). The bin "clock" for a removed item in a
 * deleted event is the EARLIER of its removed_at / the event's deleted_at, so a restore that
 * refreshes removed_at can't push it behind the event's older deletion in the eviction queue. */
function minIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

export async function GET(request: Request): Promise<Response> {
  let cronSecret: string;
  try {
    cronSecret = assertCronEnv().CRON_SECRET;
  } catch {
    // Fail closed — better a broken cron than an unauthenticated purge.
    return new Response("Cron not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  // Track media ids handled by earlier sweeps so a later sweep can't double-process.
  const handled = new Set<string>();
  const sweeps: Record<string, unknown> = {};

  // Each sweep is independently guarded so one failure doesn't abort the rest. The catch
  // ALSO reports to Sentry — a failed sweep was previously buried in the 200 response body
  // (Vercel never alerts on it), so a broken sweep meant storage silently wasn't reclaimed.
  const runSweep = async (name: string, fn: () => Promise<unknown>) => {
    try {
      sweeps[name] = await fn();
    } catch (e) {
      captureError("cron", e, { sweep: name });
      sweeps[name] = { error: String(e) };
    }
  };

  await runSweep("expired_events", () =>
    sweepExpiredEvents(admin, now, handled),
  );
  await runSweep("removed_media", () => sweepRemovedMedia(admin, now, handled));
  await runSweep("orphans", () => sweepOrphans(admin, now));
  await runSweep("expired_passes", () => sweepExpiredPasses(admin, now));
  await runSweep("over_capacity", () => sweepOverCapacity(admin, now));
  await runSweep("renewal_nudges", () => sweepRenewalNudges(admin, now));
  await runSweep("inactive_free_events", () =>
    sweepInactiveFreeEvents(admin, now),
  );
  // LAST: after expired_events + removed_media (so `handled` excludes ids they purged) and after
  // over_capacity (whose auto-reduce feeds the bin this run — youngest items, protected oldest-first).
  await runSweep("standby_budget", () =>
    sweepStandbyBudget(admin, now, handled),
  );
  // Prune the unlock rate-limiter log — rows older than its longest window are dead weight.
  await runSweep("unlock_attempts", () => sweepUnlockAttempts(admin, now));
  await runSweep("action_attempts", () => sweepActionAttempts(admin, now));

  return Response.json({ ok: true, ran_at: now.toISOString(), sweeps });
}

/**
 * Sweep 1 — events whose recoverable tail has elapsed. Hard-delete their media (R2
 * + rows + usage), then the event rows (cascades to guests/reels/reports).
 * `coalesce(purge_at, deleted_at + the recovery window)` so legacy soft-deletes (no purge_at)
 * are still reclaimed instead of leaking storage forever.
 */
async function sweepExpiredEvents(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  const nowIso = now.toISOString();
  const legacyCutoffIso = new Date(
    now.getTime() - RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
  ).toISOString();

  const { data: events, error } = await admin
    .from("events")
    .select("id")
    .not("deleted_at", "is", null)
    .or(
      `purge_at.lte.${nowIso},and(purge_at.is.null,deleted_at.lte.${legacyCutoffIso})`,
    );
  if (error) throw new Error(`select events: ${error.message}`);

  const expiredIds = (events ?? []).map((e) => e.id);
  if (expiredIds.length === 0) {
    return {
      events: 0,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    };
  }

  // LEGAL HOLD (ADR-0020): an event containing ANY held media is skipped WHOLE this run.
  // Deleting the event row would FK-CASCADE the held media rows (and their upload_forensics
  // rows) away, and the R2 enumeration below would delete the held objects — the cascade is
  // all-or-nothing, so the safe unit is the event. It stays soft-deleted in the bin and
  // re-enters this sweep once the hold releases. (`.filter` — legal_hold_at isn't in the
  // generated types until the orchestrator regenerates post-apply.)
  const { data: heldMedia, error: holdErr } = await admin
    .from("media")
    .select("event_id")
    .in("event_id", expiredIds)
    .filter("legal_hold_at", "not.is", null);
  if (holdErr) throw new Error(`select held media: ${holdErr.message}`);
  const { purgeable: eventIds, blocked: holdBlocked } = partitionEventsByHold(
    expiredIds,
    heldMedia ?? [],
  );
  if (eventIds.length === 0) {
    return {
      events: 0,
      hold_blocked_events: holdBlocked.length,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    };
  }

  // ★ PAGINATE TO EXHAUSTION (QA #9). PostgREST caps a response at max_rows (1000). An unbounded
  // select here silently returned the FIRST page, and the event-row delete below then FK-CASCADED
  // every remaining media row away — no R2 delete (permanent orphans the sweep can never reclaim,
  // replicated into the WORM backup bucket) and no storage_used_bytes decrement (a drifted meter
  // that shrinks the host's usable cap forever). A >1000-photo wedding album is an ordinary event.
  const rows: MediaRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data: page, error: mErr } = await admin
      .from("media")
      .select("id, original_key, preview_key")
      .in("event_id", eventIds)
      .order("id", { ascending: true }) // stable order: pages can't overlap or skip
      .range(from, from + PAGE - 1);
    if (mErr) throw new Error(`select media: ${mErr.message}`);
    const batch = (page ?? []) as MediaRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  const mediaIds = rows.map((r) => r.id);
  // Also delete each event's rendered highlight-reel .mp4. It's a DERIVED artifact with no media
  // row, so the media-key enumeration above never includes it AND the orphan sweep ignores it
  // (non-media-shaped key) — without this it would leak forever. Deterministic key + R2's
  // delete-absent-is-success means appending it is safe whether or not a reel was ever rendered.
  const r2 = await deleteR2Objects([
    ...keysOf(rows),
    ...eventIds.map(reelOutputKey),
  ]);
  const freed = mediaIds.length ? await purgeRows(admin, mediaIds) : 0;
  mediaIds.forEach((id) => handled.add(id));

  // Now safe to drop the event rows — their media is gone, so the FK cascade has
  // nothing of value left to destroy.
  const { error: delErr } = await admin
    .from("events")
    .delete()
    .in("id", eventIds);
  if (delErr) throw new Error(`delete events: ${delErr.message}`);

  return {
    events: eventIds.length,
    hold_blocked_events: holdBlocked.length,
    media_rows: mediaIds.length,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    freed_bytes: freed,
  };
}

/**
 * Sweep 2 — individually-removed media (status='removed') past its grace window.
 * A host "remove" frees the per-event slot immediately (counts skip 'removed'); the
 * bytes are reclaimed here after the grace, giving an undo tail.
 */
async function sweepRemovedMedia(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  // purge_at is trigger-derived (= removed_at + RECENTLY_DELETED_WINDOW_DAYS); reclaim once it passes.
  // LEGAL HOLD (ADR-0020): held rows are excluded HERE, before the R2-first delete — the SQL guard
  // in purge_media_rows protects only the row; this filter is what protects the OBJECT.
  const { data: media, error } = await admin
    .from("media")
    .select("id, original_key, preview_key")
    .eq("status", "removed")
    .not("purge_at", "is", null)
    .lte("purge_at", now.toISOString())
    .filter("legal_hold_at", "is", null);
  if (error) throw new Error(`select removed media: ${error.message}`);

  const rows = ((media ?? []) as MediaRow[]).filter((r) => !handled.has(r.id));
  if (rows.length === 0) {
    return { media_rows: 0, r2_deleted: 0, r2_errored: 0, freed_bytes: 0 };
  }

  const mediaIds = rows.map((r) => r.id);
  const r2 = await deleteR2Objects(keysOf(rows));
  const freed = await purgeRows(admin, mediaIds);
  mediaIds.forEach((id) => handled.add(id));

  return {
    media_rows: mediaIds.length,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    freed_bytes: freed,
  };
}

/**
 * Sweep 3 — orphaned R2 objects: uploaded bytes with no media row (a presign that
 * raced create_media, or stragglers from a crashed earlier sweep). No counter
 * change — orphans were never counted toward storage_used_bytes. Only deletes
 * objects older than ORPHAN_MIN_AGE_HOURS and only ones we positively recognize
 * (parseMediaIdFromKey); unrecognized keys are left untouched.
 */
async function sweepOrphans(admin: AdminClient, now: Date) {
  const ageCutoff = now.getTime() - ORPHAN_MIN_AGE_HOURS * 3_600_000;
  const orphanKeys: string[] = [];
  let token: string | undefined;
  let pages = 0;
  let objectsScanned = 0; // objects looked at this run — the breaker's fraction denominator

  do {
    const { objects, nextToken } = await listR2Objects({
      prefix: MEDIA_PREFIX,
      continuationToken: token,
    });
    pages += 1;
    objectsScanned += objects.length;

    // Group aged objects by mediaId so original+preview for one item resolve together.
    const keysByMediaId = new Map<string, string[]>();
    for (const o of objects) {
      if (!o.lastModified || o.lastModified.getTime() > ageCutoff) continue;
      const mediaId = parseMediaIdFromKey(o.key);
      if (!mediaId) continue; // not our layout → never delete
      const arr = keysByMediaId.get(mediaId) ?? [];
      arr.push(o.key);
      keysByMediaId.set(mediaId, arr);
    }

    const candidateIds = [...keysByMediaId.keys()];
    if (candidateIds.length > 0) {
      const { data: existing, error } = await admin
        .from("media")
        .select("id")
        .in("id", candidateIds);
      if (error) throw new Error(`select media for orphans: ${error.message}`);
      const existingIds = new Set((existing ?? []).map((r) => r.id));
      for (const [mediaId, keys] of keysByMediaId) {
        if (!existingIds.has(mediaId)) orphanKeys.push(...keys);
      }
    }

    token = nextToken ?? undefined;
  } while (token && pages < ORPHAN_PAGE_CAP);

  // --- Circuit-breaker (ADR-0013, media durability) ---------------------------------------
  // The sweep TRUSTS the DB to label an object an orphan. A lost/unlinked media set (bad
  // migration, snapshot restore, mass row-delete, RLS/query bug) would make ~every object look
  // orphaned, so one run could delete the entire bucket — and there is no backup to undo it.
  // Before the single bulk delete, fail CLOSED if the candidate set looks pathological: delete
  // nothing, alert loudly (Sentry + a deduped operator email), and let a human investigate. The
  // safe failure mode is a storage LEAK, not data loss. NOTE: intentional bulk purges (the
  // pre-launch test-data reset) trip this BY DESIGN — they must run via an explicit force-purge
  // path (an S3-API script / a manual admin route), never this guarded daily cron.
  if (orphanKeys.length > 0) {
    const { count: mediaCount, error: countErr } = await admin
      .from("media")
      .select("id", { count: "exact", head: true });
    if (countErr)
      throw new Error(`count media for breaker: ${countErr.message}`);

    const { trip, reason } = evaluateOrphanSweep({
      mediaCount: mediaCount ?? 0,
      candidateCount: orphanKeys.length,
      objectsScanned,
    });

    if (trip) {
      captureError(
        "cron",
        new Error(`orphan sweep circuit-breaker tripped: ${reason}`),
        {
          sweep: "orphans",
          reason,
          media_count: mediaCount ?? 0,
          orphan_candidates: orphanKeys.length,
          objects_scanned: objectsScanned,
        },
      );
      // Deduped per (reason, day) so a stuck breaker pages once a day, not every run. A failure to
      // SEND the alert must never become a delete, so swallow it — the Sentry capture above is the
      // primary signal, and we still return without deleting.
      try {
        const { subject, html } = orphanBreakerEmail({
          reason: reason ?? "unknown",
          candidates: orphanKeys.length,
          mediaCount: mediaCount ?? 0,
          objectsScanned,
        });
        await sendOnce({
          kind: "orphan_breaker",
          dedupeKey: `${reason}:${now.toISOString().slice(0, 10)}`,
          to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
          subject,
          html,
        });
      } catch (e) {
        captureError("cron", e, { sweep: "orphans", phase: "breaker_alert" });
      }

      return {
        scanned_pages: pages,
        r2_deleted: 0,
        r2_errored: 0,
        more_remain: Boolean(token),
        breaker_tripped: true,
        breaker_reason: reason,
        orphan_candidates: orphanKeys.length,
        media_count: mediaCount ?? 0,
        objects_scanned: objectsScanned,
      };
    }
  }

  const r2 = orphanKeys.length
    ? await deleteR2Objects(orphanKeys)
    : { deleted: 0, errored: [] };

  return {
    scanned_pages: pages,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    // True if we hit the page cap with more to list — next run continues from the top.
    more_remain: Boolean(token),
    objects_scanned: objectsScanned,
  };
}

/**
 * Sweep 4 — expired Event Passes. A one-time Event Pass sets `tier_expires_at` (~1 yr);
 * once it lapses we downgrade to Free. Minimal over-capacity: reset the cap (null → 2 GB
 * Free default), so new uploads are blocked when over cap but existing media stays
 * (the full grace + renewal-nudge emails are a fast-follow). storage_used_bytes is left
 * alone — bytes are only reclaimed if the host later deletes events (the purge sweeps).
 */
async function sweepExpiredPasses(admin: AdminClient, now: Date) {
  const { data, error } = await admin
    .from("profiles")
    .update({ tier: "free", storage_cap_bytes: null, tier_expires_at: null })
    .eq("tier", "event_pass")
    .not("tier_expires_at", "is", null)
    .lte("tier_expires_at", now.toISOString())
    .select("id");
  if (error) throw new Error(`expire passes: ${error.message}`);
  return { downgraded: (data ?? []).length };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Sweep 5 — over-capacity retention for LAPSED paid accounts (a Free account is blocked
 * at upload before it can exceed cap, so it never lands here). Decisions key off ACTIVE
 * bytes (non-removed media in live events), NOT storage_used_bytes (which only drops at
 * hard-delete) — so an already-reduced account doesn't re-trigger while its removed media
 * waits out the recovery-window purge. Per profile:
 *   under cap            → clear any grace (resolved by upgrade / their own deletes).
 *   over + no grace      → open a 45-day grace + grace-start email.
 *   over + grace, near   → reminder email (within OVER_CAP_REMINDER_DAYS of the deadline).
 *   over + grace elapsed → auto-reduce (soft-remove largest-first via the Phase-3 path;
 *                          the removed_media sweep reclaims R2 + bytes after the window) + email.
 * All emails go through sendOnce (deduped) so re-runs never re-send.
 */
async function sweepOverCapacity(admin: AdminClient, now: Date) {
  // Candidates: only accounts that could exceed a cap. storage_used_bytes ≥ active bytes,
  // and the smallest cap is Free's 2 GB, so ≤ 2 GB used can't be over any cap. An account
  // in grace is always over cap → used > 2 GB until its removed media purges (grace is
  // cleared by then), so this floor also covers in-grace rows.
  const { data: candidates, error } = await admin
    .from("profiles")
    .select("id, email, tier, storage_cap_bytes, storage_grace_until")
    .gt("storage_used_bytes", FREE_CAP_BYTES);
  if (error) throw new Error(`select over-cap candidates: ${error.message}`);

  const siteUrl = await getSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;
  let graceOpened = 0;
  let reminded = 0;
  let reduced = 0;
  let cleared = 0;

  for (const p of candidates ?? []) {
    const cap = effectiveStorageCap(toBillingTier(p.tier), p.storage_cap_bytes);
    if (cap === null) continue; // unlimited tier — not subject to the cap

    // ACTIVE bytes = non-removed media in non-deleted events.
    const { data: media, error: mErr } = await admin
      .from("media")
      .select(
        "id, file_size_bytes, events!media_event_id_fkey!inner(host_id, deleted_at)",
      )
      .eq("events.host_id", p.id)
      .is("events.deleted_at", null)
      .neq("status", "removed");
    if (mErr) throw new Error(`select active media: ${mErr.message}`);
    const rows = (media ?? []) as unknown as {
      id: string;
      file_size_bytes: number;
    }[];
    const activeBytes = rows.reduce((s, m) => s + m.file_size_bytes, 0);

    // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
    // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
    // them — emailing "over your limit" and later auto-removing their media is wrong. Once truly
    // over, the reduce below still targets the REAL cap (hysteresis, so it can't flap).
    const engageAt = capWithWriteHeadroom(cap);

    if (activeBytes <= engageAt) {
      if (p.storage_grace_until) {
        await admin
          .from("profiles")
          .update({ storage_grace_until: null })
          .eq("id", p.id);
        cleared++;
      }
      continue;
    }

    if (!p.storage_grace_until) {
      const graceUntil = new Date(
        now.getTime() + OVER_CAP_GRACE_DAYS * 86_400_000,
      );
      await admin
        .from("profiles")
        .update({ storage_grace_until: graceUntil.toISOString() })
        .eq("id", p.id);
      graceOpened++;
      if (p.email) {
        const { subject, html } = overCapGraceStartEmail({
          capLabel: formatBytes(cap),
          deadline: fmtDate(graceUntil),
          dashboardUrl,
        });
        await sendOnce({
          kind: "over_cap_grace_start",
          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
          profileId: p.id,
          to: p.email,
          subject,
          html,
        });
      }
      continue;
    }

    const graceUntil = new Date(p.storage_grace_until);
    if (now >= graceUntil) {
      const ids = selectForAutoReduce(rows, cap);
      if (ids.length) {
        const { error: rmErr } = await admin
          .from("media")
          .update({
            status: "removed",
            removed_at: now.toISOString(),
            // QA #2: mark these as SYSTEM-binned so sweepStandbyBudget (same invocation, seconds
            // later) excludes them. Without it the standby sweep hard-deletes the media this sweep
            // just promised the host was recoverable for 30 days. The cast drops with the
            // post-apply types regeneration (same as the legal_hold_at columns before it).
            ...({ removed_by_system: true } as Record<string, boolean>),
          })
          .in("id", ids);
        if (rmErr) throw new Error(`auto-reduce remove: ${rmErr.message}`);
      }
      await admin
        .from("profiles")
        .update({ storage_grace_until: null })
        .eq("id", p.id);
      reduced++;
      if (p.email) {
        const recoverableUntil = fmtDate(
          new Date(now.getTime() + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000),
        );
        const { subject, html } = overCapReducedEmail({
          recoverableUntil,
          dashboardUrl,
        });
        await sendOnce({
          kind: "over_cap_reduced",
          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
          profileId: p.id,
          to: p.email,
          subject,
          html,
        });
      }
    } else if (
      now.getTime() >=
      graceUntil.getTime() - OVER_CAP_REMINDER_DAYS * 86_400_000
    ) {
      if (p.email) {
        const { subject, html } = overCapReminderEmail({
          deadline: fmtDate(graceUntil),
          dashboardUrl,
        });
        const sent = await sendOnce({
          kind: "over_cap_reminder",
          dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
          profileId: p.id,
          to: p.email,
          subject,
          html,
        });
        if (sent) reminded++;
      }
    }
  }

  return {
    candidates: candidates?.length ?? 0,
    grace_opened: graceOpened,
    reminded,
    reduced,
    cleared,
  };
}

/**
 * Sweep 6 — Event Pass renewal nudges. Email active-pass holders whose pass expires within
 * RENEWAL_NUDGE_DAYS so they can renew (cheaper) before it lapses into the over-capacity
 * grace. Deduped per (profile:expiry) via sendOnce. Already-expired passes are handled by
 * sweepExpiredPasses (downgrade), not here.
 */
async function sweepRenewalNudges(admin: AdminClient, now: Date) {
  const cutoff = new Date(
    now.getTime() + RENEWAL_NUDGE_DAYS * 86_400_000,
  ).toISOString();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, tier_expires_at")
    .eq("tier", "event_pass")
    .not("tier_expires_at", "is", null)
    .gt("tier_expires_at", now.toISOString())
    .lte("tier_expires_at", cutoff);
  if (error) throw new Error(`select renewal candidates: ${error.message}`);

  const siteUrl = await getSiteUrl();
  const renewUrl = `${siteUrl}/dashboard`;
  let nudged = 0;
  for (const p of data ?? []) {
    if (!p.email || !p.tier_expires_at) continue;
    const { subject, html } = renewalNudgeEmail({
      expiresOn: fmtDate(new Date(p.tier_expires_at)),
      renewUrl,
    });
    const sent = await sendOnce({
      kind: "renewal_nudge",
      dedupeKey: `${p.id}:${p.tier_expires_at}`,
      profileId: p.id,
      to: p.email,
      subject,
      html,
    });
    if (sent) nudged++;
  }
  return { eligible: data?.length ?? 0, nudged };
}

/**
 * Sweep 7 — free-tier inactivity removal. A free event is "active" while the LATEST of its
 * host's last_active_at + the event's created/updated + its newest upload is within
 * ~6 months. Past that → warning email (14 d out), then soft-delete (deleted_at + purge_at =
 * the recovery window, so sweep 1 reclaims it) + a recoverable-tail email. Targets free tier only
 * (PRD); paid accounts keep their events until they cancel. Pre-filtered by events.updated_at
 * (cheap), with last_active_at + uploads checked per candidate.
 */
async function sweepInactiveFreeEvents(admin: AdminClient, now: Date) {
  const nowMs = now.getTime();
  const warnCutoffIso = new Date(
    nowMs - (INACTIVE_DAYS - WARN_BEFORE_DAYS) * 86_400_000,
  ).toISOString();

  const { data: events, error } = await admin
    .from("events")
    .select(
      // Disambiguate the events->profiles embed by FK name. saved_events (event_id + user_id->profiles)
      // makes PostgREST infer a SECOND, many-to-many events<->profiles relationship, so a bare
      // `profiles!inner` is ambiguous ("more than one relationship was found") and the sweep throws.
      // Pin the direct host FK. The `.eq("profiles.tier", ...)` filter still targets it by resource name.
      "id, name, host_id, created_at, updated_at, profiles!events_host_id_fkey!inner(tier, email, last_active_at)",
    )
    .eq("profiles.tier", "free")
    .is("deleted_at", null)
    .lte("updated_at", warnCutoffIso);
  if (error) throw new Error(`select inactive candidates: ${error.message}`);

  const siteUrl = await getSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;
  let warned = 0;
  let removed = 0;

  for (const e of events ?? []) {
    const prof = e.profiles as unknown as {
      email: string | null;
      last_active_at: string;
    };

    // Newest upload (any status — a recent upload means the event is still in use).
    const { data: media } = await admin
      .from("media")
      .select("created_at")
      .eq("event_id", e.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const latestUpload = media?.[0]?.created_at;

    const activityMs = Math.max(
      new Date(prof.last_active_at).getTime(),
      new Date(e.created_at).getTime(),
      new Date(e.updated_at).getTime(),
      latestUpload ? new Date(latestUpload).getTime() : 0,
    );
    const action = inactivityAction(activityMs, nowMs);
    if (action === "none") continue;

    if (action === "remove") {
      // purge_at is DERIVED by the set_event_purge_at trigger from deleted_at (single source,
      // un-spoofable — mirrors media). We still compute purgeAt locally for the email's
      // "recoverable until" date, but the persisted value comes from the trigger, not this write.
      const purgeAt = new Date(
        nowMs + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
      );
      const { error: delErr } = await admin
        .from("events")
        .update({ deleted_at: now.toISOString() })
        .eq("id", e.id)
        .is("deleted_at", null);
      if (delErr) throw new Error(`inactive soft-delete: ${delErr.message}`);
      removed++;
      if (prof.email) {
        const { subject, html } = inactivityRemovedEmail({
          eventName: e.name,
          recoverableUntil: fmtDate(purgeAt),
          dashboardUrl,
        });
        await sendOnce({
          kind: "inactivity_removed",
          dedupeKey: e.id,
          profileId: e.host_id,
          to: prof.email,
          subject,
          html,
        });
      }
    } else if (prof.email) {
      const deadline = new Date(activityMs + INACTIVE_DAYS * 86_400_000);
      const { subject, html } = inactivityWarningEmail({
        eventName: e.name,
        deadline: fmtDate(deadline),
        dashboardUrl,
      });
      const sent = await sendOnce({
        kind: "inactivity_warning",
        dedupeKey: `${e.id}:${activityMs}`,
        profileId: e.host_id,
        to: prof.email,
        subject,
        html,
      });
      if (sent) warned++;
    }
  }

  return { candidates: events?.length ?? 0, warned, removed };
}

/**
 * Sweep 8 — bounded standby budget (anti-abuse). Recovery decoupled the cap from physical bytes,
 * so deleted-but-stored media no longer counts against the cap. This bounds the TOTAL such
 * "standby" bytes per account to RECENTLY_DELETED_BUDGET_MULTIPLIER x the effective cap, evicting
 * OLDEST-first when over — so a restore -> re-delete "timer refresh" can't accumulate junk (size is
 * the bound, not the clock). The bin = a host's media that are status='removed' OR live in a
 * soft-deleted event. Runs LAST so `handled` already excludes ids the expiry sweeps purged and so
 * the bytes over_capacity just auto-reduced this run are seen (youngest -> survive oldest-first).
 * Empty soft-deleted event shells (all media evicted) are left to sweepExpiredEvents.
 */
async function sweepStandbyBudget(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  // Candidate hosts: anyone with binned bytes — (a) >=1 removed media (via the event join), (b) >=1
  // soft-deleted event. Union, then load just those profiles' cap inputs (no full-profiles scan).
  const { data: removedHosts, error: rhErr } = await admin
    .from("media")
    .select("events!media_event_id_fkey!inner(host_id)")
    .eq("status", "removed");
  if (rhErr) throw new Error(`standby removed hosts: ${rhErr.message}`);
  const { data: deletedHosts, error: dhErr } = await admin
    .from("events")
    .select("host_id")
    .not("deleted_at", "is", null);
  if (dhErr) throw new Error(`standby deleted-event hosts: ${dhErr.message}`);

  const hostIds = new Set<string>();
  for (const r of removedHosts ?? [])
    hostIds.add((r.events as unknown as { host_id: string }).host_id);
  for (const e of deletedHosts ?? []) hostIds.add(e.host_id);
  if (hostIds.size === 0) {
    return {
      candidates: 0,
      over_budget: 0,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    };
  }

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, tier, storage_cap_bytes")
    .in("id", [...hostIds]);
  if (pErr) throw new Error(`standby profiles: ${pErr.message}`);

  type BinJoin = {
    id: string;
    original_key: string;
    preview_key: string | null;
    file_size_bytes: number;
    removed_at: string | null;
    events: { deleted_at: string | null };
  };
  const BIN_SELECT =
    "id, original_key, preview_key, file_size_bytes, removed_at, events!media_event_id_fkey!inner(host_id, deleted_at)";

  let overBudget = 0;
  let mediaRows = 0;
  let r2Deleted = 0;
  let r2Errored = 0;
  let freed = 0;

  for (const p of profiles ?? []) {
    const cap = effectiveStorageCap(toBillingTier(p.tier), p.storage_cap_bytes);
    if (cap === null) continue; // unlimited tier — no standby budget to enforce
    const budget = RECENTLY_DELETED_BUDGET_MULTIPLIER * cap;

    // The bin via two DISJOINT queries (status='removed' vs in-a-deleted-event-and-not-removed),
    // unioned in JS. Avoids a version-sensitive cross-table PostgREST .or; the sets can't overlap.
    // LEGAL HOLD (ADR-0020): held rows are excluded from the bin entirely — they can't be evicted
    // (the delete is R2-first, so they must never reach the key list) and they don't count against
    // the host's standby budget (the hold is our doing, not the host's hoarding).
    // ★ removed_by_system (QA #2): sweep 5 (sweepOverCapacity) soft-removes over-cap media EARLIER
    // IN THIS SAME INVOCATION and emails "recoverable until <date>". Without this filter those very
    // rows land in the bin seconds later, blow the budget on their own (they routinely exceed it —
    // that is what over-cap means), and get HARD-DELETED with their R2 objects. They still purge on
    // schedule at purge_at. The 24h age gate in selectForStandbyEviction is the second belt.
    const { data: removedRows, error: rErr } = await admin
      .from("media")
      .select(BIN_SELECT)
      .eq("events.host_id", p.id)
      .eq("status", "removed")
      // `.filter` (not `.eq`): removed_by_system isn't in the generated types until the
      // orchestrator regenerates post-apply — same convention as legal_hold_at above.
      .filter("removed_by_system", "is", false)
      .filter("legal_hold_at", "is", null);
    if (rErr) throw new Error(`standby removed bin: ${rErr.message}`);
    const { data: deletedRows, error: dErr } = await admin
      .from("media")
      .select(BIN_SELECT)
      .eq("events.host_id", p.id)
      .not("events.deleted_at", "is", null)
      .neq("status", "removed")
      .filter("legal_hold_at", "is", null);
    if (dErr) throw new Error(`standby deleted-event bin: ${dErr.message}`);

    const binRows = [
      ...((removedRows ?? []) as unknown as BinJoin[]),
      ...((deletedRows ?? []) as unknown as BinJoin[]),
    ].filter((r) => !handled.has(r.id));

    const standby = binRows.reduce((s, r) => s + r.file_size_bytes, 0);
    if (standby <= budget) continue;
    overBudget++;

    const evictIds = selectForStandbyEviction(
      binRows.map((r) => ({
        id: r.id,
        file_size_bytes: r.file_size_bytes,
        binned_at:
          minIso(r.removed_at, r.events.deleted_at) ?? now.toISOString(),
      })),
      budget,
      now.getTime(),
    );
    if (evictIds.length === 0) continue;

    const evictSet = new Set(evictIds);
    const evictRows = binRows.filter((r) => evictSet.has(r.id));
    const r2 = await deleteR2Objects(keysOf(evictRows));
    freed += await purgeRows(admin, evictIds);
    evictIds.forEach((id) => handled.add(id));
    mediaRows += evictIds.length;
    r2Deleted += r2.deleted;
    r2Errored += r2.errored.length;
  }

  return {
    candidates: profiles?.length ?? 0,
    over_budget: overBudget,
    media_rows: mediaRows,
    r2_deleted: r2Deleted,
    r2_errored: r2Errored,
    freed_bytes: freed,
  };
}

/** Atomic hard-delete of rows + storage_used_bytes decrement; returns Σ freed bytes. */
async function purgeRows(
  admin: AdminClient,
  mediaIds: string[],
): Promise<number> {
  const { data, error } = await admin.rpc("purge_media_rows", {
    p_media_ids: mediaIds,
  });
  if (error) throw new Error(`purge_media_rows: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + Number(r.freed_bytes ?? 0), 0);
}

/**
 * Sweep 9 — prune the unlock rate-limiter log. The limiter only counts failures within the last
 * UNLOCK_EVENT_WINDOW_MIN (60 min), so rows older than a day are dead weight. Keeps the table tiny
 * (and cleans up rows orphaned by deleted events — the table has no FK, by design).
 */
async function sweepUnlockAttempts(admin: AdminClient, now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("unlock_attempts")
    .delete({ count: "exact" })
    .lt("attempted_at", cutoff);
  if (error) throw new Error(`prune unlock_attempts: ${error.message}`);
  return { pruned: count ?? 0, before: cutoff };
}

/**
 * Sweep 10 — prune the abuse rate-limiter log (`action_attempts`). The limiter's widest window is 60 min, so
 * rows older than a day are dead weight (and this cleans up rows orphaned by deleted events — no FK, by
 * design). Mirrors sweep 9 (unlock_attempts).
 */
async function sweepActionAttempts(admin: AdminClient, now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("action_attempts")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  if (error) throw new Error(`prune action_attempts: ${error.message}`);
  return { pruned: count ?? 0, before: cutoff };
}
