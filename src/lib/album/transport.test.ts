import { describe, expect, it, vi } from "vitest";

/**
 * THE BROWSER'S HALF OF THE CDN'S ASK (X5, edge-version.ts): a real answer's key is read only in its shape,
 * and the cheap ask carries the album's capability in a header, never its URL, nothing of the viewer at all,
 * and no cache mode that would send the CDN back to the function.
 */
import {
  ALBUM_EDGE_WINDOW_MS,
  ALBUM_VERSION_PATH,
} from "@/lib/album/edge-version";
import { guestAlbumTransport, guestAlbumVersion } from "@/lib/album/transport";

const TOKEN = "0123456789abcdef0123456789abcdef";
const KEY = "AbCdEfGhIjKlMnOpQrStUv";

function reply(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(status === 304 ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

describe("a real sync's word on the CDN", () => {
  it("reads the album's key off a 200 and a 304, and only in its shape", async () => {
    const answers = [
      reply(200, { ok: true, kind: "locked" }, { "x-album-edge": KEY }),
      reply(304, null, { "x-album-edge": KEY }),
      reply(200, { ok: true, kind: "locked" }, { "x-album-edge": '"a1-x"' }),
      reply(200, { ok: true, kind: "locked" }),
    ];
    const fetch = vi.fn(async () => answers.shift()!);
    const transport = guestAlbumTransport({ qrToken: TOKEN, fetch });
    const req = { since: 1, etag: '"a1-x"' };
    expect(await transport.sync(req)).toMatchObject({ edgeKey: KEY });
    expect(await transport.sync(req)).toEqual({ status: 304, edgeKey: KEY });
    expect((await transport.sync(req)) as unknown).toMatchObject({
      edgeKey: null,
    });
    expect((await transport.sync(req)) as unknown).toMatchObject({
      edgeKey: null,
    });
  });
});

describe("the cheap ask", () => {
  it("★ names the album by its key and the window, carries the token in a header and nothing of the viewer", async () => {
    const now = 1_790_000_000_000;
    const fetch = vi.fn(async () =>
      reply(200, { kind: "version", v: '"a1-v"' }),
    );
    const ask = guestAlbumVersion({ qrToken: TOKEN, fetch, now: () => now });
    expect(await ask(KEY)).toEqual({
      answer: { kind: "version", v: '"a1-v"' },
      fromCache: false,
    });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      `${ALBUM_VERSION_PATH}?k=${KEY}&w=${Math.floor(now / ALBUM_EDGE_WINDOW_MS)}`,
    );
    expect(url).not.toContain(TOKEN);
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({ "x-album-token": TOKEN });
    // No cookie rides, so nothing personal can reach the route; and an ordinary request, never `no-store` or
    // `no-cache`, whose `Pragma: no-cache` would send every lit phone past the CDN to the function.
    expect(init.credentials).toBe("omit");
    expect(init.cache).toBe("default");
    expect(init.body).toBeUndefined();
  });

  it("a clock answer sets the next window by the server's time", async () => {
    let now = 1_790_000_000_000;
    const serverNow = now + 60_000;
    const answers = [
      reply(200, { kind: "clock", now: serverNow }),
      reply(200, { kind: "ask" }),
    ];
    const fetch = vi.fn(async () => answers.shift()!);
    const ask = guestAlbumVersion({ qrToken: TOKEN, fetch, now: () => now });
    expect((await ask(KEY)).answer).toEqual({ kind: "clock", now: serverNow });
    now += 1_000;
    expect((await ask(KEY)).answer).toEqual({ kind: "ask" });
    const second = (fetch.mock.calls[1] as unknown as [string])[0];
    expect(second).toContain(
      `&w=${Math.floor((serverNow + 1_000) / ALBUM_EDGE_WINDOW_MS)}`,
    );
  });

  it("says whether the CDN answered from its cache: Vercel's word first, else a cache's Age", async () => {
    const body = { kind: "version", v: '"a1-v"' };
    const cases: [Record<string, string>, boolean][] = [
      [{ "x-vercel-cache": "HIT" }, true],
      [{ "x-vercel-cache": "STALE" }, true],
      [{ "x-vercel-cache": "MISS", age: "3" }, false],
      [{ "x-vercel-cache": "REVALIDATED" }, false],
      [{ age: "2" }, true],
      [{ age: "0" }, false],
      [{}, false],
    ];
    for (const [headers, fromCache] of cases) {
      const ask = guestAlbumVersion({
        qrToken: TOKEN,
        fetch: async () => reply(200, body, headers),
      });
      expect((await ask(KEY)).fromCache).toBe(fromCache);
    }
  });

  it("anything but a readable 200 throws, so the store asks the album itself", async () => {
    for (const r of [
      reply(500, { ok: false }),
      reply(400, { ok: false, code: "bad_request" }),
      reply(200, { kind: "version", v: "" }),
      reply(200, { kind: "version" }),
      reply(200, { kind: "clock", now: "soon" }),
      reply(200, ["version"]),
      reply(200, null),
    ]) {
      const ask = guestAlbumVersion({ qrToken: TOKEN, fetch: async () => r });
      await expect(ask(KEY)).rejects.toThrow(/album version/);
    }
  });
});
