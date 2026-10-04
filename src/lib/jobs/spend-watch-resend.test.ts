/**
 * RESEND'S OWN COUNT, red first: its times read as written, the list paged until the day ends, a count it could not
 * finish said as a floor, and a list it cannot trust (out of order, an unreadable time) no reading at all.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const list = vi.fn();
let configured = true;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/client", () => ({
  getResend: () => {
    if (!configured) throw new Error("Resend is not configured.");
    return { emails: { list: (...a: unknown[]) => list(...a) } };
  },
}));

const { countSentSince, parseResendTime, readResendDay } =
  await import("@/lib/jobs/spend-watch-resend");

const NOW = Date.parse("2026-10-03T05:00:00.000Z");
const HOUR = 60 * 60 * 1000;

/** A Resend timestamp, as the API writes it, `hoursAgo` before NOW. */
function stamp(hoursAgo: number): string {
  return new Date(NOW - hoursAgo * HOUR)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "000+00");
}

beforeEach(() => {
  vi.clearAllMocks();
  configured = true;
});

describe("Resend's times", () => {
  it("reads the API's own shape: a space, microseconds and a bare +00", () => {
    expect(parseResendTime("2026-10-03 01:12:29.587000+00")).toBe(
      Date.parse("2026-10-03T01:12:29.587Z"),
    );
    expect(parseResendTime("2026-10-03T01:12:29Z")).toBe(
      Date.parse("2026-10-03T01:12:29Z"),
    );
    expect(parseResendTime("2026-10-03 01:12:29.5+0200")).toBe(
      Date.parse("2026-10-03T01:12:29.500+02:00"),
    );
  });

  it("reads anything else as no time at all", () => {
    expect(parseResendTime("yesterday")).toBeNull();
    expect(parseResendTime(null)).toBeNull();
    expect(parseResendTime(1_700_000_000)).toBeNull();
  });
});

describe("counting the day", () => {
  const since = NOW - 24 * HOUR;

  it("pages until the first mail at or before the day began", async () => {
    const pages = [
      {
        hasMore: true,
        items: [
          { id: "a", createdAt: stamp(1) },
          { id: "b", createdAt: stamp(2) },
        ],
      },
      {
        hasMore: true,
        items: [
          { id: "c", createdAt: stamp(23) },
          { id: "d", createdAt: stamp(30) },
        ],
      },
      { hasMore: false, items: [{ id: "e", createdAt: stamp(40) }] },
    ];
    const asked: (string | undefined)[] = [];
    const result = await countSentSince(since, async (after) => {
      asked.push(after);
      return pages[asked.length - 1];
    });
    expect(result).toEqual({ count: 3, atLeast: false });
    // The cursor is each page's last id, and the third page is never read.
    expect(asked).toEqual([undefined, "b"]);
  });

  it("★ says 'at least' when it runs out of pages, never a finished count", async () => {
    const result = await countSentSince(
      since,
      async () => ({
        hasMore: true,
        items: [{ id: "x", createdAt: stamp(0.1) }],
      }),
      3,
    );
    expect(result).toEqual({ count: 3, atLeast: true });
  });

  it("refuses a list that is not newest first, or a time it cannot read", async () => {
    await expect(
      countSentSince(since, async () => ({
        hasMore: false,
        items: [
          { id: "a", createdAt: stamp(5) },
          { id: "b", createdAt: stamp(1) },
        ],
      })),
    ).rejects.toThrow(/not newest first/);
    await expect(
      countSentSince(since, async () => ({
        hasMore: false,
        items: [{ id: "a", createdAt: "soon" }],
      })),
    ).rejects.toThrow(/could not be read/);
  });

  it("counts an empty account as zero mail, which it truly is", async () => {
    expect(
      await countSentSince(since, async () => ({ hasMore: false, items: [] })),
    ).toEqual({ count: 0, atLeast: false });
  });
});

describe("the reading", () => {
  it("counts the last day through the SDK, a hundred a page", async () => {
    list.mockResolvedValueOnce({
      data: {
        has_more: false,
        data: [
          { id: "a", created_at: stamp(1) },
          { id: "b", created_at: stamp(25) },
        ],
      },
      error: null,
    });
    expect(await readResendDay(NOW)).toEqual({
      ok: true,
      count: 1,
      atLeast: false,
    });
    expect(list).toHaveBeenCalledWith({ limit: 100 });
  });

  it("★ is no reading, with its reason, when Resend is not configured or answers an error", async () => {
    configured = false;
    expect(await readResendDay(NOW)).toEqual({
      ok: false,
      why: "Resend is not configured in this environment",
    });
    configured = true;
    list.mockResolvedValueOnce({
      data: null,
      error: { message: "API key is invalid", name: "validation_error" },
    });
    const taken = await readResendDay(NOW);
    expect(taken.ok).toBe(false);
    expect(taken).toMatchObject({
      why: "Resend's list could not be read: API key is invalid",
    });
  });
});
