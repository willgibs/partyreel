"use server";

/**
 * THE OPERATOR'S HAND ON SEND TO GOOGLE DRIVE (/admin/exports#drive; drive-export.md, "Operators"). Each re-checks
 * admin and AAL2 here, validates what it was handed, and acts through the same functions her own acts use, marked an
 * operator's (`p_operator`): a send resumed for any reason, retried or canceled; a connection paused whole, resumed or
 * its breaker lifted; an account's connection disconnected (revoked at Google, as her own Disconnect is). Nothing here
 * deletes anything in her Drive.
 */
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import {
  actOnSend,
  operatorOnConnection,
  readConnectionUser,
  readLiveConnections,
  recordRefreshFailed,
} from "@/lib/db/queries/drive";
import { disconnectDrive } from "@/lib/drive/disconnect.server";
import { revokeToken } from "@/lib/drive/google";
import { notifyReconnect } from "@/lib/drive/mail.server";
import { kickConnection, openConnectionTokens } from "@/lib/drive/service.server";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

import { REVOKE_ALL_PHRASE } from "./drive-words";

const PATH = "/admin/exports";

function refused(message: string): ActionResult {
  return { ok: false, code: "unknown", message };
}

/**
 * The switch. Off: no new send starts and every lane's next lease answers `paused` (nothing is lost; each send waits
 * where it stands and carries on when it is back on). No Worker redeploy.
 */
export async function toggleDriveExportsAction(enabled: boolean): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (typeof enabled !== "boolean") return refused("Unknown setting.");
  const { error } = await createAdminClient()
    .from("ops_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", "drive_export_enabled");
  if (error) {
    captureError("export", new Error(error.message), { action: "toggle_drive_exports", enabled });
    return refused("Couldn't update the setting. Please try again.");
  }
  revalidatePath(PATH);
  return { ok: true };
}

const SEND_REFUSALS: Record<string, string> = {
  not_found: "That send no longer exists.",
  not_running: "That send has already finished.",
  not_paused: "That send isn't paused any more.",
  nothing_failed: "Nothing in that send failed.",
  gone: "Its album or its connection is gone: nothing to retry.",
  already_sending: "A newer send of that album is already going; it takes these files too.",
};

export async function driveSendAction(jobId: string, act: "resume" | "retry" | "cancel"): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (!z.uuid().safeParse(jobId).success || !["resume", "retry", "cancel"].includes(act)) {
    return refused("Unknown send.");
  }
  try {
    const r = await actOnSend({ userId: null, jobId, act, operator: true });
    if (!r.ok) return refused(SEND_REFUSALS[r.code ?? ""] ?? "Couldn't do that. Please try again.");
    // A send going again wants its lanes now, not at the next sweep.
    if (act !== "cancel" && r.connectionId) await kickConnection(r.connectionId);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    captureError("export", e, { action: "drive_operator_send", act });
    return refused("Couldn't do that. Please try again.");
  }
}

export async function driveConnectionAction(
  connectionId: string,
  act: "pause" | "resume" | "lift_breaker",
  note: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (!z.uuid().safeParse(connectionId).success || !["pause", "resume", "lift_breaker"].includes(act)) {
    return refused("Unknown connection.");
  }
  try {
    const r = await operatorOnConnection(connectionId, act, typeof note === "string" ? note.trim().slice(0, 500) || null : null);
    if (!r.ok) return refused("That connection no longer exists.");
    if (act !== "pause") await kickConnection(connectionId);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    captureError("export", e, { action: "drive_operator_connection", act });
    return refused("Couldn't do that. Please try again.");
  }
}

/** For an account's recovery: the connection ends and its grant is revoked at Google, as her own Disconnect does. */
export async function driveDisconnectAction(connectionId: string): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (!z.uuid().safeParse(connectionId).success) return refused("Unknown connection.");
  try {
    const userId = await readConnectionUser(connectionId);
    if (!userId) return refused("That connection no longer exists.");
    const r = await disconnectDrive(userId);
    revalidatePath(PATH);
    if (!r.revoked) {
      // Our key is deleted either way; Google not confirming is the account's to finish at Google.
      return {
        ok: false,
        code: "unknown",
        message: "Disconnected here, but Google didn't confirm the revoke: the account can remove Partyreel at myaccount.google.com/connections.",
      };
    }
    return { ok: true };
  } catch (e) {
    captureError("export", e, { action: "drive_operator_disconnect" });
    return refused("Couldn't disconnect. Please try again.");
  }
}

/** One press's budget: inside a Vercel function's time, leaving room to answer. */
const REVOKE_ALL_BUDGET_MS = 45_000;

/**
 * THE LEAK RUNBOOK'S ONE ACT (drive-export.md, "When a secret leaks"): every connection's grant revoked at Google
 * and its tokens wiped, as Google's own `invalid_grant` does (status revoked, her sends paused `disconnected`, the
 * reconnect mail), so a leaked token key or client secret opens nothing that still works. Each host's sends carry on
 * when she reconnects the same Google account. A press runs for 45 seconds and says what remains.
 */
export async function driveRevokeAllAction(typed: string): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (typed !== REVOKE_ALL_PHRASE) return refused(`Type \u201c${REVOKE_ALL_PHRASE}\u201d to confirm.`);
  const started = Date.now();
  let done = 0;
  let unconfirmed = 0;
  let after: string | null = null;
  try {
    for (;;) {
      const page = await readLiveConnections({ after, limit: 100 });
      if (page.length === 0) break;
      for (const c of page) {
        if (Date.now() - started > REVOKE_ALL_BUDGET_MS) {
          revalidatePath(PATH);
          return refused(
            `Revoked ${done}${unconfirmed ? ` (${unconfirmed} not confirmed by Google)` : ""}; more remain. Press again to go on.`,
          );
        }
        // Revoke at Google first (the grant is what a leaked secret would use), then wipe ours either way.
        let tokens: { refresh: string | null; access: string | null } | null = null;
        try {
          tokens = await openConnectionTokens(c.id);
        } catch {
          tokens = null;
        }
        const token = tokens?.refresh ?? tokens?.access ?? null;
        const revoked = token ? await revokeToken(token) : false;
        if (!revoked) unconfirmed += 1;
        await recordRefreshFailed({ connectionId: c.id, error: "revoked by an operator (revoke every connection)", revoked: true });
        await notifyReconnect({ connectionId: c.id, userId: c.userId, why: "revoked" });
        done += 1;
      }
      after = page[page.length - 1]!.id;
    }
  } catch (e) {
    captureError("export", e, { action: "drive_revoke_all", done });
    revalidatePath(PATH);
    return refused(`Stopped after ${done}: ${e instanceof Error ? e.message.slice(0, 120) : "an error"}. Press again to go on.`);
  }
  revalidatePath(PATH);
  if (unconfirmed > 0) {
    return refused(
      `Every connection is revoked here (${done}); Google didn't confirm ${unconfirmed}. Their keys are wiped, so nothing of ours opens them.`,
    );
  }
  return { ok: true };
}
