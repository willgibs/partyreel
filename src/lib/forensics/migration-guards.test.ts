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
 *      hold columns - nor any of the later ungranted-by-design columns (removed_by_system,
 *      removed_by_admin, status_before_removed), which MediaRow must also strip from its row type.
 *      Text-parsed (not imported): queries/media.ts is `server-only`.
 *
 * Both sources are parsed as TEXT because the truth lives in files, not runtime exports - the
 * same style as the tiers.ts <-> tier_limits() parity guard.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");
const migration = readFileSync(
  join(MIGRATIONS_DIR, "20260707150000_upload_forensics_legal_hold.sql"),
  "utf8",
);
const mediaQueries = readFileSync(
  join(ROOT, "src/lib/db/queries/media.ts"),
  "utf8",
);

/**
 * The restore_media definition that actually WINS on the live DB: the last CREATE OR REPLACE
 * across the migration set in timestamp order, NOT this file's copy. Resolving it dynamically is
 * the point of the guard — pinning it to one migration is how the invariant silently drifts the
 * next time some other migration replaces the function (QA Q3 did exactly that).
 */
function restoreMediaBlock(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let latest: string | null = null;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const start = sql.indexOf(
      "create or replace function public.restore_media",
    );
    if (start === -1) continue;
    const end = sql.indexOf(
      "grant execute on function public.restore_media",
      start,
    );
    expect(end).toBeGreaterThan(start);
    latest = sql.slice(start, end);
  }
  expect(latest).not.toBeNull();
  return latest!;
}

describe("restore_media replacement (finding: superseded-body revert)", () => {
  it("keeps the removed_by_uploader uploader-privacy guard in the ownership SELECT", () => {
    expect(restoreMediaBlock()).toContain("and m.removed_by_uploader = false");
  });

  it("keeps the legal-hold refusal", () => {
    expect(restoreMediaBlock()).toContain("v_media.legal_hold_at is not null");
  });

  it("keeps the capacity gate (a restore must still fit the strict cap)", () => {
    expect(restoreMediaBlock()).toContain("public.host_active_bytes");
    expect(restoreMediaBlock()).toContain("insufficient_space");
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

  // QA #2 added media.removed_by_system, deliberately OUTSIDE the authenticated grant (a
  // column-scoped grant does not extend to later columns, and the flag records OUR sweep's
  // action, not the host's). Selecting an ungranted column ERRORS at runtime for the RLS client:
  // that is exactly how the star-select broke the live host gallery on 2026-07-08. Pin it so a
  // future "add the new column to the list" reflex has to grant it in SQL first.
  // ...and the same for the QA Q3 provenance columns (removed_by_admin records an OPERATOR
  // takedown, which carries the trust-safety-forensics.md discretion posture; status_before_removed is machinery).
  it("keeps MEDIA_HOST_COLUMNS free of the ungranted-by-design columns", () => {
    const cols = tsSelectColumns();
    for (const c of [
      "removed_by_system",
      "removed_by_admin",
      "status_before_removed",
    ]) {
      expect(cols).not.toContain(c);
    }
  });

  // The type must strip every one of them too: after the post-apply regen, Tables<"media"> lists
  // columns the RLS client cannot actually select, and a MediaRow that claims them is a lie the
  // consumer only discovers at runtime (the star-select class that broke the gallery 2026-07-08).
  it("MediaRow omits every column the authenticated grant withholds", () => {
    const omitted = mediaQueries.slice(
      mediaQueries.indexOf("export type MediaRow"),
      mediaQueries.indexOf(">;", mediaQueries.indexOf("export type MediaRow")),
    );
    for (const c of [
      "legal_hold_at",
      "legal_hold_reason",
      "removed_by_system",
      "removed_by_admin",
      "status_before_removed",
    ]) {
      expect(omitted).toContain(`"${c}"`);
    }
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
