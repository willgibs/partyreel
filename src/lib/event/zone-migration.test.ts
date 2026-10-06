/**
 * THE PARTY'S ZONE IN THE SCHEMA (20261005220000_event_zone.sql): the column's envelope is the app's own (a host's
 * PostgREST write passes no schema, so the CHECK carries the app's bound), the host's grant is additive (a table-level
 * revoke cascades to every column grant on events and takes the host app down), and nothing in the database reads the
 * column, so the zone never reaches an anon read. The file's own text is the contract (the house's guard pattern,
 * `db/migration-guards.test.ts`), with each fact read latest-wins across the set where a later file could undo it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { executableMigrations } from "@/lib/db/testing/migrations";
import { readableZone, ZONE_MAX_LENGTH, ZONE_PATTERN } from "@/lib/event/zone";

const FILE = join(
  __dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
  "20261005220000_event_zone.sql",
);

/** The file's executable statements: every line but its comments, whitespace collapsed. */
const sql = readFileSync(FILE, "utf8")
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join(" ")
  .replace(/\s+/g, " ");

describe("events.time_zone: the column and its envelope", () => {
  it("is a nullable text with no default, so every row that exists reads as none", () => {
    expect(sql).toContain(
      "alter table public.events add column time_zone text;",
    );
  });

  it("★ its CHECK is the app's own envelope: the same length and the same shape (`ZONE_MAX_LENGTH`, `ZONE_PATTERN`)", () => {
    expect(sql).toContain(
      `add constraint events_time_zone_shape check (time_zone is null or (char_length(time_zone) between 1 and ${ZONE_MAX_LENGTH} and time_zone ~ '${ZONE_PATTERN}'));`,
    );
  });

  it("the envelope admits every zone the runtime reads, and refuses an offset the runtime would read as one", () => {
    const shape = new RegExp(ZONE_PATTERN);
    for (const zone of Intl.supportedValuesOf("timeZone")) {
      expect(shape.test(zone) && zone.length <= ZONE_MAX_LENGTH, zone).toBe(
        true,
      );
    }
    expect(shape.test("+05:30")).toBe(false);
    expect(readableZone("+05:30")).toBeNull();
  });
});

describe("the host's grant: additive, insert and update, on the column alone", () => {
  it("★ grants the one column to authenticated, and revokes nothing on events", () => {
    expect(sql).toContain(
      "grant insert (time_zone), update (time_zone) on public.events to authenticated;",
    );
    // ★ A table-level revoke cascades to every column grant on events (database-security.md, Gotchas).
    expect(sql).not.toMatch(/\brevoke\b/);
    expect(sql).not.toMatch(/\bgrant\b[^;]*\bto\b[^;]*\banon\b/);
  });

  it("no later file takes the column's grant back", () => {
    const later = executableMigrations().filter(
      ({ file }) => file > "20261005220000_event_zone.sql",
    );
    for (const { file, sql: body } of later) {
      expect(
        /revoke[^;]*\(\s*[^)]*\btime_zone\b[^)]*\)[^;]*on (?:table )?public\.events/.test(
          body,
        ),
        file,
      ).toBe(false);
    }
  });
});

describe("nothing in the database reads it", () => {
  it("★ the file defines no function, trigger, policy or view: the zone stays off every RPC, anon's included", () => {
    expect(sql).not.toMatch(
      /\bcreate (?:or replace )?(?:function|trigger|policy|view)\b/,
    );
    expect(sql).not.toMatch(/get_event_by_qr_token/);
  });
});
