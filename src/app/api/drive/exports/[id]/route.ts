/**
 * HER ACTS ON ONE SEND (`POST /api/drive/exports/<id>`, the strip's buttons and the app-wide flag; drive-export.md).
 *
 *   cancel    the send ends; her lanes stop at their next report (within ten seconds); what reached her Drive stays,
 *             and sending again later takes only the rest.
 *   check     "Check again": for a full Drive, its room is asked now, and every send that paused on it resumes
 *             when it holds what they have left (otherwise she is told how much is still missing); for a folder in
 *             her bin, whether she restored it (then the send goes on into it).
 *   refolder  the album's folder went to her bin: a new folder is made and the send goes on into it.
 *   retry     a partly done send sends what failed again.
 *   seen      her app showed the stop's flag (it flags once).
 *
 * Not hers is a 404 through her own RLS read, so nothing leaks. Nothing here deletes anything of hers.
 */
import { after, NextResponse } from "next/server";

import { z } from "zod";

import { createFolder, driveRoom, DriveCallError } from "@/lib/drive/google";
import { accessTokenFor, kickConnection } from "@/lib/drive/service.server";
import { driveFolderName } from "@/lib/export/drive-names";
import {
  actOnSend,
  claimRoot,
  readConnection,
  readMySend,
  readSendFolderId,
  recordRoom,
  refolderSend,
} from "@/lib/db/queries/drive";
import { driveFileState } from "@/lib/drive/google";
import { DRIVE_ROOT_FOLDER_NAME } from "@/lib/export/drive-names";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ act: z.enum(["cancel", "check", "refolder", "retry", "seen"]) });

function answer(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return answer({ ok: false, code: "not_found" }, 404);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return answer({ ok: false, code: "bad_request" }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return answer({ ok: false, code: "bad_request" }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return answer({ ok: false, code: "unauthorized" }, 401);

  // Hers, through her own session: another host's id reads as nothing at all.
  const send = await readMySend(id);
  if (!send) return answer({ ok: false, code: "not_found" }, 404);

  const act = parsed.data.act;
  if (act === "cancel" || act === "retry" || act === "seen") {
    const r = await actOnSend({ userId: user.id, jobId: id, act });
    if (r.ok && act === "retry" && r.connectionId) {
      const connectionId = r.connectionId;
      after(() => kickConnection(connectionId).then(() => undefined));
    }
    return answer({ ok: r.ok, code: r.code, status: r.status }, r.ok ? 200 : 409);
  }

  const connection = await readConnection(user.id);
  if (!connection || connection.status === "revoked") return answer({ ok: false, code: "disconnected" }, 409);
  const access = await accessTokenFor(connection.id);
  if (!access.ok) return answer({ ok: false, code: access.why === "revoked" ? "disconnected" : "busy" }, 409);

  if (act === "check" && send.status === "paused" && send.pauseReason === "folder_gone") {
    // She restored the folder in Drive: out of the bin, the send goes on into it.
    try {
      const folderId = await readSendFolderId(id);
      const state = folderId ? await driveFileState(access.token, folderId) : null;
      if (!state || state.trashed) return answer({ ok: false, code: "still_in_bin" }, 409);
      const r = await actOnSend({ userId: user.id, jobId: id, act: "resume" });
      if (r.ok) after(() => kickConnection(connection.id).then(() => undefined));
      return answer({ ok: r.ok, code: r.code, status: r.status }, r.ok ? 200 : 409);
    } catch (e) {
      captureError("export", e, { action: "drive_check_folder" });
      return answer({ ok: false, code: "google_unreachable" }, 409);
    }
  }

  if (act === "check") {
    if (send.status !== "paused" || send.pauseReason !== "drive_full") {
      return answer({ ok: false, code: "not_full", status: send.status }, 409);
    }
    try {
      const room = await driveRoom(access.token);
      const r = await recordRoom({ connectionId: connection.id, limit: room.limit, usage: room.usage, resume: true });
      if (r.resumed > 0) {
        after(() => kickConnection(connection.id).then(() => undefined));
        return answer({ ok: true, status: "sending" });
      }
      return answer({
        ok: false,
        code: "still_full",
        free: room.limit === null ? null : Math.max(room.limit - room.usage, 0),
        needs: r.left,
      }, 409);
    } catch (e) {
      captureError("export", e, { action: "drive_check_again" });
      return answer({ ok: false, code: "google_unreachable" }, 409);
    }
  }

  // refolder: a new folder for the album, under the Partyreel folder (made again if it went to the bin too).
  if (send.status !== "paused" || send.pauseReason !== "folder_gone") {
    return answer({ ok: false, code: "not_folder_gone", status: send.status }, 409);
  }
  try {
    let root = connection.rootFolderId;
    const rootState = root ? await driveFileState(access.token, root) : null;
    if (!root || !rootState || rootState.trashed) {
      const made = await createFolder(access.token, { name: DRIVE_ROOT_FOLDER_NAME, colored: true });
      const claim = await claimRoot({ connectionId: connection.id, candidate: made.id, expected: root });
      root = claim.root ?? made.id;
    }
    const folder = await createFolder(access.token, {
      name: driveFolderName({ name: send.albumName }),
      parentId: root,
    });
    const ok = await refolderSend({ userId: user.id, jobId: id, folderId: folder.id });
    if (ok) after(() => kickConnection(connection.id).then(() => undefined));
    return answer({ ok, status: ok ? "sending" : send.status }, ok ? 200 : 409);
  } catch (e) {
    captureError("export", e, { action: "drive_refolder" });
    return answer(
      { ok: false, code: e instanceof DriveCallError && e.reason === "storageQuotaExceeded" ? "drive_full" : "google_unreachable" },
      409,
    );
  }
}
