/**
 * THE EVIDENCE RECORD CARRIES THE WHOLE FORENSIC ROW (trust-safety-forensics.md; the guest identity
 * round, Will 2026-09-22).
 *
 * `?what=record` is the ONE operator surface that renders a forensic row rather than counting them,
 * so it is where a lawful-process response gets the uploader's identity from. The capture seam now
 * writes `upload_forensics.guest_pending_email` — for a guest at level 2 (a typed name plus an
 * address nobody proved) that column and the typed name beside it are the only things connecting the
 * upload to a person.
 *
 * ★ THE PIN IS ON THE UNNARROWED SELECT, and that is deliberate. The read is `select("*")`, so every
 *   column the schema grows rides the record for free; the failure mode worth guarding is someone
 *   "tidying" it into a named list, which would silently drop the newest evidence from every export
 *   taken afterwards, with nothing failing. Narrowing it is allowed only if the list names every
 *   identity column explicitly, which the second case below checks.
 *
 * ★ AND THE AUDIT ROW IS NOT OPTIONAL: every export attempt writes one, success or refusal. That is
 *   the chain-of-custody contract, checked here at the source so a refactor cannot quietly lose it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

// The behaviour pins at the foot run the real handler over `fake-postgrest`; everything around the
// reads is stubbed to the admin who passed the gate.
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdminAction: async () => ({ ok: true, ctx: { userId: "admin-1" } }),
}));
vi.mock("@/lib/auth/admin-host", () => ({ isAdminHost: () => true }));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: () => {} }));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async () => "https://r2.example/signed",
}));
const audits: Record<string, unknown>[] = [];
vi.mock("@/lib/forensics/preserve", () => ({
  writeForensicAudit: async (_admin: unknown, row: Record<string, unknown>) => {
    audits.push(row);
  },
}));
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const src = readFileSync(
  join(process.cwd(), "src/app/admin/forensics/export/route.ts"),
  "utf8",
);

/** The identity columns a record has to be able to answer with. */
const IDENTITY_COLUMNS = [
  "guest_id",
  "guest_user_id",
  "guest_email",
  "guest_display_name",
  "guest_pending_email",
];

describe("the record export reads the forensic row whole", () => {
  it("★ selects the upload_forensics row unnarrowed, or names every identity column", () => {
    const readsWholeRow =
      /from\("upload_forensics"\)\s*\n?\s*\.select\("\*"\)/.test(src);
    if (!readsWholeRow) {
      for (const column of IDENTITY_COLUMNS) {
        expect(src, column).toContain(column);
      }
    }
    expect(
      readsWholeRow || IDENTITY_COLUMNS.every((c) => src.includes(c)),
    ).toBe(true);
  });

  it("puts that row in the exported body rather than a hand-picked subset", () => {
    expect(src).toContain("forensics: forensics ?? null");
  });

  it("serves it as an attachment that is never cached", () => {
    expect(src).toContain("Content-Disposition");
    expect(src).toContain('"Cache-Control": "no-store"');
  });
});

describe("the chain of custody", () => {
  it("is admin-gated, and on the admin host in production", () => {
    expect(src).toContain("requireAdminAction");
    expect(src).toContain("isAdminHost");
  });

  it("writes a forensic audit row on the ok path AND on every refusal", () => {
    // Four call sites today: not-preserved, the evidence redirect, the record, and the catch.
    const audits = src.match(/writeForensicAudit\(/g) ?? [];
    expect(audits.length).toBeGreaterThanOrEqual(4);
    expect(src).toContain('outcome: "error"');
    expect(src).toContain('outcome: "ok"');
  });

  it("refuses anything that is not a uuid and one of the two shapes", () => {
    expect(src).toContain('["evidence", "record"].includes(what)');
  });
});

/**
 * ★ A FAILED READ FAILS THE EXPORT (the 1,000-row round, 2026-09-23). The record's two reads used to
 * be destructured without their errors, so a failed media or event read shipped an evidence record
 * with `media: null`, which reads exactly like a row that is genuinely gone. Now either failure is a
 * 500 with an error audit row, and never a record.
 */
describe("the record export, when a read fails", () => {
  const MEDIA = "0f0e0d0c-0b0a-4900-8800-000000000001";
  const EVENT = "0f0e0d0c-0b0a-4900-8800-000000000002";

  function world(): FakePostgrest {
    return createFakePostgrest({
      tables: {
        upload_forensics: [{ id: "f1", media_id: MEDIA, event_id: EVENT }],
        media: [{ id: MEDIA, event_id: EVENT, status: "approved" }],
        events: [{ id: EVENT, name: "Party", host_id: "h1", created_at: "x" }],
      },
    });
  }

  async function exportRecord(): Promise<Response> {
    const { GET } = await import("@/app/admin/forensics/export/route");
    return GET(
      new Request(
        `https://admin.example/admin/forensics/export?media=${MEDIA}&what=record`,
      ),
    );
  }

  it("serves the record, media and event included, when every read succeeds", async () => {
    fake = world();
    audits.length = 0;
    const response = await exportRecord();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.media).toMatchObject({ id: MEDIA });
    expect(body.event).toMatchObject({ id: EVENT });
    expect(audits.at(-1)).toMatchObject({ outcome: "ok" });
  });

  it("★ a failed media read is a 500 and an error audit row, never a record without its media", async () => {
    fake = world();
    delete fake.tables.media;
    audits.length = 0;
    const response = await exportRecord();
    expect(response.status).toBe(500);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ outcome: "error" });
    expect(String(audits[0].error)).toMatch(/media read/);
  });

  it("★ a failed event read is a 500 too", async () => {
    fake = world();
    delete fake.tables.events;
    audits.length = 0;
    const response = await exportRecord();
    expect(response.status).toBe(500);
    expect(String(audits[0]?.error)).toMatch(/event read/);
  });
});
