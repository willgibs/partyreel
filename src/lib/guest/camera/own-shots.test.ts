/**
 * HER ROLL AND HER SHOTS, AS ONE READ ANSWERS THEM: read defensively, and never asked to tell her news.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseOwnRoll,
  pictureIsVideoFile,
  readOwnRoll,
  waitsOutOfSight,
} from "./own-shots";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseOwnRoll", () => {
  it("reads her items and her roll", () => {
    expect(
      parseOwnRoll({
        ok: true,
        items: [
          {
            id: "m1",
            status: "approved",
            sealed: true,
            picture: {
              type: "photo",
              at: 1,
              tile: "https://r2/x/preview.webp",
            },
          },
          { id: "m2", status: "pending" },
          { id: "m3", status: "refused" },
        ],
        roll: { used: 3, cap: 24, taken: 4, ceiling: 72 },
      }),
    ).toEqual({
      roll: { used: 3, cap: 24, taken: 4, ceiling: 72 },
      shots: [
        {
          id: "m1",
          status: "approved",
          sealed: true,
          picture: { type: "photo", at: 1, tile: "https://r2/x/preview.webp" },
        },
        { id: "m2", status: "pending" },
        { id: "m3", status: "refused" },
      ],
    });
  });

  it("drops what it cannot read and answers no roll where there is none", () => {
    expect(
      parseOwnRoll({
        ok: true,
        items: [
          { id: 4, status: "approved" },
          { id: "m1", status: "hidden" },
          {
            id: "m2",
            status: "approved",
            picture: { type: "gif", at: 1, tile: "x" },
          },
        ],
      }),
    ).toEqual({ roll: null, shots: [{ id: "m2", status: "approved" }] });
    expect(parseOwnRoll({ ok: false })).toBeNull();
    expect(parseOwnRoll(null)).toBeNull();
  });
});

describe("readOwnRoll", () => {
  it("asks for her statuses with the ticket in the body, and never for her news", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ ok: true, items: [], roll: null }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await readOwnRoll({ qrToken: "qr", sessionToken: "sess-token" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/guests/mine");
    expect(JSON.parse(String(init.body))).toEqual({
      qr_token: "qr",
      session_token: "sess-token",
      statuses: true,
    });
  });

  it("asks as her account where the device holds no ticket", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true, items: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await readOwnRoll({ qrToken: "qr", sessionToken: null });
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(init.body))).toEqual({
      qr_token: "qr",
      statuses: true,
    });
  });

  it("answers null on a refusal or a dropped connection (the camera keeps what it knew)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 429 })),
    );
    expect(await readOwnRoll({ qrToken: "qr", sessionToken: null })).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    expect(await readOwnRoll({ qrToken: "qr", sessionToken: null })).toBeNull();
  });
});

describe("her pictures and what she may take back", () => {
  it("tells a video's own file from its preview by the key's variant", () => {
    expect(
      pictureIsVideoFile({
        type: "video",
        at: 1,
        tile: "https://bucket.r2/events/e/video/m/original.mp4?X-Amz-Signature=1",
      }),
    ).toBe(true);
    expect(
      pictureIsVideoFile({
        type: "video",
        at: 1,
        tile: "https://bucket.r2/events/e/video/m/preview.webp?X-Amz-Signature=1",
      }),
    ).toBe(false);
    expect(pictureIsVideoFile(undefined)).toBe(false);
  });

  it("is hers to take back while the album cannot show it: held, or sealed", () => {
    expect(waitsOutOfSight({ status: "pending" })).toBe(true);
    expect(waitsOutOfSight({ status: "approved", sealed: true })).toBe(true);
    expect(waitsOutOfSight({ status: "approved" })).toBe(false);
    expect(waitsOutOfSight({ status: "refused" })).toBe(false);
  });
});
