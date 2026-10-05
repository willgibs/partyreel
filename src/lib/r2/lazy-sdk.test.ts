import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ★ THE S3 SDK LOADS ON ITS FIRST SEND, NEVER ON AN IMPORT (compute-lazy-sdk, 2026-10-04). `@aws-sdk/client-s3` costs
 * about 50 ms of CPU to load, once per instance, and a page that only reads (every link is signed by hand) never
 * sends, so a cold start must not pay for it: the guest page imports `presign.ts`, which reaches `client.ts`, so the
 * SDK may be loaded only by the first send, through `getR2()`. Three things are held here:
 *
 *  A. THE LOAD, on a fake SDK whose module factory runs exactly when something imports the package: importing the
 *     four modules that send loads nothing, a presign loads nothing, the first send loads it once, a missing
 *     credential fails before it is paid for, and a failed load is thrown by the send that asked (never read as an
 *     absent object) and is not remembered.
 *  B. THE SENDS, one case each: every function still sends the command, the input and the reading it sent when the
 *     commands were static imports (none had a test before this file).
 *  C. THE GRAPH: no file in `src/` imports the SDK except as a type, only `r2/client.ts` imports it at all (once,
 *     dynamically), and the guest page's static module graph reaches the presigner and the client and none of it
 *     reaches the SDK. The detector is proved against sources that break it.
 *
 * A failure in C names the file: a new `import { X } from "@aws-sdk/client-s3"` puts the SDK's cold start back on every
 * page that presigns. Take the client and the commands from `getR2()` (`const { client, sdk } = await getR2()`), and
 * name a type with `import type`.
 */

vi.mock("server-only", () => ({}));

// Fake credentials in R2's shapes (a 32-hex account, a 9-character bucket like the real one).
const env = vi.hoisted(() => ({ present: true }));
vi.mock("@/lib/env", () => ({
  assertR2Env: () => {
    if (!env.present) throw new Error("R2 env missing");
    return {
      R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
      R2_ACCESS_KEY_ID: "3f1c0a9e8d7b6c5a4f3e2d1c0b9a8f7e",
      R2_SECRET_ACCESS_KEY:
        "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY0123456789abcdef0123456789",
      R2_BUCKET: "partyreel",
    };
  },
}));

// The SDK, faked. The factory runs when the package is imported, so `loads` counts what the real package would have
// cost; it is registered again before each test (`vi.doMock`), since a factory's result is cached until then.
type Input = Record<string, unknown>;
const state = {
  loads: 0,
  failLoads: 0,
  clients: [] as unknown[],
  sent: [] as { command: string; input: Input }[],
  reply: ((): unknown => ({})) as (command: string, input: Input) => unknown,
};
const fakeSdk = () => {
  state.loads += 1;
  if (state.failLoads > 0) {
    state.failLoads -= 1;
    throw new Error("Cannot find module '@aws-sdk/client-s3'");
  }
  const sdk: Record<string, unknown> = {};
  for (const name of [
    "AbortMultipartUploadCommand",
    "CompleteMultipartUploadCommand",
    "CopyObjectCommand",
    "CreateMultipartUploadCommand",
    "DeleteObjectsCommand",
    "HeadObjectCommand",
    "ListObjectsV2Command",
    "ListPartsCommand",
    "PutObjectCommand",
    "UploadPartCopyCommand",
  ]) {
    sdk[name] = class {
      static commandName = name;
      constructor(readonly input: Input) {}
    };
  }
  sdk.S3Client = class {
    constructor(config: unknown) {
      state.clients.push(config);
    }
    async send(command: {
      constructor: { commandName: string };
      input: Input;
    }) {
      const name = command.constructor.commandName;
      state.sent.push({ command: name, input: command.input });
      return state.reply(name, command.input);
    }
  };
  return sdk;
};

beforeEach(() => {
  state.loads = 0;
  state.failLoads = 0;
  state.clients = [];
  state.sent = [];
  state.reply = () => ({});
  env.present = true;
  vi.resetModules();
  vi.doMock("@aws-sdk/client-s3", fakeSdk);
});

/** The four modules that send, imported fresh (their memos empty), as a cold start imports them. */
async function modules() {
  const [client, presign, objects, del] = await Promise.all([
    import("./client"),
    import("./presign"),
    import("./objects"),
    import("./delete"),
  ]);
  return { client, presign, objects, del };
}

/** The send rejected with the load's own failure (Vitest wraps a failed factory and keeps the original as the cause). */
async function failsToLoad(send: Promise<unknown>) {
  const error = await send.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(Error);
  const { message, cause } = error as Error;
  expect(`${message} ${(cause as Error | undefined)?.message ?? ""}`).toContain(
    "Cannot find module '@aws-sdk/client-s3'",
  );
}

const BUCKET = "partyreel";
const KEY = "events/6f1d2c3b-4a59-4e8f-9a0b-1c2d3e4f5a6b/0a1b2c3d.jpg";

/* ── A. the load ──────────────────────────────────────────────────────────── */

describe("A. the SDK loads on the first send, never on an import", () => {
  it("is not loaded by importing the four modules that send", async () => {
    await modules();
    expect(state.loads).toBe(0);
  });

  it("is not loaded by a presign: every link is signed by hand", async () => {
    const { presign } = await modules();
    const links = [
      await presign.presignDownload({ key: KEY }),
      await presign.presignDownload({ key: KEY, stable: true }),
      await presign.presignDownload({ key: KEY, downloadFilename: "a.jpg" }),
      (
        await presign.presignUpload({
          key: KEY,
          contentType: "image/jpeg",
          contentLength: 10,
        })
      ).url,
      (
        await presign.presignUploadPart({
          key: KEY,
          uploadId: "u1",
          partNumber: 1,
          contentLength: 10,
        })
      ).url,
    ];
    for (const url of links) {
      expect(url).toMatch(/^https:\/\/partyreel\.[0-9a-f]{32}\.r2\./);
      expect(url).toContain("X-Amz-Signature=");
    }
    expect(state.loads).toBe(0);
  });

  it("is not loaded by a send that has nothing to send", async () => {
    const { del } = await modules();
    expect(await del.deleteR2Objects([])).toEqual({ deleted: 0, errored: [] });
    expect(state.loads).toBe(0);
    expect(state.sent).toEqual([]);
  });

  it("is loaded once, by the first send, and every send after it reuses it and the one client", async () => {
    const { presign, del } = await modules();
    state.reply = () => ({ ContentLength: 5 });
    expect(await presign.headObjectSize({ key: KEY })).toBe(5);
    expect(state.loads).toBe(1);
    expect(state.clients).toHaveLength(1);

    await presign.headObjectSize({ key: KEY });
    await del.deleteR2Objects([KEY]);
    await presign.abortMultipartUpload({ key: KEY, uploadId: "u1" });
    expect(state.loads).toBe(1);
    expect(state.clients).toHaveLength(1);
    expect(state.sent.map((s) => s.command)).toEqual([
      "HeadObjectCommand",
      "HeadObjectCommand",
      "DeleteObjectsCommand",
      "AbortMultipartUploadCommand",
    ]);
  });

  it("two sends racing on a cold instance load it once", async () => {
    const { presign } = await modules();
    state.reply = () => ({ ContentLength: 5 });
    await Promise.all([
      presign.headObjectSize({ key: KEY }),
      presign.headObjectSize({ key: KEY }),
      presign.headObject({ key: KEY }),
    ]);
    expect(state.loads).toBe(1);
    expect(state.clients).toHaveLength(1);
  });

  it("builds its client with the checksum options R2 needs (without them uploads silently corrupt)", async () => {
    const { client } = await modules();
    await client.getR2();
    expect(state.clients).toEqual([
      {
        region: "auto",
        endpoint:
          "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "3f1c0a9e8d7b6c5a4f3e2d1c0b9a8f7e",
          secretAccessKey:
            "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY0123456789abcdef0123456789",
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      },
    ]);
  });

  it("fails a missing credential before it pays for the SDK, and tries again on the next send", async () => {
    const { presign } = await modules();
    env.present = false;
    await expect(presign.headObjectSize({ key: KEY })).rejects.toThrow(
      "R2 env missing",
    );
    expect(state.loads).toBe(0);

    env.present = true;
    state.reply = () => ({ ContentLength: 7 });
    expect(await presign.headObjectSize({ key: KEY })).toBe(7);
    expect(state.loads).toBe(1);
  });

  it("throws a failed load from the send that asked, never remembers it, and the next send loads", async () => {
    const { presign, del, objects } = await modules();
    state.failLoads = 1;
    // Every sender throws it (a failed load is a failed send, so each caller's own handling of an R2 error applies).
    await failsToLoad(presign.headObjectSize({ key: KEY }));
    expect(state.loads).toBe(1);
    expect(state.sent).toEqual([]);

    state.failLoads = 1;
    await failsToLoad(del.deleteR2Objects([KEY]));
    state.failLoads = 1;
    await failsToLoad(objects.putJsonObject({ key: KEY, body: { a: 1 } }));
    expect(state.loads).toBe(3);

    state.reply = () => ({ ContentLength: 9 });
    expect(await presign.headObjectSize({ key: KEY })).toBe(9);
    expect(state.loads).toBe(4);
    expect(state.clients).toHaveLength(1);
  });

  it("never reads a failed load as an object that is not there", async () => {
    const { presign } = await modules();
    state.failLoads = 1;
    await failsToLoad(presign.headObject({ key: KEY }));

    // R2's own refusal (a 404 or a 403) is the one thing that reads as absent.
    state.reply = () => {
      throw Object.assign(new Error("NotFound"), { name: "NotFound" });
    };
    expect(await presign.headObject({ key: KEY })).toBeNull();
  });
});

/* ── B. the sends ─────────────────────────────────────────────────────────── */

describe("B. every send still sends what it sent", () => {
  it("deleteR2Objects: quiet batches of at most 1,000 keys, counted from the errors R2 names", async () => {
    const { del } = await modules();
    const keys = Array.from({ length: 2001 }, (_, i) => `k${i}`);
    state.reply = (_command, input) =>
      (input.Delete as { Objects: { Key: string }[] }).Objects.some(
        (o) => o.Key === "k1500",
      )
        ? {
            Errors: [{ Key: "k1500", Code: "AccessDenied", Message: "no" }],
          }
        : {};
    const out = await del.deleteR2Objects(keys);

    expect(state.sent.map((s) => s.command)).toEqual([
      "DeleteObjectsCommand",
      "DeleteObjectsCommand",
      "DeleteObjectsCommand",
    ]);
    expect(
      state.sent.map(
        (s) => (s.input.Delete as { Objects: unknown[] }).Objects.length,
      ),
    ).toEqual([1000, 1000, 1]);
    expect(state.sent[0].input).toEqual({
      Bucket: BUCKET,
      Delete: {
        Objects: keys.slice(0, 1000).map((Key) => ({ Key })),
        Quiet: true,
      },
    });
    expect(out).toEqual({
      deleted: 2000,
      errored: [{ key: "k1500", code: "AccessDenied", message: "no" }],
    });
  });

  it("listR2Objects: one page under a prefix, and the token only while R2 says there is more", async () => {
    const { del } = await modules();
    const when = new Date("2026-10-04T00:00:00Z");
    state.reply = () => ({
      Contents: [{ Key: "p/1", Size: 3, LastModified: when }, {}],
      IsTruncated: true,
      NextContinuationToken: "n1",
    });
    const page = await del.listR2Objects({
      prefix: "p/",
      continuationToken: "t0",
      startAfter: "p/0",
      maxKeys: 5,
    });
    expect(state.sent).toEqual([
      {
        command: "ListObjectsV2Command",
        input: {
          Bucket: BUCKET,
          Prefix: "p/",
          ContinuationToken: "t0",
          StartAfter: "p/0",
          MaxKeys: 5,
        },
      },
    ]);
    expect(page).toEqual({
      objects: [
        { key: "p/1", size: 3, lastModified: when },
        { key: "", size: 0, lastModified: null },
      ],
      nextToken: "n1",
    });

    state.reply = () => ({ IsTruncated: false, NextContinuationToken: "n2" });
    expect((await del.listR2Objects({ prefix: "p/" })).nextToken).toBeNull();
  });

  it("headObjectSize: the stored size, and a throw when the object is missing or empty", async () => {
    const { presign } = await modules();
    state.reply = () => ({ ContentLength: 1234 });
    expect(await presign.headObjectSize({ key: KEY })).toBe(1234);
    expect(state.sent).toEqual([
      { command: "HeadObjectCommand", input: { Bucket: BUCKET, Key: KEY } },
    ]);

    for (const reply of [{ ContentLength: 0 }, {}]) {
      state.reply = () => reply;
      await expect(presign.headObjectSize({ key: KEY })).rejects.toThrow(
        `HEAD returned no positive ContentLength for ${KEY}`,
      );
    }
  });

  it("headObject: size and time when present, null on R2's refusal", async () => {
    const { presign } = await modules();
    const when = new Date("2026-10-04T01:02:03Z");
    state.reply = () => ({ ContentLength: 9, LastModified: when });
    expect(await presign.headObject({ key: KEY })).toEqual({
      size: 9,
      lastModified: when,
    });
    state.reply = () => ({});
    expect(await presign.headObject({ key: KEY })).toEqual({
      size: 0,
      lastModified: null,
    });
    state.reply = () => {
      throw new Error("NotFound");
    };
    expect(await presign.headObject({ key: KEY })).toBeNull();
  });

  it("presign.copyObject: a copy inside the bucket, and a refusal of a key a CopySource would need escaped", async () => {
    const { presign } = await modules();
    await presign.copyObject({
      sourceKey: "staging/a.jpg",
      destinationKey: KEY,
    });
    expect(state.sent).toEqual([
      {
        command: "CopyObjectCommand",
        input: {
          Bucket: BUCKET,
          Key: KEY,
          CopySource: `${BUCKET}/staging/a.jpg`,
        },
      },
    ]);

    state.sent = [];
    state.loads = 0;
    await expect(
      presign.copyObject({ sourceKey: "staging/a b.jpg", destinationKey: KEY }),
    ).rejects.toThrow("copyObject: refusing an unescaped source key");
    expect(state.sent).toEqual([]);
  });

  it("createMultipartUpload: the upload id R2 assigns, and a throw when it assigns none", async () => {
    const { presign } = await modules();
    state.reply = () => ({ UploadId: "u1" });
    expect(
      await presign.createMultipartUpload({
        key: KEY,
        contentType: "video/mp4",
      }),
    ).toEqual({ uploadId: "u1" });
    expect(state.sent).toEqual([
      {
        command: "CreateMultipartUploadCommand",
        input: { Bucket: BUCKET, Key: KEY, ContentType: "video/mp4" },
      },
    ]);
    state.reply = () => ({});
    await expect(
      presign.createMultipartUpload({ key: KEY, contentType: "video/mp4" }),
    ).rejects.toThrow("R2 did not return an UploadId.");
  });

  it("completeMultipartUpload: the parts in ascending order, ETags verbatim", async () => {
    const { presign } = await modules();
    await presign.completeMultipartUpload({
      key: KEY,
      uploadId: "u1",
      parts: [
        { partNumber: 2, eTag: '"b"' },
        { partNumber: 1, eTag: '"a"' },
      ],
    });
    expect(state.sent).toEqual([
      {
        command: "CompleteMultipartUploadCommand",
        input: {
          Bucket: BUCKET,
          Key: KEY,
          UploadId: "u1",
          MultipartUpload: {
            Parts: [
              { ETag: '"a"', PartNumber: 1 },
              { ETag: '"b"', PartNumber: 2 },
            ],
          },
        },
      },
    ]);
  });

  it("sumMultipartParts: every page of ListParts, the marker carried from one to the next", async () => {
    const { presign } = await modules();
    state.reply = (_command, input) =>
      input.PartNumberMarker === undefined
        ? {
            Parts: [{ Size: 5 }, { Size: 7 }],
            IsTruncated: true,
            NextPartNumberMarker: "2",
          }
        : { Parts: [{ Size: 3 }, {}], IsTruncated: false };
    expect(await presign.sumMultipartParts({ key: KEY, uploadId: "u1" })).toBe(
      15,
    );
    expect(state.sent).toEqual([
      {
        command: "ListPartsCommand",
        input: {
          Bucket: BUCKET,
          Key: KEY,
          UploadId: "u1",
          PartNumberMarker: undefined,
        },
      },
      {
        command: "ListPartsCommand",
        input: {
          Bucket: BUCKET,
          Key: KEY,
          UploadId: "u1",
          PartNumberMarker: "2",
        },
      },
    ]);
  });

  it("abortMultipartUpload: aborts the upload by key and id", async () => {
    const { presign } = await modules();
    await presign.abortMultipartUpload({ key: KEY, uploadId: "u1" });
    expect(state.sent).toEqual([
      {
        command: "AbortMultipartUploadCommand",
        input: { Bucket: BUCKET, Key: KEY, UploadId: "u1" },
      },
    ]);
  });

  it("objects.copyObject: a HEAD, then one CopyObject under 4 GiB, its CopySource escaped by segment", async () => {
    const { objects } = await modules();
    state.reply = () => ({ ContentLength: 10, ContentType: "image/jpeg" });
    await objects.copyObject({
      sourceKey: "events/e1/a b+c.jpg",
      destKey: "preserved/e1/a.jpg",
    });
    expect(state.sent).toEqual([
      {
        command: "HeadObjectCommand",
        input: { Bucket: BUCKET, Key: "events/e1/a b+c.jpg" },
      },
      {
        command: "CopyObjectCommand",
        input: {
          Bucket: BUCKET,
          Key: "preserved/e1/a.jpg",
          CopySource: `${BUCKET}/events/e1/a%20b%2Bc.jpg`,
        },
      },
    ]);

    state.reply = () => ({ ContentLength: 0 });
    await expect(
      objects.copyObject({ sourceKey: "events/e1/x.jpg", destKey: "d" }),
    ).rejects.toThrow("source object missing or empty: events/e1/x.jpg");
  });

  it("objects.copyObject: past 4 GiB, ranged UploadPartCopy parts of 1 GiB and a completion", async () => {
    const { objects } = await modules();
    const GiB = 1024 ** 3;
    state.reply = (command, input) => {
      if (command === "HeadObjectCommand")
        return { ContentLength: 4 * GiB + 1, ContentType: "video/mp4" };
      if (command === "CreateMultipartUploadCommand") return { UploadId: "cu" };
      if (command === "UploadPartCopyCommand")
        return { CopyPartResult: { ETag: `e${input.PartNumber}` } };
      return {};
    };
    await objects.copyObject({
      sourceKey: "events/e1/v.mp4",
      destKey: "d.mp4",
    });

    expect(state.sent.map((s) => s.command)).toEqual([
      "HeadObjectCommand",
      "CreateMultipartUploadCommand",
      "UploadPartCopyCommand",
      "UploadPartCopyCommand",
      "UploadPartCopyCommand",
      "UploadPartCopyCommand",
      "UploadPartCopyCommand",
      "CompleteMultipartUploadCommand",
    ]);
    expect(state.sent[1].input).toEqual({
      Bucket: BUCKET,
      Key: "d.mp4",
      ContentType: "video/mp4",
    });
    expect(state.sent[2].input).toEqual({
      Bucket: BUCKET,
      Key: "d.mp4",
      UploadId: "cu",
      PartNumber: 1,
      CopySource: `${BUCKET}/events/e1/v.mp4`,
      CopySourceRange: `bytes=0-${GiB - 1}`,
    });
    expect(state.sent[6].input.CopySourceRange).toBe(
      `bytes=${4 * GiB}-${4 * GiB}`,
    );
    expect(state.sent[7].input).toEqual({
      Bucket: BUCKET,
      Key: "d.mp4",
      UploadId: "cu",
      MultipartUpload: {
        Parts: [1, 2, 3, 4, 5].map((n) => ({ ETag: `e${n}`, PartNumber: n })),
      },
    });
  });

  it("putJsonObject: the document, indented, as application/json", async () => {
    const { objects } = await modules();
    await objects.putJsonObject({ key: KEY, body: { a: [1, 2] } });
    expect(state.sent).toEqual([
      {
        command: "PutObjectCommand",
        input: {
          Bucket: BUCKET,
          Key: KEY,
          Body: JSON.stringify({ a: [1, 2] }, null, 2),
          ContentType: "application/json",
        },
      },
    ]);
  });
});

/* ── C. the graph ─────────────────────────────────────────────────────────── */

const ROOT = process.cwd();
const CLIENT = "src/lib/r2/client.ts";
const SKIP = /\.test\.tsx?$|\.d\.ts$/;

function sources(): string[] {
  return readdirSync(join(ROOT, "src"), { recursive: true })
    .map((f) => `src/${String(f).replace(/\\/g, "/")}`)
    .filter((rel) => /\.tsx?$/.test(rel) && !SKIP.test(rel))
    .sort();
}

const textOf = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

type Use = "static" | "type" | "dynamic" | "require";

/**
 * Every way a source names the SDK's package, read off its syntax tree (a comment or a string that merely says it is
 * not a use). A named import whose every specifier is `type` still counts as static: only `import type` is erased
 * for certain, so only it is allowed.
 */
function sdkUses(rel: string, text: string): Use[] {
  if (!text.includes("@aws-sdk/")) return [];
  const sf = ts.createSourceFile(
    rel,
    text,
    ts.ScriptTarget.Latest,
    false,
    rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const uses: Use[] = [];
  const sdk = (n: ts.Node | undefined) =>
    !!n && ts.isStringLiteralLike(n) && n.text.startsWith("@aws-sdk/");
  const visit = (n: ts.Node) => {
    if (ts.isImportDeclaration(n) && sdk(n.moduleSpecifier))
      uses.push(n.importClause?.isTypeOnly ? "type" : "static");
    else if (
      ts.isExportDeclaration(n) &&
      n.moduleSpecifier &&
      sdk(n.moduleSpecifier)
    )
      uses.push(n.isTypeOnly ? "type" : "static");
    else if (
      ts.isImportEqualsDeclaration(n) &&
      ts.isExternalModuleReference(n.moduleReference) &&
      sdk(n.moduleReference.expression)
    )
      uses.push("require");
    else if (ts.isCallExpression(n) && sdk(n.arguments[0])) {
      if (n.expression.kind === ts.SyntaxKind.ImportKeyword)
        uses.push("dynamic");
      else if (ts.isIdentifier(n.expression) && n.expression.text === "require")
        uses.push("require");
    } else if (
      ts.isImportTypeNode(n) &&
      ts.isLiteralTypeNode(n.argument) &&
      sdk(n.argument.literal)
    )
      uses.push("type");
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return uses;
}

/** The files a source imports STATICALLY (what a cold start evaluates with it); `import type` and `import()` excluded. */
const STATIC_EDGE =
  /^\s*(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s*)?["']([^"']+)["']/gm;

function staticImports(
  rel: string,
  text: string,
  known: Set<string>,
): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(STATIC_EDGE)) {
    const spec = m[1];
    const base = spec.startsWith("@/")
      ? `src/${spec.slice(2)}`
      : spec.startsWith(".")
        ? posix.normalize(posix.join(dirname(rel), spec))
        : null;
    if (!base) continue;
    const hit = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ].find((c) => known.has(c));
    if (hit) out.push(hit);
  }
  return out;
}

/** The guest page's module graph, from every segment file its route renders (the loader tree's own list). */
function guestPageGraph(files: string[]): Set<string> {
  const known = new Set(files);
  const dirs = ["src/app", "src/app/(guest)", "src/app/(guest)/e/[token]"];
  const names = [
    "layout",
    "page",
    "template",
    "loading",
    "error",
    "global-error",
    "not-found",
    "forbidden",
    "unauthorized",
  ];
  const queue = dirs.flatMap((d) =>
    names.flatMap((n) => [`${d}/${n}.tsx`, `${d}/${n}.ts`]),
  );
  const reached = new Set<string>();
  while (queue.length) {
    const rel = queue.pop()!;
    if (!known.has(rel) || reached.has(rel)) continue;
    reached.add(rel);
    queue.push(...staticImports(rel, textOf(rel), known));
  }
  return reached;
}

describe("C. no module graph reaches the SDK", () => {
  const files = sources();

  it("nothing in src imports the SDK except as a type, and only r2/client.ts loads it, once, dynamically", () => {
    const offences: string[] = [];
    const named: string[] = [];
    for (const rel of files) {
      const uses = sdkUses(rel, textOf(rel));
      if (uses.length) named.push(rel);
      for (const use of uses) {
        if (use === "type") continue;
        if (use === "dynamic" && rel === CLIENT) continue;
        offences.push(
          `${rel}: ${use === "dynamic" ? "a dynamic import outside r2/client.ts (one home for the one client, with the checksum options R2 needs)" : `a ${use} import of the SDK (take the client and the commands from getR2(), and name a type with import type)`}`,
        );
      }
    }
    expect(offences).toEqual([]);
    expect(
      sdkUses(CLIENT, textOf(CLIENT)).filter((u) => u === "dynamic"),
    ).toHaveLength(1);
    // The files that name the package at all: the client, and presign.ts for one type.
    expect(named).toEqual([CLIENT, "src/lib/r2/presign.ts"]);
  });

  it("the guest page's static graph reaches the presigner and the client, and none of it reaches the SDK", () => {
    const reached = guestPageGraph(files);
    // The trace is real: a graph this size that includes the files the claim is about.
    expect(reached.size).toBeGreaterThan(150);
    expect(reached).toContain("src/app/(guest)/e/[token]/page.tsx");
    expect(reached).toContain("src/lib/r2/presign.ts");
    expect(reached).toContain(CLIENT);
    const reaching = [...reached].filter((rel) =>
      sdkUses(rel, textOf(rel)).some((u) => u === "static" || u === "require"),
    );
    expect(reaching).toEqual([]);
  });

  it("the detector sees what it is meant to (it is not blind)", () => {
    const uses = (source: string) => sdkUses("src/x.ts", source);
    expect(uses(`import { S3Client } from "@aws-sdk/client-s3";`)).toEqual([
      "static",
    ]);
    expect(
      uses(
        `import {\n  type A,\n  HeadObjectCommand,\n} from "@aws-sdk/client-s3";`,
      ),
    ).toEqual(["static"]);
    expect(uses(`import { type A } from "@aws-sdk/client-s3";`)).toEqual([
      "static",
    ]);
    expect(uses(`import "@aws-sdk/client-s3";`)).toEqual(["static"]);
    expect(uses(`export * from "@aws-sdk/client-s3";`)).toEqual(["static"]);
    expect(uses(`export { S3Client } from "@aws-sdk/client-s3";`)).toEqual([
      "static",
    ]);
    expect(uses(`const s = require("@aws-sdk/client-s3");`)).toEqual([
      "require",
    ]);
    expect(uses(`import s = require("@aws-sdk/client-s3");`)).toEqual([
      "require",
    ]);
    expect(uses(`const s = await import("@aws-sdk/client-s3");`)).toEqual([
      "dynamic",
    ]);
    expect(uses(`import("@aws-sdk/s3-request-presigner");`)).toEqual([
      "dynamic",
    ]);
    // A type is erased, and a comment or a string is not a use.
    expect(uses(`import type { S3Client } from "@aws-sdk/client-s3";`)).toEqual(
      ["type"],
    );
    expect(uses(`export type { A } from "@aws-sdk/client-s3";`)).toEqual([
      "type",
    ]);
    expect(uses(`type T = typeof import("@aws-sdk/client-s3");`)).toEqual([
      "type",
    ]);
    expect(
      uses(
        `// import { S3Client } from "@aws-sdk/client-s3";\nconst a = "@aws-sdk/client-s3";`,
      ),
    ).toEqual([]);
    // And the graph walker follows a static import, an alias and a re-export, never a type or a dynamic import.
    const known = new Set([
      "src/a.ts",
      "src/b/index.ts",
      "src/c.tsx",
      "src/d.ts",
    ]);
    expect(
      staticImports(
        "src/z.ts",
        `import a from "./a";\nexport * from "@/b";\nimport type { C } from "./c";\nconst d = import("./d");\nimport "./c";`,
        known,
      ),
    ).toEqual(["src/a.ts", "src/b/index.ts", "src/c.tsx"]);
  });
});
