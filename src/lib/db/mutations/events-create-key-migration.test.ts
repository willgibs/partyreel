/**
 * A CREATE'S KEY IN THE SCHEMA (20261007120000_event_create_key.sql; lane crumbs-88): a nullable uuid the host writes once
 * at birth, one event a key PER HOST. The file's own text is the contract (the house's guard pattern: `zone-migration.test.ts`,
 * `db/migration-guards.test.ts`), with each fact read latest-wins across the set where a later file could undo it. The rolled-back
 * check at the file's foot is the proof against the live schema; what is held here is what a later edit would undo silently:
 * a key that is unique across hosts (a 23505 would tell one host about another's), a grant that grows an UPDATE (an event could
 * be re-keyed under a Create still in flight) or cascades away, and a column something in the database starts to read.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { executableMigrations } from "@/lib/db/testing/migrations";

const FILE = "20261007120000_event_create_key.sql";
const PATH = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
  FILE,
);

/** The file's executable statements: every line but its comments, whitespace collapsed. */
const sql = readFileSync(PATH, "utf8")
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join(" ")
  .replace(/\s+/g, " ");

describe("events.create_key: the column", () => {
  it("is a nullable uuid with no default, so every row that exists and every keyless create reads as none", () => {
    expect(sql).toContain(
      "alter table public.events add column create_key uuid;",
    );
  });
});

describe("the index: one event a key, per host", () => {
  it("★ is unique on the HOST and the key together, over keyed rows only: never across hosts, never a collision of NULLs", () => {
    expect(sql).toContain(
      "create unique index events_host_create_key_unique on public.events (host_id, create_key) where create_key is not null;",
    );
  });

  it("★ spans soft-deleted rows: no `deleted_at` in its predicate, so a restore can never put two live rows on one key", () => {
    const index = /create unique index [^;]*;/.exec(sql)?.[0] ?? "";
    expect(index).not.toMatch(/deleted_at/);
  });
});

describe("the host's grant: insert only, on the column alone", () => {
  it("★ grants INSERT of the one column to authenticated, never UPDATE and never anon, and revokes nothing on events", () => {
    expect(sql).toContain(
      "grant insert (create_key) on public.events to authenticated;",
    );
    expect(sql).not.toMatch(/\bgrant\b[^;]*\bupdate\b/);
    expect(sql).not.toMatch(/\bgrant\b[^;]*\bto\b[^;]*\banon\b/);
    // ★ A table-level revoke cascades to every column grant on events (database-security.md, Gotchas).
    expect(sql).not.toMatch(/\brevoke\b/);
  });

  it("no later file grants the key an UPDATE or takes its grant back", () => {
    const later = executableMigrations().filter(({ file }) => file > FILE);
    for (const { file, sql: body } of later) {
      const flat = body.replace(/\s+/g, " ");
      expect(
        /grant[^;]*update\s*\([^)]*\bcreate_key\b[^)]*\)[^;]*on (?:table )?public\.events/i.test(
          flat,
        ),
        `${file} lets a host re-key an event`,
      ).toBe(false);
      expect(
        /revoke[^;]*\([^)]*\bcreate_key\b[^)]*\)[^;]*on (?:table )?public\.events/i.test(
          flat,
        ),
        `${file} takes the key's grant back`,
      ).toBe(false);
    }
  });
});

describe("nothing in the database reads it", () => {
  it("★ the file defines no function, trigger, policy or view, and names no anon read: the key stays off every RPC", () => {
    expect(sql).not.toMatch(
      /\bcreate (?:or replace )?(?:function|trigger|policy|view)\b/,
    );
    expect(sql).not.toMatch(/get_event_by_qr_token/);
  });

  it("no later file reads it in a function body, a trigger, a policy or a view", () => {
    const later = executableMigrations().filter(({ file }) => file > FILE);
    for (const { file, sql: body } of later) {
      expect(/\bcreate_key\b/.test(body), `${file} reads the key`).toBe(false);
    }
  });
});
