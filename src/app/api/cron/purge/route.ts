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
import { effectiveStorageCap, toBillingTier } from "@/lib/constants/tiers";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  inactivityRemovedEmail,
  inactivityWarningEmail,
  overCapGraceStartEmail,
  overCapReducedEmail,
  overCapReminderEmail,
  renewalNudgeEmail,
} from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import { assertCronEnv } from "@/lib/env";
import {
  INACTIVE_DAYS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";
import { RENEWAL_NUDGE_DAYS } from "@/lib/lifecycle/renewal";
import { selectForAutoReduce } from "@/lib/media/auto-reduce";
import { captureError } from "@/lib/observability/sentry";
import { deleteR2Objects, listR2Objects } from "@/lib/r2/delete";
import { parseMediaIdFromKey } from "@/lib/r2/keys";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBytes } from "@/lib/utils";

// node:crypto + the service-role admin client require the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// R2 list/delete + DB deletes can take a while on a large backlog.
export const maxDuration = 60;

// Individually-removed media gets a short recoverable grace before hard-delete; the
// 60-day event tail is separate (events.purge_at, set on soft-delete).
const REMOVED_GRACE_DAYS = 7;
// Default tail for legacy soft-deletes that predate purge_at (deleted_at + this).
const EVENT_TAIL_DAYS = 60;
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

  return Response.json({ ok: true, ran_at: now.toISOString(), sweeps });
}

/**
 * Sweep 1 — events whose recoverable tail has elapsed. Hard-delete their media (R2
 * + rows + usage), then the event rows (cascades to guests/reels/reports).
 * `coalesce(purge_at, deleted_at + 60d)` so legacy soft-deletes (no purge_at) are
 * still reclaimed instead of leaking storage forever.
 */
async function sweepExpiredEvents(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  const nowIso = now.toISOString();
  const legacyCutoffIso = new Date(
    now.getTime() - EVENT_TAIL_DAYS * 86_400_000,
  ).toISOString();

  const { data: events, error } = await admin
    .from("events")
    .select("id")
    .not("deleted_at", "is", null)
    .or(
      `purge_at.lte.${nowIso},and(purge_at.is.null,deleted_at.lte.${legacyCutoffIso})`,
    );
  if (error) throw new Error(`select events: ${error.message}`);

  const eventIds = (events ?? []).map((e) => e.id);
  if (eventIds.length === 0) {
    return {
      events: 0,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    };
  }

  const { data: media, error: mErr } = await admin
    .from("media")
    .select("id, original_key, preview_key")
    .in("event_id", eventIds);
  if (mErr) throw new Error(`select media: ${mErr.message}`);

  const rows = (media ?? []) as MediaRow[];
  const mediaIds = rows.map((r) => r.id);
  const r2 = await deleteR2Objects(keysOf(rows));
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
  const cutoffIso = new Date(
    now.getTime() - REMOVED_GRACE_DAYS * 86_400_000,
  ).toISOString();

  const { data: media, error } = await admin
    .from("media")
    .select("id, original_key, preview_key")
    .eq("status", "removed")
    .lte("removed_at", cutoffIso);
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

  do {
    const { objects, nextToken } = await listR2Objects({
      prefix: MEDIA_PREFIX,
      continuationToken: token,
    });
    pages += 1;

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

  const r2 = orphanKeys.length
    ? await deleteR2Objects(orphanKeys)
    : { deleted: 0, errored: [] };

  return {
    scanned_pages: pages,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    // True if we hit the page cap with more to list — next run continues from the top.
    more_remain: Boolean(token),
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
 * waits out the 7-day purge. Per profile:
 *   under cap            → clear any grace (resolved by upgrade / their own deletes).
 *   over + no grace      → open a 45-day grace + grace-start email.
 *   over + grace, near   → reminder email (within OVER_CAP_REMINDER_DAYS of the deadline).
 *   over + grace elapsed → auto-reduce (soft-remove largest-first via the Phase-3 path;
 *                          the removed_media sweep reclaims R2 + bytes after 7d) + email.
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
      .select("id, file_size_bytes, events!inner(host_id, deleted_at)")
      .eq("events.host_id", p.id)
      .is("events.deleted_at", null)
      .neq("status", "removed");
    if (mErr) throw new Error(`select active media: ${mErr.message}`);
    const rows = (media ?? []) as unknown as {
      id: string;
      file_size_bytes: number;
    }[];
    const activeBytes = rows.reduce((s, m) => s + m.file_size_bytes, 0);

    if (activeBytes <= cap) {
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
          .update({ status: "removed", removed_at: now.toISOString() })
          .in("id", ids);
        if (rmErr) throw new Error(`auto-reduce remove: ${rmErr.message}`);
      }
      await admin
        .from("profiles")
        .update({ storage_grace_until: null })
        .eq("id", p.id);
      reduced++;
      if (p.email) {
        const { subject, html } = overCapReducedEmail({ dashboardUrl });
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
 * ~6 months. Past that → warning email (14 d out), then soft-delete (deleted_at + 60-day
 * purge_at, so sweep 1 reclaims it) + a recoverable-tail email. Targets free tier only
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
      "id, name, host_id, created_at, updated_at, profiles!inner(tier, email, last_active_at)",
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
      const purgeAt = new Date(nowMs + EVENT_TAIL_DAYS * 86_400_000);
      const { error: delErr } = await admin
        .from("events")
        .update({
          deleted_at: now.toISOString(),
          purge_at: purgeAt.toISOString(),
        })
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
