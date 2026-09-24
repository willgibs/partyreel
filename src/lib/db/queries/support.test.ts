/**
 * THE SUPPORT INBOX READS ITS NEWEST FEW AND SAYS SO (the 1,000-row round, Will 2026-09-23).
 *
 * It read every submission and ended silently at the thousandth. Against `fake-postgrest` (every read
 * clamped at 1,000), with 2,500 messages: the inbox reads exactly its depth, newest first through
 * timestamp ties, knows whether there are more, keeps a status filter, reaches any depth past 1,000,
 * and "oldest waiting" is one row, oldest first. The count behind the rail stays a HEAD count.
 */
import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { countContactByStatus, listContactSubmissions, oldestContactAt } =
  await import("@/lib/db/queries/support");

const uuid = (i: number) =>
  `c0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (secondsAgo: number) =>
  new Date(Date.parse("2026-09-23T12:00:00.000Z") - secondsAgo * 1000)
    .toISOString()
    .replace("Z", "000+00:00");

function inbox(n: number): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(i),
    name: `Sender ${i}`,
    email: `sender${i}@example.com`,
    message: "Hello",
    // Every three share a timestamp; one in four is already handled.
    created_at: at(60 + Math.floor(i / 3)),
    status: i % 4 === 3 ? "handled" : "new",
  }));
}

describe("listContactSubmissions", () => {
  it("★ reads exactly its depth, newest first, and knows there is more", async () => {
    fake = createFakePostgrest({ tables: { contact_submissions: inbox(2500) } });
    const { rows, more } = await listContactSubmissions(undefined, 50);
    expect(rows).toHaveLength(50);
    expect(more).toBe(true);
    const stamps = rows.map((r) => r.created_at);
    expect([...stamps].sort().reverse()).toEqual(stamps);
  });

  it("★ reaches any depth past 1,000, each message once, within a status", async () => {
    fake = createFakePostgrest({ tables: { contact_submissions: inbox(2500) } });
    const { rows, more } = await listContactSubmissions("new", 1800);
    expect(rows).toHaveLength(1800);
    expect(new Set(rows.map((r) => r.id)).size).toBe(1800);
    expect(rows.every((r) => r.status === "new")).toBe(true);
    // 1,875 are new, so 75 remain past this depth.
    expect(more).toBe(true);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("the whole inbox reads as whole: no more past its last message", async () => {
    fake = createFakePostgrest({ tables: { contact_submissions: inbox(30) } });
    const { rows, more } = await listContactSubmissions(undefined, 50);
    expect(rows).toHaveLength(30);
    expect(more).toBe(false);
  });

  it("throws on a failed read rather than an empty inbox", async () => {
    fake = createFakePostgrest({ tables: {} });
    await expect(listContactSubmissions(undefined, 50)).rejects.toThrow(
      /admin support: submissions/,
    );
  });
});

describe("the queue's figures", () => {
  it("oldest waiting is one row, oldest first; the count is a HEAD count", async () => {
    fake = createFakePostgrest({ tables: { contact_submissions: inbox(2500) } });
    // The very oldest message is handled (index 2,499), so the oldest waiting is the one before it.
    await expect(oldestContactAt("new")).resolves.toBe(at(60 + 832));
    expect(fake.requests[0]).toMatchObject({ limit: 1, returned: 1 });
    await expect(countContactByStatus("new")).resolves.toBe(1875);
    expect(fake.requests[1].method).toBe("HEAD");
  });

  it("an empty status reads null, and a failed read throws", async () => {
    fake = createFakePostgrest({ tables: { contact_submissions: [] } });
    await expect(oldestContactAt("new")).resolves.toBeNull();
    fake = createFakePostgrest({ tables: {} });
    await expect(oldestContactAt("new")).rejects.toThrow(/oldest waiting/);
  });
});
