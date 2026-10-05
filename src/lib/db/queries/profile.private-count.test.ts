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
import { describe, expect, it } from "vitest";

import { liveFunction } from "@/lib/db/testing/migrations";

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
  // The winning definition, as code (a comment may quote a clause) on one line: `testing/migrations.ts` replays the
  // set's creates and drops in order, so a function a later file drops throws here instead of reading as defined.
  const { file, code: sql } = liveFunction("get_public_profile");

  it("is in the winning definition (a canary for the reader)", () => {
    expect(file >= "20260927100000", file).toBe(true);
    expect(sql).toContain("'private_event_count'");
  });

  it("reads every gate the attended arm reads, and inverts only the owner's choice", () => {
    // ★ The arm's line carries a range's last day beside its date (event-dates, 20261003120000): reshaped on purpose,
    // the anchor only; the gates it reads are unchanged.
    const arm = between(
      sql,
      "'attended_events', coalesce(( select jsonb_agg(jsonb_build_object( 'id', e.id, 'name', e.name, 'event_date', e.event_date, 'event_end_date', e.event_end_date ) order by e.event_date desc nulls last, e.created_at desc) from public.events e where ",
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
    // And the gates it carries are the real ones, not an empty match. ★ Reshaped by the always-on
    // guest list (20260928120000): the retired host key (`e.show_guest_list`) left both predicates,
    // and the per-event block joined both, both ways.
    expect(counted).not.toContain("show_guest_list");
    for (const gate of [
      "not public.event_block_holds_account(e.id, p.id)",
      "not public.event_block_holds_account(e.id, (select auth.uid()))",
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
