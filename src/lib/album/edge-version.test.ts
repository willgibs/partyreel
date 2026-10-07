import { describe, expect, it } from "vitest";

/** The numbers both halves read (edge-version.ts): the window, its reach, the key's shape, the answer's. */
import {
  ALBUM_EDGE_WINDOW_MS,
  albumVersionUrl,
  edgeKeyOf,
  edgeWindowOf,
  readVersionAnswer,
  windowInReach,
} from "@/lib/album/edge-version";

describe("the window", () => {
  it("is a few seconds, and a moment's window is the one it falls in", () => {
    expect(ALBUM_EDGE_WINDOW_MS).toBeGreaterThanOrEqual(2_000);
    expect(ALBUM_EDGE_WINDOW_MS).toBeLessThanOrEqual(10_000);
    const start =
      1_790_000_000_000 - (1_790_000_000_000 % ALBUM_EDGE_WINDOW_MS);
    expect(edgeWindowOf(start)).toBe(start / ALBUM_EDGE_WINDOW_MS);
    expect(edgeWindowOf(start + ALBUM_EDGE_WINDOW_MS - 1)).toBe(
      start / ALBUM_EDGE_WINDOW_MS,
    );
    expect(edgeWindowOf(start + ALBUM_EDGE_WINDOW_MS)).toBe(
      start / ALBUM_EDGE_WINDOW_MS + 1,
    );
  });

  it("★ the server fills its own window or a neighbour, never one further: no fill can wait for a later window", () => {
    const now = 1_790_000_000_000;
    const w = edgeWindowOf(now);
    expect(windowInReach(w, now)).toBe(true);
    expect(windowInReach(w - 1, now)).toBe(true);
    expect(windowInReach(w + 1, now)).toBe(true);
    expect(windowInReach(w + 2, now)).toBe(false);
    expect(windowInReach(w - 2, now)).toBe(false);
    expect(windowInReach(0, now)).toBe(false);
  });
});

describe("the wire", () => {
  it("an edge key is 22 base64url characters, and nothing else is one", () => {
    expect(edgeKeyOf("AbCdEfGhIjKlMnOpQrSt-_")).toBe("AbCdEfGhIjKlMnOpQrSt-_");
    for (const bad of [
      null,
      undefined,
      "",
      '"a1-next"',
      "AbCdEfGhIjKlMnOpQrSt-",
      "AbCdEfGhIjKlMnOpQrSt-__",
      "AbCdEfGhIjKlMnOpQrSt/=",
      "0123456789abcdef0123456789abcdef",
    ])
      expect(edgeKeyOf(bad)).toBeNull();
  });

  it("the URL names the key and the window, and nothing else", () => {
    expect(albumVersionUrl("AbCdEfGhIjKlMnOpQrSt-_", 358_000_000)).toBe(
      "/api/album/guest/sync/version?k=AbCdEfGhIjKlMnOpQrSt-_&w=358000000",
    );
  });

  it("reads the three answers and refuses anything else", () => {
    expect(readVersionAnswer({ kind: "version", v: '"a1-x"' })).toEqual({
      kind: "version",
      v: '"a1-x"',
    });
    expect(readVersionAnswer({ kind: "ask", extra: 1 })).toEqual({
      kind: "ask",
    });
    expect(readVersionAnswer({ kind: "clock", now: 5 })).toEqual({
      kind: "clock",
      now: 5,
    });
    for (const bad of [
      null,
      "version",
      42,
      {},
      { kind: "version" },
      { kind: "version", v: "" },
      { kind: "version", v: 7 },
      { kind: "clock" },
      { kind: "clock", now: Number.NaN },
      { kind: "clock", now: Number.POSITIVE_INFINITY },
      { kind: "full", v: "x" },
    ])
      expect(readVersionAnswer(bad)).toBeNull();
  });
});
