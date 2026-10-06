import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISPLAY_DEFAULT, storedDisplay } from "./display";
import { withLead } from "./lead";

/**
 * THE DISPLAY MIGRATION'S LOAD-BEARING FACTS (host-dashboard r3, `20261004130000_dashboard_display.sql`), pinned the
 * way `db/migration-guards.test.ts` pins its own: the SQL is read as the file leaves it, comments off, whitespace
 * collapsed, and a later edit that loosens a fact fails here instead of in production.
 *
 *   1. HER CHOICES ARE ONE COLUMN BEHIND AN ENVELOPE, NEVER A KEY LIST: an object, 512 bytes, so a host writing
 *      straight through PostgREST stores no more than a few words and a preference learned tomorrow needs no migration.
 *   2. HER OPENS ARE A FINITE INSTANT: an owner's raw `infinity` would sort first in every list and is no moment.
 *   3. EACH IS ONE BARE COLUMN GRANT. A table-level grant or revoke would cascade to every other column's, and either
 *      takes the host app down (database-security.md, Gotchas).
 *   4. THE FILE ADDS NO FUNCTION, POLICY OR TRIGGER: the advisor sets stay where they are.
 */

const FILE = "20261004130000_dashboard_display.sql";
const DIR = join(process.cwd(), "supabase", "migrations");
const raw = readFileSync(join(DIR, FILE), "utf8");
const sql = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("the display migration", () => {
  it("gives her choices one jsonb column, empty by default, behind an object-and-size envelope", () => {
    expect(sql).toContain(
      "alter table public.profiles add column events_display jsonb not null default '{}'::jsonb;",
    );
    expect(sql).toContain(
      "add constraint profiles_events_display_shape check (jsonb_typeof(events_display) = 'object' and octet_length(events_display::text) <= 512);",
    );
  });

  it("holds every choice the app can keep inside that envelope, the default being the empty object", () => {
    expect(storedDisplay(DISPLAY_DEFAULT)).toEqual({});
    const everything = storedDisplay({
      layout: "table",
      sort: "photos",
      desc: false,
      lens: "hosting",
      when: "undated",
      year: "2023",
      group: "year",
      scale: "l",
      recent: "folded",
    });
    expect(JSON.stringify(everything).length).toBeLessThanOrEqual(512);
  });

  it("★ holds her stage's rule beside them too, counted as the column counts: the bytes of the jsonb's own text", () => {
    // The CHECK reads `events_display::text`, which prints a space after every colon and comma (`{"a": 1, "b": 2}`), so a
    // `JSON.stringify` length undercounts it by two bytes a key: the rule shares the column with the Display's nine keys.
    const everything = withLead(
      storedDisplay({
        layout: "table",
        sort: "photos",
        desc: false,
        lens: "hosting",
        when: "undated",
        year: "2023",
        group: "year",
        scale: "l",
        recent: "folded",
      }),
      "upcoming",
    );
    expect(Object.keys(everything)).toHaveLength(10);
    const asJsonb = `{${Object.entries(everything)
      .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
      .join(", ")}}`;
    expect(new TextEncoder().encode(asJsonb).length).toBeLessThanOrEqual(512);
    // And with room to spare, so a key learned tomorrow does not need a migration either.
    expect(new TextEncoder().encode(asJsonb).length).toBeLessThanOrEqual(256);
  });

  it("gives her opens a nullable finite timestamp on the event", () => {
    expect(sql).toContain(
      "alter table public.events add column host_opened_at timestamptz;",
    );
    expect(sql).toContain(
      "add constraint events_host_opened_at_finite check (host_opened_at is null or isfinite(host_opened_at));",
    );
  });

  it("grants each as one bare column to authenticated, and never anything table-wide", () => {
    expect(sql).toContain(
      "grant update (events_display) on public.profiles to authenticated;",
    );
    expect(sql).toContain(
      "grant update (host_opened_at) on public.events to authenticated;",
    );
    // A grant or revoke with no column list on either table: the cascade landmine.
    expect(sql).not.toMatch(
      /\b(grant|revoke) [a-z, ]+ on (table )?public\.(profiles|events)\b/,
    );
    expect(sql).not.toMatch(/\bgrant\b[^;]*\bto (anon|public)\b/);
  });

  it("adds no function, policy, trigger or index: the advisor sets and the hot tables stay as they are", () => {
    expect(sql).not.toMatch(
      /create (or replace )?(function|policy|trigger|index)/,
    );
    expect(sql).not.toMatch(/drop |disable trigger/);
  });

  it("carries its rolled-back proof, red without the file and green with it", () => {
    for (const step of [
      "0 fixtures",
      "1 the columns",
      "2 the envelopes",
      "3 the grants",
      "4 her own rows only",
    ])
      expect(raw).toContain(step);
  });

  it("keeps one version: no other file in the folder shares it", () => {
    const same = readdirSync(DIR).filter((f) =>
      f.startsWith("20261004130000_"),
    );
    expect(same).toEqual([FILE]);
  });
});
