/**
 * FILE-content guards on the (unapplied) forensics migration. These pin two review findings so a
 * later edit can't silently regress them before the orchestrator applies the SQL:
 *
 *   1. restore_media must keep the `removed_by_uploader = false` uploader-privacy guard from the
 *      currently-applied 20260609150000 body. The forensics migration CREATE-OR-REPLACEs the
 *      function, so dropping that predicate would let a host restore a guest's PRIVATE
 *      self-deletion back onto the live gallery (the SQL predicate is the SOLE boundary, on
 *      purpose - no app-side enforcement exists).
 *
 *   2. SELECT on media is COLUMN-scoped so the hold columns stay invisible to the owning host
 *      (the host may BE the investigated uploader). The DB grant list and the app-side
 *      MEDIA_HOST_COLUMNS select list must stay identical, and neither may ever include the two
 *      hold columns. Text-parsed (not imported): queries/media.ts is `server-only`.
 *
 * Both sources are parsed as TEXT because the truth lives in files, not runtime exports - the
 * same style as the tiers.ts <-> tier_limits() parity guard.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const migration = readFileSync(
  join(
    ROOT,
    "supabase/migrations/20260707150000_upload_forensics_legal_hold.sql",
  ),
  "utf8",
);
const mediaQueries = readFileSync(
  join(ROOT, "src/lib/db/queries/media.ts"),
  "utf8",
);

/** The restore_media function definition (from its CREATE to the closing grant). */
function restoreMediaBlock(): string {
  const start = migration.indexOf(
    "create or replace function public.restore_media",
  );
  expect(start).toBeGreaterThan(-1);
  const end = migration.indexOf(
    "grant execute on function public.restore_media",
    start,
  );
  expect(end).toBeGreaterThan(start);
  return migration.slice(start, end);
}

describe("restore_media replacement (finding: superseded-body revert)", () => {
  it("keeps the removed_by_uploader uploader-privacy guard in the ownership SELECT", () => {
    expect(restoreMediaBlock()).toContain("and m.removed_by_uploader = false");
  });

  it("adds the legal-hold refusal on top of it", () => {
    expect(restoreMediaBlock()).toContain("v_media.legal_hold_at is not null");
  });
});

/** Column names out of the migration's `grant select ( ... ) on public.media` list. */
function migrationGrantColumns(): string[] {
  const m = migration.match(
    /grant select \(([\s\S]*?)\) on public\.media to authenticated;/,
  );
  expect(m).not.toBeNull();
  return m![1]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Column names out of MEDIA_HOST_COLUMNS in src/lib/db/queries/media.ts. */
function tsSelectColumns(): string[] {
  const m = mediaQueries.match(/export const MEDIA_HOST_COLUMNS =\s*"([^"]+)"/);
  expect(m).not.toBeNull();
  return m![1]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

describe("media SELECT column-scoping (finding: hold columns host-readable)", () => {
  it("revokes the TABLE select grant BEFORE re-granting columns (revoke-order landmine)", () => {
    const revokeAt = migration.indexOf(
      "revoke select on public.media from public, anon, authenticated;",
    );
    const grantAt = migration.search(/grant select \(/);
    expect(revokeAt).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(revokeAt);
  });

  it("never grants the hold columns to authenticated", () => {
    const granted = migrationGrantColumns();
    expect(granted).not.toContain("legal_hold_at");
    expect(granted).not.toContain("legal_hold_reason");
    expect(granted.length).toBeGreaterThan(0);
  });

  it("keeps MEDIA_HOST_COLUMNS free of the hold columns", () => {
    const cols = tsSelectColumns();
    expect(cols).not.toContain("legal_hold_at");
    expect(cols).not.toContain("legal_hold_reason");
  });

  it("keeps the DB grant and MEDIA_HOST_COLUMNS identical (change one -> change both)", () => {
    expect([...tsSelectColumns()].sort()).toEqual(
      [...migrationGrantColumns()].sort(),
    );
  });

  it('leaves no select("*") on media in the host query module', () => {
    expect(mediaQueries).not.toContain('.select("*")');
  });
});
