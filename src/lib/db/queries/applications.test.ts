/**
 * THE APPLICANTS INBOX READS ITS NEWEST FEW AND SAYS SO (the 1,000-row round, Will 2026-09-23).
 *
 * It read every application and ended silently at the thousandth. Against `fake-postgrest` (every
 * read clamped at 1,000), with 2,500 applications: the inbox reads exactly its depth, newest first,
 * knows whether there are more, reaches any depth past 1,000, maps each role to its title, and
 * "oldest waiting" is one row, oldest first.
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

const { listJobApplications, oldestApplicationAt } = await import(
  "@/lib/db/queries/applications"
);

const uuid = (i: number) =>
  `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (secondsAgo: number) =>
  new Date(Date.parse("2026-09-23T12:00:00.000Z") - secondsAgo * 1000)
    .toISOString()
    .replace("Z", "000+00:00");

function applications(n: number): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(i),
    name: `Applicant ${i}`,
    email: `applicant${i}@example.com`,
    role_slug: "a-removed-posting",
    created_at: at(60 + Math.floor(i / 2)),
    status: "new",
  }));
}

describe("listJobApplications", () => {
  it("★ reads exactly its depth past 1,000, newest first, and knows there is more", async () => {
    fake = createFakePostgrest({ tables: { job_applications: applications(2500) } });
    const { rows, more } = await listJobApplications("new", 1500);
    expect(rows).toHaveLength(1500);
    expect(new Set(rows.map((r) => r.id)).size).toBe(1500);
    expect(more).toBe(true);
    const stamps = rows.map((r) => r.created_at);
    expect([...stamps].sort().reverse()).toEqual(stamps);
    // A removed posting falls back to its slug.
    expect(rows[0].roleTitle).toBe("a-removed-posting");
  });

  it("the first page is the newest fifty", async () => {
    fake = createFakePostgrest({ tables: { job_applications: applications(2500) } });
    const { rows, more } = await listJobApplications(undefined, 50);
    expect(rows).toHaveLength(50);
    expect(more).toBe(true);
  });

  it("oldest waiting is one row, oldest first", async () => {
    fake = createFakePostgrest({ tables: { job_applications: applications(2500) } });
    await expect(oldestApplicationAt("new")).resolves.toBe(at(60 + 1249));
    expect(fake.requests[0]).toMatchObject({ limit: 1, returned: 1 });
  });
});
