/**
 * WHETHER ANYTHING WAITS (the-wait r1): one read, held or sealed, a yes or a no; a failed read says no, captured.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));
const asked = vi.hoisted(() => ({
  filters: [] as string[],
  answer: { data: [] as unknown[] | null, error: null as unknown },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const q = {
      from: (t: string) => (asked.filters.push(`from ${t}`), q),
      select: (c: string) => (asked.filters.push(`select ${c}`), q),
      eq: (c: string, v: string) => (asked.filters.push(`eq ${c} ${v}`), q),
      or: (f: string) => (asked.filters.push(`or ${f}`), q),
      limit: (n: number) => (
        asked.filters.push(`limit ${n}`),
        Promise.resolve(asked.answer)
      ),
    };
    return q;
  },
}));

const { albumWaits } = await import("@/lib/disposable/waiting.server");

beforeEach(() => {
  asked.filters = [];
  asked.answer = { data: [], error: null };
  captureError.mockClear();
});

describe("albumWaits", () => {
  it("★ asks for one row held for the host or sealed now, and answers whether there is one", async () => {
    asked.answer = { data: [{ id: "x" }], error: null };
    await expect(albumWaits("e1")).resolves.toBe(true);
    expect(asked.filters).toContain("eq event_id e1");
    expect(asked.filters.find((f) => f.startsWith("or "))).toMatch(
      /^or status\.eq\.pending,and\(status\.eq\.approved,sealed_until\.gt\.\d{4}-\d{2}-\d{2}T/,
    );
    expect(asked.filters).toContain("limit 1");
  });

  it("nothing waiting is no", async () => {
    await expect(albumWaits("e1")).resolves.toBe(false);
  });

  it("a failed read is no, and is captured (never a thrown page)", async () => {
    asked.answer = { data: null, error: { message: "down" } };
    await expect(albumWaits("e1")).resolves.toBe(false);
    expect(captureError).toHaveBeenCalledTimes(1);
  });
});
