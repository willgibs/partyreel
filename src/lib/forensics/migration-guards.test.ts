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
 *      ★ Reshaped on purpose (the schema pass, 2026-09-29): the grant was read off
 *      20260707150000's text, which can never see a column dropped later, so the reel's three
 *      dormant columns could not leave the list before their drop. The grant is now REPLAYED
 *      across the whole set (a table-level revoke empties it, a column grant adds, a column revoke
 *      or a DROP COLUMN takes away), which reads 20260929170000's drops the moment the file exists.
 *      The scar stays: the list and the grant still move together, as the migrations leave them.
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

/**
 * The media columns `authenticated` can SELECT as the migrations leave them, REPLAYED statement by
 * statement across the whole set (comments stripped: a grant quoted in prose is not a grant). A
 * TABLE-level revoke of SELECT (or of all) empties the set, since it cascades to every column grant;
 * a column grant adds its columns and a column revoke takes its own away; a DROP COLUMN takes the
 * column with its grant. A table-level grant would replay as "*", every column at once.
 */
function migrationGrantColumns(): string[] {
  let columns = new Set<string>();
  const statement =
    /\b(grant|revoke) ([a-z_, ]+?)(?: \(([^)]*)\))? on (?:table )?([^;]*?) (?:to|from) ([^;]*);|\balter table (?:only )?(?:if exists )?public\.media ([^;]*);/g;
  // The media table alone, in a list, or schema-wide.
  const namesMedia = (objects: string) =>
    /(?:^|[\s,])public\.media(?=$|[\s,])/.test(objects) ||
    /\ball tables in schema public\b/.test(objects);
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ");
    for (const [
      ,
      verb,
      privileges,
      named,
      objects,
      grantees,
      altered,
    ] of sql.matchAll(statement)) {
      if (altered !== undefined) {
        for (const [, column] of altered.matchAll(
          /\bdrop column (?:if exists )?([a-z_0-9]+)/g,
        )) {
          columns.delete(column);
        }
        continue;
      }
      if (!namesMedia(objects)) continue;
      if (!grantees.split(",").some((g) => g.trim() === "authenticated"))
        continue;
      const privs = privileges.split(",").map((p) => p.trim());
      if (!privs.some((p) => ["select", "all", "all privileges"].includes(p)))
        continue;
      const cols = named?.split(",").map((c) => c.trim());
      if (verb === "revoke") {
        if (cols) cols.forEach((c) => columns.delete(c));
        else columns = new Set();
      } else {
        (cols ?? ["*"]).forEach((c) => columns.add(c));
      }
    }
  }
  expect(columns.size).toBeGreaterThan(0);
  return [...columns];
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
  // ...and `purge_asked_at` (20260929140000), a permanent delete a hold or an open report defers: a host who
  // could read it would learn that something keeps her row.
  it("keeps MEDIA_HOST_COLUMNS free of the ungranted-by-design columns", () => {
    const cols = tsSelectColumns();
    for (const c of [
      "removed_by_system",
      "removed_by_admin",
      "status_before_removed",
      "purge_asked_at",
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
      "purge_asked_at",
    ]) {
      expect(omitted).toContain(`"${c}"`);
    }
  });

  it("keeps the DB grant and MEDIA_HOST_COLUMNS identical (change one -> change both)", () => {
    expect([...tsSelectColumns()].sort()).toEqual(
      [...migrationGrantColumns()].sort(),
    );
  });

  // The same truth read from the other side: MediaRow is the generated row less exactly what the list
  // never selects. A generated column the list skips must be omitted (else the type claims a value the
  // read never returns), and an omitted name must still be a generated column: when a drop's
  // regeneration takes one away (the reel's three, after 20260929170000), this says to take it off.
  it("MediaRow is the generated media row less exactly the columns the host list skips", () => {
    const types = readFileSync(join(ROOT, "src/lib/db/types.ts"), "utf8");
    const start = types.indexOf("      media: {\n        Row: {\n");
    expect(start).toBeGreaterThan(-1);
    const body = types.slice(start, types.indexOf("\n        }\n", start));
    const generated = [...body.matchAll(/^ {10}([a-z_0-9]+)\??:/gm)].map(
      (m) => m[1],
    );
    expect(generated).toContain("event_id");
    const omitted = [
      ...mediaQueries
        .slice(
          mediaQueries.indexOf("export type MediaRow"),
          mediaQueries.indexOf(
            ">;",
            mediaQueries.indexOf("export type MediaRow"),
          ),
        )
        .matchAll(/\|\s*"([a-z_0-9]+)"/g),
    ].map((m) => m[1]);
    const selected = tsSelectColumns();
    for (const column of generated.filter((c) => !selected.includes(c))) {
      expect(omitted, `${column} is never selected: omit it`).toContain(column);
    }
    for (const column of omitted) {
      expect(
        generated,
        `${column} left the generated row: take it off MediaRow's Omit`,
      ).toContain(column);
    }
  });

  it('leaves no select("*") on media in the host query module', () => {
    expect(mediaQueries).not.toContain('.select("*")');
  });
});
