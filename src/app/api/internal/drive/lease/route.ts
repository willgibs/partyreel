/**
 * A LANE ASKS FOR WORK (`POST /api/internal/drive/lease`, the Worker's signed word; drive-export.md, "The transfer").
 *
 * `cloud_export_lease` decides everything in one transaction under the connection's row: the switch, the connection's
 * state, Google's "slow down", her live lanes, Google's day, the oldest send with work and its batch (each original
 * re-read against media as it is taken), or a page of a closing check, and whether this call refreshes the token.
 * This route then does what SQL cannot: opens or refreshes the access token (here, never in the Worker), names the
 * batch's files (the one naming function; the SQL keeps the " (2)"), and seals the token for this lease.
 *
 * A token this route cannot get gives the batch back (released, the attempts not counted) and answers wait or paused,
 * so a lane never holds items it cannot send. A connection Google says is gone is paused and mailed once.
 */
import { after } from "next/server";

import { internalJson, readDriveWord } from "@/lib/drive/internal.server";
import { notifyReconnect } from "@/lib/drive/mail.server";
import {
  leaseWordSchema,
  sealForLease,
  type CheckItem,
  type LeaseAnswer,
} from "@/lib/drive/protocol";
import { accessFromLease, leaseItemsFor } from "@/lib/drive/service.server";
import { leaseWork, reportWork } from "@/lib/db/queries/drive";
import { assertDriveEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const read = await readDriveWord(request, leaseWordSchema, "lease");
  if (!read.ok) return read.response;
  const { connectionId } = read.word;

  let raw;
  try {
    raw = await leaseWork(connectionId);
  } catch (e) {
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "lease", error: e });
    return internalJson({ ok: false, code: "lease_failed" }, 500);
  }

  if (raw.state !== "work" && raw.state !== "check") {
    const answer: LeaseAnswer = raw.state === "throttled" ? { state: "throttled", until: raw.until } : { state: raw.state };
    return internalJson(answer);
  }

  // Give the batch back: released, the attempts not counted (a lane must never hold what it cannot send).
  const giveBack = async () => {
    if (raw.state === "work") {
      await reportWork({
        lease: raw.lease,
        items: raw.items.map((i) => ({ media_id: i.mediaId, outcome: "released" })),
        finding: null,
        done: true,
      }).catch(() => undefined);
    }
  };

  const userId = raw.state === "work" ? raw.userId : null;
  const access = await accessFromLease(connectionId, raw.access, userId ?? "").catch(async (e) => {
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "lease token", error: e });
    return { ok: false as const, why: "failing" as const };
  });
  if (!access.ok) {
    await giveBack();
    if (access.why === "revoked" && access.firstRevoked && userId) {
      after(() => notifyReconnect({ connectionId, userId, why: "revoked" }));
    }
    if (access.why === "failing") {
      await recordSignalFailure({
        job: "drive_transfer",
        area: "export",
        operation: "token refresh refused (not a revocation)",
        error: new Error("refresh failed"),
        extra: { connectionId },
      });
    }
    return internalJson({ state: access.why === "wait" ? "wait" : "paused" } satisfies LeaseAnswer);
  }

  const secret = assertDriveEnv().DRIVE_WORKER_SECRET;
  if (!raw.folderId) {
    // A send always has its folder before it runs (`cloud_export_ready`); one without is a bug, never a send to her
    // Drive's root.
    await giveBack();
    await recordSignalFailure({
      job: "drive_transfer",
      area: "export",
      operation: "a lease with no folder",
      error: new Error("send without a folder"),
      extra: { jobId: raw.jobId },
    });
    return internalJson({ state: "wait" } satisfies LeaseAnswer);
  }

  if (raw.state === "check") {
    const items: CheckItem[] = raw.items.map((i) => ({ mediaId: i.mediaId, fileId: i.fileId, bytes: i.bytes, md5: i.md5 }));
    return internalJson({
      state: "check",
      lease: raw.lease,
      until: raw.until,
      jobId: raw.jobId,
      folderId: raw.folderId,
      first: raw.first,
      token: sealForLease(secret, access.token, raw.lease),
      items,
    } satisfies LeaseAnswer);
  }

  let items;
  try {
    items = await leaseItemsFor({
      lease: raw.lease,
      eventId: raw.eventId,
      albumName: raw.albumName,
      tz: raw.tz,
      items: raw.items,
    });
  } catch (e) {
    await giveBack();
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "naming a lease", error: e });
    return internalJson({ state: "wait" } satisfies LeaseAnswer);
  }
  return internalJson({
    state: "work",
    lease: raw.lease,
    until: raw.until,
    jobId: raw.jobId,
    folderId: raw.folderId,
    token: sealForLease(secret, access.token, raw.lease),
    items,
  } satisfies LeaseAnswer);
}
