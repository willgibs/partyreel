/**
 * ONE ORIGINAL INTO HER DRIVE, AGAINST A FAKE DRIVE AND A FAKE BUCKET: every end section 5 names that a single file can
 * meet, and the two promises that matter most: never a duplicate, and nothing of hers ever deleted (the only deletion
 * is undoing a file this very upload just made). ★ And Google's "slow down" on an upload's own bytes (drive-hardening):
 * the fakes are as strict as the wire (a body is spent by the PUT it rode, every answer must be read or canceled), so
 * a retry that handed back the stream it spent fails here as the runtime failed it.
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { driveAdapter } from "./google-drive";
import type { LeaseItem } from "./protocol";
import {
  FakeBucket,
  bytesOf,
  fixedLengthOf,
  md5OfStream,
} from "./testing/fake-bucket";
import { FakeDrive } from "./testing/fake-drive";
import { sendOne, type TransferContext } from "./transfer";

const MEDIA = "66666666-7777-4888-9999-aaaaaaaaaaaa";
const JOB = "11111111-2222-4333-8444-555555555555";
const KEY = `events/e/photo/${MEDIA}/original.jpg`;

function setup(
  opts: {
    size?: number;
    multipart?: boolean;
    chunkBytes?: number;
    deadlineMs?: number;
  } = {},
) {
  const drive = new FakeDrive();
  const bucket = new FakeBucket();
  const bytes = bytesOf(opts.size ?? 3000);
  bucket.put(KEY, bytes, { multipart: opts.multipart });
  const progress: { offset: number; uri: string }[] = [];
  const slept: number[] = [];
  let clock = 1_000_000;
  const ctx: TransferContext = {
    token: "access-token",
    jobId: JOB,
    folderId: "album-folder",
    drive: driveAdapter(drive.fetch, () => clock),
    bucket,
    fixedLength: fixedLengthOf,
    md5Of: md5OfStream,
    progress: async (_item, uri, offset) => {
      progress.push({ uri, offset });
    },
    deadlineMs: opts.deadlineMs ?? clock + 11 * 60_000,
    now: () => clock,
    sleep: async (ms) => {
      slept.push(ms);
      clock += ms;
    },
    random: () => 0.5,
    chunkBytes: opts.chunkBytes,
  };
  const item: LeaseItem = {
    mediaId: MEDIA,
    key: KEY,
    bytes: bytes.length,
    contentType: "image/jpeg",
    name: "2026-09-12 21.14.05 · Priya.jpg",
    description:
      "From Priya at Maya & Jay, 12 Sep 2026, 21:14. Sent from Partyreel.",
    modifiedTime: "2026-09-12T20:14:05.000Z",
    attempts: 1,
    priorFileId: null,
    session: null,
  };
  return {
    drive,
    bucket,
    bytes,
    ctx,
    item,
    progress,
    slept,
    advance: (ms: number) => (clock += ms),
  };
}

describe("one original into her Drive", () => {
  it("sends a small file in one PUT, named and marked, its MD5 R2's own", async () => {
    const { drive, ctx, item, bytes } = setup();
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    const fileId = (result.item as { fileId: string }).fileId;
    const file = drive.files.get(fileId)!;
    expect(file.name).toBe(item.name);
    expect(file.parents).toEqual(["album-folder"]);
    expect(file.size).toBe(bytes.length);
    expect(file.appProperties).toEqual({ pr_media: MEDIA, pr_job: JOB });
    expect(file.modifiedTime).toBe(item.modifiedTime);
    expect(result.item).toMatchObject({ md5: file.md5 });
    expect(result.item).not.toHaveProperty("workerMd5");
  });

  it("hashes a second read where R2 kept no MD5 (a multipart clip), and reports that hash", async () => {
    const { ctx, item, bucket } = setup({ multipart: true });
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    expect(result.item).toHaveProperty("workerMd5");
    expect(bucket.reads).toBe(2);
  });

  it("keeps an earlier send's file that is still there and whole, with no byte read", async () => {
    const { drive, ctx, item, bytes, bucket } = setup();
    const prior = drive.add({
      size: bytes.length,
      md5: (await bucket.head(KEY))!.md5!,
      appProperties: { pr_media: MEDIA },
    });
    const result = await sendOne(ctx, { ...item, priorFileId: prior.id });
    expect(result.item).toEqual({
      mediaId: MEDIA,
      outcome: "sent",
      fileId: prior.id,
      kept: true,
      md5: prior.md5,
    });
    expect(bucket.reads).toBe(0);
  });

  it("sends again a file she deleted or binned since (the prior one is no longer whole and hers)", async () => {
    const { drive, ctx, item, bytes } = setup();
    const binned = drive.add({
      size: bytes.length,
      trashed: true,
      appProperties: { pr_media: MEDIA },
    });
    const gone = await sendOne(ctx, {
      ...item,
      priorFileId: "a-file-she-deleted",
    });
    expect(gone.item.outcome).toBe("sent");
    expect((gone.item as { kept?: boolean }).kept).toBeUndefined();
    const again = await sendOne(ctx, { ...item, priorFileId: binned.id });
    expect((again.item as { fileId: string }).fileId).not.toBe(binned.id);
    expect(drive.deleted).toEqual([]);
  });

  it("★ records a re-leased item Google already holds (a report lost after the upload), never sending it twice", async () => {
    const { drive, ctx, item, bytes, bucket } = setup();
    const landed = drive.add({
      size: bytes.length,
      md5: (await bucket.head(KEY))!.md5!,
      parents: ["somewhere-she-moved-it"],
      appProperties: { pr_media: MEDIA, pr_job: JOB },
    });
    const result = await sendOne(ctx, { ...item, attempts: 2 });
    expect(result.item).toMatchObject({
      outcome: "sent",
      fileId: landed.id,
      kept: false,
    });
    expect(
      [...drive.files.values()].filter(
        (f) => f.appProperties.pr_media === MEDIA,
      ),
    ).toHaveLength(1);
  });

  it("writes a big file's session ahead, sends it in chunks, and reports where it stands after each", async () => {
    const { drive, ctx, item, progress } = setup({
      size: 10_000,
      chunkBytes: 4096,
    });
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    expect(progress.map((p) => p.offset)).toEqual([0, 4096, 8192]);
    expect(
      drive.files.get((result.item as { fileId: string }).fileId)!.size,
    ).toBe(10_000);
  });

  it("stops at a chunk boundary when the slice is nearly out, releasing the item with its session", async () => {
    const { ctx, item, progress, advance } = setup({
      size: 10_000,
      chunkBytes: 4096,
    });
    let chunks = 0;
    const inner = ctx.progress;
    ctx.progress = async (it, uri, offset) => {
      await inner(it, uri, offset);
      if (offset > 0 && ++chunks === 1) advance(11 * 60_000);
    };
    const result = await sendOne(ctx, item);
    expect(result.item).toEqual({ mediaId: MEDIA, outcome: "released" });
    expect(progress.at(-1)!.offset).toBe(4096);
  });

  it("resumes a session from where Google says it stands, never from our own offset", async () => {
    const { ctx, item } = setup({ size: 10_000, chunkBytes: 4096 });
    // A first lane: one chunk, then out of time.
    let uri = "";
    let n = 0;
    const first: TransferContext = {
      ...ctx,
      deadlineMs: Number.MAX_SAFE_INTEGER,
    };
    first.progress = async (_i: LeaseItem, u: string, offset: number) => {
      uri = u;
      if (offset > 0 && ++n === 1) first.deadlineMs = 0;
    };
    const stopped = await sendOne(first, item);
    expect(stopped.item.outcome).toBe("released");
    // A second lane, told an older offset than Google holds: Google's word wins.
    const resumed = await sendOne(ctx, {
      ...item,
      attempts: 2,
      session: { uri, offset: 0 },
    });
    expect(resumed.item.outcome).toBe("sent");
  });

  it("starts over when a session has expired", async () => {
    const { drive, ctx, item } = setup({ size: 10_000, chunkBytes: 4096 });
    drive.sessions.set(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=old",
      {
        uri: "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=old",
        meta: {
          name: "x",
          parents: [],
          mimeType: "image/jpeg",
          appProperties: {},
        },
        total: 10_000,
        received: [],
        receivedBytes: 0,
        done: null,
        expired: true,
      },
    );
    const result = await sendOne(ctx, {
      ...item,
      attempts: 2,
      session: {
        uri: "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=old",
        offset: 4096,
      },
    });
    expect(result.item.outcome).toBe("sent");
  });

  it("★ undoes the file this upload just made when its MD5 is not ours, and the item goes again", async () => {
    const { drive, ctx, item } = setup();
    drive.failures.corruptMd5 = "f".repeat(32);
    const result = await sendOne(ctx, item);
    expect(result.item).toMatchObject({ outcome: "failed", retry: true });
    expect(drive.deleted).toHaveLength(1);
    expect(drive.files.size).toBe(0);
  });

  it("never deletes a file it did not just make (an earlier send's, or hers)", async () => {
    const { drive, ctx, item, bytes } = setup();
    const hers = drive.add({
      size: bytes.length + 1,
      appProperties: { pr_media: MEDIA },
    });
    drive.failures.corruptMd5 = "e".repeat(32);
    await sendOne(ctx, { ...item, priorFileId: hers.id });
    expect(drive.files.has(hers.id)).toBe(true);
    expect(drive.deleted).not.toContain(hers.id);
  });

  it("says Drive full as a finding, the item released and its attempt not counted", async () => {
    const { drive, ctx, item } = setup();
    drive.failures.quota = true;
    expect(await sendOne(ctx, item)).toEqual({
      item: { mediaId: MEDIA, outcome: "released" },
      finding: "drive_full",
    });
  });

  it("says Google's day, a lost grant and an admin's policy as findings", async () => {
    for (const [failure, finding] of [
      ["daily", "daily_limit"],
      ["auth", "auth"],
      ["domain", "domain_policy"],
    ] as const) {
      const { drive, ctx, item } = setup();
      drive.failures[failure] = true;
      expect((await sendOne(ctx, item)).finding).toBe(finding);
    }
  });

  it("backs off through a few 'slow down's and sends; past two minutes of them, slows the lane", async () => {
    const quick = setup();
    quick.drive.failures.rate = 3;
    expect((await sendOne(quick.ctx, quick.item)).item.outcome).toBe("sent");
    expect(quick.slept).toHaveLength(3);

    const slow = setup();
    slow.drive.failures.rate = 100;
    expect(await sendOne(slow.ctx, slow.item)).toEqual({
      item: { mediaId: MEDIA, outcome: "released" },
      finding: "throttled",
    });
  });

  it("says the album's folder is gone when Google no longer has the parent", async () => {
    const { drive, ctx, item } = setup();
    drive.failures.goneParent = "album-folder";
    expect((await sendOne(ctx, item)).finding).toBe("folder_gone");
  });

  it("skips an original missing in R2 (a row without its object is a bug worth seeing)", async () => {
    const { ctx, item, bucket } = setup();
    bucket.objects.clear();
    expect((await sendOne(ctx, item)).item).toEqual({
      mediaId: MEDIA,
      outcome: "skipped",
      reason: "missing_object",
    });
  });

  it("★ reads or cancels every answer Google gives: a deleted file's 404, a session's start, a refused undo", async () => {
    const { drive, ctx, item } = setup();
    drive.failures.corruptMd5 = "f".repeat(32);
    drive.failures.refuseDelete = true;
    const result = await sendOne(ctx, {
      ...item,
      priorFileId: "a-file-she-deleted",
    });
    expect(result.item).toMatchObject({ outcome: "failed", retry: true });
    expect(drive.answers.map((a) => a.what)).toEqual([
      "GET /drive/v3/files/a-file-she-deleted 404",
      "POST /upload/drive/v3/files 200",
      "PUT /upload/drive/v3/files 200",
      expect.stringMatching(/^DELETE \/drive\/v3\/files\/file-\d+ 403$/),
    ]);
    expect(drive.unread()).toEqual([]);
  });
});

/** The original's own MD5: her Drive holds exactly its bytes, so every range was read where it should have been. */
const md5Of = (bytes: Uint8Array) =>
  createHash("md5").update(bytes).digest("hex");

describe("★ Google's 'slow down' on an upload's bytes: every PUT a read of its own", () => {
  it("sends a small file again on a fresh read after Google slowed its PUT, never the stream that PUT spent", async () => {
    const { drive, ctx, item, bytes, bucket, slept } = setup();
    drive.failures.throttlePuts = 2;
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    const file = drive.files.get((result.item as { fileId: string }).fileId)!;
    expect(file.md5).toBe(md5Of(bytes));
    expect(drive.files.size).toBe(1);
    // Three PUTs of the whole object, each its own read, with the session asked where it stands after each refusal.
    expect(bucket.readLog).toEqual([null, null, null]);
    expect(slept).toHaveLength(2);
    expect(
      drive.calls.filter((c) => c.method === "PUT").map((c) => c.method),
    ).toHaveLength(5);
    expect(drive.unread()).toEqual([]);
  });

  it("asks the session where it stands after a slow down mid-file, and sends from Google's byte on a fresh read", async () => {
    const { drive, ctx, item, bytes, bucket, progress } = setup({
      size: 10_000,
      chunkBytes: 4096,
    });
    // The second chunk is refused after Google kept 1,000 of its bytes: the next PUT starts at byte 5,096.
    const inner = ctx.progress;
    ctx.progress = async (it, uri, offset) => {
      await inner(it, uri, offset);
      if (offset === 4096) {
        drive.failures.throttlePuts = 1;
        drive.failures.throttleKeeps = 1000;
      }
    };
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    const file = drive.files.get((result.item as { fileId: string }).fileId)!;
    expect(file.size).toBe(10_000);
    expect(file.md5).toBe(md5Of(bytes));
    expect(bucket.readLog).toEqual([
      { offset: 0, length: 4096 },
      { offset: 4096, length: 4096 },
      { offset: 5096, length: 4096 },
      { offset: 9192, length: 808 },
    ]);
    expect(progress.map((p) => p.offset)).toEqual([0, 4096, 9192]);
  });

  it("starts over in a new session when Google let the slowed one go, written ahead before its first byte", async () => {
    const { drive, ctx, item, bytes, progress } = setup({
      size: 10_000,
      chunkBytes: 4096,
    });
    let armed = false;
    const inner = ctx.progress;
    ctx.progress = async (it, uri, offset) => {
      await inner(it, uri, offset);
      if (offset === 4096 && !armed) {
        armed = true;
        drive.failures.throttlePuts = 1;
        drive.failures.throttleEndsSession = true;
      }
    };
    const result = await sendOne(ctx, item);
    expect(result.item.outcome).toBe("sent");
    expect(drive.files.size).toBe(1);
    const file = drive.files.get((result.item as { fileId: string }).fileId)!;
    expect(file.md5).toBe(md5Of(bytes));
    const first = progress[0]!.uri;
    expect(
      progress.map((p) => [p.uri === first ? "old" : "new", p.offset]),
    ).toEqual([
      ["old", 0],
      ["old", 4096],
      ["new", 0],
      ["new", 4096],
      ["new", 8192],
    ]);
  });

  it("★ gives the file back when the slow down will not let up, never failing it (its attempt not counted)", async () => {
    const small = setup();
    small.drive.failures.throttlePuts = 100;
    expect(await sendOne(small.ctx, small.item)).toEqual({
      item: { mediaId: MEDIA, outcome: "released" },
      finding: "throttled",
    });
    expect(small.slept).toHaveLength(7);

    // A big file keeps the session written ahead, so the lease after the slow down resumes it rather than starts over.
    const big = setup({ size: 10_000, chunkBytes: 4096 });
    const inner = big.ctx.progress;
    big.ctx.progress = async (it, uri, offset) => {
      await inner(it, uri, offset);
      if (offset === 4096) big.drive.failures.throttlePuts = 100;
    };
    expect(await sendOne(big.ctx, big.item)).toEqual({
      item: { mediaId: MEDIA, outcome: "released" },
      finding: "throttled",
    });
    const kept = big.progress.at(-1)!;
    expect(kept.offset).toBe(4096);
    big.drive.failures.throttlePuts = 0;
    const resumed = await sendOne(big.ctx, {
      ...big.item,
      session: { uri: kept.uri, offset: kept.offset },
    });
    expect(resumed.item.outcome).toBe("sent");
    expect(big.drive.files.size).toBe(1);
  });
});
