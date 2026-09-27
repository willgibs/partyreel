/**
 * THE EMPTY PAGE'S COUNT, HELD TO THE PAGE'S OWN RULE (`identity-profile` r1, `page=count`; migration
 * 20260927100000). A claimed page that shows nothing says "2 private events", and the number is
 * `get_public_profile`'s `private_event_count`: the events this VIEWER could see on the page if its
 * owner chose them, and she has not.
 *
 * ★ ONE RULE, TWO COPIES, AND THIS FILE IS WHAT KEEPS THEM ONE. The count repeats the attended arm's
 * predicate rather than sharing it, so every guard that reads the arm from its `'attended_events'`
 * key still reads the same gates in the same place. The cost of a copy is drift: a gate added to the
 * arm and not the count would count an event the viewer could never confirm (a gated album leaking
 * through a number). So the count's predicate must equal the arm's with ONE difference, the owner's
 * choice inverted, read latest-wins across the migration set like every other guard on this RPC.
 *
 * ★ AND THE NUMBER RIDES ONLY AN EMPTY PAGE. An anon read never discloses more than the page it
 * backs (database-security.md), and the page says the count only when it has nothing else to say.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/** The winning body: the last migration in timestamp order that (re)defines the function. */
function latestBody(): { file: string; body: string } {
  let latest: { file: string; body: string } | null = null;
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const start = sql.indexOf(
      "create or replace function public.get_public_profile(",
    );
    if (start === -1) continue;
    const open = sql.indexOf("as $$", start);
    const close = sql.indexOf("$$;", open + 5);
    expect(open, `${file}: no body opener`).toBeGreaterThan(start);
    expect(close, `${file}: the body never closes`).toBeGreaterThan(open);
    latest = { file, body: sql.slice(open + 5, close) };
  }
  expect(latest, "get_public_profile is defined nowhere").not.toBeNull();
  return latest!;
}

/** Code only (a comment may quote a clause), on one line. */
function code(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CHOICE =
  "exists ( select 1 from public.profile_shown_events s where s.user_id = p.id and s.event_id = e.id )";

function between(text: string, from: string, to: string): string {
  const start = text.indexOf(from);
  expect(start, `missing: ${from}`).toBeGreaterThan(-1);
  const end = text.indexOf(to, start + from.length);
  expect(end, `missing after "${from}": ${to}`).toBeGreaterThan(start);
  return text.slice(start + from.length, end).trim();
}

describe("get_public_profile's private_event_count", () => {
  const { file, body } = latestBody();
  const sql = code(body);

  it("is in the winning definition (a canary for the reader)", () => {
    expect(file >= "20260927100000", file).toBe(true);
    expect(sql).toContain("'private_event_count'");
  });

  it("reads every gate the attended arm reads, and inverts only the owner's choice", () => {
    const arm = between(
      sql,
      "'attended_events', coalesce(( select jsonb_agg(jsonb_build_object( 'id', e.id, 'name', e.name, 'event_date', e.event_date ) order by e.event_date desc nulls last, e.created_at desc) from public.events e where ",
      "), '[]'::jsonb)",
    );
    const counted = between(
      sql,
      "select count(*) from public.events e where ",
      ") end",
    );

    // The arm ends on the owner's choice, so the substitution below is the only difference.
    expect(arm.endsWith(`and ${CHOICE}`), arm).toBe(true);
    expect(counted).toBe(arm.replace(`and ${CHOICE}`, `and not ${CHOICE}`));
    // And the gates it carries are the real ones, not an empty match.
    for (const gate of [
      "e.show_guest_list",
      "e.visibility = 'open'",
      "not e.require_verified_email",
      "not e.require_upload_to_view",
      "e.host_id <> p.id",
      "g.verified_at is not null",
      "m.status = 'approved'",
    ]) {
      expect(counted, gate).toContain(gate);
    }
  });

  it("is disclosed only while the page shows nothing, and null otherwise", () => {
    expect(sql).toContain(
      "case when (p.payload -> 'hosted_events') = '[]'::jsonb and (p.payload -> 'attended_events') = '[]'::jsonb then ( select count(*) from public.events e where ",
    );
    // A CASE with no ELSE answers null: the page with something on it carries no number.
    const tail = sql.slice(sql.indexOf("select count(*)"));
    expect(tail).not.toMatch(/\belse\b/);
  });

  it("appends to the payload after it is built, so every guard still reads the arms where they were", () => {
    // Each arm guard slices from its key's FIRST occurrence to the next '[]'::jsonb default; the
    // count's own reads of the two keys must come after both arms, or those guards would slice the
    // CASE instead of the arm.
    const firstAttended = sql.indexOf("'attended_events'");
    const firstHosted = sql.indexOf("'hosted_events'");
    const theCase = sql.indexOf("'private_event_count'");
    expect(firstHosted).toBeLessThan(firstAttended);
    expect(firstAttended).toBeLessThan(theCase);
    expect(sql.slice(firstAttended, theCase)).toContain("'[]'::jsonb");
  });
});
