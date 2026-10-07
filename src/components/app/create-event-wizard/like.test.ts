import { afterEach, describe, expect, it, vi } from "vitest";

import {
  forgetLike,
  LIKE_COOKIE,
  LIKE_COOKIE_PATH,
  likeHref,
  likeOf,
  likeToken,
} from "./like";

/**
 * MAKE ONE LIKE THIS (after-party r1's `bridge=end`): what an album lends Create, and the token it is asked by. What
 * fails silently: a token of the wrong shape reaching a read (an address the door would build from it), an album
 * lending more than its style (its develop time is never hers), and a like left behind after Create has opened in it.
 */

afterEach(() => vi.restoreAllMocks());

describe("the token Create may read", () => {
  it("is an album's token or its custom link, whole, and nothing else", () => {
    expect(likeToken("7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c")).toBe(
      "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
    );
    expect(likeToken("maya-and-jay")).toBe("maya-and-jay");
    expect(likeToken(["maya-and-jay", "other"])).toBe("maya-and-jay");
    for (const bad of [
      "",
      "ab",
      "a".repeat(65),
      "../dashboard",
      "maya and jay",
      "maya%2Fjay",
      "maya/jay",
      "https://evil.example",
      null,
      undefined,
      42,
    ])
      expect(likeToken(bad), String(bad)).toBeNull();
  });

  it("leads every way in through the door, its token encoded into the path", () => {
    expect(likeHref("maya-and-jay")).toBe("/dashboard/new/like/maya-and-jay");
  });
});

describe("what an album lends (likeOf)", () => {
  const album = {
    capture: "upload" as const,
    moderation_mode: "live",
    develops_at: null,
    qr_style: "rounded",
    roll_size: null,
  };

  it("lends its style and its look", () => {
    expect(likeOf(album)).toEqual({
      style: "live",
      look: "rounded",
      roll: null,
    });
    expect(
      likeOf({ ...album, moderation_mode: "hold_for_approval" })?.style,
    ).toBe("approval");
  });

  it("★ lends a Disposable its roll, and never its develop time", () => {
    const like = likeOf({
      ...album,
      capture: "camera",
      develops_at: "2026-10-10T13:00:00Z",
      roll_size: 36,
    });
    expect(like).toEqual({ style: "disposable", look: "rounded", roll: 36 });
    expect(JSON.stringify(like)).not.toContain("2026");
  });

  it("lends no roll with a Live or Review album", () => {
    expect(likeOf({ ...album, roll_size: 36 })?.roll).toBeNull();
  });

  it("reads a look it does not know as the default", () => {
    expect(likeOf({ ...album, qr_style: "neon" })?.look).toBe("classic");
  });

  it("lends nothing of a mix outside the three styles", () => {
    expect(likeOf({ ...album, capture: "camera" })).toBeNull();
    expect(
      likeOf({
        ...album,
        moderation_mode: "hold_for_approval",
        develops_at: "2026-10-10T13:00:00Z",
      }),
    ).toBeNull();
  });
});

describe("the like, put down", () => {
  // The unit world has no DOM: the document's cookie jar is a stand-in the test owns.
  afterEach(() => vi.unstubAllGlobals());

  it("★ expires the cookie on Create's own path, so the next Create is her own", () => {
    const written: string[] = [];
    vi.stubGlobal("document", {
      set cookie(v: string) {
        written.push(v);
      },
    });
    forgetLike();
    expect(written).toEqual([
      `${LIKE_COOKIE}=; Max-Age=0; Path=${LIKE_COOKIE_PATH}; SameSite=Lax`,
    ]);
  });

  it("is never a fault where there is no cookie jar to write", () => {
    vi.stubGlobal("document", undefined);
    expect(() => forgetLike()).not.toThrow();
  });
});
