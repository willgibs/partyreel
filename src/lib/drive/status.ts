/**
 * WHAT `GET /api/drive/status` ANSWERS: her connection and her sends that matter now, the one shape every place a send
 * shows reads (`use-drive-status.ts`). Pure.
 */
import type { SendView } from "@/lib/drive/moments";

export type DriveStatus = {
  configured: boolean;
  connection: {
    /** "Connected as": the address only when Google said it is verified. */
    email: string | null;
    status: "connected" | "failing" | "revoked";
    connectedAt: string;
    /** The Partyreel folder in her Drive, once a send made it. */
    folderUrl: string | null;
    /** Her Drive's room, as last asked (the panel's "12.6 GB free"); null when unknown or unlimited. */
    free: number | null;
  } | null;
  sends: SendView[];
  now: string;
};

/** A lease's length (`cloud_export_lease`): a lane alive at a stop has said its last word, or died, by then. */
export const LANDING_WITHIN_MS = 15 * 60 * 1000;

/**
 * May this send still be landing? Canceled or stopped inside a lease's length (a send that never started has nothing
 * on its way): only these are asked whether a lane still holds their files, so a page with none asks nothing more.
 */
export function mayBeLanding(
  send: { status: string; stopReason: string | null; closedAt: string | null },
  nowMs: number,
): boolean {
  if (send.status !== "canceled" && send.status !== "stopped") return false;
  if (send.stopReason === "failed_to_start") return false;
  const closed = send.closedAt ? Date.parse(send.closedAt) : NaN;
  return Number.isFinite(closed) && nowMs - closed < LANDING_WITHIN_MS;
}
