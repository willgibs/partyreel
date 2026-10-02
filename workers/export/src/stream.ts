/**
 * THE ZIP FOR A TOKEN THAT ASKS FOR REPORTS (`export-ends`), and the moment it ends.
 *
 * The same store-only zip of the same objects in the same order as the old stream (`index.ts`'s
 * `streamFiles`), with two differences, both only for a token that asks for reports:
 *
 *  - ★ THE WINDOW BETWEEN THE CHECK AND THE STREAM IS CLOSED HERE. The check (`check.ts`) counts what
 *    the zip would hold, but an album can empty in the second between the check and this POST. So the
 *    zip's first file is found BEFORE anything is answered: none at all, and the answer is a 204, which
 *    a top-level form POST takes as "stay where you are" (no file, the album page untouched), and the
 *    end report says `empty`. A valid empty zip is never sent to a client that can hear why.
 *  - ★ IT SAYS HOW IT ENDED: the zip's last byte went out (`saved`, or `short` with the ids it skipped),
 *    the client left before it (she stopped it, or the line dropped: `stopped`), or an object read broke
 *    it (`failed`). A zip that never reached its central directory opens in no extractor, so for those
 *    two every id is missing.
 *
 * ★ PUSHED, NOT PULLED. The zip is piped into a pass-through the response reads, so a client that leaves
 * shows as a write that fails. The runtime neither cancels a pulled response body when its client goes
 * nor, behind every front, aborts `request.signal` (both proved under `wrangler dev`: a pulled body just
 * stalled until the runtime killed the request as hung, and no word was ever sent); a failed write is
 * what its own docs detect a disconnect by. `request.signal` is still heard where it fires.
 */
import { makeZip } from "client-zip";

import { mediaIdOf } from "./check";
import type { ExportItem } from "./export-token";
import type { StreamOutcome } from "./report";

/** The bucket as the stream uses it: one read-only call, so a test can stand in for it. */
export type StreamBucket = {
  get(
    key: string,
  ): Promise<{ body: ReadableStream<Uint8Array>; size: number } | null>;
};

export type StreamEnd = {
  outcome: StreamOutcome;
  /** How many files went into the zip whole. */
  files: number;
  /** The media ids the zip does not hold whole. */
  missing: string[];
};

export type ReportedZip =
  /** Nothing to send: every object is gone. Answer 204, and report this. */
  | { kind: "empty"; end: StreamEnd }
  /** The zip's bytes, and how it ended once it has. */
  | {
      kind: "zip";
      body: ReadableStream<Uint8Array>;
      ended: Promise<StreamEnd>;
    };

/** The runtime's own pass-through where there is one (workerd), the standard one in a test. */
function passThrough(): TransformStream<Uint8Array, Uint8Array> {
  const native = (
    globalThis as {
      IdentityTransformStream?: new () => TransformStream<
        Uint8Array,
        Uint8Array
      >;
    }
  ).IdentityTransformStream;
  return native ? new native() : new TransformStream<Uint8Array, Uint8Array>();
}

export async function reportedZip(
  bucket: StreamBucket,
  items: ExportItem[],
  signal?: AbortSignal,
): Promise<ReportedZip> {
  const ids = items.map(({ key }) => mediaIdOf(key));
  const skipped: string[] = [];
  /** An object read failed: what broke the zip was ours, not the client's leaving. */
  let broke = false;

  /** An object's bytes, read through a stream that remembers if a read of them failed. */
  const guarded = (body: ReadableStream<Uint8Array>) => {
    const reader = body.getReader();
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const chunk = await reader.read();
          if (chunk.done) controller.close();
          else controller.enqueue(chunk.value);
        } catch (error) {
          broke = true;
          controller.error(error);
        }
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });
  };
  const read = async (key: string) => {
    try {
      return await bucket.get(key);
    } catch (error) {
      broke = true;
      throw error;
    }
  };

  // The zip's first file, found before anything is answered (the head's first difference).
  let start = -1;
  let first: { body: ReadableStream<Uint8Array>; size: number } | null = null;
  for (let i = 0; i < items.length; i++) {
    first = await read(items[i].key);
    if (first) {
      start = i;
      break;
    }
    skipped.push(ids[i]);
  }
  if (!first) {
    return { kind: "empty", end: { outcome: "empty", files: 0, missing: ids } };
  }
  const opening = first;

  let files = 0;
  async function* entries() {
    yield {
      input: guarded(opening.body),
      name: items[start].name,
      size: opening.size,
    };
    // client-zip reads a file's bytes whole before it asks for the next one, so a resume is a file done.
    files += 1;
    for (let i = start + 1; i < items.length; i++) {
      const obj = await read(items[i].key);
      if (!obj) {
        skipped.push(ids[i]);
        continue;
      }
      yield { input: guarded(obj.body), name: items[i].name, size: obj.size };
      files += 1;
    }
  }

  let settle!: (end: StreamEnd) => void;
  const ended = new Promise<StreamEnd>((resolve) => {
    settle = resolve;
  });
  let over = false;
  const finish = (outcome: StreamOutcome) => {
    if (over) return;
    over = true;
    const whole = outcome === "saved" || outcome === "short";
    settle({ outcome, files, missing: whole ? [...skipped] : ids });
  };

  const pass = passThrough();
  // `preventCancel`: a client that left never cancels the zip, since client-zip's own cancel throws into
  // its generator with nothing there to catch it; nothing pulls it again, and the invocation's end frees it.
  void makeZip(entries())
    .pipeTo(pass.writable, { preventCancel: true })
    .then(
      () => finish(skipped.length > 0 ? "short" : "saved"),
      () => finish(broke ? "failed" : "stopped"),
    );
  signal?.addEventListener("abort", () => finish("stopped"), { once: true });

  return { kind: "zip", body: pass.readable, ended };
}
