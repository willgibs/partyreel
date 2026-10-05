/**
 * RESTORE NOW: the backup restore's run-now, the one start the app has for a Cloudflare job (durability-backups.md,
 * "The restore"). The app cannot reach the Worker's crons, so it asks the Worker's own door instead: `POST /restore`
 * on its origin (`BACKUP_WORKER_URL`) with the internal-jobs bearer (`PRUNE_API_SECRET`, the secret the Worker
 * already checks on the confirm route and the heartbeat). The door asks the prune's Durable Object for a pass, which
 * runs as its alarm and reports on the restore's card like any other (workers/backup/src/restore-door.ts).
 *
 * Every answer becomes words for the operator, never a bare status: a pass started, joined or queued behind one in
 * flight is a success; the restore switched off, a bearer the Worker refuses, a Worker that cannot be reached each
 * say so. The caller re-checks admin and AAL2 first (actions.ts); this is the asking half only.
 */
import "server-only";

import { serverEnv } from "@/lib/env";

/** The door's path, the one the Worker answers (restore-door.ts `RESTORE_DOOR_PATH`). */
export const RESTORE_DOOR_PATH = "/restore";

/** Restore now is wired when the app knows the Worker's origin and holds the bearer they share. */
export function restoreNowWired(): boolean {
  return Boolean(serverEnv.BACKUP_WORKER_URL && serverEnv.PRUNE_API_SECRET);
}

export type RestoreNowAnswer =
  | { ok: true; state: "started" | "queued" | "running" }
  | {
      ok: false;
      message: string;
      /** A fault worth a Sentry event (an unreachable or refusing Worker), not a deliberate state (the restore off). */
      fault: boolean;
    };

export async function askRestoreNow(): Promise<RestoreNowAnswer> {
  const { BACKUP_WORKER_URL, PRUNE_API_SECRET } = serverEnv;
  if (!BACKUP_WORKER_URL || !PRUNE_API_SECRET) {
    return {
      ok: false,
      message:
        "Restore now is not wired here: set BACKUP_WORKER_URL to the backup Worker's origin.",
      fault: false,
    };
  }
  let res: Response;
  try {
    res = await fetch(new URL(RESTORE_DOOR_PATH, BACKUP_WORKER_URL), {
      method: "POST",
      headers: { authorization: `Bearer ${PRUNE_API_SECRET}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return {
      ok: false,
      message:
        "Couldn't reach the backup Worker, so no pass started. Please try again.",
      fault: true,
    };
  }
  const body = (await res.json().catch(() => null)) as {
    started?: unknown;
    state?: unknown;
    reason?: unknown;
  } | null;
  if (res.status === 202 && body?.started === true) {
    const state =
      body.state === "queued" || body.state === "running"
        ? body.state
        : "started";
    return { ok: true, state };
  }
  if (res.status === 409 && body?.reason === "off") {
    return {
      ok: false,
      message:
        "The restore is off on its Worker (RESTORE_MODE), so there is nothing to run.",
      fault: false,
    };
  }
  if (res.status === 401) {
    return {
      ok: false,
      message:
        "The backup Worker refused the app's bearer: PRUNE_API_SECRET differs between the two.",
      fault: true,
    };
  }
  return {
    ok: false,
    message: `The backup Worker did not start a pass (HTTP ${res.status}).`,
    fault: true,
  };
}
