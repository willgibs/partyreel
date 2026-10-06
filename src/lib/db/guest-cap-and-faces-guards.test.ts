/**
 * THE GUEST'S CAP AND THE FACES THAT MOVE, THEIR SQL FACTS (lane `crumbs-43`), resolved LATEST-WINS across the whole
 * migration set the way `migration-guards.test.ts` resolves its own (a later file that drops one of these fails
 * here). Its own file, because other lanes write migrations beside this one.
 *
 * What they pin:
 *   1. The host's own cap on the album's read (20261001233000): `get_event_by_qr_token`'s winning RETURNS TABLE ends
 *      with `max_upload_bytes bigint` after every column the deployed build reads, its select carries the event's
 *      own column there, and the drop and create restates the whole ACL (PUBLIC revoked by name; anon,
 *      authenticated and service_role granted: one of the accepted 0028 anon reads, database-security.md).
 *   2. A face moves at once (20261001233110): the winning `profiles_album_note` and `profiles_album_stamp` watch
 *      `display_name`, `avatar_updated_at` and `slug`, fire on any of the three that is DISTINCT, and nothing else;
 *      the note stays a plain trigger and the stamp a DEFERRABLE INITIALLY DEFERRED constraint trigger (the album
 *      row is every transaction's last lock), each dropped before it is created again.
 */
import { describe, expect, it } from "vitest";

import { readMigrations } from "@/lib/db/testing/migrations";

/** Strip `--` comments (a quoted example is not code) and collapse whitespace. */
function executable(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

const SQL = readMigrations().map(({ file, sql }) => ({
  file,
  sql: executable(sql),
}));

/** Every match of `pattern` across the set, in file order, with the file it is in. */
function everyMatch(pattern: RegExp): { file: string; text: string }[] {
  return SQL.flatMap(({ file, sql }) =>
    [...sql.matchAll(pattern)].map((m) => ({ file, text: m[0] })),
  );
}

/** The last statement matching `pattern` across the set. */
function latest(pattern: RegExp): { file: string; text: string } {
  const all = everyMatch(pattern);
  if (all.length === 0) throw new Error(`never matched: ${pattern}`);
  return all[all.length - 1];
}

describe("the host's own cap on the album's read (20261001233000)", () => {
  const create = () =>
    latest(
      /create (?:or replace )?function public\.get_event_by_qr_token\(p_qr_token text\)[^$]*\$function\$[^$]*\$function\$;/g,
    );

  // ★ Reshaped by disposable-foundation (20261002200000), which carries this body whole and appends four columns
  // after the cap (whether a develop is due, the develop time, the capture and the roll's size; their own pins are
  // src/lib/disposable/migration-guards.test.ts): the cap keeps its place, after every column the deployed build
  // reads, and the build that reads the cap reads it where it always has.
  it("returns max_upload_bytes after every column the deployed build reads", () => {
    // ★ Reshaped on purpose by event-dates (20261003120000), the read's newest file: a range's last day follows the
    // develop's four, and the cap still follows every column the deployed build reads.
    const { file, text } = create();
    expect(file).toBe("20261003120000_event_end_date.sql");
    expect(text).toContain(
      "returns table( id uuid, name text, description text, moderation_mode public.moderation_mode, visibility public.event_visibility, has_password boolean, accepting_uploads boolean, require_verified_email boolean, require_upload_to_view boolean, event_date date, qr_style text, qr_token text, custom_slug text, host_display_name text, show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean, max_upload_bytes bigint, develop_due boolean, develops_at timestamptz, capture text, roll_size integer, event_end_date date)",
    );
    // The value is the event's own column, unredacted (a presentation setting, as the switches are).
    expect(text).toContain(
      "(e.allow_videos and coalesce(p.tier <> 'free', false)), e.max_upload_bytes, public.seal_disagrees(e), e.develops_at, e.capture, e.roll_size, case when r.hide_meta then null else e.event_end_date end from public.events e",
    );
  });

  it("keeps the redaction, the sneaky block's lateral and the slug lookup it carried", () => {
    const { text } = create();
    expect(text).toContain(
      "case when r.hide_meta then null else p.display_name end",
    );
    expect(text).toContain(
      "public.event_block_holds_account(e.id, (select auth.uid()))",
    );
    expect(text).toContain(
      "or (e.custom_slug is not null and lower(e.custom_slug) = lower(p_qr_token))",
    );
    expect(text).toContain("limit 1;");
  });

  it("restates the whole ACL after its drop and create: PUBLIC revoked, the three roles granted", () => {
    const { file } = create();
    const sql = SQL.find((m) => m.file === file)!.sql;
    const created = sql.indexOf(
      "create function public.get_event_by_qr_token(p_qr_token text)",
    );
    expect(
      sql.indexOf("drop function public.get_event_by_qr_token(text);"),
    ).toBeLessThan(created);
    const after = sql.slice(created);
    expect(after).toContain(
      "revoke all on function public.get_event_by_qr_token(text) from public;",
    );
    expect(after).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
    );
  });
});

describe("a face moves at once (20261001233110)", () => {
  const WATCHED =
    "after update of display_name, avatar_updated_at, slug on public.profiles";
  const WHEN =
    "when (old.display_name is distinct from new.display_name or old.avatar_updated_at is distinct from new.avatar_updated_at or old.slug is distinct from new.slug)";

  it("the note watches the name, the face and the handle, a plain trigger", () => {
    const { file, text } = latest(
      /create (?:constraint )?trigger profiles_album_note [^;]*;/g,
    );
    expect(file).toBe("20261001233110_faces_move_attribution.sql");
    expect(text).toBe(
      `create trigger profiles_album_note ${WATCHED} for each row ${WHEN} execute function public.album_note_profile();`,
    );
  });

  it("the stamp watches the same three, deferred to commit (the album row is every transaction's last lock)", () => {
    const { file, text } = latest(
      /create (?:constraint )?trigger profiles_album_stamp [^;]*;/g,
    );
    expect(file).toBe("20261001233110_faces_move_attribution.sql");
    expect(text).toBe(
      `create constraint trigger profiles_album_stamp ${WATCHED} deferrable initially deferred for each row ${WHEN} execute function public.album_flush_trigger();`,
    );
  });

  it("each is dropped before it is created again, and the functions are not touched", () => {
    const sql = SQL.find(
      (m) => m.file === "20261001233110_faces_move_attribution.sql",
    )!.sql;
    for (const name of ["profiles_album_note", "profiles_album_stamp"]) {
      const dropped = sql.indexOf(`drop trigger ${name} on public.profiles;`);
      expect(dropped, name).toBeGreaterThanOrEqual(0);
      expect(dropped, name).toBeLessThan(sql.indexOf(`trigger ${name} after`));
    }
    expect(sql).not.toMatch(/create (or replace )?function/);
    expect(sql).not.toMatch(/\bgrant\b/);
  });
});
