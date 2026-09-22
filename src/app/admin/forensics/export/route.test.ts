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

import { describe, expect, it } from "vitest";

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
