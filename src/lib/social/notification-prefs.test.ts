/**
 * Parity guard: NOTIFICATION_PREF_DEFAULTS <-> the notification_prefs column
 * defaults in migration 20260708120000 (rows are lazy, so an absent row resolves
 * to these constants; the two sources MUST agree or "no row" silently means the
 * wrong consent). Migration parsed as TEXT — the same style as the tiers.ts <->
 * tier_limits() guard and the forensics migration guards.
 *
 * ★ A COLUMN A LATER MIGRATION DROPS IS NOT A PREFERENCE. The live reel's drop
 * (20260924110000) takes the reel-ready email's column with the stored reel, and
 * the app stopped reading and writing it first, so the parity is the create's
 * columns less every `drop column` any migration names: reshaped on purpose in
 * reel-host-wiring (the reel-ready email left the product), the scar being that
 * a new column still has to appear on both sides.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_PREF_DEFAULTS,
  resolveNotificationPrefs,
} from "@/lib/social/notification-prefs";

const migration = readFileSync(
  join(
    __dirname,
    "..",
    "..",
    "..",
    "supabase/migrations/20260708120000_profiles_social_foundation.sql",
  ),
  "utf8",
);

/** Every column any migration drops from notification_prefs. */
function droppedColumns(): string[] {
  const dir = join(__dirname, "..", "..", "..", "supabase/migrations");
  const dropped: string[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(join(dir, file), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(
      /alter table public\.notification_prefs drop column (?:if exists )?(\w+)/g,
    )) {
      dropped.push(m[1]);
    }
  }
  return dropped;
}

/** The create table public.notification_prefs (...) block. */
function prefsTableBlock(): string {
  const start = migration.indexOf("create table public.notification_prefs");
  expect(start).toBeGreaterThan(-1);
  const end = migration.indexOf(");", start);
  expect(end).toBeGreaterThan(start);
  return migration.slice(start, end);
}

/** camelCase TS field -> snake_case column, per the resolveNotificationPrefs mapping. */
const COLUMN_FOR_FIELD: Record<
  keyof typeof NOTIFICATION_PREF_DEFAULTS,
  string
> = {
  notifyAlbumShared: "notify_album_shared",
  notifyNewUploadsDigest: "notify_new_uploads_digest",
  notifyNewFollower: "notify_new_follower",
  marketingOptIn: "marketing_opt_in",
};

describe("notification_prefs defaults parity (TS <-> migration SQL)", () => {
  const block = prefsTableBlock();

  it.each(
    Object.entries(COLUMN_FOR_FIELD) as [
      keyof typeof NOTIFICATION_PREF_DEFAULTS,
      string,
    ][],
  )("%s mirrors the SQL default of %s", (field, column) => {
    const match = block.match(
      new RegExp(`${column}\\s+boolean not null default (true|false)`),
    );
    expect(match, `column ${column} missing from the migration`).not.toBeNull();
    expect(NOTIFICATION_PREF_DEFAULTS[field]).toBe(match![1] === "true");
  });

  it("the table has no extra boolean pref columns the TS side doesn't know", () => {
    const dropped = new Set(droppedColumns());
    const sqlBooleans = [...block.matchAll(/^\s+(\w+)\s+boolean/gm)]
      .map((m) => m[1])
      .filter((column) => !dropped.has(column));
    expect(sqlBooleans.sort()).toEqual(Object.values(COLUMN_FOR_FIELD).sort());
  });

  it("tier 1 (transactional) has NO column: it can never be toggled off", () => {
    expect(block).not.toMatch(/transactional|security|otp|billing/i);
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
        notify_album_shared: true,
        notify_new_uploads_digest: false,
        notify_new_follower: true,
        marketing_opt_in: true,
      }),
    ).toEqual({
      notifyAlbumShared: true,
      notifyNewUploadsDigest: false,
      notifyNewFollower: true,
      marketingOptIn: true,
    });
  });
});
