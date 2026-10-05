/**
 * THE APP'S HANDS ON A SEND (drive-export.md): an access token for a connection (the cached one, or the refresh this
 * caller won), the folders a send lands in, the names a lease hands out, and the kick that wakes the Worker. The
 * routes and the Server Actions call these; the database's half is `queries/drive.ts`, Google's is `google.ts`.
 *
 * ★ THE REFRESH TOKEN NEVER LEAVES THIS RUNTIME. It is opened here, sent to Google's token endpoint here, and its
 * answer is sealed again here before it touches the database; what the Worker gets is an hour of access, sealed for
 * its lease (`protocol.ts`).
 *
 * ★ A KEY NEITHER OF OURS OPENS IS A BROKEN CONNECTION, NEVER AN ERROR PAGE: the row reads revoked (her tokens
 * wiped, her sends paused `disconnected`) and she reconnects.
 */
import "server-only";

import {
  kickWordSchema,
  signDriveWord,
  DRIVE_PATHS,
  DRIVE_PROTOCOL_VERSION,
  type LeaseItem,
} from "@/lib/drive/protocol";
import {
  createFolder,
  driveFileState,
  refreshAccess,
  undoFolder,
  type CreatedFolder,
} from "@/lib/drive/google";
import { needsReseal, openToken, sealToken, type TokenKeys } from "@/lib/drive/tokens.server";
import {
  claimRoot,
  claimToken,
  lanesToKick,
  markReady,
  nameItems,
  readAlbumNaming,
  readSenders,
  readTokenRow,
  recordRefreshed,
  recordRefreshFailed,
  refolderSend,
  tokenClaimOf,
  type FolderFacts,
  type RawLeaseItem,
  type TokenClaim,
} from "@/lib/db/queries/drive";
import {
  DRIVE_ROOT_FOLDER_NAME,
  driveContentType,
  driveFileDescription,
  driveFileExt,
  driveFileStem,
  driveFolderName,
  driveModifiedTime,
} from "@/lib/export/drive-names";
import { assertDriveEnv } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";

/** The token keys, from the env (asserted). */
export function tokenKeys(): TokenKeys {
  const env = assertDriveEnv();
  return { current: env.DRIVE_TOKEN_KEY, previous: env.DRIVE_TOKEN_KEY_PREVIOUS ?? null };
}

export type AccessResult =
  | { ok: true; token: string; expiresAt: string }
  /**
   * revoked: Google said invalid_grant, or no key of ours opens the row (she reconnects); wait: another caller holds
   * the refresh (ask again in a moment); failing: Google could not be reached or refused for another reason;
   * missing: no connection.
   */
  | { ok: false; why: "revoked" | "wait" | "failing" | "missing"; firstRevoked?: boolean };

/** What a refresh that failed does, and says: the row's state, and whether it is news (one reconnect mail). */
async function refreshFailed(
  connectionId: string,
  error: string,
  revoked: boolean,
): Promise<AccessResult> {
  const r = await recordRefreshFailed({ connectionId, error, revoked });
  return revoked ? { ok: false, why: "revoked", firstRevoked: r.first } : { ok: false, why: "failing" };
}

/**
 * THE ACCESS TOKEN FROM A CLAIM: open the cached one, or refresh at Google with the one this caller won, sealing the
 * answer (and re-sealing the refresh token under the current key, or the one Google rotated) before it is kept.
 */
export async function resolveAccess(
  connectionId: string,
  claim: TokenClaim,
  keys: TokenKeys = tokenKeys(),
): Promise<AccessResult> {
  if (claim.state !== "cached" && claim.state !== "refresh") return { ok: false, why: claim.state };
  const userId = claim.userId;

  if (claim.state === "cached") {
    const token = openToken(claim.accessCt, { userId, provider: "google_drive", purpose: "access" }, keys);
    if (token) return { ok: true, token, expiresAt: claim.expiresAt };
    // The access slot did not open (a key rotated away): the refresh token decides, through its own claim.
    const again = await claimToken(connectionId);
    if (again.state !== "refresh") {
      return again.state === "cached" ? refreshFailed(connectionId, "token key", true) : resolveAccess(connectionId, again, keys);
    }
    return resolveAccess(connectionId, again, keys);
  }

  const refresh = openToken(claim.refreshCt, { userId, provider: "google_drive", purpose: "refresh" }, keys);
  if (!refresh) return refreshFailed(connectionId, "no key of ours opens the refresh token", true);

  const env = assertDriveEnv();
  const answer = await refreshAccess({
    clientId: env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET,
    refreshToken: refresh,
  });
  if (!answer.ok) return refreshFailed(connectionId, answer.error, answer.revoked);

  const expiresAt = new Date(Date.now() + answer.expiresIn * 1000).toISOString();
  const accessCt = sealToken(answer.accessToken, { userId, provider: "google_drive", purpose: "access" }, keys);
  const rotated = answer.refreshToken && answer.refreshToken !== refresh ? answer.refreshToken : null;
  const refreshCt =
    rotated !== null
      ? sealToken(rotated, { userId, provider: "google_drive", purpose: "refresh" }, keys)
      : needsReseal(claim.refreshCt, keys)
        ? sealToken(refresh, { userId, provider: "google_drive", purpose: "refresh" }, keys)
        : null;
  await recordRefreshed({ connectionId, accessCt, accessExpiresAt: expiresAt, refreshCt });
  return { ok: true, token: answer.accessToken, expiresAt };
}

/** An access token for a caller outside a lease (a press, Check again, an operator): a brief wait for a claim. */
export async function accessTokenFor(connectionId: string): Promise<AccessResult> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await resolveAccess(connectionId, await claimToken(connectionId));
    if (result.ok || result.why !== "wait") return result;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return { ok: false, why: "wait" };
}

/** The lease's own token answer, resolved: the claim rode inside the lease's transaction. */
export async function accessFromLease(connectionId: string, access: unknown, userId: string): Promise<AccessResult> {
  return resolveAccess(connectionId, tokenClaimOf(access, userId));
}

// ── Folders ─────────────────────────────────────────────────────────────────────────────────────

/**
 * THE FOLDERS A SEND LANDS IN, MADE AT THE PRESS: the Partyreel folder (asked again each press: she may have moved it
 * to her bin), then the album's (kept for its next send; a new one if hers went to the bin or is gone), and the send
 * starts (`markReady`). Two presses at once leave one Partyreel folder: the root is compare-and-set, and the loser
 * undoes its own empty folder by the id Google just returned.
 */
export async function makeSendFolders(input: {
  jobId: string;
  facts: FolderFacts;
  accessToken: string;
}): Promise<{ folderId: string }> {
  const { facts, accessToken } = input;
  const root = await ensureRoot(accessToken, facts.connectionId, facts.rootFolderId);

  let folderId = root.changed ? null : facts.folderId;
  if (folderId) {
    const state = await driveFileState(accessToken, folderId);
    if (!state || state.trashed) folderId = null;
  }
  let made: CreatedFolder | null = null;
  if (!folderId) {
    made = await createFolder(accessToken, {
      name: driveFolderName({ name: facts.albumName, eventDate: facts.eventDate, endDate: facts.eventEndDate }),
      parentId: root.id,
    });
    folderId = made.id;
  }
  const ok = await markReady(input.jobId, folderId);
  if (!ok) {
    // Canceled while the folder was being made: the empty folder made for it goes, by the id Google just returned.
    if (made) await undoFolder(accessToken, made).catch(() => undefined);
    throw new Error("drive: the send was no longer waiting for its folder");
  }
  return { folderId };
}

/**
 * THE PARTYREEL FOLDER, THERE AND OUT OF THE BIN: asked again (she may have binned or deleted it), made again when it
 * is not, compare-and-set, the loser undoing its own empty folder.
 */
async function ensureRoot(
  accessToken: string,
  connectionId: string,
  known: string | null,
): Promise<{ id: string; changed: boolean }> {
  const state = known ? await driveFileState(accessToken, known) : null;
  if (known && state && !state.trashed) return { id: known, changed: false };
  const made: CreatedFolder = await createFolder(accessToken, { name: DRIVE_ROOT_FOLDER_NAME, colored: true });
  const claim = await claimRoot({ connectionId, candidate: made.id, expected: known });
  if (!claim.won) await undoFolder(accessToken, made);
  const id = claim.root ?? made.id;
  return { id, changed: id !== known };
}

/**
 * "SEND TO A NEW FOLDER" (the album's folder went to her bin): a new folder under the Partyreel folder, named for the
 * album as it is now, and the paused send goes on into it; the album's next send lands there too. A send that could
 * not take it (canceled meanwhile) leaves no empty folder behind.
 */
export async function makeNewAlbumFolder(input: {
  userId: string;
  jobId: string;
  eventId: string;
  connectionId: string;
  rootFolderId: string | null;
  fallbackName: string;
  accessToken: string;
}): Promise<boolean> {
  const root = await ensureRoot(input.accessToken, input.connectionId, input.rootFolderId);
  const album = await readAlbumNaming(input.eventId);
  const made = await createFolder(input.accessToken, {
    name: driveFolderName({
      name: album?.name || input.fallbackName,
      eventDate: album?.eventDate ?? null,
      endDate: album?.eventEndDate ?? null,
    }),
    parentId: root.id,
  });
  const ok = await refolderSend({ userId: input.userId, jobId: input.jobId, folderId: made.id });
  if (!ok) await undoFolder(input.accessToken, made).catch(() => undefined);
  return ok;
}

// ── A lease's items ─────────────────────────────────────────────────────────────────────────────

/**
 * WHAT A LANE GETS FOR EACH ORIGINAL: its name (made now for one not yet named: when it arrived, then who, by the one
 * naming function; the " (2)" kept by the SQL), its description, Drive's `modifiedTime`, its type, and any session or
 * earlier file to resume from.
 */
export async function leaseItemsFor(input: {
  lease: string;
  eventId: string;
  albumName: string;
  tz: string;
  items: RawLeaseItem[];
}): Promise<LeaseItem[]> {
  const senders = await readSenders(
    input.eventId,
    input.items.map((i) => i.mediaId),
  );
  const unnamed = input.items.filter((i) => !i.name);
  const named =
    unnamed.length > 0
      ? await nameItems(
          input.lease,
          unnamed.map((i) => ({
            mediaId: i.mediaId,
            stem: driveFileStem({ arrivedAt: i.createdAt, capturedAt: null, tz: input.tz, who: senders.get(i.mediaId) }),
            ext: driveFileExt({ originalKey: i.key, type: i.type }),
          })),
        )
      : new Map<string, string>();
  return input.items
    .map((i): LeaseItem | null => {
      const name = i.name ?? named.get(i.mediaId) ?? null;
      if (!name) return null;
      const ext = driveFileExt({ originalKey: i.key, type: i.type });
      return {
        mediaId: i.mediaId,
        key: i.key,
        bytes: i.bytes,
        contentType: driveContentType(ext, i.type),
        name,
        description: driveFileDescription({
          who: senders.get(i.mediaId),
          albumName: input.albumName,
          arrivedAt: i.createdAt,
          capturedAt: null,
          tz: input.tz,
        }),
        modifiedTime: driveModifiedTime({ arrivedAt: i.createdAt, capturedAt: null }),
        attempts: i.attempts,
        priorFileId: i.priorFileId,
        session: i.sessionUri ? { uri: i.sessionUri, offset: i.sessionOffset ?? 0 } : null,
      };
    })
    .filter((i): i is LeaseItem => i !== null);
}

// ── The kick ────────────────────────────────────────────────────────────────────────────────────

/**
 * WAKE THE WORKER FOR A CONNECTION: as many lanes as are missing (at most once a minute), as a signed POST to its
 * `/kick`. Best-effort by design: a kick that does not land is the sweep's to make within five minutes, so a failure
 * is a warning, never a refusal of her press.
 */
export async function kickConnection(connectionId: string): Promise<number> {
  let lanes = 0;
  try {
    lanes = await lanesToKick(connectionId);
    if (lanes <= 0) return 0;
    const env = assertDriveEnv();
    const word = kickWordSchema.parse({
      v: DRIVE_PROTOCOL_VERSION,
      kind: "kick",
      at: Date.now(),
      connectionId,
      lanes,
    });
    const res = await fetch(new URL(DRIVE_PATHS.kick, env.DRIVE_WORKER_URL), {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: signDriveWord(env.DRIVE_WORKER_SECRET, word),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!res.ok) {
      captureWarning("export", "drive_kick_refused", { status: res.status, lanes });
    }
    return lanes;
  } catch (e) {
    captureError("export", e, { action: "drive_kick", lanes });
    return lanes;
  }
}

/** The ciphertexts of a connection, opened (the Disconnect's revoke). Null where no key of ours opens them. */
export async function openConnectionTokens(connectionId: string): Promise<{ refresh: string | null; access: string | null } | null> {
  const row = await readTokenRow(connectionId);
  if (!row) return null;
  const keys = tokenKeys();
  return {
    refresh: openToken(row.refreshCt, { userId: row.userId, provider: "google_drive", purpose: "refresh" }, keys),
    access: openToken(row.accessCt, { userId: row.userId, provider: "google_drive", purpose: "access" }, keys),
  };
}
