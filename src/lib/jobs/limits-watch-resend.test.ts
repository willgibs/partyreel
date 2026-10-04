/**
 * RESEND'S LIST, TALLIED BY DAY, red first: one pass gives every UTC day of the window, the paging stops at the first
 * mail before it, a count it could not finish is a floor, and a list it cannot trust (out of order, an unreadable
 * time, a refusal) is no reading at all for both meters, never a zero.
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

const { countByDay, dailySeries, readResendMeters } =
  await import("@/lib/jobs/limits-watch-resend");

const NOW = Date.parse("2026-10-04T16:52:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** A Resend timestamp, as the API writes it, `hoursAgo` before NOW. */
function stamp(hoursAgo: number): string {
  return new Date(NOW - hoursAgo * HOUR)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "000+00");
}

const item = (id: string, hoursAgo: number) => ({
  id,
  createdAt: stamp(hoursAgo),
});

beforeEach(() => {
  vi.clearAllMocks();
  configured = true;
});

describe("the tally by day", () => {
  it("counts each UTC day, newest first, and stops at the first mail before the window", async () => {
    const readPage = vi.fn(async () => ({
      hasMore: true,
      // 2 mails today (1 h and 5 h ago), 1 yesterday, then one before the window: never counted.
      items: [item("a", 1), item("b", 5), item("c", 30), item("old", 24 * 40)],
    }));
    const r = await countByDay(NOW - 31 * DAY, readPage);
    expect(Object.fromEntries(r.perDay)).toEqual({
      "2026-10-04": 2,
      "2026-10-03": 1,
    });
    expect(r.atLeast).toBe(false);
    expect(readPage).toHaveBeenCalledTimes(1);
  });

  it("pages by the last id, and ends when the list does", async () => {
    const pages = [
      { hasMore: true, items: [item("a", 1), item("b", 2)] },
      { hasMore: false, items: [item("c", 26)] },
    ];
    const readPage = vi.fn(async (after: string | undefined) =>
      after === undefined ? pages[0] : pages[1],
    );
    const r = await countByDay(NOW - 31 * DAY, readPage);
    expect(readPage).toHaveBeenNthCalledWith(1, undefined);
    expect(readPage).toHaveBeenNthCalledWith(2, "b");
    expect(Object.fromEntries(r.perDay)).toEqual({
      "2026-10-04": 2,
      "2026-10-03": 1,
    });
    expect(r.atLeast).toBe(false);
  });

  it("★ says a floor, not the count, when the page cap ends it", async () => {
    const readPage = vi.fn(async () => ({
      hasMore: true,
      items: [item("x", 1)],
    }));
    const r = await countByDay(NOW - 31 * DAY, readPage, 3);
    expect(r.atLeast).toBe(true);
    expect(r.perDay.get("2026-10-04")).toBe(3);
  });

  it("throws on a list out of order or a time it cannot read", async () => {
    await expect(
      countByDay(NOW - DAY, async () => ({
        hasMore: false,
        items: [item("a", 5), item("b", 1)],
      })),
    ).rejects.toThrow(/not newest first/);
    await expect(
      countByDay(NOW - DAY, async () => ({
        hasMore: false,
        items: [{ id: "a", createdAt: "yesterday" }],
      })),
    ).rejects.toThrow(/could not be read/);
  });
});

describe("the series", () => {
  it("is 31 ascending days ending today, a quiet day 0", () => {
    const days = dailySeries(
      new Map([
        ["2026-10-04", 7],
        ["2026-10-01", 3],
      ]),
      NOW,
    );
    expect(days).toHaveLength(31);
    expect(days[0].day).toBe("2026-09-04");
    expect(days.at(-1)).toEqual({ day: "2026-10-04", value: 7 });
    expect(days.find((d) => d.day === "2026-10-01")?.value).toBe(3);
    expect(days.find((d) => d.day === "2026-10-02")?.value).toBe(0);
  });
});

describe("the two meters, from one pass", () => {
  const page = (items: ReturnType<typeof item>[], hasMore = false) => ({
    data: {
      has_more: hasMore,
      data: items.map((i) => ({ id: i.id, created_at: i.createdAt })),
    },
    error: null,
  });

  it("hands both the same series, once", async () => {
    list.mockResolvedValueOnce(page([item("a", 1), item("b", 30)]));
    const r = await readResendMeters(NOW);
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ limit: 100 });
    expect(r.resend_month).toBe(r.resend_day);
    expect(r.resend_month.kind).toBe("days");
  });

  it("is a failed read of both when Resend refuses, is not configured, or answers what cannot be trusted", async () => {
    list.mockResolvedValueOnce({
      data: null,
      error: { message: "rate limited" },
    });
    const refused = await readResendMeters(NOW);
    expect(refused.resend_month).toMatchObject({
      kind: "none",
      cause: "failed",
    });
    expect(refused.resend_day).toBe(refused.resend_month);
    expect(
      refused.resend_month.kind === "none" && refused.resend_month.why,
    ).toMatch(/rate limited/);

    configured = false;
    const off = await readResendMeters(NOW);
    expect(off.resend_day).toMatchObject({
      kind: "none",
      cause: "failed",
      why: "Resend is not configured in this environment",
    });

    configured = true;
    list.mockResolvedValueOnce(page([item("a", 5), item("b", 1)]));
    const bad = await readResendMeters(NOW);
    expect(bad.resend_month.kind === "none" && bad.resend_month.why).toMatch(
      /not newest first/,
    );
  });
});
