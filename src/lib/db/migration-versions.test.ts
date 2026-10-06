/**
 * ★ ONE VERSION A FILE: lanes cut side by side each name a migration just after the newest file in the folder, so two
 * can pick the same version (crumbs-41's strike file and crumbs-43's faces file both took 20261001233100, 2026-10-01).
 * The live ledger stamps its own versions (`apply_migration`; a live migration matches its file by name), but every
 * test that replays these files sorts them by name, so two files on one version would order by their words rather
 * than their writing. The second lane's merge fails here: rename its file to a free version before it lands.
 */
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { entries } from "@/testing/source-tree";

const MIGRATIONS_DIR = join(
  __dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
);

describe("migration files", () => {
  it("never share a version", () => {
    const versions = entries(MIGRATIONS_DIR)
      .map((entry) => entry.name)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => file.split("_")[0]);
    const twice = versions.filter((v, i) => versions.indexOf(v) !== i);
    expect(
      twice,
      "two migration files share a version: rename the later one",
    ).toEqual([]);
  });
});
