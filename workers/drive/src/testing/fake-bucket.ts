/**
 * A FAKE BUCKET for the Worker's suite: objects by key, each its bytes and the MD5 R2 keeps (a single-part object's;
 * none for a multipart clip, or for a copy that kept none), read whole or by range as streams. Counts every read, so a
 * test can see that a kept file cost no byte read.
 */
import { createHash } from "node:crypto";

import type { Bucket } from "../transfer";

export class FakeBucket implements Bucket {
  objects = new Map<string, { bytes: Uint8Array; md5: string | null }>();
  reads = 0;
  heads = 0;

  /** Put an object; `multipart` keeps no MD5, as R2 keeps none for a multipart upload. */
  put(
    key: string,
    bytes: Uint8Array,
    opts: { multipart?: boolean } = {},
  ): void {
    this.objects.set(key, {
      bytes,
      md5: opts.multipart
        ? null
        : createHash("md5").update(bytes).digest("hex"),
    });
  }

  async head(key: string) {
    this.heads++;
    const o = this.objects.get(key);
    return o ? { size: o.bytes.length, md5: o.md5 } : null;
  }

  async read(key: string, range?: { offset: number; length: number }) {
    this.reads++;
    const o = this.objects.get(key);
    if (!o) return null;
    const bytes = range
      ? o.bytes.slice(range.offset, range.offset + range.length)
      : o.bytes;
    return new Response(bytes).body!;
  }
}

/** Bytes of a given size, deterministic. */
export function bytesOf(size: number, seed = 7): Uint8Array {
  const out = new Uint8Array(size);
  let x = seed;
  for (let i = 0; i < size; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out[i] = x & 0xff;
  }
  return out;
}

/** MD5 of a stream, as the runtime's DigestStream would give it. */
export async function md5OfStream(stream: ReadableStream): Promise<string> {
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return createHash("md5").update(bytes).digest("hex");
}
