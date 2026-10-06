/**
 * THE DRIVE ADAPTER (drive-export.md, "One file" and "Never a duplicate"): every call this Worker makes to Google, on
 * the `drive.file` scope (only files Partyreel made), through four addresses: files (get, list by our own
 * appProperties, delete our own just-made file), the resumable upload, and the folder listing that counts duplicates.
 * `google-urls.test.ts` in the app holds every Google URL here to the app's allowlist.
 *
 * ★ THE WORKER'S ONE WRITE THAT REMOVES ANYTHING IS UNDOING ITS OWN FAILED UPLOAD, AND THE TYPES MAKE IT SO (the
 * Advisor's Q27 N4): only a fresh upload's completion makes a `CreatedFile`, and `undo` takes nothing else, so no path
 * here can delete a recorded `drive_file_id`, a file she moved, or anything a send before this one made. Partyreel never
 * deletes or bins anything in her Drive on its own.
 *
 * Errors are classified once (`classify`): Drive full, Google's day, "slow down", a lost grant, her admin's policy, a
 * folder past its 500,000 children, a parent gone, Google's own trouble, or ours.
 *
 * ★ EVERY ANSWER IS READ OR CANCELED: one nobody reads (a 404's error body, a session start's empty one, an undo's) is
 * held until it is collected, while a check runs eight asks at once. Cloudflare counts only the connections still
 * awaiting their headers against its six (since 2026-04-09), so an unread body no longer stalls the next ask; its own
 * advice stands all the same: cancel what you will not read (the Workers limits page).
 */

const FILES = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

/** Every Google call's ceiling but a chunk's (a chunk of 128 MiB takes as long as the network takes). */
export const DRIVE_CALL_MS = 30_000;
export const DRIVE_CHUNK_MS = 10 * 60_000;

export type DriveFile = {
  id: string;
  size: number | null;
  md5: string | null;
  trashed: boolean;
  /** Our own mark: the send that made it (asked only where it decides whether a file was kept or sent). */
  job?: string | null;
};

export type ErrorKind =
  | "quota"
  | "daily"
  | "rate"
  | "auth"
  | "domain"
  | "not_found"
  | "folder_full"
  | "server"
  | "client";

export class DriveError extends Error {
  constructor(
    readonly kind: ErrorKind,
    readonly status: number,
    readonly reason: string | null,
    message: string,
  ) {
    super(message);
    this.name = "DriveError";
  }
}

/** One Google answer, classified by its status and its first error reason. */
export function classify(status: number, reason: string | null): ErrorKind {
  if (status === 401) return "auth";
  if (status === 429) return "rate";
  if (status === 403) {
    if (reason === "storageQuotaExceeded") return "quota";
    if (reason === "dailyLimitExceeded" || reason === "uploadLimitExceeded")
      return "daily";
    if (reason === "userRateLimitExceeded" || reason === "rateLimitExceeded")
      return "rate";
    if (reason === "domainPolicy") return "domain";
    if (reason === "numChildrenInNonRootLimitExceeded") return "folder_full";
    return "client";
  }
  if (status === 404) return "not_found";
  if (status >= 500) return "server";
  return "client";
}

async function errorOf(res: Response, what: string): Promise<DriveError> {
  const body = (await res.json().catch(() => null)) as {
    error?: { errors?: { reason?: string }[] };
  } | null;
  const reason = body?.error?.errors?.[0]?.reason ?? null;
  return new DriveError(
    classify(res.status, reason),
    res.status,
    reason,
    `${what}: HTTP ${res.status}${reason ? ` ${reason}` : ""}`,
  );
}

function fileOf(raw: unknown): DriveFile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as {
    id?: unknown;
    size?: unknown;
    md5Checksum?: unknown;
    trashed?: unknown;
    appProperties?: { pr_job?: unknown };
  };
  if (typeof r.id !== "string" || !r.id) return null;
  const size =
    typeof r.size === "string" || typeof r.size === "number"
      ? Number(r.size)
      : null;
  return {
    id: r.id,
    size: size !== null && Number.isFinite(size) ? size : null,
    md5: typeof r.md5Checksum === "string" ? r.md5Checksum.toLowerCase() : null,
    trashed: r.trashed === true,
    job:
      typeof r.appProperties?.pr_job === "string"
        ? r.appProperties.pr_job
        : null,
  };
}

const CREATED = Symbol("created by this upload");

/** A file this very upload created: the one thing `undo` accepts. */
export type CreatedFile = DriveFile & {
  readonly [CREATED]: true;
  readonly createdAtMs: number;
};

function created(file: DriveFile, nowMs: number): CreatedFile {
  return Object.assign({}, file, {
    [CREATED]: true as const,
    createdAtMs: nowMs,
  });
}

/** What a new file says about itself in her Drive (the lease's name, description, moment, and our private marks). */
export type FileMeta = {
  name: string;
  parentId: string;
  mimeType: string;
  modifiedTime: string;
  description: string;
  mediaId: string;
  jobId: string;
};

export type ChunkResult =
  | { done: false; next: number }
  | { done: true; file: CreatedFile };

export type SessionState = ChunkResult | { gone: true };

export type DriveAdapter = ReturnType<typeof driveAdapter>;

export function driveAdapter(
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const call = (
    url: string,
    token: string,
    init: RequestInit = {},
    ms = DRIVE_CALL_MS,
  ) =>
    fetchImpl(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...((init.headers as Record<string, string>) ?? {}),
      },
      signal: AbortSignal.timeout(ms),
    });

  /** A 308's `Range: bytes=0-N`: the next byte Google wants. No header: it holds none yet. */
  const nextFrom = (res: Response): number => {
    const range = res.headers.get("range");
    const match = range ? /bytes=0-(\d+)/.exec(range) : null;
    return match ? Number(match[1]) + 1 : 0;
  };

  /** A file of ours by its id, or null when Google no longer has it. */
  async function getFile(
    token: string,
    fileId: string,
  ): Promise<DriveFile | null> {
    const res = await call(
      `${FILES}/${encodeURIComponent(fileId)}?fields=id,size,md5Checksum,trashed`,
      token,
    );
    if (res.status === 404) {
      await res.body?.cancel();
      return null;
    }
    if (!res.ok) throw await errorOf(res, "files.get");
    return fileOf(await res.json());
  }

  return {
    getFile,

    /**
     * A file this media already has in her Drive, wherever she moved it (our private `pr_media` mark, no parent
     * clause), out of the bin. How a re-leased item whose report was lost is recorded instead of sent twice.
     */
    async findByMedia(
      token: string,
      mediaId: string,
    ): Promise<DriveFile | null> {
      const q = `appProperties has { key='pr_media' and value='${mediaId.replace(/[^0-9a-f-]/gi, "")}' } and trashed = false`;
      const url = `${FILES}?q=${encodeURIComponent(q)}&fields=${encodeURIComponent("files(id,size,md5Checksum,trashed,appProperties)")}&pageSize=10&spaces=drive`;
      const res = await call(url, token);
      if (!res.ok) throw await errorOf(res, "files.list (pr_media)");
      const body = (await res.json()) as { files?: unknown[] };
      for (const raw of body.files ?? []) {
        const file = fileOf(raw);
        if (file && !file.trashed) return file;
      }
      return null;
    },

    /** Open a resumable session for a new file: its URI (a capability for a week). */
    async startSession(
      token: string,
      meta: FileMeta,
      size: number,
    ): Promise<string> {
      const res = await call(
        `${UPLOAD}?uploadType=resumable&fields=id,size,md5Checksum,trashed`,
        token,
        {
          method: "POST",
          headers: {
            "content-type": "application/json; charset=UTF-8",
            "x-upload-content-type": meta.mimeType,
            "x-upload-content-length": String(size),
          },
          body: JSON.stringify({
            name: meta.name,
            parents: [meta.parentId],
            mimeType: meta.mimeType,
            modifiedTime: meta.modifiedTime,
            description: meta.description,
            appProperties: { pr_media: meta.mediaId, pr_job: meta.jobId },
          }),
        },
      );
      if (!res.ok) throw await errorOf(res, "files.create (resumable)");
      // The session is the Location header; the body is empty (Google's own words) and never read.
      await res.body?.cancel();
      const uri = res.headers.get("location");
      if (!uri)
        throw new DriveError(
          "server",
          res.status,
          null,
          "files.create (resumable): no session",
        );
      return uri;
    },

    /** The whole file in one PUT (Google's own advice up to a chunk's size). */
    async putWhole(
      sessionUri: string,
      token: string,
      body: ReadableStream,
      size: number,
    ): Promise<CreatedFile> {
      const res = await call(
        sessionUri,
        token,
        {
          method: "PUT",
          headers: { "content-length": String(size) },
          body,
        },
        DRIVE_CHUNK_MS,
      );
      if (res.status !== 200 && res.status !== 201)
        throw await errorOf(res, "upload (whole)");
      const file = fileOf(await res.json());
      if (!file)
        throw new DriveError(
          "server",
          res.status,
          null,
          "upload (whole): no file",
        );
      return created(file, now());
    },

    /** One chunk at `offset` (a multiple of 256 KiB but the last): Google's next byte, or the file when done. */
    async putChunk(
      sessionUri: string,
      token: string,
      body: ReadableStream,
      offset: number,
      length: number,
      total: number,
    ): Promise<ChunkResult> {
      const res = await call(
        sessionUri,
        token,
        {
          method: "PUT",
          headers: {
            "content-length": String(length),
            "content-range": `bytes ${offset}-${offset + length - 1}/${total}`,
          },
          body,
        },
        DRIVE_CHUNK_MS,
      );
      if (res.status === 308) {
        await res.body?.cancel();
        return { done: false, next: nextFrom(res) };
      }
      if (res.status !== 200 && res.status !== 201)
        throw await errorOf(res, "upload (chunk)");
      const file = fileOf(await res.json());
      if (!file)
        throw new DriveError(
          "server",
          res.status,
          null,
          "upload (chunk): no file",
        );
      return { done: true, file: created(file, now()) };
    },

    /**
     * Where a session stands, asked of Google (`Content-Range: bytes * /size`), never trusted from our own offset: the
     * next byte it wants, the file if it already finished, or gone (a week passed, or it was abandoned: start over).
     */
    async querySession(
      sessionUri: string,
      token: string,
      total: number,
    ): Promise<SessionState> {
      const res = await call(sessionUri, token, {
        method: "PUT",
        headers: { "content-length": "0", "content-range": `bytes */${total}` },
      });
      if (res.status === 308) {
        await res.body?.cancel();
        return { done: false, next: nextFrom(res) };
      }
      if (res.status === 200 || res.status === 201) {
        const file = fileOf(await res.json());
        if (file) return { done: true, file: created(file, now()) };
      }
      if (res.status === 404 || res.status === 410) {
        await res.body?.cancel();
        return { gone: true };
      }
      throw await errorOf(res, "upload (status)");
    },

    /** The album folder's own state: still there, in her bin, or gone. */
    async folderState(
      token: string,
      folderId: string,
    ): Promise<"ok" | "trashed" | "gone"> {
      const file = await getFile(token, folderId);
      if (!file) return "gone";
      return file.trashed ? "trashed" : "ok";
    },

    /** One page of the album folder's files, each one's `pr_media` mark (to count duplicates; nothing is binned). */
    async listFolderMedia(
      token: string,
      folderId: string,
      pageToken: string | null,
    ): Promise<{ media: string[]; next: string | null }> {
      const q = `'${folderId.replace(/[^A-Za-z0-9_-]/g, "")}' in parents and trashed = false`;
      const url =
        `${FILES}?q=${encodeURIComponent(q)}&fields=${encodeURIComponent("nextPageToken,files(id,appProperties)")}` +
        `&pageSize=1000&spaces=drive${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await call(url, token);
      if (!res.ok) throw await errorOf(res, "files.list (folder)");
      const body = (await res.json()) as {
        nextPageToken?: string;
        files?: { appProperties?: { pr_media?: unknown } }[];
      };
      const media = (body.files ?? [])
        .map((f) => f.appProperties?.pr_media)
        .filter((m): m is string => typeof m === "string");
      return { media, next: body.nextPageToken ?? null };
    },

    /**
     * UNDO A FILE THIS UPLOAD JUST MADE (its size or fingerprint did not match ours): the one deletion this Worker can
     * make, and only of a `CreatedFile`, minutes old. Best-effort: a mismatched file left behind is counted, never a
     * reason to fail the item twice.
     */
    async undo(token: string, file: CreatedFile): Promise<boolean> {
      if (
        !(file as { [CREATED]?: true })[CREATED] ||
        now() - file.createdAtMs > 30 * 60_000
      )
        return false;
      try {
        const res = await call(
          `${FILES}/${encodeURIComponent(file.id)}`,
          token,
          { method: "DELETE" },
        );
        await res.body?.cancel();
        return res.ok || res.status === 404;
      } catch {
        return false;
      }
    },
  };
}
