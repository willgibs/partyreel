import { describe, expect, it, vi } from "vitest";

import { createLinkStore } from "@/lib/album/links";
import { createClipResolver } from "@/lib/album/resolver";
import type { AlbumLinksBody, GuestWhoTuple } from "@/lib/events/album-wire";
import { PRESIGN_BUCKET_MS } from "@/lib/r2/presign-bucket";

const MIN = 60_000;
/** A server clock at the very start of a presign bucket. */
const SERVER_T0 = 1_000 * PRESIGN_BUCKET_MS;

type Call = string[];

function server(opts: {
  serverNow: () => number;
  hidden?: Set<string>;
  who?: () => GuestWhoTuple | null;
}) {
  const calls: Call[] = [];
  const fetch = vi.fn(
    async (ids: string[]): Promise<AlbumLinksBody<GuestWhoTuple>> => {
      calls.push(ids);
      const at = opts.serverNow();
      const hidden = opts.hidden ?? new Set();
      return {
        ok: true,
        access: "full",
        gate: null,
        b: Math.floor(at / PRESIGN_BUCKET_MS),
        now: at,
        links: ids
          .filter((id) => !hidden.has(id))
          .map((id) => [
            id,
            `tile:${id}:${at}`,
            id.startsWith("np") ? null : `view:${id}`,
            `dl:${id}`,
            opts.who?.() ?? null,
          ]),
        missing: ids.filter((id) => hidden.has(id)),
      };
    },
  );
  return { fetch, calls };
}

describe("ensure: one request a tick, never an id twice", () => {
  it("coalesces calls made in the same tick into one request", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    await Promise.all([links.ensure(["a", "b"]), links.ensure(["b", "c"])]);
    expect(srv.calls).toEqual([["a", "b", "c"]]);
    expect(links.get("c")?.tile).toContain("tile:c");
  });

  it("splits a big ask at the batch size", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({
      fetch: srv.fetch,
      now: () => 0,
      batchSize: 2,
    });
    await links.ensure(["a", "b", "c", "d", "e"]);
    expect(srv.calls.map((c) => c.length)).toEqual([2, 2, 1]);
  });

  it("an id in flight is awaited, not asked again", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const inner = server({ serverNow: () => SERVER_T0 });
    const fetch = vi.fn(async (ids: string[]) => {
      await gate;
      return inner.fetch(ids);
    });
    const links = createLinkStore({ fetch, now: () => 0 });
    const first = links.ensure(["a", "b"]);
    await Promise.resolve();
    const second = links.ensure(["b"]);
    release();
    await Promise.all([first, second]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(links.get("b")).toBeDefined();
  });

  it("a held, fresh link is never asked again", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    await links.ensure(["a"]);
    await links.ensure(["a"]);
    expect(srv.calls).toHaveLength(1);
  });

  it("a view that IS the tile (no preview) reads back as the tile", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    await links.ensure(["np1"]);
    const l = links.get("np1")!;
    expect(l.view).toBe(l.tile);
  });

  it("a failed request leaves what was held and asks again next time", async () => {
    let fail = true;
    const srv = server({ serverNow: () => SERVER_T0 });
    const fetch = vi.fn(async (ids: string[]) => {
      if (fail) throw new Error("offline");
      return srv.fetch(ids);
    });
    const links = createLinkStore({ fetch, now: () => 0 });
    await links.ensure(["a"]);
    expect(links.get("a")).toBeUndefined();
    fail = false;
    await links.ensure(["a"]);
    expect(links.get("a")).toBeDefined();
  });
});

describe("each link dates itself on this device's clock", () => {
  it("re-mints an hour after its bucket opened and dies at ninety minutes, whatever the device clock says", async () => {
    // The device clock runs 25 minutes behind the server's.
    const skew = -25 * MIN;
    let serverNow = SERVER_T0 + 10 * MIN; // ten minutes into the bucket
    let device = serverNow + skew;
    const srv = server({ serverNow: () => serverNow });
    const links = createLinkStore({ fetch: srv.fetch, now: () => device });
    await links.ensure(["a"]);
    const link = links.get("a")!;
    // On the device's own clock: 50 minutes until the re-mint (60 - 10), 80 until the link dies.
    expect(link.remintAt - device).toBe(50 * MIN);
    expect(link.expiresAt - device).toBe(80 * MIN);

    device += 49 * MIN;
    serverNow += 49 * MIN;
    await links.ensure(["a"]);
    expect(srv.calls).toHaveLength(1);

    device += 2 * MIN;
    serverNow += 2 * MIN;
    await links.ensure(["a"]);
    expect(srv.calls).toHaveLength(2);
  });

  it("answers nothing for a link past its expiry, so a dead url is never drawn", async () => {
    let device = 0;
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => device });
    await links.ensure(["a"]);
    device += 90 * MIN;
    expect(links.get("a")).toBeUndefined();
  });

  it("refreshAged re-mints the recently asked links that aged, and only those", async () => {
    let device = 0;
    let serverNow = SERVER_T0;
    const srv = server({ serverNow: () => serverNow });
    const links = createLinkStore({
      fetch: srv.fetch,
      now: () => device,
      interestSize: 2,
    });
    await links.ensure(["a", "b", "c"]);
    await links.refreshAged();
    expect(srv.calls).toHaveLength(1);
    device += 61 * MIN;
    serverNow += 61 * MIN;
    await links.refreshAged();
    // Interest holds the last two asked; "a" fell out of it.
    expect(srv.calls[1]).toEqual(["b", "c"]);
  });
});

describe("missing, attribution, forgetting", () => {
  it("drops an id the route reports missing, tells the album, and does not ask again until revived", async () => {
    const hidden = new Set(["h"]);
    const onMissing = vi.fn();
    const srv = server({ serverNow: () => SERVER_T0, hidden });
    const links = createLinkStore({
      fetch: srv.fetch,
      now: () => 0,
      onMissing,
    });
    await links.ensure(["a", "h"]);
    expect(onMissing).toHaveBeenCalledWith(["h"]);
    expect(links.get("h")).toBeUndefined();
    await links.ensure(["h"]);
    expect(srv.calls).toHaveLength(1);
    hidden.delete("h");
    links.revive(["h"]);
    await links.ensure(["h"]);
    expect(links.get("h")).toBeDefined();
  });

  it("an attribution move makes every held name stale, and the refresh re-reads them", async () => {
    let name = "Maya";
    const srv = server({ serverNow: () => SERVER_T0, who: () => [name, 0] });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    await links.ensure(["a"]);
    expect(links.get("a")?.who).toEqual(["Maya", 0]);
    name = "Maya J.";
    links.setAttr(1);
    await links.refreshAged();
    expect(links.get("a")?.who).toEqual(["Maya J.", 0]);
    expect(srv.calls).toHaveLength(2);
  });

  it("forget drops links and notifies; clear drops everything", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    const listener = vi.fn();
    links.subscribe(listener);
    await links.ensure(["a", "b"]);
    const before = links.revision();
    links.forget(["a"]);
    expect(links.get("a")).toBeUndefined();
    expect(links.revision()).toBeGreaterThan(before);
    links.clear();
    expect(links.get("b")).toBeUndefined();
    expect(listener).toHaveBeenCalled();
  });
});

describe("the reel's resolver", () => {
  it("answers a clip's tile and view by id, and ensures through the same store", async () => {
    const srv = server({ serverNow: () => SERVER_T0 });
    const links = createLinkStore({ fetch: srv.fetch, now: () => 0 });
    const clips = createClipResolver(links);
    expect(clips.get("a")).toBeUndefined();
    await clips.ensure(["a"]);
    expect(clips.get("a")).toEqual({
      tile: links.get("a")!.tile,
      view: "view:a",
    });
  });
});
