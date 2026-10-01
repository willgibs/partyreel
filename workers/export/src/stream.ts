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
 *  - ★ IT SAYS HOW IT ENDED. The body is read through a stream of our own, so the Worker knows which of
 *    three things happened: the zip's last byte went out (`saved`, or `short` with the ids it skipped),
 *    the client left (`cancel`: she stopped it, or the line dropped; `stopped`), or an object read broke
 *    the zip (`failed`). A zip that never reached its central directory opens in no extractor, so for
 *    those two every id is missing.
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

export async function reportedZip(
  bucket: StreamBucket,
  items: ExportItem[],
  signal?: AbortSignal,
): Promise<ReportedZip> {
  const ids = items.map(({ key }) => mediaIdOf(key));
  const skipped: string[] = [];

  // The zip's first file, found before anything is answered (the head's first difference).
  let start = -1;
  let first: { body: ReadableStream<Uint8Array>; size: number } | null = null;
  for (let i = 0; i < items.length; i++) {
    first = await bucket.get(items[i].key);
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
    yield { input: opening.body, name: items[start].name, size: opening.size };
    // client-zip reads a file's bytes whole before it asks for the next one, so a resume is a file done.
    files += 1;
    for (let i = start + 1; i < items.length; i++) {
      const obj = await bucket.get(items[i].key);
      if (!obj) {
        skipped.push(ids[i]);
        continue;
      }
      yield { input: obj.body, name: items[i].name, size: obj.size };
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

  const zip = makeZip(entries()).getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await zip.read();
      } catch (error) {
        // An object read broke the zip mid-way (the client leaving is `cancel`, below).
        finish(signal?.aborted ? "stopped" : "failed");
        controller.error(error);
        return;
      }
      if (chunk.done) {
        controller.close();
        finish(skipped.length > 0 ? "short" : "saved");
        return;
      }
      controller.enqueue(chunk.value);
    },
    cancel() {
      // The client left before the last byte: she stopped it, or the line dropped. The zip is left
      // where it is rather than cancelled: nothing pulls it again, the invocation's end frees what it
      // holds, and client-zip's own cancel throws into its generator with nothing there to catch it
      // (an unhandled rejection in the Worker's log for every stopped download).
      finish("stopped");
    },
  });
  signal?.addEventListener("abort", () => finish("stopped"), { once: true });

  return { kind: "zip", body, ended };
}
