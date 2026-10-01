import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import { fetchInternalImage } from "next/dist/server/image-optimizer";
import { serveStatic } from "next/dist/server/serve-static";
import { describe, expect, it } from "vitest";

/**
 * ★ A SIZE WHOSE FIRST REQUESTER HUNG UP IS STILL ANSWERED (demo-stall,
 * 2026-09-30): the guard on `patches/next@16.2.6.patch`.
 *
 * Next 16.2's image optimizer reads a local source image through a mocked
 * request and response, and it handed the mocked RESPONSE the requester's own
 * socket. `send` (through on-finished) treats a response whose socket is no
 * longer writable as finished and drops the file without ever ending it, so
 * when the requester had already hung up the read never settled, and the
 * response cache hands that one pending result to every later request for the
 * same size: the size was never answered again while the server lived. Six of
 * them held every connection Chrome opens to a dev server, and lab:demo's next
 * navigation never left the browser (`about-press.facts`, three gates in five).
 * Upstream's fix (vercel/next.js#98168, in 16.4.0-canary.27) builds the
 * response without the socket; the patch backports it, and this proves the
 * INSTALLED Next carries it. So it is red:
 *  - in a checkout that pulled the patch without `pnpm install`, which is the
 *    only thing that writes a patch into node_modules;
 *  - on an upgrade to a Next that still has the bug (16.3.8, the latest stable
 *    on 2026-09-30, does), where the patch has to be carried forward.
 * On a Next with the fix of its own (16.4 on) it is green with no patch, and
 * that is the day to delete the patch.
 */

const PUBLIC = join(process.cwd(), "public");
const FILE = "/press/partyreel-qr.svg";

/** The router's own read of a public file (router-server.js), on the mocked pair the optimizer builds. */
function read(socket: PassThrough) {
  const req = { method: "GET", socket } as unknown as IncomingMessage;
  const res = {} as ServerResponse;
  return fetchInternalImage(FILE, req, res, 50_000_000, (mreq, mres) =>
    serveStatic(mreq, mres, FILE, { root: PUBLIC }),
  );
}

/** Whether a read settles at all: the bug is a promise that never does. */
async function settles(p: Promise<unknown>) {
  return Promise.race([
    p.then(() => true),
    new Promise<false>((r) => setTimeout(() => r(false), 2000)),
  ]);
}

describe("Next's image optimizer, reading a source image", () => {
  it("answers when the requester is still there (the control)", async () => {
    const upstream = read(new PassThrough());
    expect(await settles(upstream)).toBe(true);
    expect(
      (await upstream).buffer.equals(readFileSync(join(PUBLIC, FILE))),
    ).toBe(true);
  });

  it("answers when the requester has already hung up", async () => {
    // A requester that left: its socket is no longer writable.
    const gone = new PassThrough();
    gone.destroy();
    const upstream = read(gone);
    expect(
      await settles(upstream),
      "the installed Next never answers an image whose first requester hung up: run `pnpm install` (it applies patches/next@16.2.6.patch)",
    ).toBe(true);
    expect(
      (await upstream).buffer.equals(readFileSync(join(PUBLIC, FILE))),
    ).toBe(true);
  });
});
