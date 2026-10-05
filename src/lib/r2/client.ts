/**
 * Cloudflare R2 (S3-compatible) client. Server-only — it holds the R2 secret.
 *
 * ★ THE SDK LOADS ON ITS FIRST SEND, NEVER ON AN IMPORT (compute-lazy-sdk, 2026-10-04). `@aws-sdk/client-s3` costs
 * about 50 ms of CPU to load, once an instance, and every link a page shows is signed by hand (`sigv4.ts`), so a page
 * that only reads never sends: yet it imports `presign.ts`, and so this file, so a static import of the SDK here made
 * every cold start of every such page pay for sends it rarely makes (a guest's own delete, a multipart, a HEAD, a
 * COPY). So nothing in `src/` imports the SDK except as a TYPE (`import type`), and every send takes its client AND
 * its command classes from `getR2()` below: `lazy-sdk.test.ts` holds both, and that no module graph reaches the SDK.
 * A failed load is a failed send: it throws from the function that asked, like any R2 error (and `headObject` never
 * reads it as an absent object). This file remembers no failure; the bundler's own module cache may keep a failed
 * `require`, which then fails each send the same way until the instance is replaced.
 *
 * ⚠️ THE CHECKSUM GOTCHA — do NOT remove the two `*ChecksumCalculation` /
 * `*ChecksumValidation` options below. Recent @aws-sdk/client-s3 versions
 * auto-inject CRC32 checksum headers that R2 REJECTS, producing silent 0-byte
 * objects or `SignatureDoesNotMatch`. `WHEN_REQUIRED` keeps the SDK from adding
 * them unless an operation truly needs one. (See uploads-and-r2.md and CLAUDE.md.)
 *
 * Bucket CORS must allow PUT/POST/GET/HEAD + the `content-type` and `range` headers AND expose
 * `ETag`, `Content-Range`, `Accept-Ranges` and `Content-Length` (ExposeHeaders) — multipart completion
 * needs the per-part ETags, and the reel's video window reader (2026-09-22) reads byte ranges by CORS fetch.
 */
import "server-only";

import type { S3Client } from "@aws-sdk/client-s3";

import { assertR2Env } from "@/lib/env";

/** The SDK's exports (`S3Client` and every command class), as a TYPE: the value arrives with `getR2()`, never by import. */
export type S3Sdk = typeof import("@aws-sdk/client-s3");

export type R2 = {
  /** The one client of the process, built with the checksum options below. */
  client: S3Client;
  /** The SDK's module: build a command as `new sdk.HeadObjectCommand(...)`, never from an import. */
  sdk: S3Sdk;
};

// Memoized across requests in a warm lambda; built lazily so the app still boots without R2 creds (assertR2Env throws
// only when an upload path actually runs) and without the SDK. A failure clears the memo, so a missing credential or
// a failed load is tried again by the next send instead of failing every send after it.
let r2: Promise<R2> | null = null;

export function getR2(): Promise<R2> {
  r2 ??= createR2().catch((error: unknown) => {
    r2 = null;
    throw error;
  });
  return r2;
}

async function createR2(): Promise<R2> {
  // The credentials are checked first: a missing one fails before the SDK is paid for.
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
    assertR2Env();

  const sdk = await import("@aws-sdk/client-s3");

  const client = new sdk.S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    // ↓↓↓ DO NOT REMOVE — without these, uploads silently corrupt against R2.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return { client, sdk };
}
