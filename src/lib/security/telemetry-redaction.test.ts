import { describe, expect, it } from "vitest";

import {
  redactBreadcrumb,
  redactEvent,
  redactReplayFrame,
  redactTokens,
  redactUrl,
} from "@/lib/security/telemetry-redaction";

// A real-shaped qr_token: gen_random_uuid() with the dashes stripped, i.e. 32 lowercase hex.
const TOKEN = "8f1c2d3e4a5b6c7d8e9f0a1b2c3d4e5f";
const ALBUM = `https://partyreel.com/e/${TOKEN}`;
// A real-shaped session_token: TWO of those concatenated, i.e. 64 hex. The upload capability, and
// from the door round (2026-09-21) also a cookie value and a poll field.
const SESSION = `${TOKEN}0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d`;

describe("redactTokens", () => {
  it("removes a bare capability token wherever it appears", () => {
    expect(redactTokens(`join failed for ${TOKEN}`)).toBe(
      "join failed for [redacted]",
    );
    expect(redactTokens(TOKEN)).not.toContain(TOKEN);
  });

  // ★ THE 64-HEX SESSION TOKEN (the door as three steps, 2026-09-21). `\b[0-9a-f]{32}\b` never
  // matched one: at character 33 of a 64-hex run there is no word boundary, so the LONGER
  // capability was the one sailing through every hook here. The door round puts it on a cookie and
  // in a poll body, so this is pinned before any of that ships.
  it("removes a 64-hex session token, the longer capability", () => {
    expect(SESSION).toHaveLength(64);
    expect(redactTokens(`upload refused for ${SESSION}`)).toBe(
      "upload refused for [redacted]",
    );
    expect(redactTokens(SESSION)).not.toContain(TOKEN);
    expect(redactTokens(`pr_guest_x=${SESSION}; Path=/`)).toBe(
      "pr_guest_x=[redacted]; Path=/",
    );
  });

  it("removes the guest-link segment even when the token shape changes", () => {
    // The route rule is the belt to the shape rule's braces: a future link format, or a custom slug,
    // is still a capability in the path.
    expect(redactTokens("GET /e/my-wedding-2026 404")).toBe(
      "GET /e/[redacted] 404",
    );
  });

  it("leaves ordinary diagnostics alone", () => {
    // Media and event ids are real UUIDs, dashes included, so the 32-hex shape never matches them.
    const uuid = "8f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f";
    expect(redactTokens(`media ${uuid} missing`)).toBe(`media ${uuid} missing`);
    expect(redactTokens("upload finalize failed: 502")).toBe(
      "upload finalize failed: 502",
    );
  });
});

describe("redactUrl", () => {
  it("redacts the album path", () => {
    expect(redactUrl(ALBUM)).toBe("https://partyreel.com/e/[redacted]");
  });

  it("drops the query and fragment outright", () => {
    // R2 presigns carry a signature in the query; nothing there has ever been worth reading.
    expect(
      redactUrl("https://cdn.example.com/o/x.jpg?X-Amz-Signature=deadbeef"),
    ).toBe("https://cdn.example.com/o/x.jpg");
    expect(redactUrl(`${ALBUM}?from=qr#top`)).toBe(
      "https://partyreel.com/e/[redacted]",
    );
  });
});

describe("redactBreadcrumb", () => {
  it("redacts navigation to/from and fetch urls", () => {
    const crumb = redactBreadcrumb({
      category: "navigation",
      data: { from: "/", to: `/e/${TOKEN}` },
    });
    expect(crumb.data).toEqual({ from: "/", to: "/e/[redacted]" });
  });

  it("redacts the crumb message", () => {
    const crumb = redactBreadcrumb({ message: `polling ${ALBUM}` });
    expect(crumb.message).toBe("polling https://partyreel.com/e/[redacted]");
  });
});

describe("redactEvent", () => {
  it("redacts the request url, the transaction name and the exception value", () => {
    const event = redactEvent({
      transaction: `/e/${TOKEN}`,
      request: { url: `${ALBUM}?x=1` },
      exception: { values: [{ value: `no event for ${TOKEN}` }] },
    });
    expect(event.transaction).toBe("/e/[redacted]");
    expect(event.request?.url).toBe("https://partyreel.com/e/[redacted]");
    expect(event.exception?.values?.[0]?.value).toBe("no event for [redacted]");
  });

  it("reaches into breadcrumbs and the extra bag, which beforeSend never saw", () => {
    const event = redactEvent({
      breadcrumbs: [{ category: "fetch", data: { url: ALBUM } }],
      extra: { qr_token: TOKEN, nested: { link: ALBUM }, count: 3 },
    });
    expect(event.breadcrumbs?.[0]?.data?.url).toBe(
      "https://partyreel.com/e/[redacted]",
    );
    expect(event.extra).toEqual({
      qr_token: "[redacted]",
      nested: { link: "https://partyreel.com/e/[redacted]" },
      count: 3,
    });
  });

  it("redacts the replay envelope's url list", () => {
    const event = redactEvent({ urls: [ALBUM, "/pricing"] } as never) as {
      urls: string[];
    };
    expect(event.urls).toEqual([
      "https://partyreel.com/e/[redacted]",
      "/pricing",
    ]);
  });
});

describe("redactReplayFrame", () => {
  it("redacts a custom (breadcrumb/performance) frame", () => {
    const frame = redactReplayFrame({
      type: 5,
      data: {
        tag: "performanceSpan",
        payload: { op: "navigation.navigate", description: ALBUM },
      },
    }) as { data: { payload: { description: string } } };
    expect(frame.data.payload.description).toBe(
      "https://partyreel.com/e/[redacted]",
    );
  });

  it("leaves DOM snapshot frames untouched", () => {
    // Walking every node of every snapshot in a hot path would cost far more than it buys; the
    // visible content is already covered by maskAllText + blockAllMedia.
    const snapshot = { type: 2, data: { node: { id: 1 } } };
    expect(redactReplayFrame(snapshot)).toBe(snapshot);
    expect(snapshot.data).toEqual({ node: { id: 1 } });
  });
});
