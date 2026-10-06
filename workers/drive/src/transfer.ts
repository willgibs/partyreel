/**
 * ONE ORIGINAL, FROM R2 INTO HER DRIVE (drive-export.md, "One file"): a Google resumable upload, always one code path.
 *
 *  1. The original's facts from R2 (a HEAD: its size, and the MD5 R2 keeps for a single-part object). None: the row
 *     outlived its object, a bug worth seeing: skipped, `missing_object`.
 *  2. An earlier send's file (`priorFileId`): asked for first, and KEPT when it is still there, out of the bin, its size
 *     ours and its MD5 ours where we know ours, so sending again never duplicates, and a file she deleted goes again.
 *  3. A re-leased item (its report may have been lost after Google stored it): looked up by our private `pr_media`
 *     mark, wherever she moved it, and recorded rather than sent twice.
 *  4. A big file's session (`session`): Google asked where it stands (never our own offset), resumed from there; gone
 *     after its week, started over.
 *  5. Up to 128 MiB: one PUT of the whole object, streamed (nothing buffers; a Worker has 128 MB). Past it: chunks of
 *     128 MiB, each a ranged R2 read, the session reported BEFORE its first byte (write-ahead), so whoever leases the
 *     item next resumes the same session; a slice nearly out, or a stop the app said (her Cancel, a pause), stops at a
 *     chunk boundary and releases the item.
 *  6. Checked as it lands: Drive's size and MD5 against ours (R2's, or one computed natively over a second read where R2
 *     kept none, a multipart clip). A mismatch undoes the file this upload just made (the one deletion this Worker can
 *     make, `CreatedFile` only) and the item goes again.
 *
 * Every Google answer that is about her Drive (full, its day, "slow down" that will not let up, a lost grant, her
 * admin's policy, a folder gone) comes back as a FINDING with the item released (the attempt not counted): the report
 * pauses or slows every send of the connection.
 */
import {
  DriveError,
  type CreatedFile,
  type DriveAdapter,
  type DriveFile,
} from "./google-drive";
import type { Finding, LeaseItem, ReportItem } from "./protocol";

/** Chunks of 128 MiB (a multiple of 256 KiB, as Google requires of every chunk but the last). */
export const CHUNK_BYTES = 128 * 1024 * 1024;

/** "Slow down", inside the slice: 1, 2, 4 ... 64 s with jitter, about two minutes in all, then the lane slows. */
export const RATE_BACKOFF_MS = [
  1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 64_000,
];

/** A chunk is not started unless this much of the slice is left (a 128 MiB chunk at 10 Mbps is about two minutes). */
export const CHUNK_HEADROOM_MS = 3 * 60_000;

/** What R2 says about an object: just what a transfer reads. */
export type ObjectFacts = { size: number; md5: string | null };

/** The bucket, as a transfer needs it (the binding in production, a fake in the tests). */
export type Bucket = {
  head(key: string): Promise<ObjectFacts | null>;
  /** The whole object, or a range of it, as a stream; null when it is gone. */
  read(
    key: string,
    range?: { offset: number; length: number },
  ): Promise<ReadableStream | null>;
};

export type TransferContext = {
  token: string;
  jobId: string;
  folderId: string;
  drive: DriveAdapter;
  bucket: Bucket;
  /** The stream a body travels as (a FixedLengthStream in the runtime, so Content-Length is exact; identity in tests). */
  fixedLength(stream: ReadableStream, length: number): ReadableStream;
  /** MD5 of a stream, natively (crypto.DigestStream in the runtime). */
  md5Of(stream: ReadableStream): Promise<string>;
  /** Report a big file's session at once, before its first byte (and after each chunk). */
  progress(item: LeaseItem, sessionUri: string, offset: number): Promise<void>;
  /** The moment the slice must have stopped by; a chunk is not started past `deadline - CHUNK_HEADROOM_MS`. */
  deadlineMs: number;
  now(): number;
  sleep(ms: number): Promise<void>;
  /** Jitter for the backoff, 0..1 (Math.random in production). */
  random(): number;
  /** The chunk size (CHUNK_BYTES; a test's own smaller one, a multiple of 256 KiB all the same). */
  chunkBytes?: number;
  /** The app said stop (her Cancel, a pause, the switch): a big file stops at its next chunk boundary, session kept. */
  stopping?(): boolean;
};

export type TransferResult = { item: ReportItem; finding?: Finding };

const released = (item: LeaseItem, finding?: Finding): TransferResult => ({
  item: { mediaId: item.mediaId, outcome: "released" },
  ...(finding ? { finding } : {}),
});

/** The finding a Google error is about, if it is about her Drive rather than this one file. */
function findingOf(error: DriveError): Finding | null {
  switch (error.kind) {
    case "quota":
      return "drive_full";
    case "daily":
      return "daily_limit";
    case "auth":
      return "auth";
    case "domain":
      return "domain_policy";
    default:
      return null;
  }
}

/** A file in her Drive matches ours: its size equal, and its MD5 equal wherever both are known. */
function matches(
  file: DriveFile,
  facts: ObjectFacts,
  md5: string | null,
): boolean {
  if (file.trashed || file.size !== facts.size) return false;
  return !md5 || !file.md5 || file.md5 === md5;
}

/** Retry a Google call through "slow down", then give up as `rate` (the lane's slow-down finding). */
async function withRate<T>(
  ctx: TransferContext,
  run: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (e) {
      if (
        !(e instanceof DriveError) ||
        e.kind !== "rate" ||
        attempt >= RATE_BACKOFF_MS.length
      )
        throw e;
      await ctx.sleep(RATE_BACKOFF_MS[attempt]! * (0.75 + ctx.random() / 2));
    }
  }
}

/** Upload chunks from `from` to the end, or stop at a boundary when the slice is nearly out or the app said stop. */
async function sendChunks(
  ctx: TransferContext,
  item: LeaseItem,
  sessionUri: string,
  from: number,
  total: number,
): Promise<{ file: CreatedFile } | { stoppedAt: number }> {
  let offset = from;
  while (offset < total) {
    if (ctx.now() > ctx.deadlineMs - CHUNK_HEADROOM_MS || ctx.stopping?.())
      return { stoppedAt: offset };
    const length = Math.min(ctx.chunkBytes ?? CHUNK_BYTES, total - offset);
    const body = await ctx.bucket.read(item.key, { offset, length });
    if (!body) throw new MissingObject();
    const result = await withRate(ctx, () =>
      ctx.drive.putChunk(
        sessionUri,
        ctx.token,
        ctx.fixedLength(body, length),
        offset,
        length,
        total,
      ),
    );
    if (result.done) return { file: result.file };
    offset = result.next;
    await ctx.progress(item, sessionUri, offset);
  }
  // Every byte went and Google did not close it: ask once where it stands.
  const state = await ctx.drive.querySession(sessionUri, ctx.token, total);
  if ("gone" in state)
    throw new DriveError("server", 404, null, "session gone at its end");
  if (state.done) return { file: state.file };
  return { stoppedAt: state.next };
}

class MissingObject extends Error {
  constructor() {
    super("original missing in R2");
    this.name = "MissingObject";
  }
}

const hex = (s: string | null) => (s && /^[0-9a-f]{32}$/.test(s) ? s : null);

/** Send one original. Never throws: every end is a report item (and maybe a finding). */
export async function sendOne(
  ctx: TransferContext,
  item: LeaseItem,
): Promise<TransferResult> {
  // A session Google holds for this item (resumed, or written ahead in this run): a failure keeps it, so the next
  // lease resumes rather than starts over.
  let liveSession: string | null = item.session?.uri ?? null;
  try {
    const facts = await ctx.bucket.head(item.key);
    if (!facts)
      return {
        item: {
          mediaId: item.mediaId,
          outcome: "skipped",
          reason: "missing_object",
        },
      };

    // 2. An earlier send's file, still hers and whole: kept.
    if (item.priorFileId) {
      const prior = await withRate(ctx, () =>
        ctx.drive.getFile(ctx.token, item.priorFileId!),
      );
      if (prior && matches(prior, facts, facts.md5)) {
        return {
          item: {
            mediaId: item.mediaId,
            outcome: "sent",
            fileId: prior.id,
            kept: true,
            ...(hex(prior.md5) ? { md5: prior.md5! } : {}),
          },
        };
      }
    }

    // 3. A re-leased item: Google may already hold it (a report lost after the upload).
    if (item.attempts > 1 || item.session) {
      const found = await withRate(ctx, () =>
        ctx.drive.findByMedia(ctx.token, item.mediaId),
      );
      if (found && matches(found, facts, facts.md5)) {
        return {
          item: {
            mediaId: item.mediaId,
            outcome: "sent",
            fileId: found.id,
            kept: found.job !== ctx.jobId,
            ...(hex(found.md5) ? { md5: found.md5! } : {}),
          },
        };
      }
    }

    // 4 and 5. The bytes: a session resumed, or a new one.
    let file: CreatedFile | null = null;
    let sessionUri: string | null = null;
    let from = 0;
    if (item.session) {
      const state = await withRate(ctx, () =>
        ctx.drive.querySession(item.session!.uri, ctx.token, facts.size),
      );
      if (!("gone" in state)) {
        sessionUri = item.session.uri;
        if (state.done) file = state.file;
        else from = state.next;
      } else {
        liveSession = null;
      }
    }
    if (!file) {
      if (!sessionUri) {
        try {
          sessionUri = await withRate(ctx, () =>
            ctx.drive.startSession(
              ctx.token,
              {
                name: item.name,
                parentId: ctx.folderId,
                mimeType: item.contentType,
                modifiedTime: item.modifiedTime,
                description: item.description,
                mediaId: item.mediaId,
                jobId: ctx.jobId,
              },
              facts.size,
            ),
          );
        } catch (e) {
          // ★ A parent Google no longer has is the album's folder gone (deleted, not merely in the bin).
          if (e instanceof DriveError && e.kind === "not_found")
            return released(item, "folder_gone");
          throw e;
        }
      }
      if (facts.size <= (ctx.chunkBytes ?? CHUNK_BYTES) && from === 0) {
        const body = await ctx.bucket.read(item.key);
        if (!body) throw new MissingObject();
        const uri = sessionUri;
        file = await withRate(ctx, () =>
          ctx.drive.putWhole(
            uri,
            ctx.token,
            ctx.fixedLength(body, facts.size),
            facts.size,
          ),
        );
      } else {
        // Written ahead: whoever leases this item next resumes this very session.
        if (from === 0) await ctx.progress(item, sessionUri, 0);
        liveSession = sessionUri;
        const sent = await sendChunks(ctx, item, sessionUri, from, facts.size);
        if ("stoppedAt" in sent) {
          await ctx.progress(item, sessionUri, sent.stoppedAt);
          return released(item);
        }
        file = sent.file;
      }
    }

    // 6. Checked as it lands.
    let workerMd5: string | null = null;
    let expected = facts.md5;
    if (!expected) {
      const again = await ctx.bucket.read(item.key);
      if (!again) throw new MissingObject();
      workerMd5 = await ctx.md5Of(again);
      expected = workerMd5;
    }
    if (
      file.size !== facts.size ||
      (file.md5 && expected && file.md5 !== expected)
    ) {
      await ctx.drive.undo(ctx.token, file);
      return {
        item: {
          mediaId: item.mediaId,
          outcome: "failed",
          reason: `mismatch: Drive holds ${file.size ?? "?"} bytes, md5 ${file.md5 ?? "?"}`,
          retry: true,
        },
      };
    }
    return {
      item: {
        mediaId: item.mediaId,
        outcome: "sent",
        fileId: file.id,
        ...(hex(file.md5) ? { md5: file.md5! } : {}),
        ...(workerMd5 ? { workerMd5 } : {}),
      },
    };
  } catch (e) {
    if (e instanceof MissingObject) {
      return {
        item: {
          mediaId: item.mediaId,
          outcome: "skipped",
          reason: "missing_object",
        },
      };
    }
    if (e instanceof DriveError) {
      const finding = findingOf(e);
      if (finding) return released(item, finding);
      if (e.kind === "rate") return released(item, "throttled");
      if (e.kind === "folder_full") {
        return {
          item: {
            mediaId: item.mediaId,
            outcome: "failed",
            reason: "the album's folder holds 500,000 files",
            retry: false,
          },
        };
      }
      return {
        item: {
          mediaId: item.mediaId,
          outcome: "failed",
          reason: e.message.slice(0, 300),
          retry: e.kind === "server" || e.kind === "client",
          keepSession: e.kind === "server" && Boolean(liveSession),
        },
      };
    }
    // The network or the runtime: worth another try.
    return {
      item: {
        mediaId: item.mediaId,
        outcome: "failed",
        reason: String(e).slice(0, 300),
        retry: true,
        keepSession: Boolean(liveSession),
      },
    };
  }
}
