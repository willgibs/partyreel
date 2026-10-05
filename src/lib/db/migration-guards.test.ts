/**
 * FILE-content guards on the write-spine migration invariants (QA #17 + #18, migration
 * 20260729190000). Same house pattern as forensics/migration-guards.test.ts: the truth lives in
 * the migration FILES, resolved LATEST-WINS across the whole set (never pinned to one file — a
 * later `create or replace` silently replacing the body is exactly the drift these guards catch;
 * QA Q3 did precisely that to restore_media).
 *
 * What they pin:
 *   1. Every cap decision keeps its `for update` profiles-row lock (Pattern D): create_media,
 *      create_media_as_host, restore_media, restore_event, enforce_event_limit. Dropping the lock
 *      re-opens the concurrent over-admit race the round closed.
 *   2. create_guest keeps the visibility refusals (private never mints; password requires
 *      p_unlock_proven) and stays service-role-only.
 *   3. get_upload_context keeps its `visibility` output (the presign/complete lock re-check feeds
 *      on it) AND its anon EXECUTE grant — it is one of the FIVE 0028 anon read RPCs; a replaced
 *      body must re-assert the grant explicitly (the MCP anon-grant landmine cuts both ways).
 *   4. The identity reshape (2026-09-21, migration 20260921150000): anonymity left the product, so
 *      every one of its load-bearing SQL facts is pinned here rather than in the file that happens
 *      to hold it today — create_guest's verified-email refusal and its nulled name, create_media's
 *      post-flip refusal AND the wording mapCheckViolation splits on, get_upload_context's two new
 *      keys, set_guest_display_name's posture, and the display-name cap's parity with
 *      DISPLAY_NAME_MAX_LENGTH.
 *   5. get_event_by_qr_token's QA #40 redaction, which until now was pinned to the FILE that added
 *      it (escalation-guards.test.ts). The reshape drops and recreates that function, which is
 *      exactly the drift a file-pinned guard cannot see — so it gets a latest-wins guard too.
 *   6. claim_anonymous_uploads's TWO arms (the guest identity round deliberately inverted the old
 *      "never writes email" pin — that describe carries the reasoning).
 *   7. The guest identity round (2026-09-22, migrations 20260922120000 + 20260922122000): the
 *      unproved address lives in its own fail-closed column with its CHECK and partial index, the
 *      five claim/attach RPCs sit exactly where database-security.md puts them, nothing expires, and
 *      a profile publishes no attended event until its owner chooses it.
 *   8. The identity SQL gaps (2026-09-22, migration 20260922200000): `guests.email` is written by
 *      create_guest only beside a confirmation, the host's guests SELECT never carries `email`
 *      again, and get_public_profile's attended arm applies the album's own confirmed-email gate,
 *      pinned against the album code it mirrors.
 *   9. The guests grant tidy (2026-09-22, migration 20260922213000): no client role reads `guests`
 *      at all (the SELECT and `guests_host_select` are gone, replayed statement by statement across
 *      the set), and capture_guest_email fills `guests.email` only on a row whose own account is the
 *      confirmed owner of that address.
 *  10. Guest by upload (Will, 2026-09-22; migrations 20260923120000 + 20260923130000): a person is a
 *      guest of an event only through an upload of theirs. The upload gate closes again on the
 *      guest's OWN deletes (never on a host's removal), a profile's attended line follows the album's
 *      Require an upload to view, the claim card and Claim all skip a row with no live upload, the
 *      token claim's count is the claimed rows that carry one, and the save objects are dropped.
 *  11. The identity contract (migration 20260923150000): the legacy `allow_anonymous_uploads` column,
 *      its twin-keeper trigger and the trigger's function are dropped and never recreated, and no
 *      executable SQL after the drop names the column; get_event_by_qr_token returns the two door
 *      switches and no legacy key; create_guest refuses a nameless mint by an unconfirmed caller in
 *      its own words, which the app maps ahead of its verification fallback.
 *  12. The row cap (Will, 2026-09-23; migrations 20260924010000/020000/030000): every SQL shape the
 *      1,000-row fixes read, pinned as the contract the TypeScript lanes compile against. Each new or
 *      replaced function's signature (PostgREST resolves an RPC by its argument names), security
 *      mode, empty search_path and grants; the album's order, cursor and limit; the like counts'
 *      liked-only join; the claim card's keyset; the sweeps' predicates. The paging POLICY across
 *      every function is row-cap-sql.test.ts.
 *  13. The live reel (migrations 20260924100000 + 20260924110000): the expand's columns, grants and
 *      backfill, create_media and create_media_as_host carrying every guard plus p_reel_eligible,
 *      the two guest reads' new keys beside their paging and redaction, the platform flag; and the
 *      drop removing exactly the stored reel, never reel_eligible or tier_limits.
 *  14. The host's reel defaults (migration 20260925100000): the hold column with its envelope and
 *      its bare column grant, get_event_by_qr_token carried from the expand with only the hold
 *      appended, and event_stills' shape, scoping, clamp and grants.
 *  15. The paged album's version and change log (migration 20260926100000): two deny-all tables the
 *      service role only reads; nine functions no client role can run; the album row written ONLY by
 *      the deferred stamps at commit, every event of a transaction bumped in event-id order (the
 *      lock-order rule, database-security.md); the note before the stamp by name; the reader's one
 *      snapshot and its clamp.
 *  16. The per-event block and the always-on guest list (event-safety r1, migration 20260928120000): the
 *      table's keys, RLS and grants; the one rule (four predicates no client role can run); the host's
 *      two acts re-checking the host, skipping a hold and keeping what the restore reads; the mask on
 *      every guest path, in the private album's own words; the four claims leaving a block alone; her
 *      own feed and lists kept as a private album's; and no SQL reading the retired switch.
 *  17. An operator's removal leaves the host's view (admin-triage r1, migration 20260928140000): the
 *      host's policy hides it while the flag stays ungranted; her Delete permanently cannot end its
 *      window; her Deleted and her restored event count only what her Deleted shows; and an event
 *      holding one inside its window is kept by every event-level purge.
 *  18. The doors (event-settings r1, migration 20260929120000): a gated album stored private with its
 *      gate, the gate ungranted and the Videos switch granted; admission on the ticket; the invite
 *      list's keys, RLS and cap; the standing and every read the service role's alone; the host's four
 *      acts re-checking the host; and every guest path (the join, the upload, the rename, likes, both
 *      claims, the ask) meeting the door in the private album's words.
 *  19. The schema pass (migrations 20260929160000 + 20260929170000): the events CHECKs at the app's own
 *      bounds, anon granted no table ever again, the default privileges left revoked, tier_limits kept
 *      from the client roles across a recreate, the dropped columns never re-added, and the contract
 *      dropping exactly the reel's three dormant columns behind its milestone-31 gate.
 *  20. The list lets in who waits (build 23's BUG-2, migration 20260929220000): while the invite list
 *      is the door, a waiting person it names is in, by the door's own predicates, no client role
 *      runs the rule, and each act that can bring it about (the listing, the door becoming the list,
 *      Let back in) settles it and says how many.
 *  21. A password ends every ask (crumbs-21, migration 20260929230000): a trigger on every path to a
 *      password takes each waiting ticket, never a row an upload names, no client role runs it, and a
 *      guest row is only ever deleted as an ask ending.
 *  22. A report keeps what it named (crumbs-21, migration 20260929231000): `media_id` is no foreign key
 *      by the last word on the constraint, the kind is the item's (written by a trigger that refuses
 *      an id naming nothing), backfilled with no stamp moved, and paired with the item by a CHECK.
 *  23. The host's like counts (crumbs-21, migration 20260929232000): a count only for a row she can
 *      meet, held to media_host_all's latest USING conjunct by conjunct.
 *  24. Shared phones (shared-claims, migration 20260929234000): whose a ticket is has one rule,
 *      whose_ticket, which no client role runs; the silent claim takes only what it calls hers; the ask
 *      is one jsonb for a confirmed account, of tickets typed under another name with a live upload;
 *      her answer never takes another address and never names her profile.
 *  25. The join waits for the door (crumbs-24, migration 20260930100000): both mints of an ask read the
 *      door under its row's share lock first, the one lock every move of the door waits on, and no
 *      other body mints a waiting ticket.
 *  26. The claim says what it left for another address (crumbs-24, migration 20260930110000): the ask
 *      read answers each held ticket typed under an address that is not hers, one entry a ticket with no
 *      name (so a build before it reads past), and never the address.
 *  27. The instant hide's bar, three strikes that lapse (hide-strikes, migration 20260930120000; one home since
 *      crumbs-33, 20261001100000): the winning report_strikes counts the address's child-abuse reports dismissed
 *      inside the window, by the dismissal's own time, against the two numbers named once there, and the winning
 *      create_report asks it, holding neither, with its signature and its one grant.
 *  28. No door's opening admits a blocked ask (crumbs-29, migration 20260930130000): the door's asks are read once,
 *      by an owner-only helper both of the list's twins read and neither spells, and no body lets a waiting row in
 *      but through it or the host's own answer.
 *  29. One account, one ticket at an album (crumbs-29, migration 20260930140000): both mints answer the ticket a
 *      confirmed account holds, read under a lock on the album and the account, before they insert.
 *  30. A report is open exactly when it has no resolved_at (crumbs-29, migration 20260930150000): the CHECK stands,
 *      and every write of a report's status in the app writes its time beside it.
 *  31. The newsletter row follows the address (crumbs-33, migration 20261001110000): the winning
 *      handle_user_email_change moves the account's list row from its old address to its new one, in the list's
 *      own form, keeps a row the new address already had without ever raising, still returns first for an account
 *      being deleted, and stays trivial and uncallable by a client role.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DOOR_NAME_KEY } from "@/app/(auth)/door-name-key";
import { QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import {
  allMigrations,
  executableMigrations,
  liveFunction,
  liveFunctions,
  MIGRATIONS_DIR,
} from "@/lib/db/testing/migrations";
import { createEventSchema, updateEventSchema } from "@/lib/validation/event";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

const ROOT = join(__dirname, "..", "..", "..");

/** Whitespace-tolerant: the shape is the contract, never the SQL's line breaks. */
function collapse(sql: string): string {
  return sql.replace(/\s+/g, " ");
}

/**
 * The definition that actually WINS on the live DB: the last `create [or replace] function public.<name>(`
 * of the overloads still standing after the whole set is replayed, creates AND drops, in timestamp order
 * (`testing/migrations.ts`, shared with the two row-cap tests). ★ A function a later file drops is not
 * defined: this throws, naming the file that drops it, where it used to answer with the body it had before
 * (the old reader scanned creates alone), so a pin on a dropped function failed nowhere and guarded nothing.
 * Returns the winning statement, `create` to its closing dollar-quote and `;`, comments kept, and the whole
 * winning FILE (grants live outside the body).
 */
function latestDefinition(name: string): { body: string; file: string } {
  const { raw, fileSql } = liveFunction(name);
  return { body: raw, file: fileSql };
}

/** Does a GRANT/REVOKE object list name the guests table (alone, in a list, or schema-wide)? */
function namesGuests(objects: string): boolean {
  return (
    /(?:^|[\s,])public\.guests(?=$|[\s,])/.test(objects) ||
    /\ball tables in schema public\b/.test(objects)
  );
}

/**
 * The columns `authenticated` can SELECT on `guests` as the live DB holds them, REPLAYED statement
 * by statement across the whole set rather than read off the last grant, because two Postgres rules
 * decide it (database-security.md's gotchas): a TABLE-level revoke cascades to every column grant,
 * so it empties the set, and a column-level revoke removes only its own columns. A table-level
 * grant, which another guard forbids, replays as "*": every column at once.
 */
function hostGuestsSelect(): string[] {
  let columns = new Set<string>();
  const statement =
    /\b(grant|revoke) ([a-z_, ]+?)(?: \(([^)]*)\))? on (?:table )?([^;]*?) (?:to|from) ([^;]*);/g;
  for (const { sql } of executableMigrations()) {
    for (const [, verb, privileges, named, objects, grantees] of sql.matchAll(
      statement,
    )) {
      if (!namesGuests(objects)) continue;
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
  return [...columns];
}

/** Can the host (any `authenticated` session) read this guests column over PostgREST? */
function hostSelects(column: string): boolean {
  const columns = hostGuestsSelect();
  return columns.includes("*") || columns.includes(column);
}

/** The policies standing on `guests` after the whole set, create / drop / rename replayed in order. */
function guestsPolicies(): string[] {
  const names = new Set<string>();
  const statement =
    /\b(create|drop|alter) policy (?:if exists )?([a-z0-9_"]+) on (?:only )?public\.guests\b(?: rename to ([a-z0-9_"]+))?/g;
  for (const { sql } of executableMigrations()) {
    for (const [, verb, name, renamed] of sql.matchAll(statement)) {
      if (verb === "create") names.add(name);
      else if (verb === "drop") names.delete(name);
      else if (renamed) {
        names.delete(name);
        names.add(renamed);
      }
    }
  }
  return [...names];
}

/** The last word on guests' row level security across the set: "enable" or "disable". */
function guestsRowSecurity(): string | null {
  let state: string | null = null;
  for (const { sql } of executableMigrations()) {
    for (const [, verb] of sql.matchAll(
      /alter table (?:only )?public\.guests (enable|disable) row level security/g,
    )) {
      state = verb;
    }
  }
  return state;
}

/** The text between the paren opened at `open` and the one that closes it (quotes respected). */
function balancedInside(sql: string, open: number): string {
  let depth = 0;
  let quoted = false;
  for (let i = open; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") quoted = !quoted;
    if (quoted) continue;
    if (ch === "(") depth++;
    if (ch === ")" && --depth === 0) return sql.slice(open + 1, i);
  }
  throw new Error("unbalanced parentheses");
}

/** A boolean expression's top-level `and` conjuncts, trimmed (parentheses and quotes respected). */
function topLevelConjuncts(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let from = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'") quoted = !quoted;
    if (quoted) continue;
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (depth === 0 && expr.startsWith(" and ", i)) {
      parts.push(expr.slice(from, i).trim());
      from = i + " and ".length;
    }
  }
  parts.push(expr.slice(from).trim());
  return parts.filter(Boolean);
}

/**
 * `media_host_all`'s USING as the live DB holds it (the last `create` or `alter` of the policy across the
 * set's executable SQL), split into its top-level conjuncts: the rows a host's own policy lets her meet.
 */
function mediaHostAllUsingConjuncts(): string[] {
  let using: string | null = null;
  const statement =
    /\b(?:create|alter) policy media_host_all on public\.media\b[^;]*?\busing \(/g;
  for (const { sql } of executableMigrations()) {
    for (const match of sql.matchAll(statement)) {
      using = balancedInside(sql, match.index + match[0].length - 1);
    }
  }
  expect(using, "media_host_all has no USING").not.toBeNull();
  return topLevelConjuncts(using!.trim());
}

describe("QA #17 — the cap row locks survive body replacement", () => {
  it("create_media locks the host's profiles row before the cap reads", () => {
    expect(latestDefinition("create_media").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("create_media_as_host locks the host's profiles row before the cap reads", () => {
    expect(latestDefinition("create_media_as_host").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  // ★ RESHAPED ON PURPOSE (trash-in-storage, 20261003220000; scar kept: the host's profiles row is locked before any
  // capacity read or slot count). The two restores take it FIRST now, on the caller's own id (her own row; the reads
  // after it prove the item or the event is hers), the one lock order every capacity decision shares since an upload
  // making room from Deleted (`leave_deleted`, inside create_media*) writes her Deleted under the same lock.
  const LOCK_FIRST =
    "from public.profiles where id = (select auth.uid()) for update";

  it("restore_media locks the host's profiles row first, before it reads the item or its room", () => {
    const { body } = latestDefinition("restore_media");
    const lock = body.indexOf(LOCK_FIRST);
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(body.indexOf("from public.media m"));
    expect(lock).toBeLessThan(body.indexOf("public.host_storage_summary("));
  });

  it("restore_event locks the host's profiles row first, before it reads the event or counts the slots", () => {
    const { body } = latestDefinition("restore_event");
    const lock = body.indexOf(LOCK_FIRST);
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(body.indexOf("from public.events"));
    expect(lock).toBeLessThan(body.indexOf("public.tier_limits("));
  });

  it("enforce_event_limit locks the host's profiles row before the slot count", () => {
    expect(latestDefinition("enforce_event_limit").body).toContain(
      "perform 1 from public.profiles where id = new.host_id for update;",
    );
  });
});

describe("QA #18 — create_guest inherits the read gate", () => {
  it("refuses a private event's mint outright", () => {
    const { body } = latestDefinition("create_guest");
    expect(body).toContain("v_event.visibility = 'private'");
  });

  it("requires proof of unlock for a password event", () => {
    const { body } = latestDefinition("create_guest");
    expect(body).toContain("p_unlock_proven");
    expect(body).toContain("v_event.visibility = 'password'");
  });

  it("stays service-role-only (database-security.md) in its defining migration", () => {
    const { file } = latestDefinition("create_guest");
    expect(file).toMatch(
      /revoke execute on function public\.create_guest\([^)]*\) from public, anon, authenticated;/,
    );
    expect(file).toMatch(
      /grant execute on function public\.create_guest\([^)]*\) to service_role;/,
    );
  });
});

describe("QA #18 — get_upload_context feeds the route lock re-check", () => {
  it("returns the event's visibility", () => {
    expect(latestDefinition("get_upload_context").body).toContain(
      "'visibility', v_event.visibility",
    );
  });

  it("keeps the anon EXECUTE grant (0028 — the four anon read RPCs) in its defining migration", () => {
    // A body replacement WITHOUT an explicit re-grant fails here on purpose: re-assert it
    // (never service-role this one — the session token IS the authorization, database-security.md).
    const { file } = latestDefinition("get_upload_context");
    expect(file).toContain(
      "grant execute on function public.get_upload_context(text, public.media_type) to anon, authenticated;",
    );
  });
});

describe("the identity contract — the legacy twin is gone and stays gone", () => {
  // `require_verified_email` is the host's one identity switch. Its legacy twin,
  // `events.allow_anonymous_uploads`, and the trigger that held the two opposite are dropped by
  // 20260923150000, functions first (every body that read the column is replaced before the column
  // goes), trigger before its function. ★ `latestDefinition` finds only `create` statements, so a
  // dropped object's old pins would stay green while false: what is pinned here is the DROP, and
  // that nothing later in the set brings any of it back (the save objects' pattern, at the foot).
  const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
  const columnDrop = sql.lastIndexOf(
    "alter table public.events drop column allow_anonymous_uploads;",
  );
  // Each statement's last occurrence AT OR BEFORE the column drop: a later file may drop and
  // recreate get_event_by_qr_token for its own reasons (the live reel's expand, 20260924100000,
  // does), which says nothing about this contract's order.
  const drops = [
    "create or replace function public.get_public_profile(",
    "drop function public.get_event_by_qr_token(text);",
    "drop trigger events_sync_verified_email_flags on public.events;",
    "drop function public.sync_event_verified_email_flags();",
    "alter table public.events drop column allow_anonymous_uploads;",
  ].map((statement) => sql.lastIndexOf(statement, columnDrop));

  it("drops the trigger, then its function, then the column, after replacing every reader", () => {
    expect(drops.every((at) => at > -1)).toBe(true);
    expect([...drops].sort((a, b) => a - b)).toEqual(drops);
  });

  it("nothing later in the set recreates the trigger, its function or the column", () => {
    const after = sql.slice(Math.max(...drops));
    for (const revival of [
      /create (or replace )?trigger events_sync_verified_email_flags\b/,
      /create (or replace )?function public\.sync_event_verified_email_flags\(/,
      /add column (if not exists )?allow_anonymous_uploads\b/,
    ]) {
      expect(after).not.toMatch(revival);
    }
  });

  it("no executable SQL after the drop names the legacy column", () => {
    // A body that still read it would pass every create and fail at its first call.
    const at = sql.lastIndexOf(
      "alter table public.events drop column allow_anonymous_uploads;",
    );
    const after = sql.slice(
      at +
        "alter table public.events drop column allow_anonymous_uploads;".length,
    );
    expect(after).not.toContain("allow_anonymous_uploads");
  });

  it("the winning bodies that read events name only the new switch", () => {
    for (const name of [
      "get_public_profile",
      "get_event_by_qr_token",
      "create_guest",
    ]) {
      expect(
        latestDefinition(name).body.replace(/--[^\n]*/g, ""),
        name,
      ).not.toContain("allow_anonymous_uploads");
    }
  });
});

describe("the identity reshape — create_guest mints an identity", () => {
  it("refuses a mint without a verified email when the switch is on", () => {
    expect(collapse(latestDefinition("create_guest").body)).toContain(
      "if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then",
    );
  });

  it("nulls a typed name when a confirmed account already carries the identity", () => {
    // One identity per row: a profile name and a typed name must never sit side by side and
    // disagree. Wave 1's precedence rule depends on this being true in the DATA, not in the UI.
    expect(collapse(latestDefinition("create_guest").body)).toContain(
      "if v_confirmed is not null then v_name := null; end if;",
    );
  });

  it("stamps verified_at from the confirmed session, never from a client value", () => {
    const body = collapse(latestDefinition("create_guest").body);
    // The column list grew by the guest identity round's two columns (20260922120000), and by the
    // doors' `admission` (20260929120000: whether the door let this ticket through), appended last;
    // what this pins is that `email` and `verified_at` are still written from the SERVER-read
    // auth.users row and in that order, never from a client value.
    expect(body).toContain(
      "insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at, admission)",
    );
    expect(body).toContain("v_name, v_confirmed");
    // v_confirmed comes from auth.users under definer privilege — the whole point.
    expect(body).toContain(
      "select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;",
    );
  });

  it("refuses a nameless mint by an unconfirmed caller, in its own words, before the insert", () => {
    // The identity contract: every unconfirmed row carries a name. After the name is normalised and
    // a confirmed caller's is nulled, and before the row is written.
    const body = collapse(
      latestDefinition("create_guest").body.replace(/--[^\n]*/g, ""),
    );
    const raise = body.indexOf(
      "if v_name is null and v_confirmed is null then raise exception 'Add your name to upload.' using errcode = 'check_violation'; end if;",
    );
    expect(raise).toBeGreaterThan(
      body.indexOf("if v_confirmed is not null then v_name := null; end if;"),
    );
    expect(raise).toBeLessThan(body.indexOf("insert into public.guests"));
  });

  it("still mints a CONFIRMED caller nameless (the profile's name is its identity)", () => {
    // Never an unconditional name requirement: a verified row is nameless by design.
    expect(collapse(latestDefinition("create_guest").body)).not.toContain(
      "if v_name is null then raise",
    );
  });

  it("the app maps the nameless refusal to name_required ahead of its verification fallback", () => {
    // createGuest's last check_violation arm reads ANY unknown refusal as verification_required,
    // so a refusal it does not name first would send a nameless guest to the email step.
    const mutation = collapse(
      readFileSync(join(ROOT, "src/lib/db/mutations/guest.ts"), "utf8"),
    );
    const named = mutation.indexOf(
      'if (m.includes("add your name")) { return { ok: false, code: "name_required", message: error.message }; }',
    );
    expect(named).toBeGreaterThan(-1);
    expect(named).toBeLessThan(
      mutation.indexOf('code: "verification_required", message: error.message'),
    );
  });
});

describe("the identity reshape — create_media gates the upload, not only the join", () => {
  it("refuses an unverified guest after the host flips the switch on", () => {
    expect(collapse(latestDefinition("create_media").body)).toContain(
      "if v_event.require_verified_email and v_guest.verified_at is null then",
    );
  });

  it("words the two refusals so mapCheckViolation splits them apart", () => {
    // The coupling is real and invisible: the identity refusal ALSO reads "not accepting", so
    // mapCheckViolation must test "verified email" ABOVE the general "not accepting" branch or the
    // identity refusal disappears into uploads_closed. Reword one side and this fails.
    const body = latestDefinition("create_media").body;
    expect(body).toContain(
      "This event is not accepting uploads without a verified email.",
    );
    expect(body).toContain("This event is not accepting uploads.");
    const mutation = collapse(
      readFileSync(join(ROOT, "src/lib/db/mutations/guest.ts"), "utf8"),
    );
    const identity = mutation.indexOf('if (m.includes("verified email"))');
    const closed = mutation.indexOf(
      'if (m.includes("not accepting") || m.includes("no longer exists")) { return { ok: false, code: "uploads_closed",',
    );
    expect(identity).toBeGreaterThan(-1);
    expect(closed).toBeGreaterThan(identity);
  });
});

describe("the identity reshape — get_upload_context carries the identity gate", () => {
  it("returns the event's gate and this session's standing", () => {
    const body = latestDefinition("get_upload_context").body;
    expect(body).toContain(
      "'require_verified_email', v_event.require_verified_email",
    );
    expect(body).toContain(
      "'guest_verified', (v_guest.verified_at is not null)",
    );
  });
});

describe("the identity reshape — set_guest_display_name", () => {
  it("is service-role-only, like every other server-mediated guest write", () => {
    // Doubly so here: profanity and the reserved-name list CANNOT be checked in SQL (the obscenity
    // matcher must never ship to a browser), so the route that calls this is load-bearing.
    const { file } = latestDefinition("set_guest_display_name");
    expect(file).toContain(
      "revoke execute on function public.set_guest_display_name(text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.set_guest_display_name(text, text) to service_role;",
    );
  });

  it("refuses to give a verified guest a second name", () => {
    expect(collapse(latestDefinition("set_guest_display_name").body)).toContain(
      "if v_guest.verified_at is not null then",
    );
  });
});

describe("QA #40 — get_event_by_qr_token's redaction survives a drop + create", () => {
  // Pinned latest-wins here because the reshape DROPPED and recreated this function; a guard
  // pinned to 20260729180000 (escalation-guards.test.ts) can no longer see the winning body.
  it("redacts metadata for a non-owner of a gated event, and the name only for private", () => {
    // ★ Reshaped by the per-event block (20260928120000): the redaction reads `v.visibility`, the
    // event AS THIS CALLER SEES IT (private to an account the event blocked), where it read the row's
    // own `e.visibility`. The rule it pins is unchanged: a non-owner of a gated album gets no
    // metadata, and no name when it is private. The mask itself is pinned with the block's guards.
    const body = collapse(latestDefinition("get_event_by_qr_token").body);
    expect(body).toContain(
      "(v.visibility <> 'open' and e.host_id is distinct from (select auth.uid())) as hide_meta",
    );
    expect(body).toContain(
      "(v.visibility = 'private' and e.host_id is distinct from (select auth.uid())) as hide_name",
    );
    expect(body).toContain("case when r.hide_name then null else e.name end");
    for (const field of [
      "e.description",
      "e.event_date",
      "e.custom_slug",
      "p.display_name",
    ]) {
      expect(body).toContain(
        `case when r.hide_meta then null else ${field} end`,
      );
    }
  });

  it("keeps qr_token unredacted (the locked page hands it to the client by design)", () => {
    expect(latestDefinition("get_event_by_qr_token").body).toContain(
      "e.qr_token,",
    );
  });

  it("returns both door switches unredacted, and no legacy flag", () => {
    // The lock screen and the entry sheet must render the right refusal: redacting a switch would
    // break a page the RPC exists to back. The legacy twin left with its column.
    const body = collapse(latestDefinition("get_event_by_qr_token").body);
    expect(body).toContain(
      "e.accepting_uploads, e.require_verified_email, e.require_upload_to_view,",
    );
    expect(body).toContain(
      "accepting_uploads boolean, require_verified_email boolean, require_upload_to_view boolean,",
    );
    expect(body).not.toContain("allow_anonymous_uploads");
  });

  it("re-asserts the anon EXECUTE grant its drop took away (0028)", () => {
    // ★ Reshaped by the doors (20260929120000), which narrowed the ACL to the roles that call it
    // (ROADMAP's security line): anon and authenticated ride one grant with service_role now.
    expect(latestDefinition("get_event_by_qr_token").file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
    );
  });
});

describe("claim_anonymous_uploads writes email ONLY on the confirmed arm", () => {
  // ★ THIS PIN IS INVERTED ON PURPOSE (the guest identity round, 2026-09-22). It used to read
  // "never writes email", from the 20260602144343 invariant that a claim proves possession of a
  // session token and never ownership of an address. That reasoning held while the only address on
  // a guest row came from its own mint. It no longer does: a CONFIRMED caller presenting the
  // session token holds the device that made the upload AND has proved an address — strictly more
  // proof than claim_guest_rows_by_email asks for — so this is the one legitimate path from a typed
  // address to a confirmed one. What must NOT drift is the split: the unconfirmed arm stamps user_id
  // and nothing else, so an unconfirmed sign-in never claims an address it has not proved.
  const body = collapse(latestDefinition("claim_anonymous_uploads").body);
  const updates = body
    .split("update public.guests")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf(";")));

  it("has exactly two guests updates: the confirmed arm and the unconfirmed one", () => {
    expect(updates).toHaveLength(2);
  });

  it("the confirmed arm stamps the row whole and drops the unproved address", () => {
    const [confirmed] = updates;
    expect(confirmed).toContain("set user_id = v_uid");
    expect(confirmed).toContain("verified_at = now()");
    expect(confirmed).toContain("email = v_email");
    expect(confirmed).toContain("pending_email = null");
    expect(confirmed).toContain("pending_email_at = null");
    // The no-theft guard is what makes this safe to expose to the browser at all.
    expect(confirmed).toContain("user_id is null");
  });

  it("the unconfirmed arm stamps user_id and nothing else", () => {
    const unconfirmed = updates[1];
    expect(unconfirmed).toContain("set user_id = v_uid");
    expect(unconfirmed).not.toContain("email");
    expect(unconfirmed).not.toContain("verified_at");
    expect(unconfirmed).toContain("user_id is null");
  });

  it("keeps its authenticated-only grant (0029, never 0028)", () => {
    const { file } = latestDefinition("claim_anonymous_uploads");
    expect(file).toContain(
      "revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;",
    );
  });
});

describe("guests.display_name is capped where the app caps a name", () => {
  it("the CHECK mirrors DISPLAY_NAME_MAX_LENGTH", () => {
    // The zod schema is the UX gate; this CHECK is the hard backstop. They drift the moment one
    // number moves alone, and nothing else in the gate would notice.
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      `add constraint guests_display_name_len check (display_name is null or char_length(display_name) between 1 and ${DISPLAY_NAME_MAX_LENGTH})`,
    );
    expect(sql).not.toContain("drop constraint guests_display_name_len");
  });
});

describe("the door round, wave 0 — Require an upload to view", () => {
  // The switch (Will, 2026-09-21, "the door as three steps"): a genuinely new flag with
  // no legacy twin, off by default, free on every tier; the gate it drives is enforced by the
  // gallery access resolver through one service-role read.
  it("the column joins the column-locked host grant by a bare additive grant", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      "grant insert (require_upload_to_view), update (require_upload_to_view) on public.events to authenticated;",
    );
  });

  it("get_event_by_qr_token returns the switch beside its sibling and keeps its client grant", () => {
    const { body, file } = latestDefinition("get_event_by_qr_token");
    expect(body).toContain(
      "require_verified_email boolean, require_upload_to_view boolean,",
    );
    expect(body).toContain(
      "e.require_verified_email, e.require_upload_to_view,",
    );
    // ★ Reshaped by the doors (20260929120000): the client roles ride one grant with service_role.
    expect(file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
    );
  });

  it("get_upload_gate is service-role only, closes again on the guest's own deletes and mirrors the presign's caps", () => {
    const { body, file } = latestDefinition("get_upload_gate");
    expect(file).toContain(
      "revoke all on function public.get_upload_gate(uuid, text, uuid) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.get_upload_gate(uuid, text, uuid) to service_role;",
    );
    // The token arm is the delete RPC's guard; the account arm is the server-verified id.
    expect(body).toContain(
      "g.session_token = p_session_token and g.user_id is null",
    );
    expect(body).toContain("p_user_id is not null and g.user_id = p_user_id");
    // ★ OWN DELETES CLOSE IT (Will, 2026-09-22, re-ruling his "any completed upload counts"): the
    // ONE status filter is the guest's own removal. Pending, approved, hidden and a removal by the
    // host, an admin or the system all still count, because a door that re-closed on the host's
    // curation would leak it to the guest. So the body names exactly this clause and no other
    // status test: a `m.status = 'approved'` here would re-close the door on every hide.
    const code = collapse(body.replace(/--[^\n]*/g, ""));
    expect(code).toContain(
      "and not (m.status = 'removed' and m.removed_by_uploader)",
    );
    expect(code.match(/m\.status/g)).toHaveLength(1);
    // ★ The fail-open pair is exactly what the presign refuses `cap_reached` on: both cap
    // expressions must read the same in both functions, or a guest could be held at a step the
    // presign would refuse anyway. ★ Reshaped by trash-in-storage (20261003220000; scar kept: one
    // expression in both): the storage line is `host_room_used`, what she keeps less Deleted while
    // her setting lets an upload make room from it, the same line the presign's meter refuses past. ★ And by Ladder A
    // (20261004100000; scar kept: one expression in both): the uploads line is her plan's own number over its window.
    // ★ And by billing-integrity (20261005181000; scar kept: one expression in both): that line is the completes' own
    // question, `uploads_refused`, asked of the smallest file, so a lapsed pass reads full here as the presign refuses it.
    const ctx = latestDefinition("get_upload_context").body;
    for (const expr of [
      "public.host_room_used(v_event.host_id) >= v_cap + (v_cap / 10)",
      "public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1)",
    ]) {
      expect(body).toContain(expr);
      expect(ctx).toContain(expr);
    }
  });
});

describe("the guest identity round, wave 0 — the unproved address", () => {
  // Will, 2026-09-22 ("guest identity: name only, unconfirmed email, verified account"):
  // a typed address nobody has proved, stored in its OWN column, inert — never shown to the host,
  // never attributed, never mailed on its own, never expiring — and moved into `email` only by a
  // claim that proves it. Every load-bearing fact of migration 20260922120000 is pinned here rather
  // than in the file that happens to hold it, because a later `create or replace` is exactly the
  // drift a file-pinned guard cannot see.

  it("keeps the address in pending_email, shaped by a CHECK that storage can satisfy", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain("add constraint guests_pending_email_shape");
    // Normalised storage is what makes the claim's `= lower(v_email)` lookup exact.
    expect(sql).toContain("pending_email = lower(btrim(pending_email))");
    expect(sql).toContain("char_length(pending_email) between 3 and 254");
    expect(sql).toContain("position('@' in pending_email) > 1");
    expect(sql).not.toContain("drop constraint guests_pending_email_shape");
  });

  it("indexes it partially, which is the claim's only lookup", () => {
    expect(collapse(allMigrations())).toContain(
      "create index guests_pending_email_idx on public.guests (pending_email) where pending_email is not null;",
    );
  });

  it("★ never names the address in a guests SELECT grant (QA #41 fail-closed)", () => {
    // SELECT on guests is column-scoped, so a new column is invisible to the host over PostgREST
    // until a grant names it. The host sees a badge, never the address — that IS the ruling
    // ("there's no impersonation risk if the host can't see the attributed email"), and one
    // `grant select (…, pending_email, …)` anywhere in the set would undo it silently.
    expect(hostSelects("pending_email")).toBe(false);
    expect(collapse(allMigrations())).not.toMatch(
      /grant select \([^)]*pending_email/,
    );
  });

  it("nothing expires it: no expiry job, no expiry function", () => {
    // Will, 2026-09-22: "I'd prefer not to expire/detach any uploads from an unconfirmed email's
    // upload history." A sweep added later would quietly delete the address a guest typed to claim her
    // uploads by.
    expect(collapse(allMigrations())).not.toMatch(
      /create (or replace )?function public\.expire_/,
    );
  });

  it("denormalizes it on the forensic row, capture-only", () => {
    expect(collapse(allMigrations())).toContain(
      "alter table public.upload_forensics add column guest_pending_email text;",
    );
  });
});

describe("the guest identity round — create_guest carries the optional address", () => {
  it("takes it as a 5th defaulted parameter and stays service-role-only", () => {
    const { body, file } = latestDefinition("create_guest");
    expect(collapse(body)).toContain("p_pending_email text default null");
    expect(file).toContain(
      "revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;",
    );
  });

  it("normalises it, and nulls it beside a confirmed account or a require-verified event", () => {
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain(
      "v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''));",
    );
    expect(body).toContain(
      "if v_confirmed is not null or v_event.require_verified_email then v_pending := null; end if;",
    );
  });

  it("belts the WHOLE check, floor included, so nothing reaches it as a raw 23514", () => {
    // 'a@' passes `position('@') > 1` and would otherwise hit guests_pending_email_shape as an
    // unmappable constraint error rather than the route's own message.
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain("char_length(v_pending) not between 3 and 254");
    expect(body).toContain("That email address does not look right.");
  });

  it("reports WHETHER an address is attached, and never echoes it back", () => {
    const body = collapse(latestDefinition("create_guest").body);
    expect(body).toContain("'email_attached', (v_pending is not null)");
    expect(body).not.toContain("'pending_email', v_pending");
  });
});

describe("the guest identity round — the four claim and attach RPCs", () => {
  it("set_guest_pending_email is service-role-only, and refuses a verified row", () => {
    const { body, file } = latestDefinition("set_guest_pending_email");
    expect(file).toContain(
      "revoke execute on function public.set_guest_pending_email(text, text) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.set_guest_pending_email(text, text) to service_role;",
    );
    const collapsed = collapse(body);
    expect(collapsed).toContain("if v_guest.verified_at is not null then");
    // A blank DETACHES rather than erroring: "clear it" and "set it to nothing" are one intent.
    expect(collapsed).toContain(
      "set pending_email = null, pending_email_at = null",
    );
  });

  it("★ list_guest_rows_by_email is no oracle: the address is never a parameter", () => {
    // The one function that reads rows BY ADDRESS. It takes none: the address comes from
    // auth.users for auth.uid() under definer privilege, and an unconfirmed caller gets nothing
    // even for their own address. A parameter here would turn the product into "is this address a
    // Partyreel guest?".
    const { body, file } = latestDefinition("list_guest_rows_by_email");
    // The signature is the pin. The row cap (20260924020000) gave it a keyset cursor and a page size,
    // all three defaulting to null so the no-argument call still reaches it; what must never appear is
    // a TEXT parameter, which is the only shape an address could take.
    expect(collapse(body)).toMatch(
      /^create (or replace )?function public\.list_guest_rows_by_email\( p_after_at timestamptz default null, p_after_id uuid default null, p_limit integer default null \)/,
    );
    const params = collapse(body).slice(
      collapse(body).indexOf("(") + 1,
      collapse(body).indexOf(")"),
    );
    expect(params).not.toMatch(/\btext\b/);
    const collapsed = collapse(body);
    expect(collapsed).toContain("v_uid uuid := (select auth.uid());");
    expect(collapsed).toContain(
      "if v_confirmed is null or v_email is null then return; end if;",
    );
    // The album capability must not ride a list.
    expect(collapsed).not.toContain("qr_token");
    expect(collapsed).not.toContain("custom_slug");
    expect(file).toContain(
      "revoke all on function public.list_guest_rows_by_email(timestamptz, uuid, integer) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.list_guest_rows_by_email(timestamptz, uuid, integer) to authenticated;",
    );
  });

  it("claim_guest_rows_by_email stamps the row whole and names only a NAMELESS profile", () => {
    const { body, file } = latestDefinition("claim_guest_rows_by_email");
    const collapsed = collapse(body);
    expect(collapsed).toContain("verified_at = now(), email = v_email");
    expect(collapsed).toContain(
      "pending_email = null, pending_email_at = null",
    );
    // His rule: the active unverified name becomes the account's name — but only when the account
    // has none, and only from a row actually being claimed.
    expect(collapsed).toContain(
      "update public.profiles set display_name = v_name where id = v_uid and display_name is null;",
    );
    // Bounded, like every other array parameter in this schema.
    expect(collapsed).toContain("cardinality(p_event_ids) > 200");
    expect(file).toContain(
      "revoke all on function public.claim_guest_rows_by_email(uuid[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.claim_guest_rows_by_email(uuid[]) to authenticated;",
    );
  });

  it("disown_guest_rows_by_email removes through the uploader path and never reads null as ALL", () => {
    const { body, file } = latestDefinition("disown_guest_rows_by_email");
    const collapsed = collapse(body);
    // removed_by_uploader is what keeps a disowned upload out of the host's bin AND out of
    // restore_media (20260609150000) — the host cannot quietly put it back.
    expect(collapsed).toContain("removed_by_uploader = true");
    expect(collapsed).toContain("status = 'removed'");
    expect(collapsed).toContain("removed_at = coalesce(m.removed_at, now())");
    // ★ claim_ reads null as "all of mine"; on the destructive twin that shorthand would delete
    // every upload the caller ever made from an unclaimed row.
    expect(collapsed).toContain(
      "if p_event_ids is null or cardinality(p_event_ids) = 0 then",
    );
    // The guest ROW survives: the album's guest list and the forensic trail are history.
    expect(collapsed).not.toContain("delete from public.guests");
    expect(file).toContain(
      "revoke all on function public.disown_guest_rows_by_email(uuid[]) from public, anon;",
    );
    expect(file).toContain(
      "grant execute on function public.disown_guest_rows_by_email(uuid[]) to authenticated;",
    );
  });

  it("no claim RPC is reachable by anon (the 0028/0029 split IS the security property)", () => {
    const sql = collapse(allMigrations());
    for (const signature of [
      "public.list_guest_rows_by_email()",
      "public.list_guest_rows_by_email(timestamptz, uuid, integer)",
      "public.claim_guest_rows_by_email(uuid[])",
      "public.disown_guest_rows_by_email(uuid[])",
      "public.set_guest_pending_email(text, text)",
    ]) {
      expect(sql).not.toContain(`on function ${signature} to anon`);
    }
  });
});

describe("the guest identity round — a profile publishes nothing until chosen", () => {
  it("the attended arm reads the OPT-IN table, not the opt-out one", () => {
    const { body } = latestDefinition("get_public_profile");
    const start = body.indexOf("'attended_events'");
    // Comments stripped: the arm's own comment names the table it stopped reading, and a "must
    // not contain" assertion has to read code rather than its own documentation.
    const attended = body
      .slice(start, body.indexOf("'[]'::jsonb", start))
      .replace(/--[^\n]*/g, "");
    expect(attended).toContain("public.profile_shown_events");
    expect(attended).not.toContain("profile_hidden_events");
  });

  it("and only a PROVED identity attends in public", () => {
    // The belt: a level-1 (typed name) or level-2 (typed, unproved address) row publishes nothing,
    // so an impersonator's uploads can never surface under someone's profile.
    const { body } = latestDefinition("get_public_profile");
    const start = body.indexOf("'attended_events'");
    const attended = collapse(
      body.slice(start, body.indexOf("'[]'::jsonb", start)),
    );
    expect(attended).toContain("g.verified_at is not null");
  });

  it("ships the table with RLS and the three owner policies, and no backfill", () => {
    const sql = collapse(allMigrations());
    expect(sql).toContain(
      "alter table public.profile_shown_events enable row level security;",
    );
    for (const policy of [
      "profile_shown_events_select_own",
      "profile_shown_events_insert_own",
      "profile_shown_events_delete_own",
    ]) {
      expect(sql).toContain(`create policy ${policy}`);
    }
    expect(sql).toContain(
      "grant insert (user_id, event_id) on public.profile_shown_events to authenticated;",
    );
    // ★ NO BACKFILL. Copying today's attendance in would publish exactly what the ruling says must
    // stay private until someone turns it on.
    expect(sql).not.toMatch(
      /insert into public\.profile_shown_events \(user_id, event_id\) select/,
    );
  });

  it("re-states get_public_profile's anon grant (one of the five 0028 reads)", () => {
    expect(latestDefinition("get_public_profile").file).toContain(
      "grant execute on function public.get_public_profile(text) to anon, authenticated;",
    );
  });
});

describe("the identity SQL gaps — only a confirmed address reaches guests.email", () => {
  // Will's guest-identity ruling (guest-flow.md "Joining + identity"): the host sees a badge, never
  // an unproven address. `guests.email` means "confirmed" to every reader (the uploader resolver,
  // the forensic `guest_email`), so the mint writes it only beside the confirmation that proves it,
  // and the host's PostgREST view no longer carries the column at all (migration 20260922200000).

  it("create_guest drops the session's address unless auth.users confirmed it, before the insert", () => {
    const body = collapse(latestDefinition("create_guest").body);
    const drop = body.indexOf(
      "if v_confirmed is null then v_email := null; end if;",
    );
    expect(
      drop,
      "an unconfirmed session's address reaches the row again",
    ).toBeGreaterThan(-1);
    // After the auth.users read that fills the variable, before the insert that writes it.
    expect(drop).toBeGreaterThan(
      body.indexOf(
        "select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;",
      ),
    );
    expect(drop).toBeLessThan(body.indexOf("insert into public.guests"));
    // And `email` is still written from that variable alone, never from a parameter.
    expect(body).toContain(
      "v_uid, nullif(trim(coalesce(v_email, '')), ''), v_session_token,",
    );
  });

  it("★ the host's guests SELECT (replayed across the set) never carries email again", () => {
    // Every guests read runs on the service-role admin client or a SECURITY DEFINER function, so
    // the host's PostgREST view narrowed to what nothing sensitive rides on (and, since the grant
    // tidy, to nothing at all).
    expect(hostSelects("email")).toBe(false);
  });

  it("every column-scoped guests SELECT grant follows the TABLE-level revoke in its own file (QA #41)", () => {
    // The QA #41 shape: the TABLE-level revoke first (it cascades to every column grant), then the
    // whole allowlist in the same file. A bare column revoke is a silent no-op beside a table
    // grant; a table revoke without the full re-grant takes the other columns with it.
    const grant = /grant select \([^)]*\) on public\.guests to authenticated;/;
    const files = executableMigrations().filter(({ sql }) => grant.test(sql));
    expect(files.length).toBeGreaterThan(0);
    for (const { file, sql } of files) {
      const revoke = sql.indexOf(
        "revoke select on public.guests from public, anon, authenticated;",
      );
      expect(
        revoke,
        `${file}: a guests grant with no table-level revoke`,
      ).toBeGreaterThan(-1);
      expect(revoke, `${file}: the revoke comes after the grant`).toBeLessThan(
        sql.search(grant),
      );
    }
  });

  it("no migration hands a client role a table-wide SELECT on guests", () => {
    // A table-level grant would re-open every column at once, the plaintext capability token and
    // both addresses included, past every column-scoped grant above.
    expect(collapse(allMigrations().replace(/--[^\n]*/g, ""))).not.toMatch(
      /grant [a-z, ]*\b(?:select|all)\b[a-z, ]* on (?:table )?public\.guests to [^;]*\b(?:authenticated|anon)\b/,
    );
  });

  it("the existing rows lose only an address no account ever confirmed", () => {
    // A one-time rule, pinned so the file cannot drift before it is applied: the address itself is
    // the test, never the row's flag alone (a confirmed address a newsletter capture wrote onto an
    // unverified row was still proved by its owner), and a verified row is never touched.
    expect(collapse(allMigrations())).toContain(
      "update public.guests g set email = null where g.email is not null and g.verified_at is null and not exists ( select 1 from auth.users u where u.email_confirmed_at is not null and lower(btrim(u.email)) = lower(btrim(g.email)) );",
    );
  });
});

describe("the identity SQL gaps — the attended arm applies the album's own gate", () => {
  // The album (resolveGalleryDecision) answers its owner `full` first, then holds a viewer without
  // a CONFIRMED email at the teaser on a Require-verified-emails event, and the teaser never renders
  // the Guests list. The attended arm of get_public_profile is that list's reverse surface (QA #36's
  // principle: never disclose membership the album withholds from the same viewer), so it refuses
  // the same viewer. The QA #36 clause itself is pinned in social/public-profile-visibility.test.ts.
  const { body } = latestDefinition("get_public_profile");
  const start = body.indexOf("'attended_events'");
  const attended = collapse(
    body
      .slice(start, body.indexOf("'[]'::jsonb", start))
      .replace(/--[^\n]*/g, ""),
  );

  it("admits, on a verified-required event, only the event's host or a confirmed viewer", () => {
    // Keyed on `require_verified_email`: nothing new keys on the legacy `allow_anonymous_uploads`.
    expect(attended).toContain(
      "and ( not e.require_verified_email or e.host_id = (select auth.uid()) or exists ( select 1 from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null ) )",
    );
  });

  it("mirrors the album's code: the owner first, then the gate, and `isAuthed` IS email_confirmed_at", () => {
    // If the album's definition of a confirmed viewer moves, the SQL mirror above must move with
    // it: this is the coupling that keeps the two surfaces answering the same viewer the same way.
    const access = collapse(
      readFileSync(join(ROOT, "src/lib/events/gallery-access.ts"), "utf8"),
    );
    expect(access).toContain(
      'if (ctx.isOwner) return { access: "full", gate: null };',
    );
    expect(access).toContain(
      "if (event.require_verified_email && !ctx.isAuthed) {",
    );
    const page = readFileSync(
      join(ROOT, "src/app/(guest)/e/[token]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("isAuthed = Boolean(user.email_confirmed_at);");
  });
});

describe("the guests grant tidy: no client reads guests, and a capture lands only on its own account's row", () => {
  // Migration 20260922213000. The host's last PostgREST view of `guests`, `(id, event_id, user_id,
  // created_at)`, had no reader (every read is the service-role client or a SECURITY DEFINER
  // function), so the SELECT and its row filter went. And capture_guest_email,
  // which filled an EMPTY `guests.email` on whatever row the session token named, now fills it only
  // on a row whose own account is the confirmed owner of that address: on a shared phone the token
  // names the last joiner's row, and a VERIFIED row with no address printed the stranger's address
  // in the host's credit (uploader-identity.ts case 2 returns `guests.email`).

  it("★ authenticated holds no SELECT on any guests column, replayed across the whole set", () => {
    // The table-level revoke cascades to every column grant, and nothing re-grants: a new column
    // stays fail-closed, and now so does every old one.
    expect(hostGuestsSelect()).toEqual([]);
  });

  it("no policy on guests stands, and RLS stays on, so even a returning grant reads no row", () => {
    // Kept, `guests_host_select` would be a latent row filter waiting for a grant. With no policy
    // and RLS enabled, a stray future `grant select` still answers zero rows to every client role.
    expect(guestsPolicies()).toEqual([]);
    expect(guestsRowSecurity()).toBe("enable");
  });

  const capture = collapse(
    latestDefinition("capture_guest_email").body.replace(/--[^\n]*/g, ""),
  );

  it("keeps the signature its route calls by argument name", () => {
    // PostgREST resolves an RPC by its argument NAMES, and /api/guests/capture-email calls it by
    // these.
    expect(capture).toContain(
      "create or replace function public.capture_guest_email( p_session_token text, p_email text, p_newsletter_opt_in boolean default false ) returns jsonb",
    );
  });

  it("★ writes guests.email only when the row's own account is the confirmed owner of the address", () => {
    expect(capture).toContain(
      "update public.guests g set email = v_email where g.id = v_guest.id and g.email is null and exists ( select 1 from auth.users u where u.id = g.user_id and u.email_confirmed_at is not null and lower(btrim(u.email)) = v_email );",
    );
    // The ONE write to the table: a second, unguarded update would reopen the crack.
    expect(capture.match(/update public\.guests\b/g)).toHaveLength(1);
    // The equality with `lower(btrim(u.email))` is exact only because the parameter is normalised
    // the same way before it is compared.
    expect(capture).toContain(
      "v_email := lower(nullif(trim(coalesce(p_email, '')), ''));",
    );
  });

  it("keeps the opt-in: the caller's own address, whichever row the token names", () => {
    // A person's consent to the list is theirs and says nothing about the row.
    expect(capture).toContain(
      "insert into public.newsletter_signups (email, source, event_id) values (v_email, 'guest_upload', v_guest.event_id) on conflict (email) do nothing;",
    );
  });

  it("stays SECURITY DEFINER with a pinned search_path, and service-role-only in its defining migration", () => {
    expect(capture).toContain("security definer set search_path = ''");
    const { file } = latestDefinition("capture_guest_email");
    expect(file).toContain(
      "revoke execute on function public.capture_guest_email(text, text, boolean) from public, anon, authenticated;",
    );
    expect(file).toContain(
      "grant execute on function public.capture_guest_email(text, text, boolean) to service_role;",
    );
  });
});

describe("guest by upload: a person is a guest of an event only through an upload of theirs", () => {
  // Will, 2026-09-22 (docs/systems/guest-flow.md holds the definition as an invariant): "the only way
  // to be attached to an event as a guest should be via upload ... Delete all of your uploads? Removed
  // as a guest. Uploaded 1 photo? You're a guest." A LIVE upload is one whose status is not
  // `removed`; what other people see needs an APPROVED one. Migration 20260923120000 codes the rule
  // into five bodies and 20260923130000 drops the save objects it retired. Each pin reads CODE
  // (comments stripped), so a comment that names a clause can never stand in for the clause.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  it("a profile's attended line follows the album's Require an upload to view", () => {
    // His "Follow the album": on a require-upload event whose uploads are open, only the host and a
    // signed-in viewer whose own row carries an upload they did not remove themselves see the line,
    // exactly the viewers the album lets past its upload door.
    const { body } = latestDefinition("get_public_profile");
    const start = body.indexOf("'attended_events'");
    const attended = collapse(
      body
        .slice(start, body.indexOf("'[]'::jsonb", start))
        .replace(/--[^\n]*/g, ""),
    );
    expect(attended).toContain(
      "and ( not e.require_upload_to_view or not e.accepting_uploads or e.host_id = (select auth.uid()) or exists ( select 1 from public.guests vg join public.media vm on vm.guest_id = vg.id where vg.event_id = e.id and vm.event_id = e.id and vg.user_id = (select auth.uid()) and not (vm.status = 'removed' and vm.removed_by_uploader) ) )",
    );
  });

  it("the line's door and the album's door are one rule, mirrored against the album code", () => {
    // The gate (get_upload_gate) and the attended line must agree on what counts as having passed
    // the door, or a viewer could read the line of an album that is still holding them.
    expect(code("get_upload_gate")).toContain(
      "not (m.status = 'removed' and m.removed_by_uploader)",
    );
    const access = collapse(
      readFileSync(join(ROOT, "src/lib/events/gallery-access.ts"), "utf8"),
    );
    expect(access).toContain(
      "if (event.require_upload_to_view && ctx.canContribute && !ctx.hasContributed) {",
    );
  });

  it("the claim card lists only a row with a live upload", () => {
    // A row with nothing on it makes nobody a guest, so claiming it carries nothing and releasing
    // it removes nothing: it has no place on the card.
    expect(code("list_guest_rows_by_email")).toContain(
      "and g.verified_at is null and m.n > 0 order by",
    );
  });

  it("Claim all (null) claims only such a row, and takes its name only from one", () => {
    const body = code("claim_guest_rows_by_email");
    const skip =
      "(p_event_ids is not null or exists ( select 1 from public.media x where x.guest_id = g.id and x.status <> 'removed' ))";
    // Twice: the naming rule's read and the claim itself.
    expect(body.split(skip)).toHaveLength(3);
  });

  it("the token claim stamps every row it can and counts only the ones that carry a live upload", () => {
    // Every reader of that integer says "uploads" (the (app) layout's toast, the album's follow
    // moment), so a claim that carried only an empty row is not news.
    const body = code("claim_anonymous_uploads");
    const counted =
      "returning id ) select count(*)::integer into v_count from claimed c where exists ( select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed' );";
    expect(body.split(counted)).toHaveLength(3);
    expect(body).not.toContain("get diagnostics");
  });

  it("the contract file drops the save objects and the dead opt-out table, functions first", () => {
    // Before launch nothing waits for partyreel.com's older build (PROGRAM.md, "Before launch"); the
    // file's own header names what that build loses. Functions before the tables they read, and
    // nothing later in the set brings any of the four back.
    const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
    const drops = [
      "drop function if exists public.save_event(text);",
      "drop function if exists public.get_saved_events();",
      "drop table if exists public.saved_events;",
      "drop table if exists public.profile_hidden_events;",
    ].map((statement) => sql.lastIndexOf(statement));
    expect(drops.every((at) => at > -1)).toBe(true);
    expect([...drops].sort((a, b) => a - b)).toEqual(drops);
    const after = sql.slice(Math.max(...drops));
    for (const revival of [
      /create (or replace )?function public\.save_event\(/,
      /create (or replace )?function public\.get_saved_events\(/,
      /create table (if not exists )?public\.saved_events\b/,
      /create table (if not exists )?public\.profile_hidden_events\b/,
    ]) {
      expect(after).not.toMatch(revival);
    }
  });
});

describe("the row cap: the SQL shapes the 1,000-row fixes read", () => {
  // PostgREST cuts every table read and every set-returning RPC at max_rows (1,000) with no error and
  // no flag. Each function below answers with one value (a jsonb or a uuid[]) or a keyset page whose
  // p_limit is clamped to 1,000 in SQL, and a NULL p_limit reads everything so the deployed builds'
  // old calls return exactly what they did. Each pin reads CODE (comments stripped), and each grant
  // reads the defining file's executable SQL, so a quoted example can never stand in for either.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));
  const PAGE =
    "limit case when p_limit is null then null else least(p_limit, 1000) end;";

  describe("get_event_media_by_qr_token: the guest album, paged on its display order", () => {
    it("keeps p_qr_token and adds the cursor and the page size, each defaulting to null", () => {
      // The live reel's expand (20260924100000) appended reel_eligible, last; the four parameters
      // are the row cap's, unchanged, since PostgREST resolves the call by their names.
      expect(code("get_event_media_by_qr_token")).toContain(
        "create function public.get_event_media_by_qr_token( p_qr_token text, p_before_created_at timestamptz default null, p_before_id uuid default null, p_limit integer default null ) returns table( id uuid, type public.media_type, original_key text, preview_key text, width integer, height integer, duration_seconds double precision, created_at timestamptz, reel_eligible boolean )",
      );
    });

    it("stays the SECURITY DEFINER anon capability read, search_path pinned", () => {
      expect(code("get_event_media_by_qr_token")).toContain(
        "language sql stable security definer set search_path to ''",
      );
    });

    it("keeps its four gates, the event resolved first so the index walks in display order", () => {
      expect(code("get_event_media_by_qr_token")).toContain(
        "from public.media m where m.event_id = ( select e.id from public.events e where e.qr_token = p_qr_token and e.visibility = 'open' and e.deleted_at is null ) and m.status = 'approved'",
      );
    });

    it("orders created_at then id, pages strictly after (created_at, id), and reads everything on a null p_limit", () => {
      expect(code("get_event_media_by_qr_token")).toContain(
        `and (p_before_created_at is null or (m.created_at, m.id) < (p_before_created_at, p_before_id)) order by m.created_at desc, m.id desc ${PAGE}`,
      );
    });

    it("replaces the old signature in the same file and re-grants anon (one of the five 0028 reads)", () => {
      // The winning file drops the definition before it: the four-parameter signature since the
      // live reel's expand grew the RETURNS TABLE (a drop and a create, never create-or-replace).
      const file = grants("get_event_media_by_qr_token");
      const drop = file.indexOf(
        "drop function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer);",
      );
      expect(drop).toBeGreaterThan(-1);
      expect(drop).toBeLessThan(
        file.indexOf("create function public.get_event_media_by_qr_token("),
      );
      expect(file).toContain(
        "revoke all on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) from public;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to anon, authenticated;",
      );
    });

    it("ships the index its pages walk", () => {
      expect(collapse(allMigrations().replace(/--[^\n]*/g, ""))).toContain(
        "create index media_event_created_id_idx on public.media (event_id, created_at desc, id desc);",
      );
    });
  });

  describe("get_event_like_counts: liked media only, for the host alone", () => {
    it("keeps p_event_id and adds the cursor and the page size", () => {
      // Reshaped by crumbs-21: 20260929232000 carries this body in place (`create or replace`, the
      // signature unchanged), so the pin reads the shape PostgREST resolves by, never the verb.
      expect(code("get_event_like_counts")).toContain(
        "function public.get_event_like_counts( p_event_id uuid, p_after uuid default null, p_limit integer default null ) returns table (media_id uuid, like_count integer) language sql stable security definer set search_path = ''",
      );
    });

    it("★ joins FROM the likes, so an unliked item never takes a row", () => {
      const body = code("get_event_like_counts");
      expect(body).toContain(
        "select l.media_id, count(*)::integer from public.media_likes l join public.media m on m.id = l.media_id where m.event_id = p_event_id",
      );
      expect(body).not.toContain("left join");
    });

    it("keeps the host gate: anyone else reads zero rows, so a count never reaches a guest", () => {
      expect(code("get_event_like_counts")).toContain(
        "and exists ( select 1 from public.events e where e.id = p_event_id and e.host_id = (select auth.uid()) and e.deleted_at is null )",
      );
    });

    it("pages on media_id", () => {
      expect(code("get_event_like_counts")).toContain(
        `and (p_after is null or l.media_id > p_after) group by l.media_id order by l.media_id ${PAGE}`,
      );
    });

    it("replaces the old signature and stays authenticated-only", () => {
      // Reshaped by crumbs-21: the one-argument signature's drop is the row cap's (PostgREST forbids
      // overloads, so it must stay gone), read across the set; the grants are the winning file's,
      // which restates them.
      expect(collapse(allMigrations().replace(/--[^\n]*/g, ""))).toContain(
        "drop function public.get_event_like_counts(uuid);",
      );
      const file = grants("get_event_like_counts");
      expect(file).toContain(
        "revoke all on function public.get_event_like_counts(uuid, uuid, integer) from public, anon, authenticated;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_like_counts(uuid, uuid, integer) to authenticated;",
      );
    });

    it("★ counts only what her surfaces show: never a takedown, an asked row or a withdrawal (crumbs-21)", () => {
      expect(code("get_event_like_counts")).toContain(
        "and not (m.status = 'removed' and m.removed_by_admin) and m.purge_asked_at is null and not (m.status = 'removed' and m.removed_by_uploader)",
      );
    });

    it("★ holds every conjunct of media_host_all's latest USING, so what her policy hides is never counted", () => {
      // The policy is the one home of "the rows that leave the host's view"; the count is a DEFINER
      // read (it counts every liker), so it cannot inherit the policy and restates it. A conjunct the
      // policy gains fails here until the count follows.
      const conjuncts = mediaHostAllUsingConjuncts().filter(
        (c) => !c.startsWith("exists"),
      );
      expect(conjuncts.length).toBeGreaterThanOrEqual(2);
      const body = code("get_event_like_counts");
      for (const conjunct of conjuncts) {
        expect(body).toContain(conjunct.replaceAll("media.", "m."));
      }
    });
  });

  describe("my_liked_media_ids: the caller's own hearts, the ids in the POST body", () => {
    it("returns ONE uuid[] as SECURITY INVOKER over the owner-only RLS, filtered to the caller", () => {
      expect(code("my_liked_media_ids")).toContain(
        "create function public.my_liked_media_ids(p_media_ids uuid[]) returns uuid[] language sql stable security invoker set search_path = '' as $$ select coalesce(array_agg(l.media_id order by l.media_id), '{}'::uuid[]) from public.media_likes l where l.user_id = (select auth.uid()) and l.media_id = any(p_media_ids); $$;",
      );
    });

    it("is authenticated-only", () => {
      const file = grants("my_liked_media_ids");
      expect(file).toContain(
        "revoke all on function public.my_liked_media_ids(uuid[]) from public, anon, authenticated;",
      );
      expect(file).toContain(
        "grant execute on function public.my_liked_media_ids(uuid[]) to authenticated;",
      );
    });
  });

  describe("event_card_stats and event_covers: one jsonb for any number of cards", () => {
    // ★ Reshaped by disposable-foundation (20261002200000), which carries both bodies in place (`create or replace`,
    // the signatures untouched) with the seal's one predicate: the pins read the shape, never the verb (crumbs-21's
    // reshape of get_event_like_counts), and the covers' read keeps its gates with the predicate after them.
    it("event_card_stats is SECURITY INVOKER, answers every input id, and counts outside the bin", () => {
      const body = code("event_card_stats");
      expect(body).toContain(
        "function public.event_card_stats(p_event_ids uuid[]) returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(body).toContain(
        "from ( select distinct u.event_id from unnest(p_event_ids) as u(event_id) where u.event_id is not null ) ids left join",
      );
      expect(body).toContain(
        "count(*) filter (where m.status = 'approved') as approved, count(*) filter (where m.status = 'pending') as pending from public.media m where m.event_id = any(p_event_ids) and m.removed_at is null",
      );
    });

    it("event_covers is SECURITY INVOKER: the newest approved photo outside the bin, id as the tiebreak", () => {
      const body = code("event_covers");
      expect(body).toContain(
        "function public.event_covers(p_event_ids uuid[]) returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(body).toContain(
        "select distinct on (m.event_id) m.event_id, m.preview_key, m.original_key from public.media m where m.event_id = any(p_event_ids) and m.status = 'approved' and m.type = 'photo' and m.removed_at is null and (m.sealed_until is null or m.sealed_until <= now() or exists (select 1 from public.events e where e.id = m.event_id and e.host_id = (select auth.uid()))) order by m.event_id, m.created_at desc, m.id desc",
      );
    });

    it("the cards read on the user's client; the covers on the service role too; neither for anon", () => {
      expect(grants("event_card_stats")).toContain(
        "revoke all on function public.event_card_stats(uuid[]) from public, anon, authenticated; grant execute on function public.event_card_stats(uuid[]) to authenticated;",
      );
      expect(grants("event_covers")).toContain(
        "revoke all on function public.event_covers(uuid[]) from public, anon, authenticated; grant execute on function public.event_covers(uuid[]) to authenticated, service_role;",
      );
    });

    it("event_link_totals is SECURITY INVOKER over the host's own link_stats, authenticated-only", () => {
      expect(code("event_link_totals")).toContain(
        "create function public.event_link_totals(p_event_id uuid) returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(grants("event_link_totals")).toContain(
        "revoke all on function public.event_link_totals(uuid) from public, anon, authenticated; grant execute on function public.event_link_totals(uuid) to authenticated;",
      );
    });
  });

  describe("list_guest_rows_by_email: the claim card, paged on its own order", () => {
    it("stays SECURITY DEFINER with an empty search_path", () => {
      expect(code("list_guest_rows_by_email")).toContain(
        "language plpgsql stable security definer set search_path = ''",
      );
    });

    it("pages strictly after (last upload, guest id), ordered with the id as the tiebreak", () => {
      const body = code("list_guest_rows_by_email");
      expect(body).toContain(
        "and (p_after_at is null or (coalesce(m.last_at, g.created_at), g.id) < (p_after_at, p_after_id))",
      );
      expect(body).toContain(
        `order by coalesce(m.last_at, g.created_at) desc, g.id desc ${PAGE}`,
      );
    });

    it("never leaves an overload standing: each file drops the signature it replaces before it creates (PostgREST forbids overloads)", () => {
      // Replayed statement by statement across the set rather than pinned to the file that first
      // did it: the row cap replaced the no-argument signature (20260924020000), and the claims
      // review's previews replaced the three-argument one with itself (20260927200000), because a
      // RETURNS TABLE cannot change in place. A bare create over a standing signature fails to
      // apply; one beside a different signature leaves an overload PostgREST cannot choose between.
      const statement =
        /\b(create (?:or replace )?function|drop function(?: if exists)?) public\.list_guest_rows_by_email ?\(([^)]*)\)/g;
      const typesOf = (list: string, named: boolean) =>
        list
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => (named ? p.split(" ")[1] : p))
          .join(", ");
      const live = new Set<string>();
      for (const { file, sql } of executableMigrations()) {
        for (const [, verb, list] of sql.matchAll(statement)) {
          if (verb.startsWith("drop")) {
            live.delete(typesOf(list, false));
            continue;
          }
          const types = typesOf(list, true);
          const replaces = verb.includes("or replace") && live.has(types);
          expect(
            replaces ? [] : [...live],
            `${file} creates (${types}) beside a standing signature`,
          ).toEqual([]);
          live.add(types);
        }
      }
      expect([...live]).toEqual(["timestamptz, uuid, integer"]);
    });

    it("★ previews a row's own photographs only where its album shows them to anyone: open, approved, live, four at most", () => {
      // The claims review's cards (identity-claims r1, `pass=cards`): the keys of the row's OWN
      // media, never the album's, and nothing from a password or private album (the guest album's
      // `visibility = 'open'` gate) or from an upload the album shows nobody yet (held or hidden).
      const body = code("list_guest_rows_by_email");
      expect(body).toContain(
        "case when e.visibility = 'open' then coalesce(p.keys, '{}'::text[]) end",
      );
      expect(body).toContain(
        "where y.guest_id = g.id and e.visibility = 'open' and y.status = 'approved' and y.removed_at is null and y.preview_key is not null order by y.created_at desc, y.id desc limit 4",
      );
    });
  });

  describe("admin_metrics_snapshot: every metric that came from a whole-table read", () => {
    it("is SECURITY INVOKER, takes the pages' two windows with today's defaults, and refuses a bad one", () => {
      const body = code("admin_metrics_snapshot");
      expect(body).toContain(
        "create function public.admin_metrics_snapshot( p_window_days integer default 30, p_fortnight_days integer default 14 ) returns jsonb language plpgsql stable security invoker set search_path = ''",
      );
      expect(body).toContain("using errcode = 'invalid_parameter_value';");
    });

    it("never counts the operator as a customer, and reads paid the way the JavaScript did", () => {
      const body = code("admin_metrics_snapshot");
      expect(body).toContain("from public.profiles p where not p.is_admin;");
      expect(body).toContain(
        "'paid', count(*) filter (where coalesce(p.stripe_subscription_id, '') <> '')",
      );
      // 24-hour days, as `days * 86_400_000` ms: a calendar-day interval would move across DST.
      expect(body).toContain(
        "v_window_start := v_now - make_interval(hours => 24 * p_window_days);",
      );
    });

    it("is service_role only: anon and authenticated hold no EXECUTE", () => {
      expect(grants("admin_metrics_snapshot")).toContain(
        "revoke all on function public.admin_metrics_snapshot(integer, integer) from public, anon, authenticated; grant execute on function public.admin_metrics_snapshot(integer, integer) to service_role;",
      );
    });
  });

  describe("the sweeps: the legal-hold partition and the standby budget's hosts", () => {
    // The shape is pinned whether a later migration replaces the function or not (20260928140000 did).
    const shape = (name: string) =>
      code(name).replace("create or replace function", "create function");

    // ★ RESHAPED ON PURPOSE (triage-wiring, 2026-09-28; scar kept: ONE uuid[] per candidate set, never a
    // read of held rows). The expired reason: "the events that hold anything" meant a legal hold alone.
    // An operator's removal still inside its window keeps its event too (20260928140000), so a deleted
    // account cannot take the evidence before the runbook preserves it.
    // ★ AND AGAIN (triage-r2-wiring, 2026-09-29; scar kept: ONE uuid[] per candidate set). An open report, an
    // item's or the album's, keeps its event whole too (Will: "an open report protects its item from every
    // permanent delete ... an event's deletion, an account's"), and the report cascades with its event row.
    it("held_event_ids answers ONE uuid[] of the events that hold anything the purge must keep", () => {
      expect(shape("held_event_ids")).toContain(
        "create function public.held_event_ids(p_event_ids uuid[]) returns uuid[] language sql stable security invoker set search_path = '' as $$ select coalesce(array_agg(h.event_id order by h.event_id), '{}'::uuid[]) from ( select m.event_id from public.media m where m.event_id = any(p_event_ids) and ( m.legal_hold_at is not null or (m.status = 'removed' and m.removed_by_admin and m.purge_at > now()) ) union select r.event_id from public.reports r where r.event_id = any(p_event_ids) and r.status = 'open' ) h; $$;",
      );
    });

    // ★ RESHAPED ON PURPOSE (triage-wiring, 2026-09-28; scar kept: exactly the budget's bin). The bin
    // now leaves out an operator's removal too: never the host's, and never evicted inside its window.
    // ★ AND AGAIN (triage-r2-wiring, 2026-09-29): nor a row she asked to delete permanently while a keeper holds
    // it (`purge_asked_at`), which left her Deleted at her press.
    it("★ standby_hosts counts exactly the budget's bin: no system removal, no guest's own withdrawal, no operator's removal, no asked row, no hold", () => {
      expect(shape("standby_hosts")).toContain(
        "where m.legal_hold_at is null and ( (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader and not m.removed_by_admin and m.purge_asked_at is null) or (m.status <> 'removed' and e.deleted_at is not null) )",
      );
    });

    it("standby_hosts pages on host id and lists only hosts with bytes", () => {
      const body = shape("standby_hosts");
      expect(body).toContain(
        "create function public.standby_hosts(p_after uuid default null, p_limit integer default null) returns table (host_id uuid, standby_bytes bigint) language sql stable security invoker set search_path = ''",
      );
      expect(body).toContain(
        `and (p_after is null or e.host_id > p_after) group by e.host_id having sum(m.file_size_bytes) > 0 order by e.host_id ${PAGE}`,
      );
    });

    it("both are service_role only", () => {
      expect(grants("held_event_ids")).toContain(
        "revoke all on function public.held_event_ids(uuid[]) from public, anon, authenticated; grant execute on function public.held_event_ids(uuid[]) to service_role;",
      );
      expect(grants("standby_hosts")).toContain(
        "revoke all on function public.standby_hosts(uuid, integer) from public, anon, authenticated; grant execute on function public.standby_hosts(uuid, integer) to service_role;",
      );
    });
  });

  it("no function of the round is executable by anon but the album", () => {
    const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
    for (const signature of [
      "public.get_event_like_counts(uuid, uuid, integer)",
      "public.my_liked_media_ids(uuid[])",
      "public.event_card_stats(uuid[])",
      "public.event_covers(uuid[])",
      "public.event_link_totals(uuid)",
      "public.list_guest_rows_by_email(timestamptz, uuid, integer)",
      "public.admin_metrics_snapshot(integer, integer)",
      "public.held_event_ids(uuid[])",
      "public.standby_hosts(uuid, integer)",
    ]) {
      expect(sql).not.toMatch(
        new RegExp(
          `grant execute on function ${signature.replace(/[()[\]]/g, "\\$&")} to [^;]*\\banon\\b`,
        ),
      );
    }
  });
});

describe("the live reel: the expand (20260924100000) and the drop (20260924110000)", () => {
  // Will, 2026-09-22: the reel is a live montage each viewer's device composes from the album, never
  // stored ("we never have to deal with reel storage files"); a CUT is a clip anyone renders on a
  // device, and a paid event can save one to its album. The expand lands that data model beside the
  // stored reel and is applied before the wiring; the drop removes the stored reel after the wiring's
  // red-team, on Will's yes. Each pin reads CODE (comments stripped), so a comment that names a
  // clause can never stand in for it.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));
  const executableOf = (file: string) =>
    collapse(
      readFileSync(join(MIGRATIONS_DIR, file), "utf8").replace(/--[^\n]*/g, ""),
    );
  const EXPAND = "20260924100000_live_reel_expand.sql";
  const DROP = "20260924110000_live_reel_drop.sql";
  const expand = executableOf(EXPAND);
  const drop = executableOf(DROP);

  describe("events: the host's default mood and the off switch", () => {
    it("adds reel_style_id with no default and show_reel default on", () => {
      expect(expand).toContain(
        "alter table public.events add column reel_style_id text, add column show_reel boolean not null default true;",
      );
    });

    it("never puts a CHECK or an enum on reel_style_id: a new mood needs no migration", () => {
      const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
      expect(sql).not.toMatch(/check \([^)]*\breel_style_id\b/);
      expect(sql).not.toMatch(/\breel_style_id public\./);
    });

    it("the host writes both by a bare additive column grant, and the file revokes nothing on events", () => {
      expect(expand).toContain(
        "grant insert (show_reel, reel_style_id), update (show_reel, reel_style_id) on public.events to authenticated;",
      );
      // ★ A table-level revoke cascades to every column grant on events and takes the host app
      // down (database-security.md, Gotchas): adding a column is the bare grant and nothing else.
      expect(expand).not.toMatch(/revoke [^;]* on (?:table )?public\.events\b/);
      expect(expand).not.toMatch(
        /grant [^;]* on public\.events to [^;]*\banon\b/,
      );
    });
  });

  describe("media.reel_eligible: plays in the live reel", () => {
    it("defaults true, then backfills every existing row with its two writing triggers paused around the one statement", () => {
      const steps = [
        "alter table public.media alter column reel_eligible set default true;",
        "alter table public.media disable trigger media_set_updated_at, disable trigger media_set_purge_at;",
        "update public.media set reel_eligible = true where not reel_eligible;",
        "alter table public.media enable trigger media_set_updated_at, enable trigger media_set_purge_at;",
      ].map((statement) => expand.indexOf(statement));
      expect(steps.every((at) => at > -1)).toBe(true);
      expect([...steps].sort((a, b) => a - b)).toEqual(steps);
      // The backfill is the file's one media update, and it writes reel_eligible alone: with
      // media_set_updated_at on, every row's updated_at (the gallery ETag's key) would move.
      expect(expand.match(/update public\.media set /g)).toHaveLength(1);
    });

    it("no migration leaves a trigger it paused disabled", () => {
      for (const { file, sql } of executableMigrations()) {
        for (const [, name] of sql.matchAll(/disable trigger ([a-z_]+)/g)) {
          expect(
            sql.split(`enable trigger ${name}`).length,
            `${file}: ${name} is disabled and never re-enabled`,
          ).toBe(sql.split(`disable trigger ${name}`).length);
        }
      }
    });

    it("stays write-once: no client role may update it, and the host still reads it", () => {
      const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
      expect(sql).not.toMatch(
        /grant [^;]*update \([^)]*\breel_eligible\b[^)]*\) on public\.media/,
      );
      expect(sql).toContain(
        "reel_eligible, highlight_score, clip_start_seconds, clip_end_seconds ) on public.media to authenticated;",
      );
    });
  });

  // ★ RESHAPED ON PURPOSE (take-home-wiring, 20261003110000; scar kept: every earlier parameter by name with
  // p_reel_eligible defaulting to true, every guard, the insert's columns in their order, service role only). The
  // phone-size copy's two defaulted arguments now follow p_reel_eligible, its two columns end the insert, and its file
  // (a DROP and CREATE) is the one that restates the grants, for the signature with the pair.
  describe("create_media and create_media_as_host: p_reel_eligible, last, every guard kept", () => {
    const shapes = {
      create_media: {
        params:
          "p_session_token text, p_media_id uuid, p_type public.media_type, p_original_key text, p_file_size_bytes bigint, p_preview_key text default null, p_duration_seconds double precision default null, p_width integer default null, p_height integer default null, p_reel_eligible boolean default true, p_phone_key text default null, p_phone_bytes bigint default null",
        before:
          "text, uuid, public.media_type, text, bigint, text, double precision, integer, integer",
        guest: "v_guest.id",
        guards: [
          "if not found then raise exception 'Invalid guest session.' using errcode = 'no_data_found'; end if;",
          "if v_event.deleted_at is not null then raise exception 'This event no longer exists.'",
          "if not v_event.accepting_uploads then raise exception 'This event is not accepting uploads.'",
          "if v_event.require_verified_email and v_guest.verified_at is null then raise exception 'This event is not accepting uploads without a verified email.'",
          "if v_event.max_upload_bytes is not null and p_file_size_bytes > v_event.max_upload_bytes then raise exception",
          "when v_event.moderation_mode = 'live' then 'approved'::public.media_status else 'pending'::public.media_status",
        ],
      },
      create_media_as_host: {
        params:
          "p_host_id uuid, p_event_id uuid, p_media_id uuid, p_type public.media_type, p_original_key text, p_file_size_bytes bigint, p_preview_key text default null, p_duration_seconds double precision default null, p_width integer default null, p_height integer default null, p_reel_eligible boolean default true, p_phone_key text default null, p_phone_bytes bigint default null",
        before:
          "uuid, uuid, uuid, public.media_type, text, bigint, text, double precision, integer, integer",
        guest: "null",
        guards: [
          "where id = p_event_id and host_id = p_host_id and deleted_at is null; if not found then raise exception 'Event not found or not owned by you.'",
          "v_status public.media_status := 'approved'::public.media_status;",
        ],
      },
    } as const;
    // Both paths: the key binding, the ceiling, QA #17's lock, the paid-only video gate (which is
    // what keeps a saved cut to a paid event), the ingress meter and the storage cap. ★ Reshaped by
    // trash-in-storage (20261003220000; scar kept: the cap and its 10% bind every upload, refused in
    // the same words): the cap holds everything she keeps, her Deleted included, read off the one
    // summary, and with her setting on Deleted makes room for a file that fits beside her albums. ★ And by
    // Ladder A (20261004100000; scar kept: the uploads line binds every upload, refused under "limit"): the
    // allowance is her plan's own number over its window, a month or a pass's year. ★ And by billing-integrity
    // (20261005181000; same scar): the line is one call, `uploads_refused`, a lapsed pass included.
    const shared = [
      "if p_original_key not like 'events/' || v_event.id::text || '/%' then raise exception 'Object key does not belong to this event.'",
      "if p_preview_key is not null and p_preview_key not like 'events/' || v_event.id::text || '/%' then raise exception 'Preview key does not belong to this event.'",
      "if p_file_size_bytes > c_max_upload_bytes then raise exception 'File exceeds the 10 GB maximum.'",
      "from public.profiles where id = v_event.host_id for update;",
      "if p_type = 'video' and v_profile.tier = 'free' then raise exception 'Video uploads are available on paid plans.'",
      "if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then raise exception 'Upload limit reached for this plan.'",
      "select s.active_bytes, s.standby_bytes into v_active, v_deleted from public.host_storage_summary(v_event.host_id) s;",
      "and v_profile.make_room_from_deleted and v_active + p_file_size_bytes <= v_cap + (v_cap / 10) then perform public.leave_deleted(v_event.host_id, v_active + v_deleted + p_file_size_bytes - (v_cap + (v_cap / 10)), true);",
      "if v_active + v_deleted + p_file_size_bytes > v_cap + (v_cap / 10) then raise exception 'Storage capacity exceeded for this plan.'",
    ];

    for (const [name, shape] of Object.entries(shapes)) {
      const after = `${shape.before}, boolean, text, bigint`;

      it(`${name}: every earlier parameter by name, then p_reel_eligible defaulting to true`, () => {
        // PostgREST resolves by argument names, so the deployed calls (without the new one) still
        // land here, and the default makes what they upload play in the live reel. ★ Reshaped by
        // the per-event block (20260928120000), which replaces create_media IN PLACE (`create or
        // replace`, the signature untouched): the pin holds the signature, whichever form wins.
        expect(code(name)).toMatch(
          new RegExp(
            `create (or replace )?function public\\.${name}\\( ${shape.params.replace(/[()[\].]/g, "\\$&")} \\) returns jsonb language plpgsql security definer set search_path`,
          ),
        );
      });

      it(`${name}: keeps every guard of its last definition`, () => {
        for (const guard of [...shared, ...shape.guards]) {
          expect(code(name), guard).toContain(guard);
        }
      });

      // ★ Reshaped by disposable-foundation (20261002200000): the insert also writes the seal it decided
      // (`v_sealed_until`, the album's develop time while it is ahead, else null), last; every earlier
      // column and value where it was.
      it(`${name}: writes reel_eligible, and an explicit null reads as the default`, () => {
        expect(code(name)).toContain(
          `insert into public.media ( id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds, width, height, status, reel_eligible, sealed_until, phone_key, phone_bytes ) values ( p_media_id, v_event.id, ${shape.guest}, p_type, p_original_key, p_preview_key, p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status, coalesce(p_reel_eligible, true), v_sealed_until, p_phone_key, p_phone_bytes );`,
        );
      });

      it(`${name}: replaces its one signature in the same file and stays service-role only`, () => {
        // ★ Reshaped by the per-event block (20260928120000): the drop-before-create is the EXPAND's
        // own fact, so it reads the expand's file; a later in-place replace (create_media's, there)
        // drops nothing. The grants still read the winning file, which must restate them.
        const dropped = expand.indexOf(
          `drop function public.${name}(${shape.before});`,
        );
        expect(dropped).toBeGreaterThan(-1);
        expect(dropped).toBeLessThan(
          expand.indexOf(`create function public.${name}(`),
        );
        const file = grants(name);
        expect(file).toContain(
          `revoke execute on function public.${name}(${after}) from public, anon, authenticated;`,
        );
        expect(file).toContain(
          `grant execute on function public.${name}(${after}) to service_role;`,
        );
        expect(collapse(allMigrations().replace(/--[^\n]*/g, ""))).not.toMatch(
          new RegExp(
            `grant execute on function public\\.${name}\\(${after.replace(/[()[\]]/g, "\\$&")}\\) to [^;]*\\b(?:anon|authenticated|public)\\b`,
          ),
        );
      });
    }

    it("the host's per-event cap still binds guests only", () => {
      expect(code("create_media_as_host")).not.toContain(
        "v_event.max_upload_bytes",
      );
    });
  });

  describe("the guest reads carry the new keys", () => {
    it("get_event_media_by_qr_token returns reel_eligible, last, off the row", () => {
      expect(code("get_event_media_by_qr_token")).toContain(
        "select m.id, m.type, m.original_key, m.preview_key, m.width, m.height, m.duration_seconds, m.created_at, m.reel_eligible from public.media m",
      );
    });

    it("get_event_media_by_qr_token keeps anon, authenticated and service_role, never PUBLIC", () => {
      const file = grants("get_event_media_by_qr_token");
      expect(file).toContain(
        "revoke all on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) from public;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_media_by_qr_token(text, timestamptz, uuid, integer) to service_role;",
      );
    });

    it("get_event_by_qr_token returns show_reel and reel_style_id unredacted, after the host's name", () => {
      // Presentation settings like qr_style, never the identifying metadata QA #40 withholds (the
      // redaction itself is pinned above, latest-wins). They were the last columns until the reel
      // defaults (20260925100000) appended the hold after them; that tail is pinned there.
      const body = code("get_event_by_qr_token");
      expect(body).toContain(
        "custom_slug text, host_display_name text, show_reel boolean, reel_style_id text,",
      );
      expect(body).toContain(
        "case when r.hide_meta then null else p.display_name end, e.show_reel, e.reel_style_id,",
      );
    });

    it("get_event_by_qr_token restates its ACL: the client roles and service_role, PUBLIC revoked by name", () => {
      // ★ Reshaped by the doors (20260929120000). This read "the client roles, PUBLIC and
      // service_role": the recreates carried PUBLIC's EXECUTE along, which ROADMAP's security line
      // named; a fresh CREATE starts from the default privileges, so PUBLIC is revoked by name and
      // only the roles that call it are granted.
      const file = grants("get_event_by_qr_token");
      expect(file).toContain(
        "revoke all on function public.get_event_by_qr_token(text) from public;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
      );
      expect(file).not.toContain(
        "grant execute on function public.get_event_by_qr_token(text) to public",
      );
    });
  });

  describe("the platform lever", () => {
    it("seeds live_reel_enabled on, beside reel_render_enabled, which only the drop deletes", () => {
      expect(expand).toContain(
        "insert into public.ops_flags (key, enabled) values ('live_reel_enabled', true) on conflict (key) do nothing;",
      );
      expect(expand).not.toContain("reel_render_enabled");
      expect(drop).not.toContain("live_reel_enabled");
    });
  });

  describe("the drop removes exactly the stored reel", () => {
    const statements = [
      "drop function if exists public.get_event_reel_by_qr_token(text);",
      "drop function if exists public.set_reel_guest_visible(uuid, boolean);",
      "drop function if exists public.upsert_reel_config(uuid, text, text, bigint, integer, uuid);",
      "drop function if exists public.reorder_reel(uuid, uuid[]);",
      "drop function if exists public.add_to_reel(uuid);",
      "drop table if exists public.reel_items;",
      "drop table if exists public.reel_render_log;",
      "drop table if exists public.highlight_reels;",
      "drop type if exists public.reel_status;",
      "alter table public.notification_prefs drop column if exists notify_reel_ready;",
      "delete from public.ops_flags where key = 'reel_render_enabled';",
    ];

    it("runs its list and nothing else, in dependency order, with no cascade", () => {
      // The functions before the tables their bodies read, the tables before the enum their
      // column holds, then the preference and the flag. A cascade would hide a dependent the
      // inventory missed; a plain drop fails loudly on one instead.
      const executed = drop
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `${s};`);
      expect(executed).toEqual(statements);
      expect(drop).not.toMatch(/\bcascade\b/);
    });

    it("never touches reel_eligible, tier_limits or anything the expand added", () => {
      for (const kept of [
        "reel_eligible",
        "tier_limits",
        "max_reel_seconds",
        "show_reel",
        "reel_style_id",
        "live_reel_enabled",
        "public.media",
        "public.events",
      ]) {
        expect(drop, kept).not.toContain(kept);
      }
    });

    it("carries its apply gate in its header", () => {
      expect(readFileSync(join(MIGRATIONS_DIR, DROP), "utf8")).toContain(
        "APPLY ONLY after the live-reel wiring's alias build is red-teamed, on Will's yes (destructive)",
      );
    });

    it("nothing later in the set brings a dropped object back", () => {
      const sql = collapse(allMigrations().replace(/--[^\n]*/g, ""));
      const after = sql.slice(
        sql.lastIndexOf(statements[statements.length - 1]),
      );
      for (const revival of [
        /create (?:or replace )?function public\.(?:get_event_reel_by_qr_token|set_reel_guest_visible|upsert_reel_config|reorder_reel|add_to_reel)\(/,
        /create table (?:if not exists )?public\.(?:reel_items|reel_render_log|highlight_reels)\b/,
        /create type public\.reel_status\b/,
        /add column (?:if not exists )?notify_reel_ready\b/,
        /'reel_render_enabled'/,
      ]) {
        expect(
          after.slice(statements[statements.length - 1].length),
        ).not.toMatch(revival);
      }
    });
  });

  it("leaves highlight_score, the clip columns and max_reel_seconds to a later change", () => {
    // They sat in the host's column-scoped SELECT grant and MEDIA_HOST_COLUMNS, where a stale list is
    // a runtime 400 on every host read, so the list let go first and the schema pass's contract
    // (20260929170000) drops them; max_reel_seconds is the cut's length cap now.
    for (const sql of [expand, drop]) {
      for (const kept of [
        "highlight_score",
        "clip_start_seconds",
        "clip_end_seconds",
        "max_reel_seconds",
      ]) {
        expect(sql).not.toContain(kept);
      }
    }
  });
});

describe("the host's reel defaults (20260925100000)", () => {
  // Will, reel-host round 1 (2026-09-25): `style=both`, the reel's look and hold set for everyone
  // from the view and from Settings, and `pulse`, the dashboard cards crossfading through their
  // stills. Each pin reads CODE (comments stripped), so a comment that names a clause can never
  // stand in for it.
  const FILE = "20260925100000_reel_host_defaults.sql";
  const executableOf = (file: string) =>
    collapse(
      readFileSync(join(MIGRATIONS_DIR, file), "utf8").replace(/--[^\n]*/g, ""),
    );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));
  /** One file's own definition of a function, from `create` to its closing dollar-quote. */
  const definitionIn = (file: string, name: string) => {
    const sql = executableOf(file);
    const start = sql.indexOf(`create function public.${name}(`);
    expect(start, `${file} defines no ${name}`).toBeGreaterThan(-1);
    const tag = sql.slice(start).match(/ as (\$[a-z_]*\$)/)![1];
    const open = sql.indexOf(` as ${tag}`, start) + ` as ${tag}`.length;
    return sql.slice(start, sql.indexOf(`${tag};`, open) + tag.length + 1);
  };
  const sql = executableOf(FILE);

  describe("events.reel_hold_sec: the host's default hold", () => {
    it("adds a nullable numeric with no default, inside the envelope", () => {
      // NULL is the default hold; the app validates the steps, the CHECK only refuses a flicker, a
      // stall, NaN and Infinity (NaN sorts above every number, so the upper bound is load-bearing).
      expect(sql).toContain(
        "alter table public.events add column reel_hold_sec numeric constraint events_reel_hold_sec_range check (reel_hold_sec is null or (reel_hold_sec >= 0.5 and reel_hold_sec <= 30));",
      );
      expect(sql).toContain("comment on column public.events.reel_hold_sec is");
    });

    it("the host writes it by a bare additive column grant, and the file revokes nothing on events", () => {
      expect(sql).toContain(
        "grant insert (reel_hold_sec), update (reel_hold_sec) on public.events to authenticated;",
      );
      // ★ A table-level revoke cascades to every column grant on events and takes the host app
      // down (database-security.md, Gotchas).
      expect(sql).not.toMatch(/revoke [^;]* on (?:table )?public\.events\b/);
      expect(sql).not.toMatch(/grant [^;]* on public\.events to [^;]*\banon\b/);
    });
  });

  describe("get_event_by_qr_token: the hold, last and unredacted", () => {
    it("is the expand's definition with only the hold appended (QA #40 and `limit 1` verbatim)", () => {
      // Every other character is carried, so the redaction, the slug path and the one-row limit
      // cannot drift in a recreate that was only meant to grow the RETURNS TABLE.
      const carried = definitionIn(
        "20260924100000_live_reel_expand.sql",
        "get_event_by_qr_token",
      )
        .replace(
          "show_reel boolean, reel_style_id text)",
          "show_reel boolean, reel_style_id text, reel_hold_sec numeric)",
        )
        .replace(
          "e.show_reel, e.reel_style_id from",
          "e.show_reel, e.reel_style_id, e.reel_hold_sec from",
        );
      // ★ Reshaped by the per-event block (20260928120000), which masks the event's visibility for a
      // blocked caller: the carry is THIS file's fact, so it reads this file's own definition; what
      // must survive later replacements (the hold last, QA #40, `limit 1`) is pinned below and with
      // the block's guards.
      expect(definitionIn(FILE, "get_event_by_qr_token")).toBe(carried);
      expect(sql).toContain("reel_hold_sec");
    });

    it("returns the hold after the reel's two settings, as a SECURITY DEFINER read with an empty search_path", () => {
      // ★ Reshaped by the doors (20260929120000), which append the guest picker's flag
      // (`accepts_video`) after the hold, by the host's cap (20261001233000, crumbs-43), which
      // appends `max_upload_bytes` after the flag, by disposable-foundation (20261002200000), which appends
      // whether a develop is due, the develop time, the capture and the roll's size after the cap, and by event-dates
      // (20261003120000), which appends a range's last day after the roll: the hold still follows the reel's two
      // settings, and nothing but those comes after it (the later columns' own pins: guest-cap-and-faces-guards.test.ts,
      // src/lib/disposable/migration-guards.test.ts and src/lib/events/event-dates.test.ts).
      const body = code("get_event_by_qr_token");
      expect(body).toContain(
        "show_reel boolean, reel_style_id text, reel_hold_sec numeric, accepts_video boolean, max_upload_bytes bigint, develop_due boolean, develops_at timestamptz, capture text, roll_size integer, event_end_date date) language sql stable security definer set search_path to ''",
      );
      expect(body).toContain(
        "e.show_reel, e.reel_style_id, e.reel_hold_sec, (e.allow_videos and coalesce(p.tier <> 'free', false)), e.max_upload_bytes, public.seal_disagrees(e), e.develops_at, e.capture, e.roll_size, case when r.hide_meta then null else e.event_end_date end from public.events e",
      );
      expect(body).toContain(
        "order by (e.qr_token = p_qr_token) desc limit 1;",
      );
    });

    it("drops the old signature first and restates the ACL (the client roles and service_role, PUBLIC revoked)", () => {
      // ★ The drop-before-create is this file's (reshaped with the carry above); the ACL is restated
      // by whichever file wins, the in-place replace too.
      const dropped = sql.indexOf(
        "drop function public.get_event_by_qr_token(text);",
      );
      expect(dropped).toBeGreaterThan(-1);
      expect(dropped).toBeLessThan(
        sql.indexOf("create function public.get_event_by_qr_token("),
      );
      const file = grants("get_event_by_qr_token");
      // ★ Reshaped by the doors (20260929120000), which narrowed the ACL (the test above says why).
      expect(file).toContain(
        "revoke all on function public.get_event_by_qr_token(text) from public;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
      );
    });
  });

  describe("event_stills: the dashboard cards' stills, one jsonb", () => {
    // ★ Reshaped by disposable-foundation (20261002200000), which carries the body in place (`create or replace`) with
    // the seal's one predicate after the stills' own four conditions: the pins read the shape, never the verb.
    it("is SECURITY INVOKER with an empty search_path and answers one jsonb (the row cap cannot cut it)", () => {
      expect(code("event_stills")).toContain(
        "function public.event_stills(p_event_ids uuid[], p_per_event integer) returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(code("event_stills")).not.toContain("security definer");
    });

    it("answers the newest approved, previewed photos outside the bin, clamped to 12 an event", () => {
      const body = code("event_stills");
      expect(body).toContain(
        "select coalesce(jsonb_object_agg(e.id::text, s.preview_keys), '{}'::jsonb) from public.events e cross join lateral",
      );
      expect(body).toContain(
        "jsonb_agg(newest.preview_key order by newest.created_at desc, newest.id desc) as preview_keys",
      );
      // ★ A null or non-positive N answers nothing: `greatest` ignores the null, so the limit is 0,
      // never the unbounded read a null p_limit means on a paged function.
      expect(body).toContain(
        "where m.event_id = e.id and m.status = 'approved' and m.type = 'photo' and m.removed_at is null and m.preview_key is not null and (m.sealed_until is null or m.sealed_until <= now() or e.host_id = (select auth.uid())) order by m.created_at desc, m.id desc limit least(greatest(p_per_event, 0), 12)",
      );
      // An event with no previewed photo is absent; the ids are the caller's, scoped by RLS.
      expect(body).toContain(
        "where e.id = any(p_event_ids) and s.preview_keys is not null;",
      );
    });

    it("reads only media columns the host's SELECT grant holds (an invoker read of any other errors)", () => {
      // The grant, replayed statement by statement: a table-level revoke empties it, a column-level
      // grant adds its columns (database-security.md: SELECT on media is column-scoped).
      let granted = new Set<string>();
      const statement =
        /\b(grant|revoke) ([a-z_, ]+?)(?: \(([^)]*)\))? on (?:table )?([^;]*?) (?:to|from) ([^;]*);/g;
      for (const { sql: each } of executableMigrations()) {
        for (const [
          ,
          verb,
          privileges,
          named,
          objects,
          grantees,
        ] of each.matchAll(statement)) {
          if (!/(?:^|[\s,])public\.media(?=$|[\s,])/.test(objects)) continue;
          if (!grantees.split(",").some((g) => g.trim() === "authenticated"))
            continue;
          const privs = privileges.split(",").map((p) => p.trim());
          if (
            !privs.some((p) => ["select", "all", "all privileges"].includes(p))
          )
            continue;
          const cols = named?.split(",").map((c) => c.trim());
          if (verb === "revoke") {
            if (cols) cols.forEach((c) => granted.delete(c));
            else granted = new Set();
          } else {
            (cols ?? ["*"]).forEach((c) => granted.add(c));
          }
        }
      }
      expect(granted.has("*")).toBe(false);
      const read = [
        ...new Set(
          [...code("event_stills").matchAll(/\bm\.([a-z_]+)/g)].map(
            ([, c]) => c,
          ),
        ),
      ];
      expect(read.length).toBeGreaterThan(0);
      for (const column of read) expect(granted, column).toContain(column);
    });

    it("is authenticated-only: every client role revoked, then one grant, and never anon anywhere", () => {
      expect(grants("event_stills")).toContain(
        "revoke all on function public.event_stills(uuid[], integer) from public, anon, authenticated; grant execute on function public.event_stills(uuid[], integer) to authenticated;",
      );
      expect(collapse(allMigrations().replace(/--[^\n]*/g, ""))).not.toMatch(
        /grant execute on function public\.event_stills\(uuid\[\], integer\) to [^;]*\b(?:anon|public)\b/,
      );
    });
  });
});

describe("the paged album's version and change log (20260926100000)", () => {
  // The lock-order rule (database-security.md, Grants): an album row is always a transaction's LAST
  // lock, taken at COMMIT by the deferred stamps, every event of the transaction in event-id order.
  // Each pin reads CODE (comments stripped), latest-wins across the set, so a later file that replaces
  // a body, moves a write mid-transaction or grants a client role fails here.
  const FILE = "20260926100000_album_version.sql";
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const everything = () => collapse(allMigrations().replace(/--[^\n]*/g, ""));
  const fileSql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const FUNCTIONS = [
    "album_scope(public.media_status, public.media_status)",
    "album_remember(text, uuid)",
    "album_flush()",
    "album_note_media()",
    "album_stamp_media()",
    "album_note_guest()",
    "album_note_profile()",
    "album_flush_trigger()",
    "album_changes_since(uuid, text, bigint, integer)",
  ];

  describe("the tables: deny-all, read by the service role alone", () => {
    it("album_state hangs off events and album_changes off album_state, both cascading", () => {
      expect(fileSql).toContain(
        "create table public.album_state ( event_id uuid primary key references public.events (id) on delete cascade, version bigint not null default 0, album_max bigint not null default 0, attr_version bigint not null default 0, updated_at timestamptz not null default now() );",
      );
      // No foreign key to media: a purged item's row is its tombstone, how a client learns it left.
      expect(fileSql).toContain(
        "create table public.album_changes ( event_id uuid not null references public.album_state (event_id) on delete cascade, media_id uuid not null, host_version bigint not null, album_version bigint, primary key (event_id, media_id) );",
      );
    });

    it("both are RLS-on with no policy, revoked from every role and read by service_role only", () => {
      expect(fileSql).toContain(
        "alter table public.album_state enable row level security; alter table public.album_changes enable row level security;",
      );
      expect(fileSql).toContain(
        "revoke all on table public.album_state, public.album_changes from public, anon, authenticated, service_role; grant select on table public.album_state, public.album_changes to service_role;",
      );
      const sql = everything();
      expect(sql).not.toMatch(
        /create policy [^;]* on public\.album_(state|changes)\b/,
      );
      expect(sql).not.toMatch(
        /grant [^;]* on (?:table )?[^;]*public\.album_(state|changes)\b[^;]* to [^;]*\b(anon|authenticated|public)\b/,
      );
      expect(sql).not.toMatch(
        /grant (?:all|insert|update|delete)[^;]* on (?:table )?[^;]*public\.album_(state|changes)\b/,
      );
    });

    it("every event starts with a row; the change log starts empty", () => {
      expect(fileSql).toContain(
        "insert into public.album_state (event_id) select e.id from public.events e on conflict (event_id) do nothing;",
      );
      expect(fileSql).not.toMatch(
        /insert into public\.album_changes[^;]* select [^;]* from public\.media/,
      );
    });
  });

  describe("the functions: nine, pinned, never a client role's", () => {
    it("each pins an empty search_path", () => {
      for (const signature of FUNCTIONS) {
        const name = signature.slice(0, signature.indexOf("("));
        expect(code(name), name).toMatch(/ set search_path = '' as \$\$/);
      }
    });

    it("each revokes EXECUTE from public, anon and authenticated; only the reader is granted, to service_role", () => {
      for (const signature of FUNCTIONS) {
        expect(fileSql, signature).toContain(
          `revoke all on function public.${signature} from public, anon, authenticated;`,
        );
      }
      expect(fileSql).toContain(
        "grant execute on function public.album_changes_since(uuid, text, bigint, integer) to service_role;",
      );
      expect(everything()).not.toMatch(
        /grant execute on function public\.album_[a-z_]+\([^)]*\) to [^;]*\b(anon|authenticated|public)\b/,
      );
    });

    it("the writers are SECURITY DEFINER, the reader and the helpers INVOKER", () => {
      for (const name of [
        "album_flush",
        "album_note_media",
        "album_stamp_media",
        "album_note_guest",
        "album_note_profile",
        "album_flush_trigger",
      ]) {
        expect(code(name), name).toContain(
          " security definer set search_path = ''",
        );
      }
      expect(code("album_changes_since")).toContain(
        " returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(code("album_remember")).toContain(
        " security invoker set search_path = ''",
      );
      expect(code("album_scope")).toContain(
        " language sql immutable set search_path = ''",
      );
    });
  });

  describe("the lock-order rule: the album row is every transaction's last lock", () => {
    it("the stamps are DEFERRABLE INITIALLY DEFERRED constraint triggers; the notes are plain", () => {
      expect(fileSql).toContain(
        "create trigger media_album_note after insert or update of status or delete on public.media for each row execute function public.album_note_media();",
      );
      expect(fileSql).toContain(
        "create constraint trigger media_album_stamp after insert or update of status or delete on public.media deferrable initially deferred for each row execute function public.album_stamp_media();",
      );
      for (const table of ["guests", "profiles"]) {
        expect(fileSql).toMatch(
          new RegExp(
            `create trigger ${table}_album_note after update of [^;]* on public\\.${table} for each row when \\([^;]*\\) execute function public\\.album_note_${table === "guests" ? "guest" : "profile"}\\(\\);`,
          ),
        );
        expect(fileSql).toMatch(
          new RegExp(
            `create constraint trigger ${table}_album_stamp after update of [^;]* on public\\.${table} deferrable initially deferred for each row when \\([^;]*\\) execute function public\\.album_flush_trigger\\(\\);`,
          ),
        );
      }
    });

    it("each table's note sorts before its stamp BY NAME (both fire at a statement's end in name order under set constraints all immediate)", () => {
      for (const table of ["media", "guests", "profiles"]) {
        expect(`${table}_album_note` < `${table}_album_stamp`).toBe(true);
      }
    });

    it("the notes touch no table: an event id into a transaction-local setting, nothing else", () => {
      for (const name of ["album_note_media", "album_remember"]) {
        expect(code(name), name).not.toMatch(
          /\b(insert into|update public\.|delete from)\b/,
        );
      }
      expect(code("album_remember")).toContain(
        "perform pg_catalog.set_config(v_key, v_set || p_event_id::text || ',', true);",
      );
    });

    it("the flush bumps every noted event once, one upsert each, in event-id order, skipping a vanished event", () => {
      const flush = code("album_flush");
      expect(flush).toContain(
        "for v_event in select x.id from unnest(v_host || v_album || v_attr) as x(id) where exists (select 1 from public.events e where e.id = x.id) group by x.id order by x.id loop insert into public.album_state as s",
      );
      expect(flush).toContain(
        "on conflict (event_id) do update set version = s.version + excluded.version, album_max = s.album_max + excluded.album_max, attr_version = s.attr_version + excluded.attr_version, updated_at = now(); end loop;",
      );
      // Where the last flush stopped, so a set that grew is flushed from there and never twice.
      expect(flush).toContain(
        "if length(v_h) = v_fh and length(v_a) = v_fa and length(v_t) = v_ft then return; end if;",
      );
    });

    it("the media stamp flushes before it writes, and writes the change at its event's new versions", () => {
      const stamp = code("album_stamp_media");
      const flush = stamp.indexOf("perform public.album_flush();");
      const write = stamp.indexOf("insert into public.album_changes as c");
      expect(flush).toBeGreaterThan(-1);
      expect(write).toBeGreaterThan(flush);
      expect(stamp).toContain(
        "select v_event, v_media, s.version, case when v_scope & 2 = 2 then s.album_max end from public.album_state s where s.event_id = v_event on conflict (event_id, media_id) do update set host_version = excluded.host_version, album_version = coalesce(excluded.album_version, c.album_version);",
      );
    });

    // ★ RESHAPED ON PURPOSE (crumbs-37, 2026-10-01; scar kept: no writer outside this list, and no writer that
    // takes an album row out of order). The expired reason: "only the flush and the stamp" held while the log
    // was never pruned. The album-log sweep's prune (20261001150000) joins them; it takes the album's version
    // row first, as the flush does, which `upkeep-migrations.test.ts` pins.
    it("nothing but the flush, the media stamp and the log's prune ever writes an album table (the backfill aside)", () => {
      const writers = new Set<string>();
      const fn = /create (?:or replace )?function public\.([a-z_0-9]+)\(/g;
      for (const { sql } of executableMigrations()) {
        const starts = [...sql.matchAll(fn)];
        starts.forEach((m, i) => {
          const body = sql.slice(m.index, starts[i + 1]?.index ?? sql.length);
          if (
            /\b(insert into|update|delete from) public\.album_(state|changes)\b/.test(
              body,
            )
          ) {
            writers.add(m[1]);
          }
        });
      }
      expect([...writers].sort()).toEqual([
        "album_flush",
        "album_prune_tombstones",
        "album_stamp_media",
      ]);
    });
  });

  describe("the scopes: only what a viewer can see moves a version", () => {
    it("album_scope: 1 for the host's scope, +2 across approved, 0 for a move inside the bin or no move", () => {
      expect(code("album_scope")).toContain(
        "select case when p_was is not distinct from p_is then 0 when coalesce(p_was, 'removed') = 'removed' and coalesce(p_is, 'removed') = 'removed' then 0 else 1 + case when (p_was is not distinct from 'approved') <> (p_is is not distinct from 'approved') then 2 else 0 end end;",
      );
    });

    it("a guest row moves attribution only with a live upload; a profile moves its hosted events and its verified-guest ones", () => {
      expect(code("album_note_guest")).toContain(
        "if exists ( select 1 from public.media m where m.guest_id = new.id and m.status <> 'removed' ) then perform public.album_remember('t', new.event_id);",
      );
      expect(code("album_note_profile")).toContain(
        "select e.id from public.events e where e.host_id = new.id union select g.event_id from public.guests g where g.user_id = new.id and g.verified_at is not null and exists ( select 1 from public.media m where m.guest_id = g.id and m.status <> 'removed' )",
      );
    });
  });

  describe("album_changes_since: one jsonb, one snapshot", () => {
    it("keysets each scope on its own version, clamped to 1,000, a null limit reading all", () => {
      const reader = code("album_changes_since");
      for (const scope of ["host", "album"]) {
        const column = scope === "host" ? "host_version" : "album_version";
        expect(reader).toContain(
          `where p_scope = '${scope}' and ch.event_id = p_event_id and ch.${column} > p_after order by ch.${column}, ch.media_id limit case when p_limit is null then null else least(p_limit, 1000) end)`,
        );
      }
    });

    it("hands the guest scope no guest_id and no moderation counts", () => {
      const reader = code("album_changes_since");
      expect(reader).toContain(
        "case when p_scope = 'host' then m.guest_id end",
      );
      expect(reader).toContain(
        "'hidden', case when p_scope = 'host' then ( select count(*) from public.media m where m.event_id = p_event_id and m.status = 'hidden') end",
      );
      expect(reader).toContain(
        "'pending', case when p_scope = 'host' then ( select count(*) from public.media m where m.event_id = p_event_id and m.status = 'pending') end",
      );
    });

    it("carries created_at as whole microseconds, the manifest's `t`", () => {
      expect(code("album_changes_since")).toContain(
        "(extract(epoch from m.created_at) * 1000000)::bigint",
      );
    });
  });
});

describe("the per-event block and the always-on guest list (20260928120000)", () => {
  // Will, event-safety r1 (2026-09-28): a block is "Out, uploads removed", per event, the host's to make
  // and undo; the person meets the private album's door ("Sneaky block") on every path, re-checked per
  // request; it keys on the account, a confirmed address or the guest row, never a device or an IP. And
  // `room=always`: the guest list is always on. Each pin reads CODE (comments stripped), and each grant
  // the defining file's executable SQL, so a comment can never stand in for a clause.
  const FILE = "20260928120000_event_blocks.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));

  describe("public.event_blocks: the keys, RLS on, the host's own events only", () => {
    it("keys on the account, a confirmed address or the row, with no foreign key but the event's", () => {
      const table = sql.slice(
        sql.indexOf("create table public.event_blocks ("),
        sql.indexOf(");", sql.indexOf("create table public.event_blocks (")),
      );
      // One FK: a second (profiles, guests) would be a new PostgREST embed path (PGRST201).
      expect(table.match(/\breferences\b/g)).toHaveLength(1);
      expect(table).toContain(
        "event_id uuid not null references public.events (id) on delete cascade",
      );
      expect(table).toContain(
        "check (user_id is not null or email is not null or guest_id is not null)",
      );
      // The address is only ever a confirmed one, stored normalised.
      expect(table).toContain("email = lower(btrim(email))");
      expect(table).not.toMatch(/\b(ip|device)/);
    });

    it("enables RLS, grants SELECT alone to authenticated behind the host's policy, and nothing to anon", () => {
      expect(sql).toContain(
        "alter table public.event_blocks enable row level security;",
      );
      expect(sql).toContain(
        "revoke all on table public.event_blocks from public, anon, authenticated;",
      );
      expect(sql).toContain(
        "grant select on table public.event_blocks to authenticated;",
      );
      expect(sql).toContain(
        "create policy event_blocks_select_host on public.event_blocks for select to authenticated using (exists (select 1 from public.events e where e.id = event_blocks.event_id and e.host_id = (select auth.uid())));",
      );
      expect(sql).not.toMatch(
        /grant [^;]*\b(insert|update|delete|all)\b[^;]* on (?:table )?public\.event_blocks to [^;]*\b(anon|authenticated|public)\b/,
      );
    });
  });

  describe("the rule, once", () => {
    it("names a row by its id, its account, or the address a PROVED row proved, never a pending one", () => {
      const names = code("event_block_names_row");
      expect(names).toContain("p_guest.id = p_guest_id");
      expect(names).toContain(
        "(p_guest.user_id is not null and p_guest.user_id = p_user_id)",
      );
      expect(names).toContain(
        "(p_guest.verified_at is not null and p_email is not null and lower(btrim(p_guest.email)) = p_email)",
      );
      expect(names).not.toContain("pending_email");
      expect(code("event_block_holds_row")).toContain(
        "where b.event_id = p_guest.event_id and public.event_block_names_row(b.user_id, b.email, b.guest_id, p_guest)",
      );
    });

    it("names an account by its id, or its address while auth.users says it is confirmed", () => {
      expect(code("event_block_names_account")).toContain(
        "where u.id = p_account and u.email_confirmed_at is not null",
      );
      expect(code("event_block_holds_account")).toContain(
        "public.event_block_names_account(b.user_id, b.email, p_user_id)",
      );
    });

    it("no client role runs any predicate or any server read; the host's two acts are authenticated only", () => {
      for (const signature of [
        "public.event_block_names_row(uuid, text, uuid, public.guests)",
        "public.event_block_holds_row(public.guests)",
        "public.event_block_names_account(uuid, text, uuid)",
        "public.event_block_holds_account(uuid, uuid)",
        "public.event_ticket_blocked(uuid, text[])",
        "public.event_blocked_guest_ids(uuid)",
        "public.blocked_events_for(uuid)",
      ]) {
        expect(sql).toContain(
          `revoke all on function ${signature} from public, anon, authenticated;`,
        );
        expect(sql).toContain(
          `grant execute on function ${signature} to service_role;`,
        );
      }
      for (const signature of [
        "public.block_from_event(uuid, uuid, uuid, uuid, boolean, boolean)",
        "public.let_back_in(uuid, boolean)",
      ]) {
        expect(sql).toContain(
          `revoke all on function ${signature} from public, anon, authenticated;`,
        );
        expect(sql).toContain(
          `grant execute on function ${signature} to authenticated;`,
        );
      }
      expect(sql).not.toMatch(
        /grant execute on function public\.(event_block_\w+|event_ticket_blocked|event_blocked_guest_ids|blocked_events_for|block_from_event|let_back_in)\([^)]*\) to [^;]*\banon\b/,
      );
    });
  });

  describe("the host's two acts", () => {
    // ★ RESHAPED ON PURPOSE (triage-r2-wiring, 2026-09-29; scar kept: the host re-checked, the preview before any
    // write, the removal the host's own). The block no longer skips a held row: under a quiet hold the photograph
    // stayed in the album the block emptied, and the confirm counted one fewer than she could see, the tell
    // Will's quiet hold forbids ("the host's own delete of a quietly held item looks like any delete"). The
    // expired reason: "a hold is immutable to the host". let_back_in still skips one (restore refused).
    it("block_from_event re-checks the host, previews before it writes, takes a quietly held row like any other and keeps what the restore reads", () => {
      const act = code("block_from_event");
      expect(act).toContain("security definer set search_path = ''");
      expect(act).toContain(
        "where e.id = v_event_id and e.host_id = v_uid and e.deleted_at is null",
      );
      // The preview returns before anything is written.
      expect(
        act.indexOf("if p_preview then return jsonb_build_object("),
      ).toBeLessThan(act.indexOf("insert into public.event_blocks"));
      // Their uploads leave for Deleted in the same step, as the host's own removal, a held row with them.
      expect(act).toContain(
        "update public.media m set status = 'removed', removed_at = now() from public.guests g where g.id = m.guest_id and g.event_id = v_event.id and m.event_id = v_event.id and m.status <> 'removed' and public.event_block_names_row(v_user, v_email, v_row, g)",
      );
      expect(act).not.toContain("legal_hold_at");
      expect(act).not.toContain("removed_by_uploader");
      expect(act).toContain("set removed_media_ids = v_removed");
      // The host is never their own guest.
      expect(act).toContain("if v_user = v_event.host_id then");
    });

    it("let_back_in re-checks the host and restores only this block's standing removal, within the cap", () => {
      const lift = code("let_back_in");
      expect(lift).toContain(
        "where b.id = p_block_id and e.host_id = v_uid and e.deleted_at is null",
      );
      // QA #17: the one capacity lock, the host's profiles row, first.
      expect(lift).toContain(
        "from public.profiles where id = v_event.host_id for update;",
      );
      for (const clause of [
        "m.id = any (v_block.removed_media_ids)",
        "m.removed_at = v_block.created_at",
        "not m.removed_by_uploader",
        "not m.removed_by_admin",
        "m.legal_hold_at is null",
      ]) {
        expect(lift, clause).toContain(clause);
      }
      expect(lift).toContain(
        "delete from public.event_blocks where id = v_block.id;",
      );
    });
  });

  describe("every guest path meets the private album's door", () => {
    it("get_event_by_qr_token reads the event as private to a blocked account, never to its host", () => {
      expect(code("get_event_by_qr_token")).toContain(
        "select case when e.host_id is distinct from (select auth.uid()) and public.event_block_holds_account(e.id, (select auth.uid())) then 'private'::public.event_visibility else e.visibility end as visibility ) v",
      );
      expect(code("get_event_by_qr_token")).toContain(
        "e.moderation_mode, v.visibility,",
      );
    });

    it("get_upload_context masks a blocked ticket's event as private, a local copy only", () => {
      expect(code("get_upload_context")).toContain(
        "if public.event_block_holds_row(v_guest) then v_event.visibility := 'private'; end if;",
      );
    });

    it("the join, the upload and the door's rename-first path refuse in the private album's own words", () => {
      expect(code("create_guest")).toContain(
        "if public.event_block_holds_account(v_event.id, v_uid) then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
      );
      for (const name of [
        "create_media",
        "set_guest_display_name",
        "set_guest_pending_email",
      ]) {
        expect(code(name), name).toContain(
          "if public.event_block_holds_row(v_guest) then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
        );
      }
      // And the app maps those words to the private album's 403, ahead of every other refusal.
      const mutation = collapse(
        readFileSync(join(ROOT, "src/lib/db/mutations/guest.ts"), "utf8"),
      );
      expect(mutation).toContain('if (m.includes("event is private"))');
    });

    it("like_media refuses a blocked account (not_found, a private album's answer)", () => {
      expect(code("like_media")).toContain(
        "not public.event_block_holds_account(e.id, v_uid)",
      );
    });

    it("both kinds of claim leave a block alone: never a row it holds, never an event that blocked the caller", () => {
      for (const name of [
        "claim_anonymous_uploads",
        "list_guest_rows_by_email",
        "claim_guest_rows_by_email",
        "disown_guest_rows_by_email",
      ]) {
        const body = code(name);
        expect(body, name).toContain("not public.event_block_holds_row(g)");
        expect(body, name).toMatch(
          /not public\.event_block_holds_account\((g\.event_id|e\.id), v_uid\)/,
        );
      }
    });

    it("the profile hides a line when its owner or its viewer is blocked there, and a host's card reads private", () => {
      const profile = code("get_public_profile");
      expect(profile).toContain(
        "'visibility', case when e.host_id is distinct from (select auth.uid()) and public.event_block_holds_account(e.id, (select auth.uid())) then 'private'::public.event_visibility else e.visibility end,",
      );
      expect(
        profile.split("and not public.event_block_holds_account(e.id, p.id)"),
      ).toHaveLength(3);
    });
  });

  describe("her own feed and lists read as a private album's", () => {
    // ★ RESHAPED ON PURPOSE (triage-r2-wiring, 2026-09-29; scar kept: never a takedown, and her delete withdraws
    // it). A block now takes a quietly held upload like any other, so her own feed keeps it like any other and
    // her delete withdraws it: a feed that dropped it would tell the uploader, who may be the one investigated.
    // The expired reason: "never a hold".
    it("get_my_uploads keeps an approved upload a standing block removed, never a takedown, a quietly held one like any other, and her delete withdraws it", () => {
      const feed = code("get_my_uploads");
      expect(feed).toContain(
        "or (m.status = 'removed' and m.status_before_removed = 'approved' and not m.removed_by_uploader and not m.removed_by_admin and exists (select 1 from public.event_blocks b where b.event_id = m.event_id and m.id = any (b.removed_media_ids) and m.removed_at = b.created_at))",
      );
      expect(feed).not.toContain("legal_hold_at");
      expect(code("remove_my_upload")).toContain(
        "update public.media m set removed_by_uploader = true where m.id = p_media_id and m.status = 'removed' and not m.removed_by_uploader and exists (select 1 from public.event_blocks b",
      );
      expect(code("remove_my_upload")).not.toContain("legal_hold_at");
    });

    it("blocked_events_for keeps her card's place and her picker's tile for her own blocks, as SECURITY DEFINER for the service role", () => {
      const lists = code("blocked_events_for");
      expect(lists).toContain("security definer set search_path = ''");
      expect(lists).toContain(
        "max(b.last_upload_at) filter (where b.user_id = p_user_id) as last_upload_at",
      );
      expect(lists).toContain("and e.host_id is distinct from p_user_id");
      expect(grants("blocked_events_for")).toContain(
        "grant execute on function public.blocked_events_for(uuid) to service_role;",
      );
    });
  });

  it("no winning function body reads the retired guest-list switch", () => {
    // The guest list is always on (Will, `room=always`). 20260929160000 drops the column; no function
    // body read it before, and none may name it again.
    const readers = liveFunctions()
      .map((fn) => fn.name)
      .filter((name) => code(name).includes("show_guest_list"));
    expect(readers).toEqual([]);
  });
});

describe("a private album likes nothing but its host (20260929100000)", () => {
  // Build 17's red-team: like_media told a block from a private album. A private album's guest with a
  // row got ok where a blocked account got not_found, so a photo id she already knew revealed the
  // block. The private album's answer is now the block's: every guest of it gets the same not_found,
  // and its host still likes. Each pin reads CODE (comments stripped), the grants the winning file's.
  const FILE = "20260929100000_like_private.sql";
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  it("is carried by disposable-foundation (20261002200000), which wins like_media now", () => {
    // ★ Reshaped by the doors: they carry like_media with a gated album's guest arm, so the winner
    // moved to their file; what this file set down (a private album likes nothing but its host) is
    // pinned below in the winning body's own words. ★ Reshaped again by disposable-foundation, which carries
    // the doors' body whole with the seal's one predicate beside the item's own gates (a sealed shot is the
    // not_found every unseen item answers, to everyone but its host).
    expect(latestDefinition("like_media").file).toBe(
      readFileSync(
        join(MIGRATIONS_DIR, "20261002200000_disposable_foundation.sql"),
        "utf8",
      ),
    );
  });

  it("★ the guest arm refuses Only me, keeps the block, and leaves the host's arm alone", () => {
    // ★ Reshaped by the doors (20260929120000): a gated album is stored private with its gate, and a
    // guest of it who is past its door likes there, as a password album's guest always could. Only me
    // (private with no gate) is named by neither arm, so it still likes nothing but its host, and no
    // clause may admit a private album by its visibility alone.
    expect(code("like_media")).toContain(
      "e.host_id = v_uid or ( not public.event_block_holds_account(e.id, v_uid) and ( e.visibility = 'open' or ((e.visibility = 'password' or e.gate is not null) and public.event_door_account_in(e.id, v_uid)) ) )",
    );
    expect(code("like_media")).not.toMatch(/e\.visibility (=|<>) 'private'/);
  });

  it("answers every refusal with the one not_found, and inserts only past the check", () => {
    expect(code("like_media")).toContain(
      ") then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if; insert into public.media_likes (media_id, user_id) values (p_media_id, v_uid) on conflict (media_id, user_id) do nothing;",
    );
  });

  it("stays authenticated only: the file's grants, and never anon or PUBLIC anywhere", () => {
    const file = collapse(
      readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
    );
    expect(file).toContain(
      "revoke all on function public.like_media(uuid) from public, anon; grant execute on function public.like_media(uuid) to authenticated;",
    );
    for (const { file: name, sql } of executableMigrations()) {
      expect(sql, name).not.toMatch(
        /grant execute on function public\.like_media\(uuid\) to [^;]*\b(anon|public)\b/,
      );
    }
  });
});

describe("an operator's removal leaves the host's view (20260928140000)", () => {
  // Will, admin-triage r1 (2026-09-28), `notice=deleted` as his note refines it: "in the case of a report
  // leading to media removal, it should be fully purged from the event, not moved to deleted". The copy
  // waits out its own window for the operator's Undo and the runbook's hold, so each fact below is
  // what keeps it out of the host's reach until then. Each pin reads CODE (comments stripped).
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  /** The host's media policy as the live DB holds it: the last CREATE or ALTER of it, replayed in order. */
  function hostMediaPolicy(): string {
    let latest = "";
    for (const { sql } of executableMigrations()) {
      for (const [statement] of sql.matchAll(
        /(?:create|alter) policy media_host_all on public\.media[^;]*;/g,
      )) {
        latest = statement;
      }
    }
    expect(latest, "media_host_all defined nowhere").not.toBe("");
    return latest;
  }

  it("★ the host's own-media policy leaves out an operator's removal, for every command", () => {
    const policy = hostMediaPolicy();
    expect(policy).toContain(
      "and not (media.status = 'removed' and media.removed_by_admin)",
    );
    // Still the host's own events, by the cached auth.uid() the advisor wants.
    expect(policy).toContain(
      "exists ( select 1 from public.events e where e.id = media.event_id and e.host_id = (select auth.uid()) )",
    );
  });

  it("★ and the flag it tests is never granted to a client role: she cannot read it, only lose the row", () => {
    for (const { file, sql } of executableMigrations()) {
      for (const [statement] of sql.matchAll(
        /grant (?:select|update|insert)[^;]* on (?:table )?public\.media to [^;]*;/g,
      )) {
        expect(statement, file).not.toContain("removed_by_admin");
      }
    }
  });

  // ★ RESHAPED ON PURPOSE (triage-r2-wiring, 2026-09-29; scar kept: never a takedown's window, and never a
  // kept row's bytes). Her Delete permanently no longer skips a held row in silence (it came back in her
  // Deleted, a tell): what a hold or an open report keeps is ASKED, gone from her view and her meter, and only
  // the rest is purged. The expired reason: "refuses a held row".
  it("★ her Delete permanently can never end a takedown's window, and only asks what a keeper holds", () => {
    const purge = code("purge_media_now");
    expect(purge).toContain(
      "and e.host_id = (select auth.uid()) and m.status = 'removed' and not m.removed_by_admin and m.purge_asked_at is null;",
    );
    expect(purge).toContain("v_kept := public.kept_media_ids(v_ids);");
    expect(purge).toContain(
      "update public.media set purge_asked_at = now() where id = any(v_kept) and purge_asked_at is null;",
    );
    expect(purge).toContain(
      "select coalesce(array_agg(x), '{}'::uuid[]) into v_gone from unnest(v_ids) as x where not (x = any(v_kept));",
    );
  });

  it("her restored event counts what her Deleted still shows of it, never a withdrawal, a takedown, an asked row or a row past the window", () => {
    expect(code("restore_event")).toContain(
      "select count(*) into v_still_removed from public.media where event_id = p_event_id and status = 'removed' and not removed_by_uploader and not removed_by_admin and purge_asked_at is null and removed_at >= now() - interval '30 days';",
    );
  });

  it("her Restore still refuses a takedown, in a hold's discreet words", () => {
    expect(code("restore_media")).toContain(
      "if v_media.removed_by_admin then return jsonb_build_object('ok', false, 'reason', 'admin_removed');",
    );
  });
});

describe("the doors: Public, Private with its gate, Only me (20260929120000)", () => {
  // Will, event-settings r1 (2026-09-29): what the link opens is Public, Private (a gate: a password,
  // the host lets each person in, an invite list, or only people already in) or Only me; a gate stops
  // newcomers, and only Only me and a block shut out someone already in; a decline is a block; Videos is
  // a switch. A gated album is stored private WITH its gate, so every reader that has not learned the
  // gate answers it as a private album (the safe side). Each pin reads CODE (comments stripped), and each
  // grant the defining file's executable SQL, so a comment can never stand in for a clause.
  const FILE = "20260929120000_event_doors.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  describe("the door's columns", () => {
    it("keeps the gate beside the password: meaningful only on a private album, and an address gate holds the email step on", () => {
      expect(sql).toContain(
        "create type public.event_gate as enum ('approve', 'invite', 'closed');",
      );
      expect(sql).toContain(
        "add constraint events_gate_is_private check (gate is null or visibility = 'private')",
      );
      expect(sql).toContain(
        "add constraint events_gate_needs_email check (gate is null or gate = 'closed' or require_verified_email)",
      );
    });

    it("never grants the gate to a client role (set_event_door writes it), and grants the Videos switch by a bare additive grant", () => {
      expect(sql).toContain(
        "grant insert (allow_videos), update (allow_videos) on public.events to authenticated;",
      );
      for (const { file, sql: text } of executableMigrations()) {
        for (const [statement] of text.matchAll(
          /grant [^;]* on (?:table )?public\.events to [^;]*;/g,
        )) {
          expect(statement, file).not.toMatch(/\bgate\b/);
        }
      }
      // ★ A table-level revoke cascades to every column grant on events (database-security.md).
      expect(sql).not.toMatch(/revoke [^;]* on (?:table )?public\.events\b/);
    });

    it("puts admission on the ticket the door minted, every earlier row past it", () => {
      expect(sql).toContain(
        "create type public.guest_admission as enum ('in', 'waiting');",
      );
      expect(sql).toContain(
        "alter table public.guests add column admission public.guest_admission not null default 'in', add column waiting_seen_at timestamptz;",
      );
      expect(sql).toContain(
        "create index guests_waiting_idx on public.guests (event_id) where admission = 'waiting';",
      );
    });
  });

  describe("the invite list", () => {
    it("keys on a normalised address with one foreign key, RLS on, SELECT alone to the host", () => {
      const table = sql.slice(
        sql.indexOf("create table public.event_invites ("),
        sql.indexOf(");", sql.indexOf("create table public.event_invites (")),
      );
      expect(table.match(/\breferences\b/g)).toHaveLength(1);
      expect(table).toContain("email = lower(btrim(email))");
      expect(table).toContain("unique (event_id, email)");
      expect(sql).toContain(
        "alter table public.event_invites enable row level security;",
      );
      expect(sql).toContain(
        "revoke all on table public.event_invites from public, anon, authenticated;",
      );
      expect(sql).toContain(
        "grant select on table public.event_invites to authenticated;",
      );
      expect(sql).toContain(
        "create policy event_invites_select_host on public.event_invites for select to authenticated using (exists (select 1 from public.events e where e.id = event_invites.event_id and e.host_id = (select auth.uid())));",
      );
      expect(sql).not.toMatch(
        /grant [^;]*\b(insert|update|delete|all)\b[^;]* on (?:table )?public\.event_invites to [^;]*\b(anon|authenticated|public)\b/,
      );
    });

    it("caps the list where the app does (INVITE_LIST_CAP) and bounds one call", () => {
      const add = code("add_event_invites");
      expect(add).toContain("c_cap constant integer := 500;");
      expect(add).toContain("cardinality(p_emails) > 2000");
      expect(add).toContain(
        "where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null for no key update;",
      );
    });
  });

  describe("who is at the door, one read", () => {
    it("the standing is SECURITY DEFINER for the service role alone, bounds its tickets and derives the door's word from the gate", () => {
      const standing = code("event_door_standing");
      expect(standing).toContain("security definer set search_path = ''");
      expect(standing).toContain("if cardinality(v_tickets) > 8 then");
      expect(standing).toContain(
        "'door', case when v_event.visibility = 'private' and v_event.gate is not null then v_event.gate::text else v_event.visibility::text end,",
      );
      expect(standing).toContain("'in', v_was_in and not v_blocked,");
    });

    it("no client role runs a predicate, a read or the ask; the host's four acts are authenticated only", () => {
      for (const signature of [
        "public.event_door_account_in(uuid, uuid)",
        "public.event_door_lists_account(uuid, uuid)",
        "public.event_door_standing(uuid, uuid, text[])",
        "public.event_door_check_in(uuid, uuid, text[])",
        "public.event_door_counts(uuid)",
        "public.event_door_queue(uuid)",
        "public.event_invite_list(uuid)",
        "public.host_door_waiting(uuid)",
        "public.ask_to_join(text, uuid)",
      ]) {
        expect(sql).toContain(
          `revoke all on function ${signature} from public, anon, authenticated;`,
        );
        expect(sql).toContain(
          `grant execute on function ${signature} to service_role;`,
        );
      }
      for (const signature of [
        "public.set_event_door(uuid, text)",
        "public.let_in_at_door(uuid, uuid)",
        "public.add_event_invites(uuid, text[])",
        "public.remove_event_invite(uuid, text)",
      ]) {
        expect(sql).toContain(
          `revoke all on function ${signature} from public, anon, authenticated;`,
        );
        expect(sql).toContain(
          `grant execute on function ${signature} to authenticated;`,
        );
      }
      expect(sql).toContain(
        "revoke all on function public.events_door_opened() from public, anon, authenticated;",
      );
      expect(sql).not.toMatch(
        /grant execute on function public\.(event_door_\w+|event_invite_list|host_door_waiting|ask_to_join|set_event_door|let_in_at_door|add_event_invites|remove_event_invite|events_door_opened)\([^)]*\) to [^;]*\banon\b/,
      );
    });
  });

  describe("the host's acts", () => {
    it("set_event_door re-checks the host, opens the password only onto one set, and holds the email on for an address gate", () => {
      const door = code("set_event_door");
      expect(door).toContain(
        "where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null for no key update;",
      );
      expect(door).toContain(
        "if p_door = 'password' and v_event.event_password_hash is null then return jsonb_build_object('ok', false, 'reason', 'no_password');",
      );
      expect(door).toContain(
        "v_email := v_event.require_verified_email or p_door in ('approve', 'invite');",
      );
    });

    it("let_in_at_door re-checks the host and never lets a block through", () => {
      const letIn = code("let_in_at_door");
      expect(letIn).toContain(
        "where g.id = p_guest_id and g.event_id = p_event_id and e.host_id = v_uid and e.deleted_at is null;",
      );
      expect(letIn).toContain(
        "if public.event_block_holds_row(v_guest) then return jsonb_build_object('ok', false, 'reason', 'blocked');",
      );
    });

    // ★ RESHAPED ON PURPOSE (crumbs-29, 20260930130000; scar kept: every path to Public lets the door's asks in,
    // by a trigger). The expired reason: "everyone waiting". A declined newcomer's ask waits on her block, and a
    // Public trip that let it in walked her into an album its host never let her into (build 30's red-team).
    it("set_event_password clears the gate beside its flip, and turning Public lets in every ask no block holds", () => {
      expect(code("set_event_password")).toContain(
        "visibility = 'password', gate = null",
      );
      expect(code("events_door_opened")).toContain(
        "if new.visibility = 'open' and old.visibility is distinct from 'open' then update public.guests g set admission = 'in' from public.event_door_asks(new.id) a where g.id = a.guest_id; end if;",
      );
      expect(sql).toContain(
        "create trigger events_door_opened after update of visibility on public.events for each row execute function public.events_door_opened();",
      );
    });
  });

  describe("every guest path meets the door", () => {
    it("the join: Only me never mints, someone already in passes the password and every gate, and each gate turns a newcomer its own way", () => {
      const join = code("create_guest");
      expect(join).toContain(
        "if v_event.visibility = 'private' and v_event.gate is null then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
      );
      expect(join).toContain(
        "v_in := public.event_door_account_in(v_event.id, v_uid);",
      );
      expect(join).toContain(
        "if v_event.visibility = 'password' and not coalesce(p_unlock_proven, false) and not v_in then",
      );
      expect(join).toContain(
        "if v_event.gate is not null and not v_in then if v_event.gate = 'closed' then raise exception 'This event is private.' using errcode = 'check_violation'; elsif v_event.gate = 'approve' then v_admission := 'waiting'; elsif not public.event_door_lists_account(v_event.id, v_uid) then raise exception 'Ask the host to let you in.' using errcode = 'check_violation'; end if; end if;",
      );
      // The gate is asked after the verified-email refusal, so an address gate never mints a typed name.
      expect(
        join.indexOf("if v_event.gate is not null and not v_in then"),
      ).toBeGreaterThan(
        join.indexOf(
          "if v_event.require_verified_email and (v_uid is null or v_confirmed is null) then",
        ),
      );
      expect(join).toContain("'admission', v_admission");
    });

    it("the upload reads the door as its ticket sees it, the block last, and the switch in its advisory", () => {
      const ctx = code("get_upload_context");
      const door = ctx.indexOf(
        "if v_guest.admission = 'waiting' then v_event.visibility := 'private'; elsif v_event.gate is not null or v_event.visibility = 'password' then v_event.visibility := 'open'; end if;",
      );
      expect(door).toBeGreaterThan(-1);
      expect(door).toBeLessThan(
        ctx.indexOf(
          "if public.event_block_holds_row(v_guest) then v_event.visibility := 'private'; end if;",
        ),
      );
      expect(ctx).toContain(
        "'video_blocked', (p_type = 'video' and (v_profile.tier = 'free' or not v_event.allow_videos)),",
      );
      const media = code("create_media");
      expect(media).toContain(
        "if v_guest.admission = 'waiting' or (v_event.visibility = 'private' and v_event.gate is null) then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
      );
      expect(media).toContain(
        "if p_type = 'video' and not v_event.allow_videos then raise exception 'Video uploads are available on paid plans.' using errcode = 'check_violation'; end if;",
      );
    });

    it("the door's rename-first path refuses a waiting ticket and Only me in the private album's words", () => {
      for (const name of [
        "set_guest_display_name",
        "set_guest_pending_email",
      ]) {
        expect(code(name), name).toContain(
          "if v_guest.admission = 'waiting' or exists ( select 1 from public.events e where e.id = v_guest.event_id and e.visibility = 'private' and e.gate is null ) then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
        );
      }
    });

    it("both kinds of claim move only a row past the door", () => {
      for (const name of [
        "claim_anonymous_uploads",
        "list_guest_rows_by_email",
        "claim_guest_rows_by_email",
        "disown_guest_rows_by_email",
      ]) {
        expect(code(name), name).toContain("g.admission = 'in'");
      }
    });

    it("the ask mints a waiting row only at an invite list, for a confirmed account the event has not blocked", () => {
      const ask = code("ask_to_join");
      expect(ask).toContain(
        "if v_confirmed is null then raise exception 'This event requires a verified email to upload.' using errcode = 'check_violation'; end if;",
      );
      expect(ask).toContain(
        "if v_event.host_id = p_user_id or v_event.visibility <> 'private' or v_event.gate is distinct from 'invite' or public.event_block_holds_account(v_event.id, p_user_id) then raise exception 'This event is private.' using errcode = 'check_violation'; end if;",
      );
    });

    it("the album's read carries the guest picker's flag and needs no gate clause: a gated album is stored private", () => {
      const read = code("get_event_by_qr_token");
      expect(read).toContain(
        "(e.allow_videos and coalesce(p.tier <> 'free', false))",
      );
      expect(read).not.toContain("gate");
    });
  });
});

describe("the schema pass (20260929160000) and its contract (20260929170000)", () => {
  // The data architecture audited under Will's standing permission (2026-09-29), each fact read off the
  // executable SQL (comments stripped), so a comment quoting a clause can never stand in for it.
  const PASS = "20260929160000_schema_pass.sql";
  const CONTRACT = "20260929170000_schema_pass_contract.sql";
  const executableOf = (file: string) =>
    collapse(
      readFileSync(join(MIGRATIONS_DIR, file), "utf8").replace(/--[^\n]*/g, ""),
    );
  const pass = executableOf(PASS);
  /** Every file from the pass on, executable, in apply order. */
  const fromThePass = () =>
    executableMigrations().filter(({ file }) => file >= PASS);

  describe("events holds the app's own bounds", () => {
    type Lengths = { minLength: number | null; maxLength: number | null };
    type Wrapped = Partial<Lengths> & { unwrap?: () => unknown };
    /** A string field's own lengths, under however many optional wrappers the schema adds. */
    const lengthsOf = (field: unknown): Lengths => {
      let f = field as Wrapped;
      while (typeof f.unwrap === "function") f = f.unwrap() as Wrapped;
      return { minLength: f.minLength ?? null, maxLength: f.maxLength ?? null };
    };

    it("the name CHECK is the event schema's own length, on create and on update", () => {
      const create = lengthsOf(createEventSchema.shape.name);
      expect(create.minLength).toBe(1);
      expect(create.maxLength).not.toBeNull();
      expect(lengthsOf(updateEventSchema.shape.name)).toEqual(create);
      expect(pass).toContain(
        `add constraint events_name_len check (char_length(name) between ${create.minLength} and ${create.maxLength})`,
      );
    });

    it("the description CHECK is the event schema's own cap", () => {
      const { maxLength: cap } = lengthsOf(createEventSchema.shape.description);
      expect(cap).not.toBeNull();
      expect(lengthsOf(updateEventSchema.shape.description).maxLength).toBe(
        cap,
      );
      expect(pass).toContain(
        `add constraint events_description_len check (description is null or char_length(description) <= ${cap})`,
      );
    });

    it("the QR key's CHECK is an envelope every preset fits, never the list", () => {
      const envelope = pass.match(
        /add constraint events_qr_style_len check \(char_length\(qr_style\) between (\d+) and (\d+)\)/,
      );
      expect(envelope).not.toBeNull();
      for (const key of QR_STYLE_KEYS) {
        expect(key.length).toBeGreaterThanOrEqual(Number(envelope![1]));
        expect(key.length).toBeLessThanOrEqual(Number(envelope![2]));
        // A new preset needs no migration: the CHECK never names one.
        expect(pass).not.toContain(`'${key}'`);
      }
    });

    it("no later migration drops one of the three", () => {
      for (const { file, sql } of fromThePass()) {
        expect(sql, file).not.toMatch(
          /drop constraint (?:if exists )?events_(?:name|description|qr_style)_len/,
        );
      }
    });
  });

  describe("the client roles keep only what their callers use", () => {
    it("anon holds no table privilege from the pass on", () => {
      expect(pass).toContain(
        "revoke all on all tables in schema public from anon;",
      );
      for (const { file, sql } of fromThePass()) {
        for (const [grant] of sql.matchAll(/\bgrant [^;]*;/g)) {
          if (!/\bto [^;]*\banon\b/.test(grant)) continue;
          // A capability read may still be granted to anon; a table never.
          expect(grant, `${file}: ${grant}`).toMatch(/ on function /);
        }
      }
    });

    it("authenticated loses the latent privileges, MAINTAIN included, and SELECT on every deny-all table", () => {
      expect(pass).toContain(
        "revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;",
      );
      const revoke = pass.match(
        /revoke select on table ([^;]*) from authenticated;/,
      );
      expect(revoke).not.toBeNull();
      expect(
        revoke![1]
          .split(",")
          .map((t) => t.trim())
          .sort(),
      ).toEqual(
        [
          "public.action_attempts",
          "public.contact_submissions",
          "public.export_log",
          "public.job_applications",
          "public.job_runs",
          "public.newsletter_signups",
          "public.ops_flags",
          "public.reports",
          "public.sent_emails",
          "public.storage_ledger",
          "public.unlock_attempts",
        ].sort(),
      );
      expect(pass).toContain(
        "drop policy storage_ledger_host_select on public.storage_ledger;",
      );
    });

    it("the default privileges stay revoked for anon and authenticated", () => {
      for (const kind of ["tables", "sequences", "functions"]) {
        expect(pass).toContain(
          `alter default privileges for role postgres in schema public revoke all on ${kind} from anon, authenticated;`,
        );
      }
      for (const { file, sql } of fromThePass()) {
        expect(sql, file).not.toMatch(
          /alter default privileges [^;]* grant [^;]* to [^;]*\b(?:anon|authenticated)\b/,
        );
      }
    });

    it("tier_limits stays the service role's: a recreate after the pass restates the revoke", () => {
      expect(pass).toContain(
        "revoke all on function public.tier_limits(public.tier_type) from public, anon, authenticated; grant execute on function public.tier_limits(public.tier_type) to service_role;",
      );
      const winning = executableMigrations().filter(({ sql }) =>
        /create (?:or replace )?function public\.tier_limits\(/.test(sql),
      );
      const last = winning[winning.length - 1];
      if (last.file > PASS) {
        expect(last.sql).toContain(
          "revoke all on function public.tier_limits(public.tier_type) from public, anon, authenticated;",
        );
      }
    });

    it("no function in public keeps PUBLIC's EXECUTE: get_upload_context's goes by name", () => {
      expect(pass).toContain(
        "revoke execute on function public.get_upload_context(text, public.media_type) from public;",
      );
    });
  });

  it("the dropped columns are never added back", () => {
    for (const [table, column] of [
      ["events", "show_guest_list"],
      ["notification_prefs", "notify_album_shared"],
      ["notification_prefs", "notify_new_uploads_digest"],
      ["notification_prefs", "notify_new_follower"],
      ["newsletter_signups", "opted_in_at"],
      ["job_applications", "resume_url"],
    ]) {
      expect(pass).toContain(
        `alter table public.${table} drop column ${column};`,
      );
      for (const { file, sql } of fromThePass()) {
        expect(sql, `${file}: ${table}.${column}`).not.toMatch(
          new RegExp(
            `alter table (?:only )?public\\.${table} [^;]*add column (?:if not exists )?${column}\\b`,
          ),
        );
      }
    }
  });

  describe("the contract drops exactly the reel's three dormant columns, after milestone 31", () => {
    const contract = executableOf(CONTRACT);

    it("runs its three drops and nothing else, with no cascade", () => {
      expect(
        contract
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `${s};`),
      ).toEqual([
        "alter table public.media drop column highlight_score;",
        "alter table public.media drop column clip_start_seconds;",
        "alter table public.media drop column clip_end_seconds;",
      ]);
    });

    it("carries its apply gate in its header", () => {
      expect(readFileSync(join(MIGRATIONS_DIR, CONTRACT), "utf8")).toContain(
        "★ APPLY ONLY AFTER MILESTONE 31 SHIPS (destructive)",
      );
    });
  });
});

describe("the list lets in who waits (20260929220000)", () => {
  // Build 23's red-team (BUG-2): a newcomer who asked at an invite list stayed At the door after the host
  // listed her, counted by the pulse and the bell beside her Joined address, while the door let her through
  // on a ticket every upload refused. The rule, once: while the list is the door, a waiting person it
  // names is in, decided by the door's own predicates, and each act that can bring that about settles it.
  const FILE = "20260929220000_door_invite_admits.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const ADMIT = "public.event_door_admit_listed(";

  // ★ RESHAPED ON PURPOSE (crumbs-29, 20260930130000; scar kept: only while the list is the door, by the door's
  // own match, every row of a person at once, no block through). The expired reason: the update spelled the
  // door's predicates itself; they live once in event_door_asks, which its twin reads too (pinned below, in
  // "no door's opening admits a blocked ask").
  it("admits only while the list is the door, by the door's own match, every row of a person at once, no block through", () => {
    const admit = code("event_door_admit_listed");
    expect(admit).not.toContain("security definer");
    expect(admit).toContain("set search_path = ''");
    expect(admit).toContain(
      "perform 1 from public.events e where e.id = p_event_id and e.deleted_at is null and e.visibility = 'private' and e.gate = 'invite'; if not found then return 0; end if;",
    );
    expect(admit).toContain(
      "update public.guests g set admission = 'in' from public.event_door_asks(p_event_id) a where g.id = a.guest_id and a.listed returning g.user_id",
    );
    // Counted as people, as every door count is: an account once, however many devices asked.
    expect(admit).toContain("count(distinct a.user_id)");
  });

  it("no client role runs the rule: the host's acts reach it, as the owner", () => {
    expect(sql).toContain(
      "revoke all on function public.event_door_admit_listed(uuid) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.event_door_admit_listed(uuid) to service_role;",
    );
    for (const { file, sql: text } of executableMigrations()) {
      expect(text, file).not.toMatch(
        /grant execute on function public\.event_door_admit_listed\([^)]*\) to [^;]*\b(anon|authenticated|public)\b/,
      );
    }
  });

  it("add_event_invites lets in whom the list now names, after its insert, and says how many", () => {
    const add = code("add_event_invites");
    expect(add.indexOf(`v_admitted := ${ADMIT}p_event_id);`)).toBeGreaterThan(
      add.indexOf("insert into public.event_invites (event_id, email)"),
    );
    expect(add).toContain("'admitted', v_admitted");
  });

  it("set_event_door lets in whom the list names as it becomes the door, counted with the door opening's", () => {
    const door = code("set_event_door");
    const admit = door.indexOf(
      `if p_door = 'invite' then v_listed := ${ADMIT}v_event.id); end if;`,
    );
    expect(admit).toBeGreaterThan(
      door.indexOf(
        "update public.events set visibility = v_visibility, gate = v_gate, require_verified_email = v_email where id = v_event.id;",
      ),
    );
    expect(door).toContain("'admitted', v_waiting + v_listed");
  });

  it("let_back_in lets a listed newcomer in once the block is gone, and says so", () => {
    const lift = code("let_back_in");
    expect(
      lift.indexOf(`v_admitted := ${ADMIT}v_block.event_id);`),
    ).toBeGreaterThan(
      lift.indexOf("delete from public.event_blocks where id = v_block.id;"),
    );
    expect(lift).toContain("'admitted', v_admitted");
  });

  it("restates the three acts' grants exactly as they stood: authenticated only", () => {
    for (const signature of [
      "public.add_event_invites(uuid, text[])",
      "public.set_event_door(uuid, text)",
      "public.let_back_in(uuid, boolean)",
    ]) {
      expect(sql).toContain(
        `revoke all on function ${signature} from public, anon, authenticated;`,
      );
      expect(sql).toContain(
        `grant execute on function ${signature} to authenticated;`,
      );
    }
  });
});

describe("a password ends every ask at the door (20260929230000)", () => {
  // crumbs-17's find: a newcomer waiting at letting each person in, or at the invite list, whose door then
  // became a password kept her waiting ticket, so once she unlocked every upload path refused it as a
  // private album's, and the host's At the door, pulse and bell kept counting her. A password lets in
  // whoever proves it and nobody waits on the host there, so the moment an album takes one, every ask ends.
  const FILE = "20260929230000_door_password_ends_asks.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const ENDS =
    "delete from public.guests g where g.event_id = new.id and g.admission = 'waiting' and not exists (select 1 from public.media m where m.guest_id = g.id);";

  it("★ ends each waiting ticket the moment the door becomes a password, never a row an upload names", () => {
    const fn = code("events_door_to_password");
    expect(fn).toContain(
      "create function public.events_door_to_password() returns trigger language plpgsql security definer set search_path = ''",
    );
    expect(fn).toContain(
      `if new.visibility = 'password' and old.visibility is distinct from 'password' then ${ENDS} end if; return null;`,
    );
  });

  it("fires on every path to a password, beside the door opening's trigger", () => {
    let standing = false;
    for (const { sql: text } of executableMigrations()) {
      for (const [, verb] of text.matchAll(
        /\b(create|drop) trigger (?:if exists )?events_door_to_password\b/g,
      ))
        standing = verb === "create";
    }
    expect(standing).toBe(true);
    expect(sql).toContain(
      "create trigger events_door_to_password after update of visibility on public.events for each row execute function public.events_door_to_password();",
    );
  });

  it("no client role runs it (a trigger still fires)", () => {
    expect(sql).toContain(
      "revoke all on function public.events_door_to_password() from public, anon, authenticated;",
    );
    for (const { file, sql: text } of executableMigrations()) {
      expect(text, file).not.toMatch(
        /grant execute on function public\.events_door_to_password\(\) to/,
      );
    }
  });

  it("settles once the asks already stranded at a password, by the same rule", () => {
    expect(sql).toContain(
      "delete from public.guests g using public.events e where e.id = g.event_id and e.visibility = 'password' and g.admission = 'waiting' and not exists (select 1 from public.media m where m.guest_id = g.id);",
    );
  });

  it("★ a guest row is only ever deleted as an ask ending: a waiting ticket, never one an upload names", () => {
    // The guest list and the forensic trail are history (disown_guest_rows_by_email keeps the row), and a
    // block keys a confirmed person on her account and address, never on a waiting row: so the one delete
    // of a guest row there is keeps to waiting tickets, and a row with an upload stays whatever else moves.
    let deletes = 0;
    for (const { file, sql: text } of executableMigrations()) {
      for (const match of text.matchAll(
        /delete from public\.guests\b[^;]*;/g,
      )) {
        deletes += 1;
        expect(match[0], file).toContain("g.admission = 'waiting'");
        expect(match[0], file).toContain(
          "not exists (select 1 from public.media m where m.guest_id = g.id)",
        );
      }
    }
    // The trigger's, and the settle of the asks already stranded when the file applies.
    expect(deletes).toBeGreaterThanOrEqual(1);
  });

  it("leaves every door act as it stood: the closed door and Only me keep their asks", () => {
    // Nothing in the file replaces an act; the asks end in the trigger alone, and only at a password.
    expect(sql).not.toContain(
      "create or replace function public.set_event_door(",
    );
    expect(sql).not.toContain(
      "create or replace function public.set_event_password(",
    );
    expect(code("events_door_to_password")).not.toMatch(
      /'closed'|'private'|'approve'|'invite'/,
    );
  });
});

describe("a report keeps what it named (20260929231000)", () => {
  // triage-r2's find: `reports.media_id` was ON DELETE SET NULL, so a purged item's report read as its
  // album's: under All, and reopened by a dismissal's Undo, where kept_media_ids read it as keeping every
  // item of the album from every permanent delete. A report keeps which item it named and its kind, and
  // nothing the purge exists to remove.
  const FILE = "20260929231000_report_keeps_its_item.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  it("★ the purge no longer touches it: media_id is no foreign key, by the last word on the constraint", () => {
    let standing: boolean | null = null;
    for (const { sql: text } of executableMigrations()) {
      for (const [statement] of text.matchAll(
        /\bmedia_id uuid references public\.media \(id\) on delete set null\b|\bdrop constraint (?:if exists )?reports_media_id_fkey\b|\badd constraint reports_media_id_fkey\b/g,
      )) {
        // The column's own inline key (the init file's reports table) or a named re-add stands it up.
        standing = !statement.startsWith("drop");
      }
    }
    expect(standing).toBe(false);
  });

  it("records the kind from the item as it is filed, and never from anything else", () => {
    const fn = code("reports_name_item");
    expect(fn).toContain(
      "create function public.reports_name_item() returns trigger language plpgsql set search_path = ''",
    );
    expect(fn).not.toContain("security definer");
    // An update that keeps its item keeps its kind: a gone item's report can close and reopen, and
    // nothing re-kinds it.
    expect(fn).toContain(
      "if tg_op = 'UPDATE' and new.media_id is not distinct from old.media_id then new.media_type := old.media_type; return new; end if;",
    );
    expect(fn).toContain(
      "if new.media_id is null then new.media_type := null; return new; end if;",
    );
    // What the key checked at insert: an id that names no item is refused as the key refused it.
    expect(fn).toContain(
      "select m.type into new.media_type from public.media m where m.id = new.media_id; if not found then raise exception 'A report names an item that does not exist.' using errcode = 'foreign_key_violation'; end if;",
    );
    expect(sql).toContain(
      "create trigger reports_name_item before insert or update of media_id, media_type on public.reports for each row execute function public.reports_name_item();",
    );
    expect(sql).toContain(
      "revoke execute on function public.reports_name_item() from public, anon, authenticated;",
    );
  });

  it("pairs the kind with the item by a CHECK, after a backfill that stamps nothing else", () => {
    expect(sql).toContain(
      "alter table public.reports add column media_type public.media_type;",
    );
    const off = sql.indexOf(
      "alter table public.reports disable trigger reports_set_updated_at;",
    );
    const backfill = sql.indexOf(
      "update public.reports r set media_type = m.type from public.media m where m.id = r.media_id and r.media_type is null;",
    );
    const on = sql.indexOf(
      "alter table public.reports enable trigger reports_set_updated_at;",
    );
    expect(off).toBeGreaterThan(-1);
    expect(backfill).toBeGreaterThan(off);
    expect(on).toBeGreaterThan(backfill);
    expect(
      sql.indexOf(
        "alter table public.reports add constraint reports_media_type_named check ((media_id is null) = (media_type is null));",
      ),
    ).toBeGreaterThan(on);
  });

  it("an album report is still the one with no item: kept_media_ids' album arm reads media_id is null", () => {
    expect(code("kept_media_ids")).toContain(
      "(r.media_id = m.id or (r.media_id is null and r.event_id = m.event_id))",
    );
  });
});

describe("shared phones: a claim by ticket takes only what can be hers (shared-claims, 20260929234000)", () => {
  // Build 26's red-team: on one browser an anonymous visitor typed a name and an unproved address and
  // added a photo, and the next person to sign in there took the visitor's ticket, typed name and
  // address erased, the address's owner locked out for good. Whose a ticket is has ONE rule, which no
  // client role runs; the silent claim takes only what it calls hers; a name at odds with hers is asked
  // about (one jsonb, a confirmed account only); her answer never takes another address and never
  // names her profile. Each pin reads CODE (comments stripped), so a quoted clause stands in for none.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));

  describe("whose_ticket: the rule, once", () => {
    it("is an INVOKER predicate no client role can run, like the block's four", () => {
      const rule = code("whose_ticket");
      expect(rule).toContain(
        "create function public.whose_ticket(p_guest public.guests, p_uid uuid) returns text language plpgsql stable set search_path = ''",
      );
      expect(rule).not.toContain("security definer");
      expect(grants("whose_ticket")).toContain(
        "revoke all on function public.whose_ticket(public.guests, uuid) from public, anon, authenticated; grant execute on function public.whose_ticket(public.guests, uuid) to service_role;",
      );
    });

    it("a row an account holds, or proved before it was deleted, is that account's", () => {
      expect(code("whose_ticket")).toContain(
        "if p_guest.user_id is not null then return case when p_guest.user_id = p_uid then 'mine' else 'theirs' end; end if; if p_guest.verified_at is not null then return 'theirs'; end if;",
      );
    });

    it("an address settles it: hers only when it is her own CONFIRMED address, in the claims review's lookup form", () => {
      expect(code("whose_ticket")).toContain(
        "if p_guest.pending_email is not null then if v_confirmed is not null and p_guest.pending_email = lower(nullif(btrim(coalesce(v_email, '')), '')) then return 'mine'; end if; return 'theirs'; end if;",
      );
      // The claims review keys the same column the same way, so a ticket left for its owner is one her
      // review lists.
      expect(code("list_guest_rows_by_email")).toContain(
        "where g.pending_email = lower(v_email)",
      );
    });

    it("no address: a name at odds with hers is asked, and hers is her profile's, else the one her sign-up carried", () => {
      const rule = code("whose_ticket");
      expect(rule).toContain(
        "select nullif(btrim(p.display_name), '') into v_name from public.profiles p where p.id = p_uid;",
      );
      // The door's key is the one the guest door writes (a renamed key would leave every new account
      // nameless to the rule, and a shared phone's tickets hers).
      expect(rule).toContain(
        `v_name := coalesce(v_name, nullif(btrim(v_meta ->> '${DOOR_NAME_KEY}'), ''), nullif(btrim(v_meta ->> 'full_name'), ''), nullif(btrim(v_meta ->> 'name'), ''));`,
      );
      // First words, case and marks aside, on both sides alike.
      for (const side of ["v_typed := ", "v_own := "]) {
        expect(rule).toContain(
          side + "regexp_replace((regexp_match(lower(coalesce(",
        );
      }
      expect(
        rule.split("'\\S*[[:alnum:]]\\S*'))[1], '[^[:alnum:]]', '', 'g');"),
      ).toHaveLength(3);
      expect(rule).toContain(
        "if v_typed is null or v_own is null or v_typed = v_own then return 'mine'; end if; return 'ask';",
      );
    });
  });

  describe("claim_anonymous_uploads: the silent claim takes only what is hers", () => {
    it("asks the rule in the naming read and in both arms, so a stranger's ticket and name never move", () => {
      const body = code("claim_anonymous_uploads");
      expect(
        body.split("and public.whose_ticket(g, v_uid) = 'mine'"),
      ).toHaveLength(4);
      // The naming read comes first, so the rule the update asks reads a profile it just named.
      expect(body.indexOf("update public.profiles")).toBeLessThan(
        body.indexOf("update public.guests"),
      );
    });

    it("keeps its signature, its answer and its authenticated-only grant", () => {
      expect(code("claim_anonymous_uploads")).toContain(
        "create or replace function public.claim_anonymous_uploads(p_session_tokens text[]) returns integer language plpgsql security definer set search_path = ''",
      );
    });
  });

  describe("claim_ticket_asks: the ask", () => {
    it("is one jsonb (never a set), authenticated-only, bounded like the claim", () => {
      const ask = code("claim_ticket_asks");
      // ★ RESHAPED ON PURPOSE (crumbs-24; scar kept: one jsonb, never a set, a DEFINER read with its path
      // pinned): 20260930110000 replaces the body, so its opener says `or replace` where the first said none.
      expect(ask).toMatch(
        /^create (?:or replace )?function public\.claim_ticket_asks\(p_session_tokens text\[\]\) returns jsonb language plpgsql stable security definer set search_path = ''/,
      );
      expect(ask).toContain(
        "if cardinality(p_session_tokens) > 1000 then raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded'; end if;",
      );
      expect(grants("claim_ticket_asks")).toContain(
        "revoke all on function public.claim_ticket_asks(text[]) from public, anon; grant execute on function public.claim_ticket_asks(text[]) to authenticated;",
      );
    });

    it("asks only a confirmed account, only of a ticket typed under another name with a live upload, past the door and no block", () => {
      const ask = code("claim_ticket_asks");
      expect(ask).toContain(
        "if v_confirmed is null then return '[]'::jsonb; end if;",
      );
      expect(ask).toContain(
        "where g.session_token = any (p_session_tokens) and g.user_id is null and g.admission = 'in' and not public.event_block_holds_row(g) and not public.event_block_holds_account(g.event_id, v_uid) and public.whose_ticket(g, v_uid) = 'ask' and m.n > 0 group by lower(btrim(g.display_name))",
      );
      expect(ask).toContain(
        "select count(*)::integer as n from public.media x where x.guest_id = g.id and x.status <> 'removed'",
      );
    });

    it("answers the name, the live uploads and the caller's own tokens, and nothing else about the rows", () => {
      const ask = code("claim_ticket_asks");
      expect(ask).toContain(
        "jsonb_build_object('name', a.name, 'uploads', a.uploads, 'tokens', a.tokens)",
      );
      for (const secret of ["pending_email", "g.email", "event_id,", "g.id,"]) {
        expect(ask).not.toContain(`'${secret}'`);
      }
    });
  });

  describe("claim_asked_uploads: her answer", () => {
    const yes = () => code("claim_asked_uploads");

    it("is authenticated-only and bounded like the claim", () => {
      expect(yes()).toContain(
        "create function public.claim_asked_uploads(p_session_tokens text[]) returns integer language plpgsql security definer set search_path = ''",
      );
      expect(yes()).toContain(
        "if cardinality(p_session_tokens) > 1000 then raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded'; end if;",
      );
      expect(grants("claim_asked_uploads")).toContain(
        "revoke all on function public.claim_asked_uploads(text[]) from public, anon; grant execute on function public.claim_asked_uploads(text[]) to authenticated;",
      );
    });

    it("★ never takes another address, whatever the answer, and never through a door or a block", () => {
      expect(yes()).toContain(
        "where g.session_token = any (p_session_tokens) and g.user_id is null and g.admission = 'in' and not public.event_block_holds_row(g) and not public.event_block_holds_account(g.event_id, v_uid) and public.whose_ticket(g, v_uid) <> 'theirs'",
      );
    });

    it("answers for a confirmed account only, stamps as the confirmed arm stamps, counts as the claim counts, and names no profile", () => {
      const body = yes();
      expect(body).toContain(
        "if v_confirmed is null or v_email is null then return 0; end if;",
      );
      expect(body).toContain(
        "set user_id = v_uid, verified_at = now(), email = v_email, pending_email = null, pending_email_at = null, display_name = null",
      );
      expect(body).toContain(
        "returning id ) select count(*)::integer into v_count from claimed c where exists ( select 1 from public.media m where m.guest_id = c.id and m.status <> 'removed' );",
      );
      // The name on an asked ticket is not hers: that is why she was asked.
      expect(body).not.toContain("public.profiles");
    });
  });
});

describe("the join waits for the door (crumbs-24, 20260930100000)", () => {
  // crumbs-21's find: create_guest read the door with no lock the host's move waits on, so an ask minted in
  // the instant a door became a password stood at the password until the door moved again (and one minted
  // as the door turned Public, or as the list became the door, was never let in). The file's foot holds the
  // two-session proof, red on the bodies before it. Each pin reads CODE (comments stripped).
  const FILE = "20260930100000_the_join_waits_for_the_door.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const READ =
    "select * into v_event from public.events where qr_token = p_qr_token and deleted_at is null for share;";

  /** Every live function's winning body, as code (comments stripped, whitespace collapsed), in one pass over the set. */
  function latestBodies(): Map<string, string> {
    return new Map(liveFunctions().map((fn) => [fn.name, fn.code]));
  }

  it("★ both mints of an ask read the door under its row's share lock, before anything else", () => {
    for (const name of ["create_guest", "ask_to_join"]) {
      const body = code(name);
      expect(body, name).toContain(READ);
      // Its first lock, taken holding nothing: nothing reads a table before it, so it adds no deadlock.
      expect(body.indexOf(READ), name).toBeLessThan(
        body.indexOf("public.event_block_holds_account"),
      );
      expect(body.indexOf(READ), name).toBeLessThan(
        body.indexOf("from auth.users"),
      );
    }
  });

  it("★ no other body mints a waiting ticket: a new mint of an ask takes the lock too, or strands its ask", () => {
    const minting = [...latestBodies()]
      .filter(
        ([, body]) =>
          /insert into public\.guests\b/.test(body) && /'waiting'/.test(body),
      )
      .map(([name]) => name)
      .sort();
    expect(minting).toEqual(["ask_to_join", "create_guest"]);
  });

  it("the share lock conflicts with what every move of the door takes (and a share lock with no join)", () => {
    // set_event_door locks the row before it writes; set_event_password's update of it takes the same lock.
    expect(code("set_event_door")).toContain(
      "where e.id = p_event_id and e.host_id = v_uid and e.deleted_at is null for no key update;",
    );
    expect(code("set_event_password")).toContain(
      "update public.events set event_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')), visibility = 'password', gate = null",
    );
  });

  it("keeps both the service role's alone, restated in the file", () => {
    expect(sql).toContain(
      "revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated; grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;",
    );
    expect(sql).toContain(
      "revoke all on function public.ask_to_join(text, uuid) from public, anon, authenticated; grant execute on function public.ask_to_join(text, uuid) to service_role;",
    );
  });
});

describe("the claim says what it left for another address (crumbs-24, 20260930110000)", () => {
  // shared-claims' second Question: a keep confirmed with another address than the one typed at the door
  // leaves her photos waiting under the typed one, rightly unasked, and the phone never learned where they
  // wait. The ask read now answers those tickets too, WHETHER and never WHAT.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));

  it("★ answers each held ticket typed under an address that is not hers, with a live upload, past the door and no block", () => {
    const ask = code("claim_ticket_asks");
    expect(ask).toContain(
      "where g.session_token = any (p_session_tokens) and g.user_id is null and g.verified_at is null and g.pending_email is not null and g.admission = 'in' and not public.event_block_holds_row(g) and not public.event_block_holds_account(g.event_id, v_uid) and public.whose_ticket(g, v_uid) = 'theirs' and m.n > 0",
    );
    expect(ask).toContain("return v_asks || v_left;");
  });

  it("★ one entry a ticket, `kind` address, with no name (a build before it reads past), the caller's own token and nothing else", () => {
    const ask = code("claim_ticket_asks");
    expect(ask).toContain(
      "jsonb_build_object('kind', 'address', 'uploads', t.uploads, 'tokens', array[t.token])",
    );
    const left = ask.slice(ask.indexOf("jsonb_build_object('kind', 'address'"));
    expect(left.slice(0, left.indexOf("into v_left"))).not.toContain("'name'");
    for (const secret of ["pending_email", "email", "event_id", "id"]) {
      expect(left.slice(0, left.indexOf("into v_left"))).not.toContain(
        `'${secret}'`,
      );
    }
  });

  it("still answers only a confirmed account, and stays authenticated-only", () => {
    expect(code("claim_ticket_asks")).toContain(
      "if v_confirmed is null then return '[]'::jsonb; end if;",
    );
    expect(grants("claim_ticket_asks")).toContain(
      "revoke all on function public.claim_ticket_asks(text[]) from public, anon; grant execute on function public.claim_ticket_asks(text[]) to authenticated;",
    );
  });
});

describe("the instant hide's bar: three strikes that lapse, in one home both readers ask (hide-strikes 20260930120000, crumbs-33 20261001100000)", () => {
  // Will, 2026-09-30, overruling call B: "I don't want to prevent a well-meaning reporter from a second report
  // if I simply disagree with the first." One dismissed child-abuse report used to bar its address from the
  // instant hide for good (20260929140000). Now a strike is a child-abuse report from the address that the
  // operator dismissed, it lapses 180 days after its dismissal, and three live ones bar the hide. The count
  // reads the reports as they stand, so a dismissal's Undo (which clears `resolved_at` with the status) takes
  // its strike back. ★ Since crumbs-33 the rule lives in `report_strikes`, which create_report asks and the
  // portal's queue reads, so the line that tells the operator an address's strikes can never count by another
  // rule (these pins read create_report's inline count until it moved). Each pin reads CODE (comments
  // stripped), latest wins.
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const grants = (name: string) =>
    collapse(latestDefinition(name).file.replace(/--[^\n]*/g, ""));

  it("★ counts the address's live strikes: its child-abuse reports dismissed inside the window, by the dismissal's own time", () => {
    const fn = code("report_strikes");
    expect(fn).toContain(
      "where r.kind = 'child' and r.status = 'dismissed' and r.resolved_at > now() - c_strike_lapse",
    );
    expect(fn).toContain("'barred', t.live >= c_strikes");
    // The newest c_strikes lapses, newest first: when the c_strikes-th newest lapses, the bar lifts.
    expect(fn).toContain(
      "row_number() over (partition by r.reporter_hash order by r.resolved_at desc, r.id desc) as nth",
    );
    expect(fn).toContain(
      "jsonb_agg(s.lapses_at order by s.nth) filter (where s.nth <= c_strikes)",
    );
  });

  it("★ names the two numbers once, where the rule lives: three strikes, each lapsing 180 days after its dismissal", () => {
    const fn = code("report_strikes");
    expect(fn).toContain("c_strikes constant integer := 3;");
    expect(fn).toContain(
      "c_strike_lapse constant interval := interval '180 days';",
    );
    expect(fn.match(/180/g)).toHaveLength(1);
    expect(fn.match(/r\.status = 'dismissed'/g)).toHaveLength(1);
  });

  it("★ create_report asks the one home, holds no number or dismissal of its own, and never bars an address for good", () => {
    const fn = code("create_report");
    expect(fn).toContain(
      "and not coalesce( (public.report_strikes(array[p_reporter_hash]) #>> array['addresses', p_reporter_hash, 'barred'])::boolean, false)",
    );
    expect(fn).not.toMatch(/180|c_strike|'dismissed'/);
    expect(fn).not.toMatch(
      /not exists \( select 1 from public\.reports r where r\.reporter_hash = p_reporter_hash/,
    );
  });

  it("keeps the signature the deployed route calls by name, DEFINER with an empty search_path, the service role's alone", () => {
    expect(code("create_report")).toContain(
      "function public.create_report( p_qr_token text, p_media_id uuid default null, p_reason text default null, p_kind public.report_kind default 'other', p_reporter_user_id uuid default null, p_reporter_email text default null, p_reporter_hash text default null ) returns jsonb language plpgsql security definer set search_path = '' as $$",
    );
    expect(grants("create_report")).toContain(
      "revoke all on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text) from public, anon, authenticated; grant execute on function public.create_report(text, uuid, text, public.report_kind, uuid, text, text) to service_role;",
    );
  });

  it("★ report_strikes is an INVOKER read the service role alone may call, one jsonb (no row cap)", () => {
    expect(code("report_strikes")).toContain(
      "function public.report_strikes(p_reporter_hashes text[]) returns jsonb language plpgsql stable security invoker set search_path = '' as $$",
    );
    expect(grants("report_strikes")).toContain(
      "revoke all on function public.report_strikes(text[]) from public, anon, authenticated; grant execute on function public.report_strikes(text[]) to service_role;",
    );
  });
});

describe("no door's opening admits a blocked ask, and the door's asks are read once (crumbs-29, 20260930130000)", () => {
  // Build 30's red-team: a declined newcomer (a decline is a block that keeps her ask waiting, for Undo) was let in
  // by a Public trip, events_door_opened admitting every waiting row, and Let back in then walked her into an album
  // whose host never let her in. And (ROADMAP, from crumbs-23) the list's twins spelled one predicate twice. Each pin
  // reads CODE (comments stripped), latest wins; each grant the file's executable SQL.
  const FILE = "20260930130000_the_door_admits_no_block.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));
  const ASKS = "public.event_door_asks(";

  /** Every live function's winning body, as code (comments stripped, whitespace collapsed), in one pass over the set. */
  function winningBodies(): Map<string, string> {
    return new Map(liveFunctions().map((fn) => [fn.name, fn.code]));
  }

  it("★ the asks a door may let in, read once: every waiting row of a live event no block holds, and whether the list names it", () => {
    const asks = code("event_door_asks");
    expect(asks).toContain(
      "create function public.event_door_asks(p_event_id uuid) returns table (guest_id uuid, user_id uuid, listed boolean) language sql stable set search_path = ''",
    );
    expect(asks).not.toContain("security definer");
    expect(asks).toContain(
      "(g.user_id is not null and public.event_door_lists_account(p_event_id, g.user_id))",
    );
    expect(asks).toContain(
      "where g.event_id = p_event_id and e.deleted_at is null and g.admission = 'waiting' and not public.event_block_holds_account(p_event_id, g.user_id) and not public.event_block_holds_row(g);",
    );
  });

  it("★ its EXECUTE is the owner's alone: no role PostgREST serves can call it, so it pages nothing", () => {
    expect(sql).toContain(
      "revoke all on function public.event_door_asks(uuid) from public, anon, authenticated, service_role;",
    );
    for (const { file, sql: text } of executableMigrations()) {
      expect(text, file).not.toMatch(
        /grant [^;]* on function public\.event_door_asks\(/,
      );
    }
  });

  it("★ the list's twins both read it and neither spells it (the parity guard)", () => {
    const admit = code("event_door_admit_listed");
    const count = code("event_door_waiting_listed");
    expect(admit).toContain(
      `from ${ASKS}p_event_id) a where g.id = a.guest_id and a.listed returning g.user_id`,
    );
    expect(count).toContain(
      `select count(distinct a.user_id)::integer from ${ASKS}p_event_id) a join public.events e on e.id = p_event_id where a.listed and a.user_id is distinct from e.host_id;`,
    );
    for (const [name, body] of [
      ["event_door_admit_listed", admit],
      ["event_door_waiting_listed", count],
    ]) {
      for (const predicate of [
        "public.event_door_lists_account(",
        "public.event_block_holds_account(",
        "public.event_block_holds_row(",
        "admission = 'waiting'",
      ]) {
        expect(body, `${name} spells ${predicate} itself`).not.toContain(
          predicate,
        );
      }
    }
    // Still the DEFINER it was: event_door_counts (INVOKER, the service role's) asks it, and the list's match
    // reads auth.users.
    expect(count).toContain("security definer");
  });

  it("★ no body lets a waiting row in but through the door's asks, or the host's own answer, which refuses a held row", () => {
    const admitting = [...winningBodies()]
      .filter(([, body]) => body.includes("set admission = 'in'"))
      .map(([name]) => name)
      .sort();
    expect(admitting).toEqual([
      "event_door_admit_listed",
      "events_door_opened",
      "let_back_in",
      "let_in_at_door",
    ]);
    for (const [name, body] of winningBodies()) {
      if (!admitting.includes(name)) continue;
      for (const statement of body.split(";")) {
        if (!statement.includes("set admission = 'in'")) continue;
        if (name === "let_in_at_door") {
          expect(
            body.indexOf(
              "if public.event_block_holds_row(v_guest) then return jsonb_build_object('ok', false, 'reason', 'blocked');",
            ),
            name,
          ).toBeGreaterThan(-1);
          continue;
        }
        expect(statement, name).toContain(`from ${ASKS}`);
      }
    }
  });

  it("the Public door lets every ask in and counts exactly those; Let back in lets in at Public the ask its block held, and says so", () => {
    expect(code("events_door_opened")).not.toContain("a.listed");
    expect(code("set_event_door")).toContain(
      `select count(distinct coalesce(a.user_id::text, a.guest_id::text))::integer into v_waiting from ${ASKS}v_event.id) a;`,
    );
    const lift = code("let_back_in");
    const opened = lift.indexOf(
      "if exists (select 1 from public.events e where e.id = v_block.event_id and e.visibility = 'open') then with opened as ( update public.guests g set admission = 'in' from public.event_door_asks(v_block.event_id) a where g.id = a.guest_id",
    );
    expect(opened).toBeGreaterThan(
      lift.indexOf("delete from public.event_blocks where id = v_block.id;"),
    );
    expect(lift).toContain("'admitted', v_admitted + v_opened");
  });

  it("restates the five's grants exactly as they stood", () => {
    for (const signature of [
      "public.event_door_admit_listed(uuid)",
      "public.event_door_waiting_listed(uuid)",
    ]) {
      expect(sql).toContain(
        `revoke all on function ${signature} from public, anon, authenticated; grant execute on function ${signature} to service_role;`,
      );
    }
    expect(sql).toContain(
      "revoke all on function public.events_door_opened() from public, anon, authenticated;",
    );
    for (const signature of [
      "public.set_event_door(uuid, text)",
      "public.let_back_in(uuid, boolean)",
    ]) {
      expect(sql).toContain(
        `revoke all on function ${signature} from public, anon, authenticated; grant execute on function ${signature} to authenticated;`,
      );
    }
  });
});

describe("one account, one ticket at an album (crumbs-29, 20260930140000)", () => {
  // Build 30's red-team: on a shared phone the queue's silent join and the page's own raced, create_guest always
  // inserted, and each album minted two rows of hers in one second; the phone kept the empty one. Both mints now
  // answer the ticket a confirmed account holds there. Each pin reads CODE (comments stripped), latest wins.
  const FILE = "20260930140000_one_account_one_ticket.sql";
  const sql = collapse(
    readFileSync(join(MIGRATIONS_DIR, FILE), "utf8").replace(/--[^\n]*/g, ""),
  );
  const code = (name: string) =>
    collapse(latestDefinition(name).body.replace(/--[^\n]*/g, ""));

  it("★ her ticket is read under a lock on the album and the account, taken before the read", () => {
    const ticket = code("event_account_ticket");
    const lock = ticket.indexOf(
      "perform pg_catalog.pg_advisory_xact_lock( pg_catalog.hashtextextended('guest_ticket:' || p_event_id::text || ':' || p_user_id::text, 0));",
    );
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(ticket.indexOf("select g.* into v_ticket"));
    expect(ticket).toContain(
      "where g.event_id = p_event_id and g.user_id = p_user_id and g.verified_at is not null and g.admission = p_admission and not public.event_block_holds_row(g) order by g.created_at desc, g.id desc limit 1;",
    );
    expect(ticket).not.toContain("security definer");
    expect(ticket).toContain("set search_path = ''");
  });

  it("★ it answers a whole row, its ticket in it, so its EXECUTE is the owner's alone", () => {
    expect(sql).toContain(
      "revoke all on function public.event_account_ticket(uuid, uuid, public.guest_admission) from public, anon, authenticated, service_role;",
    );
    for (const { file, sql: text } of executableMigrations()) {
      expect(text, file).not.toMatch(
        /grant [^;]* on function public\.event_account_ticket\(/,
      );
    }
  });

  it("★ both mints answer it once the door has decided, before they insert: a confirmed join, and every ask", () => {
    const join = code("create_guest");
    const answer = join.indexOf(
      "if v_confirmed is not null then v_held := public.event_account_ticket(v_event.id, v_uid, v_admission); if v_held.id is not null then return jsonb_build_object(",
    );
    expect(answer).toBeGreaterThan(
      join.indexOf("if v_event.gate is not null and not v_in then"),
    );
    expect(answer).toBeLessThan(join.indexOf("insert into public.guests"));
    const ask = code("ask_to_join");
    const asked = ask.indexOf(
      "v_held := public.event_account_ticket(v_event.id, p_user_id, v_admission); if v_held.id is not null then return jsonb_build_object(",
    );
    expect(asked).toBeGreaterThan(ask.indexOf("v_admission := case"));
    expect(asked).toBeLessThan(ask.indexOf("insert into public.guests"));
  });

  it("the answer is a mint's own shape, and never an address", () => {
    const join = code("create_guest");
    const answer = join.slice(
      join.indexOf("v_held := public.event_account_ticket("),
      join.indexOf("v_session_token := replace("),
    );
    for (const key of [
      "'session_token', v_held.session_token",
      "'guest_id', v_held.id",
      "'event_id', v_event.id",
      "'display_name', v_held.display_name",
      "'verified', true",
      "'email_attached', (v_held.pending_email is not null)",
      "'admission', v_held.admission",
    ]) {
      expect(answer).toContain(key);
    }
    expect(answer).not.toMatch(/'(email|pending_email)',/);
  });

  it("the door's share lock stays each mint's first; the account's comes after it", () => {
    for (const name of ["create_guest", "ask_to_join"]) {
      const body = code(name);
      expect(body.indexOf("for share;"), name).toBeGreaterThan(-1);
      expect(body.indexOf("for share;"), name).toBeLessThan(
        body.indexOf("public.event_account_ticket("),
      );
    }
  });

  it("keeps both mints the service role's, restated in the file", () => {
    expect(sql).toContain(
      "revoke execute on function public.create_guest(text, uuid, boolean, text, text) from public, anon, authenticated; grant execute on function public.create_guest(text, uuid, boolean, text, text) to service_role;",
    );
    expect(sql).toContain(
      "revoke all on function public.ask_to_join(text, uuid) from public, anon, authenticated; grant execute on function public.ask_to_join(text, uuid) to service_role;",
    );
  });
});

describe("a report is open exactly when it has no resolved_at (crumbs-29, 20260930150000)", () => {
  // ROADMAP, from hide-strikes: the instant hide's strikes lapse from a dismissal's own time, so a close written
  // without it would count as no strike. The CHECK refuses one at run time; the source pin below at test time.

  it("★ the CHECK stands, the rule verbatim, and no later file drops it", () => {
    let standing: string | null = null;
    for (const { sql } of executableMigrations()) {
      for (const [statement, verb] of sql.matchAll(
        /alter table (?:only )?public\.reports (add|drop) constraint (?:if exists )?reports_resolved_when_closed\b[^;]*;/g,
      )) {
        standing = verb === "add" ? statement : null;
      }
    }
    expect(standing).toBe(
      "alter table public.reports add constraint reports_resolved_when_closed check ((status = 'open') = (resolved_at is null));",
    );
  });

  it("★ every write of a report's status in the app writes its resolved_at beside it", () => {
    const writes: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (
          /\.tsx?$/.test(entry.name) &&
          !/\.test\.tsx?$/.test(entry.name)
        ) {
          const source = collapse(readFileSync(path, "utf8"));
          for (const [, fields] of source.matchAll(
            /\.from\("reports"\) \.update\(\{([^}]*)\}\)/g,
          )) {
            if (/\bstatus:/.test(fields)) writes.push(`${path}: ${fields}`);
          }
        }
      }
    };
    walk(join(ROOT, "src"));
    // The portal's close, its reopen and the Undo of an action: the scan is not vacuous.
    expect(writes.length).toBeGreaterThanOrEqual(3);
    for (const write of writes) {
      expect(write).toMatch(/\bresolved_at:/);
    }
  });
});

describe("the newsletter row follows the address (crumbs-33, 20261001110000)", () => {
  // ROADMAP, from identity-email: an email change left `newsletter_signups` on the old address, so the /account
  // marketing switch, which reads and removes by the address the account holds, could neither see the old row
  // nor take it off, and a first sender would mail an address its owner had left. The row moves with the change,
  // inside GoTrue's commit (the only place that sees every change: both codes, a link tapped in another browser,
  // an operator's update). Each pin reads CODE (comments stripped), latest wins.
  const code = () =>
    collapse(
      latestDefinition("handle_user_email_change").body.replace(
        /--[^\n]*/g,
        "",
      ),
    );

  it("★ moves the account's row to the new address, in the list's own form, and drops the old", () => {
    const fn = code();
    expect(fn).toContain(
      "v_old text := lower(btrim(coalesce(old.email, ''))); v_new text := lower(btrim(coalesce(new.email, '')));",
    );
    expect(fn).toContain(
      "if v_old <> '' and v_new <> '' and v_old <> v_new then begin update public.newsletter_signups n set email = v_new where n.email = v_old and not exists (select 1 from public.newsletter_signups m where m.email = v_new); exception when unique_violation then null; end; delete from public.newsletter_signups n where n.email = v_old; end if;",
    );
  });

  it("★ still returns first for an account being deleted, before any copy or move", () => {
    const fn = code();
    const guard = fn.indexOf(
      "if exists ( select 1 from public.profiles p where p.id = new.id and p.deletion_requested_at is not null ) then return null; end if;",
    );
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(fn.indexOf("update public.profiles p"));
    expect(guard).toBeLessThan(fn.indexOf("public.newsletter_signups"));
  });

  it("keeps the copies it already made and stays trivial: no raise, no dynamic SQL, no client role", () => {
    const fn = code();
    expect(fn).toContain(
      "update public.profiles p set email = new.email where p.id = new.id and p.email is distinct from new.email;",
    );
    expect(fn).toContain(
      "update public.guests g set email = nullif(btrim(coalesce(new.email, '')), '') where g.user_id = new.id and g.verified_at is not null",
    );
    expect(fn).not.toMatch(/\braise\b|\bexecute\b/);
    expect(fn).toContain(
      "returns trigger language plpgsql security definer set search_path = ''",
    );
    expect(
      collapse(
        latestDefinition("handle_user_email_change").file.replace(
          /--[^\n]*/g,
          "",
        ),
      ),
    ).toContain(
      "revoke execute on function public.handle_user_email_change() from public, anon, authenticated;",
    );
  });
});
