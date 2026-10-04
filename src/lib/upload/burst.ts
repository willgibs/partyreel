/**
 * A BURST: the files a phone sends together, as ONE presign and as few completes as their landing allows, where each
 * file was a presign and a complete of its own (compute-uploads, the compute model's lever 4: a burst of ten photos was
 * 20 function calls before the album answered it). The one home of the burst's limits and of its wire, shared by the
 * browser's half (`uploader.ts`) and the engine's (`server-pipeline.ts`). Pure and isomorphic.
 *
 * THE WIRE. A burst's body is the one-file body with its files' own fields moved into `files`: what every file
 * shares (the identity: `session_token`, or the host's `event_id`; the forensic `device_uuid`) once at the top, each
 * file's fields in its entry, and the answer is `{ ok: true, files: [...] }`, one answer a file in the request's order
 * (a presign's or a complete's own answer, or that file's refusal with its `status`). A refusal of the WHOLE request
 * (a body the route cannot read, or a presign's gate about who is sending, which every file would meet alike) is
 * answered as a one-file request's is, its status and `{ ok: false, code, message }`. The one-file body still
 * answers as it always did, for a tab loaded before bursts (until the next milestone).
 */

/** At most this many files ride one request, a presign's or a complete's (the engine refuses more). */
export const MAX_BURST_FILES = 20;

/**
 * At most this many declared bytes make one burst (its first file whatever its size). Presigned URLs live 2 hours, and
 * a burst's files are presigned before most of them go: a burst of a few large videos on a slow line would otherwise
 * outlive its own URLs.
 */
export const MAX_BURST_BYTES = 1024 ** 3;

/**
 * How long a landed file may wait for its siblings before it is recorded (Will's to move: the manifest's Question). A
 * burst's landed files are recorded together when its last file has gone up, when the first of them has waited this
 * long, or at once when the page is hidden; her own tile already shows it, and its bar stands full meanwhile.
 */
export const BURST_RECORD_WAIT_MS = 10_000;

/**
 * How far preparing (the strip, the preview, the phone copy: bytes held in memory) may run ahead of the network: a
 * file is prepared only while the prepared files not yet sent hold less than this (the next one always may), so a
 * phone never holds a whole burst of photographs at once.
 */
export const PREP_AHEAD_BYTES = 64 * 1024 ** 2;

/**
 * The files a run sends as one burst: the first waiting, then each next one while the burst holds fewer than
 * `MAX_BURST_FILES` and stays within `MAX_BURST_BYTES` (by `sizeOf`). In order, never skipping one: a file that does
 * not fit begins the next burst.
 */
export function takeBurst<T>(
  waiting: readonly T[],
  sizeOf: (item: T) => number,
): T[] {
  const burst: T[] = [];
  let bytes = 0;
  for (const item of waiting) {
    const size = Math.max(0, sizeOf(item));
    if (
      burst.length > 0 &&
      (burst.length >= MAX_BURST_FILES || bytes + size > MAX_BURST_BYTES)
    ) {
      break;
    }
    burst.push(item);
    bytes += size;
  }
  return burst;
}

/** A burst's body, split: what its files share, and each file's own fields. */
export type BurstBody = {
  shared: Record<string, unknown>;
  files: Record<string, unknown>[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A request body as the engine reads it: `null` for the one-file body (no `files`), a burst's split, or `malformed`
 * (a `files` that is not 1 to `MAX_BURST_FILES` objects).
 *
 * ★ EACH FILE'S BODY IS ITS ENTRY UNDER THE SHARED FIELDS (`{ ...entry, ...shared }`), so the identity a burst names
 * once is every file's, and an entry can never name another ticket or another event: the session the burst's reads
 * share is the one every file is checked as.
 */
export function splitBurst(body: unknown): BurstBody | "malformed" | null {
  if (!isRecord(body) || !("files" in body)) return null;
  const { files, ...shared } = body;
  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    files.length > MAX_BURST_FILES ||
    !files.every(isRecord)
  ) {
    return "malformed";
  }
  return { shared, files: files as Record<string, unknown>[] };
}

/** One file's body in a burst: its own fields, under what the burst shares. */
export function fileBody(
  burst: BurstBody,
  entry: Record<string, unknown>,
): Record<string, unknown> {
  return { ...entry, ...burst.shared };
}
