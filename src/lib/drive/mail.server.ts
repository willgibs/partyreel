/**
 * THE MAIL A SEND SENDS (drive-export.md, "The tab is hers to close"): the connection's notice, the done mail (an
 * hour's finished sends folded into one), a pause that needs her or tells her when it carries on, a send that gave up,
 * and a connection that lost its access. Each goes through `sendOnce` with a key that names its moment, so a report
 * replayed, a sweep run twice or two lanes seeing one stop send it once (the kinds: `DRIVE_KINDS`, send-kinds.ts).
 *
 * ★ A MAIL NEVER FAILS A SEND. Every function here swallows and reports its own failure: the send's own place in the
 * app says the same thing at once, and `sendOnce` records a failed delivery in the `email_delivery` signal.
 */
import "server-only";

import { DRIVE_ACCOUNT_PATH, albumPath } from "@/lib/drive/links";
import { SITE_URL } from "@/lib/constants/site";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { sendOnce, sendOncePerWindow } from "@/lib/email/send";
import {
  driveConnectedEmail,
  driveExportDoneEmail,
  driveExportPausedEmail,
  driveExportStoppedEmail,
  driveReconnectEmail,
  type DriveDoneAlbum,
  type DrivePauseReason,
  type DriveReconnectWhy,
} from "@/lib/email/templates";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBytes } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The done mail's fold: at most one an hour an account. */
export const DONE_MAIL_WINDOW_MS = 60 * 60 * 1000;

const url = (path: string) => new URL(path, SITE_URL).toString();

function admin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

/** The account's own address (every transactional mail goes there), or null for an account with none. */
async function accountEmail(userId: string): Promise<string | null> {
  const row = await mustQuery(
    admin().from("profiles").select("email").eq("id", userId).maybeSingle(),
    "drive mail: the account's address",
  );
  const email = (row as { email?: unknown } | null)?.email;
  return typeof email === "string" && email.includes("@") ? email : null;
}

/** A new Google account connected (or another replacing hers): the notice, to her own address. */
export async function notifyConnected(input: {
  userId: string;
  connectionId: string;
  googleEmail: string | null;
  replaced: string | null;
}): Promise<void> {
  try {
    const to = await accountEmail(input.userId);
    if (!to) return;
    const mail = driveConnectedEmail({
      googleEmail: input.googleEmail,
      replacedEmail: input.replaced,
      accountUrl: url(DRIVE_ACCOUNT_PATH),
    });
    await sendOnce({
      kind: "drive_connected",
      dedupeKey: `connection:${input.connectionId}`,
      profileId: input.userId,
      to,
      ...mail,
    });
  } catch (e) {
    captureError("export", e, {
      action: "drive_mail",
      kind: "drive_connected",
    });
  }
}

/** A finished send as the sweep hands it to the fold. */
export type FinishedSend = {
  jobId: string;
  albumName: string;
  status: string;
  itemsTotal: number;
  itemsSent: number;
  itemsKept: number;
  itemsFailed: number;
  bytesSent: number;
  folderUrl: string | null;
};

/**
 * THE DONE MAIL, FOLDED: every send of hers that finished since her last done mail, in one, at most one an hour. Sent:
 * the sends it named are marked, so none is named twice. Held by the window: nothing is marked, and the next sweep
 * after the hour folds them with whatever finished meanwhile. Answers the job ids the mail named.
 */
export async function notifyDone(
  userId: string,
  sends: FinishedSend[],
): Promise<string[]> {
  if (sends.length === 0) return [];
  try {
    const to = await accountEmail(userId);
    if (!to) return sends.map((s) => s.jobId);
    const albums: DriveDoneAlbum[] = sends.map((s) => ({
      name: s.albumName,
      sent: s.itemsSent,
      kept: s.itemsKept,
      failed: s.itemsFailed,
      total: s.itemsTotal,
      size: formatBytes(s.bytesSent),
      folderUrl: s.folderUrl,
    }));
    const mail = driveExportDoneEmail({ albums, albumsUrl: url("/dashboard") });
    const sent = await sendOncePerWindow({
      kind: "drive_export_done",
      scope: `drive-done:${userId}`,
      windowMs: DONE_MAIL_WINDOW_MS,
      profileId: userId,
      to,
      ...mail,
    });
    return sent ? sends.map((s) => s.jobId) : [];
  } catch (e) {
    captureError("export", e, {
      action: "drive_mail",
      kind: "drive_export_done",
    });
    return [];
  }
}

const PAUSE_MAILED: ReadonlySet<string> = new Set([
  "drive_full",
  "daily_limit",
  "folder_gone",
  "domain_policy",
]);

/**
 * A SEND THAT PAUSED, once a send, a reason and a pause: Drive full, Google's day (quiet in the app, so its mail says
 * when it carries on), the folder in her bin, her admin's policy. A lost connection is the reconnect mail (once a
 * connection, not once a send); a dying lane, the breaker and an operator's pause are ours, and say so in the app.
 */
export async function notifyPaused(jobId: string): Promise<void> {
  try {
    const row = await mustQuery(
      admin()
        .from("cloud_exports")
        .select(
          "id, user_id, event_id, album_name, status, pause_reason, paused_at, resume_at, bytes_total, bytes_sent, tz",
        )
        .eq("id", jobId)
        .maybeSingle(),
      "drive mail: a paused send",
    );
    const job = row as Record<string, unknown> | null;
    if (
      !job ||
      job.status !== "paused" ||
      typeof job.pause_reason !== "string" ||
      !PAUSE_MAILED.has(job.pause_reason)
    ) {
      return;
    }
    const userId = String(job.user_id);
    const to = await accountEmail(userId);
    if (!to) return;
    const left = Math.max(
      Number(job.bytes_total ?? 0) - Number(job.bytes_sent ?? 0),
      0,
    );
    const resumesAt =
      typeof job.resume_at === "string"
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: typeof job.tz === "string" ? job.tz : "UTC",
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(job.resume_at))
        : null;
    const mail = driveExportPausedEmail({
      albumName: String(job.album_name ?? "Your album"),
      reason: job.pause_reason as DrivePauseReason,
      left: formatBytes(left),
      resumesAt,
      albumUrl: url(
        typeof job.event_id === "string"
          ? albumPath(job.event_id)
          : "/dashboard",
      ),
      accountUrl: url(DRIVE_ACCOUNT_PATH),
    });
    await sendOnce({
      kind: "drive_export_paused",
      dedupeKey: `${jobId}:${job.pause_reason}:${String(job.paused_at ?? "")}`,
      profileId: userId,
      to,
      ...mail,
    });
  } catch (e) {
    captureError("export", e, {
      action: "drive_mail",
      kind: "drive_export_paused",
    });
  }
}

/** A send that gave up after its days: once. */
export async function notifyStopped(jobId: string): Promise<void> {
  try {
    const row = await mustQuery(
      admin()
        .from("cloud_exports")
        .select(
          "id, user_id, event_id, album_name, status, stop_reason, items_sent, items_total",
        )
        .eq("id", jobId)
        .maybeSingle(),
      "drive mail: a stopped send",
    );
    const job = row as Record<string, unknown> | null;
    if (!job || job.status !== "stopped" || job.stop_reason !== "expired")
      return;
    const userId = String(job.user_id);
    const to = await accountEmail(userId);
    if (!to) return;
    const mail = driveExportStoppedEmail({
      albumName: String(job.album_name ?? "Your album"),
      sent: Number(job.items_sent ?? 0),
      total: Number(job.items_total ?? 0),
      albumUrl: url(
        typeof job.event_id === "string"
          ? albumPath(job.event_id)
          : "/dashboard",
      ),
    });
    await sendOnce({
      kind: "drive_export_stopped",
      dedupeKey: `${jobId}:stopped`,
      profileId: userId,
      to,
      ...mail,
    });
  } catch (e) {
    captureError("export", e, {
      action: "drive_mail",
      kind: "drive_export_stopped",
    });
  }
}

/** A connection that needs her again: once a connection, a reason and a day. */
export async function notifyReconnect(input: {
  connectionId: string;
  userId: string;
  why: DriveReconnectWhy;
}): Promise<void> {
  try {
    const to = await accountEmail(input.userId);
    if (!to) return;
    const conn = await mustQuery(
      admin()
        .from("cloud_connections")
        .select("account_email, email_verified")
        .eq("id", input.connectionId)
        .maybeSingle(),
      "drive mail: the connection",
    );
    const c = conn as {
      account_email?: unknown;
      email_verified?: unknown;
    } | null;
    const googleEmail =
      c?.email_verified === true && typeof c.account_email === "string"
        ? c.account_email
        : null;
    const waiting = await mustCount(
      admin()
        .from("cloud_exports")
        .select("id", { count: "exact", head: true })
        .eq("connection_id", input.connectionId)
        .eq("status", "paused")
        .eq("pause_reason", "disconnected"),
      "drive mail: what waits on the connection",
    );
    const mail = driveReconnectEmail({
      why: input.why,
      googleEmail,
      waiting,
      accountUrl: url(DRIVE_ACCOUNT_PATH),
    });
    const day = new Date().toISOString().slice(0, 10);
    await sendOnce({
      kind: "drive_reconnect",
      dedupeKey: `${input.connectionId}:${input.why}:${day}`,
      profileId: input.userId,
      to,
      ...mail,
    });
  } catch (e) {
    captureError("export", e, {
      action: "drive_mail",
      kind: "drive_reconnect",
    });
  }
}
