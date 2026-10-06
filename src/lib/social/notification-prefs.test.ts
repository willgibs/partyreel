/**
 * Parity guard: NOTIFICATION_PREF_DEFAULTS <-> the notification_prefs column
 * defaults in the migrations (rows are lazy, so an absent row resolves to these
 * constants; the two sources MUST agree or "no row" silently means the wrong
 * consent). Migrations parsed as TEXT — the same style as the tiers.ts <->
 * tier_limits() guard and the forensics migration guards.
 *
 * ★ THE TABLE IS THE CREATE, PLUS EVERY COLUMN A LATER MIGRATION ADDS, LESS EVERY COLUMN ONE DROPS.
 * Reshaped on purpose twice: in reel-host-wiring the reel-ready email left the product and its column
 * dropped (20260924110000); in emails-wiring the Event Pass reminders' column arrived by
 * `add column` (20260928160000), so the create alone no longer names every preference. The scar
 * stays: a new column still has to appear on both sides.
 *
 * ★ Reshaped on purpose a third time (the schema pass, 20260929160000): three switches had no mail
 * behind them, so emails-wiring let go of their columns and this test listed them as `UNREAD` until
 * the drop Will said yes to. The drop landed, so the list went with it: the table is again exactly the
 * mapped columns, and the scar stays in the replay above (a drop takes a column off the table).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readMigrations } from "@/lib/db/testing/migrations";
import {
  NOTIFICATION_PREF_COLUMNS,
  NOTIFICATION_PREF_DEFAULTS,
  resolveNotificationPrefs,
} from "@/lib/social/notification-prefs";

const DIR = join(__dirname, "..", "..", "..", "supabase/migrations");

/** Every migration's SQL, comments stripped, in apply order. */
const MIGRATIONS = readMigrations().map(({ sql }) =>
  sql.replace(/--[^\n]*/g, ""),
);

const CREATE = readFileSync(
  join(DIR, "20260708120000_profiles_social_foundation.sql"),
  "utf8",
);

/** The create table public.notification_prefs (...) block. */
function prefsTableBlock(): string {
  const start = CREATE.indexOf("create table public.notification_prefs");
  expect(start).toBeGreaterThan(-1);
  const end = CREATE.indexOf(");", start);
  expect(end).toBeGreaterThan(start);
  return CREATE.slice(start, end);
}

/** Every boolean preference column the migrations leave standing, with its SQL default. */
function standingColumns(): Map<string, boolean> {
  const columns = new Map<string, boolean>();
  for (const m of prefsTableBlock().matchAll(
    /^\s+(\w+)\s+boolean not null default (true|false)/gm,
  )) {
    columns.set(m[1], m[2] === "true");
  }
  for (const sql of MIGRATIONS) {
    for (const m of sql.matchAll(
      /alter table public\.notification_prefs\s+add column (?:if not exists )?(\w+)\s+boolean not null default (true|false)/g,
    )) {
      columns.set(m[1], m[2] === "true");
    }
    for (const m of sql.matchAll(
      /alter table public\.notification_prefs\s+drop column (?:if exists )?(\w+)/g,
    )) {
      columns.delete(m[1]);
    }
  }
  return columns;
}

/** camelCase TS field -> snake_case column, per the resolveNotificationPrefs mapping. */
const COLUMN_FOR_FIELD: Record<
  keyof typeof NOTIFICATION_PREF_DEFAULTS,
  string
> = {
  notifyPassRenewal: "notify_pass_renewal",
  marketingOptIn: "marketing_opt_in",
};

describe("notification_prefs defaults parity (TS <-> migration SQL)", () => {
  const standing = standingColumns();

  it.each(
    Object.entries(COLUMN_FOR_FIELD) as [
      keyof typeof NOTIFICATION_PREF_DEFAULTS,
      string,
    ][],
  )("%s mirrors the SQL default of %s", (field, column) => {
    expect(
      standing.has(column),
      `column ${column} missing from the migrations`,
    ).toBe(true);
    expect(NOTIFICATION_PREF_DEFAULTS[field]).toBe(standing.get(column));
  });

  it("the table has no boolean pref column the TS side doesn't know", () => {
    expect([...standing.keys()].sort()).toEqual(
      Object.values(COLUMN_FOR_FIELD).sort(),
    );
  });

  it("the one select list is exactly the mapped columns", () => {
    expect(
      NOTIFICATION_PREF_COLUMNS.split(",")
        .map((c) => c.trim())
        .sort(),
    ).toEqual(Object.values(COLUMN_FOR_FIELD).sort());
  });

  it("Event Pass reminders default ON: tier 2 is opt-out, never opt-in", () => {
    expect(NOTIFICATION_PREF_DEFAULTS.notifyPassRenewal).toBe(true);
    expect(standing.get("notify_pass_renewal")).toBe(true);
  });

  // ★ A SWITCH THE CARD CANNOT WRITE FAILS EVERY SAVE (database-security.md, Gotchas): each mapped
  // column needs its own insert and update grant to authenticated, added beside the others, and no
  // migration after the create may revoke on the table, which would cascade to every column grant.
  it("every mapped column is insertable and updatable by its owner, and no later revoke undoes it", () => {
    const grants = MIGRATIONS.join("\n");
    for (const column of Object.values(COLUMN_FOR_FIELD)) {
      for (const verb of ["insert", "update"]) {
        expect(
          new RegExp(
            `grant[^;]*\\b${verb} \\([^)]*\\b${column}\\b[^)]*\\)[^;]*on public\\.notification_prefs to authenticated`,
          ).test(grants),
          `${verb}(${column}) is granted to authenticated`,
        ).toBe(true);
      }
    }
    const revokes = MIGRATIONS.slice(
      MIGRATIONS.findIndex((sql) =>
        sql.includes("create table public.notification_prefs"),
      ) + 1,
    ).filter((sql) => /revoke[^;]*on public\.notification_prefs/.test(sql));
    expect(revokes).toEqual([]);
  });

  it("tier 1 (transactional) has NO column: it can never be toggled off", () => {
    expect(prefsTableBlock()).not.toMatch(
      /transactional|security|otp|billing/i,
    );
    for (const column of standing.keys()) {
      expect(column).not.toMatch(/transactional|security|otp|billing/i);
    }
    expect(
      Object.keys(NOTIFICATION_PREF_DEFAULTS).some((k) =>
        /transactional/i.test(k),
      ),
    ).toBe(false);
  });
});

describe("resolveNotificationPrefs", () => {
  it("absent row (lazy) resolves to the defaults, as a fresh object", () => {
    const resolved = resolveNotificationPrefs(null);
    expect(resolved).toEqual(NOTIFICATION_PREF_DEFAULTS);
    expect(resolved).not.toBe(NOTIFICATION_PREF_DEFAULTS);
    expect(resolveNotificationPrefs(undefined)).toEqual(
      NOTIFICATION_PREF_DEFAULTS,
    );
  });

  it("a row maps 1:1 (snake_case -> camelCase)", () => {
    expect(
      resolveNotificationPrefs({
        notify_pass_renewal: false,
        marketing_opt_in: true,
      }),
    ).toEqual({
      notifyPassRenewal: false,
      marketingOptIn: true,
    });
  });
});
