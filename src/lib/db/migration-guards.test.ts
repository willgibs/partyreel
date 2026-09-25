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
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

/** Whitespace-tolerant: the shape is the contract, never the SQL's line breaks. */
function collapse(sql: string): string {
  return sql.replace(/\s+/g, " ");
}

/** Every migration, in timestamp order, as one string — for facts that are not a function body. */
function allMigrations(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
}

/**
 * The definition that actually WINS on the live DB: the LAST `create [or replace] function
 * public.<name>(` across the migration set in timestamp order, sliced to its closing dollar-quote
 * (bodies use `$$` and `$function$`; the tag is read from the `as $tag$` opener so either works).
 * Returns the winning body and the whole winning FILE (grants live outside the body).
 */
function latestDefinition(name: string): { body: string; file: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let latest: { body: string; file: string } | null = null;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    // The open paren keeps create_media from matching create_media_as_host.
    const starts = [
      sql.indexOf(`create or replace function public.${name}(`),
      sql.indexOf(`create function public.${name}(`),
    ].filter((i) => i !== -1);
    if (starts.length === 0) continue;
    const start = Math.min(...starts);
    const opener = sql.slice(start).match(/as \$([a-z_]*)\$/);
    expect(opener, `${file}: ${name} has no dollar-quoted body`).not.toBeNull();
    const tag = `$${opener![1]}$`;
    const bodyStart = start + opener!.index! + opener![0].length;
    const close = sql.indexOf(`${tag};`, bodyStart);
    expect(close, `${file}: ${name} body never closes`).toBeGreaterThan(start);
    latest = { body: sql.slice(start, close + tag.length + 1), file: sql };
  }
  expect(latest, `${name} defined nowhere`).not.toBeNull();
  return latest!;
}

/**
 * Every migration's EXECUTABLE SQL, one entry per file in timestamp order: line comments stripped
 * first (a grant or a policy quoted in prose is not a grant or a policy), then whitespace collapsed.
 */
function executableMigrations(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: collapse(
        readFileSync(join(MIGRATIONS_DIR, file), "utf8").replace(
          /--[^\n]*/g,
          "",
        ),
      ),
    }));
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

  it("restore_media locks the host's profiles row before the capacity gate", () => {
    expect(latestDefinition("restore_media").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
  });

  it("restore_event locks the host's profiles row before the slot + capacity gates", () => {
    expect(latestDefinition("restore_event").body).toContain(
      "from public.profiles where id = v_event.host_id for update",
    );
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
    // The column list grew by the guest identity round's two columns (20260922120000); what this
    // pins is that `email` and `verified_at` are still written from the SERVER-read auth.users row
    // and in that order, never from a client value.
    expect(body).toContain(
      "insert into public.guests (event_id, user_id, email, session_token, display_name, verified_at, pending_email, pending_email_at)",
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
    const body = collapse(latestDefinition("get_event_by_qr_token").body);
    expect(body).toContain(
      "(e.visibility <> 'open' and e.host_id is distinct from (select auth.uid())) as hide_meta",
    );
    expect(body).toContain(
      "(e.visibility = 'private' and e.host_id is distinct from (select auth.uid())) as hide_name",
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
    expect(latestDefinition("get_event_by_qr_token").file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
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
    expect(file).toContain(
      "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
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
    // presign would refuse anyway.
    const ctx = latestDefinition("get_upload_context").body;
    for (const expr of [
      "public.host_active_bytes(v_event.host_id) >= v_cap + (v_cap / 10)",
      "coalesce(v_month_bytes, 0) >= v_ingress_cap",
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
    // upload history." A sweep added later would quietly delete a guest's claim ticket.
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
      expect(code("get_event_like_counts")).toContain(
        "create function public.get_event_like_counts( p_event_id uuid, p_after uuid default null, p_limit integer default null ) returns table (media_id uuid, like_count integer) language sql stable security definer set search_path = ''",
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
      const file = grants("get_event_like_counts");
      expect(file).toContain(
        "drop function public.get_event_like_counts(uuid);",
      );
      expect(file).toContain(
        "revoke all on function public.get_event_like_counts(uuid, uuid, integer) from public, anon, authenticated;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_like_counts(uuid, uuid, integer) to authenticated;",
      );
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
    it("event_card_stats is SECURITY INVOKER, answers every input id, and counts outside the bin", () => {
      const body = code("event_card_stats");
      expect(body).toContain(
        "create function public.event_card_stats(p_event_ids uuid[]) returns jsonb language sql stable security invoker set search_path = ''",
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
        "create function public.event_covers(p_event_ids uuid[]) returns jsonb language sql stable security invoker set search_path = ''",
      );
      expect(body).toContain(
        "select distinct on (m.event_id) m.event_id, m.preview_key, m.original_key from public.media m where m.event_id = any(p_event_ids) and m.status = 'approved' and m.type = 'photo' and m.removed_at is null order by m.event_id, m.created_at desc, m.id desc",
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

    it("replaces the no-argument signature in the same file (PostgREST forbids overloads)", () => {
      const file = grants("list_guest_rows_by_email");
      const drop = file.indexOf(
        "drop function public.list_guest_rows_by_email();",
      );
      expect(drop).toBeGreaterThan(-1);
      expect(drop).toBeLessThan(
        file.indexOf("create function public.list_guest_rows_by_email("),
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
    it("held_event_ids answers ONE uuid[] of the events that hold anything", () => {
      expect(code("held_event_ids")).toContain(
        "create function public.held_event_ids(p_event_ids uuid[]) returns uuid[] language sql stable security invoker set search_path = '' as $$ select coalesce(array_agg(h.event_id order by h.event_id), '{}'::uuid[]) from ( select distinct m.event_id from public.media m where m.event_id = any(p_event_ids) and m.legal_hold_at is not null ) h; $$;",
      );
    });

    it("★ standby_hosts counts exactly the budget's bin: no system removal, no guest's own withdrawal, no hold", () => {
      expect(code("standby_hosts")).toContain(
        "where m.legal_hold_at is null and ( (m.status = 'removed' and not m.removed_by_system and not m.removed_by_uploader) or (m.status <> 'removed' and e.deleted_at is not null) )",
      );
    });

    it("standby_hosts pages on host id and lists only hosts with bytes", () => {
      const body = code("standby_hosts");
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

  describe("create_media and create_media_as_host: p_reel_eligible, last, every guard kept", () => {
    const shapes = {
      create_media: {
        params:
          "p_session_token text, p_media_id uuid, p_type public.media_type, p_original_key text, p_file_size_bytes bigint, p_preview_key text default null, p_duration_seconds double precision default null, p_width integer default null, p_height integer default null, p_reel_eligible boolean default true",
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
          "p_host_id uuid, p_event_id uuid, p_media_id uuid, p_type public.media_type, p_original_key text, p_file_size_bytes bigint, p_preview_key text default null, p_duration_seconds double precision default null, p_width integer default null, p_height integer default null, p_reel_eligible boolean default true",
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
    // what keeps a saved cut to a paid event), the ingress meter and the active-bytes cap.
    const shared = [
      "if p_original_key not like 'events/' || v_event.id::text || '/%' then raise exception 'Object key does not belong to this event.'",
      "if p_preview_key is not null and p_preview_key not like 'events/' || v_event.id::text || '/%' then raise exception 'Preview key does not belong to this event.'",
      "if p_file_size_bytes > c_max_upload_bytes then raise exception 'File exceeds the 10 GB maximum.'",
      "from public.profiles where id = v_event.host_id for update;",
      "if p_type = 'video' and v_profile.tier = 'free' then raise exception 'Video uploads are available on paid plans.'",
      "if coalesce(v_month_bytes, 0) + p_file_size_bytes > v_ingress_cap then raise exception 'Monthly upload limit reached for this plan.'",
      "if public.host_active_bytes(v_event.host_id) + p_file_size_bytes > v_cap + (v_cap / 10) then raise exception 'Storage capacity exceeded for this plan.'",
    ];

    for (const [name, shape] of Object.entries(shapes)) {
      const after = `${shape.before}, boolean`;

      it(`${name}: every earlier parameter by name, then p_reel_eligible defaulting to true`, () => {
        // PostgREST resolves by argument names, so the deployed calls (without the new one) still
        // land here, and the default makes what they upload play in the live reel.
        expect(code(name)).toContain(
          `create function public.${name}( ${shape.params} ) returns jsonb language plpgsql security definer set search_path`,
        );
      });

      it(`${name}: keeps every guard of its last definition`, () => {
        for (const guard of [...shared, ...shape.guards]) {
          expect(code(name), guard).toContain(guard);
        }
      });

      it(`${name}: writes reel_eligible, and an explicit null reads as the default`, () => {
        expect(code(name)).toContain(
          `insert into public.media ( id, event_id, guest_id, type, original_key, preview_key, file_size_bytes, duration_seconds, width, height, status, reel_eligible ) values ( p_media_id, v_event.id, ${shape.guest}, p_type, p_original_key, p_preview_key, p_file_size_bytes, p_duration_seconds, p_width, p_height, v_status, coalesce(p_reel_eligible, true) );`,
        );
      });

      it(`${name}: replaces its one signature in the same file and stays service-role only`, () => {
        const file = grants(name);
        const dropped = file.indexOf(
          `drop function public.${name}(${shape.before});`,
        );
        expect(dropped).toBeGreaterThan(-1);
        expect(dropped).toBeLessThan(
          file.indexOf(`create function public.${name}(`),
        );
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

    it("get_event_by_qr_token restates today's whole ACL: the client roles, PUBLIC and service_role", () => {
      const file = grants("get_event_by_qr_token");
      expect(file).toContain(
        "grant execute on function public.get_event_by_qr_token(text) to public, service_role;",
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
    // They sit in the host's column-scoped SELECT grant and MEDIA_HOST_COLUMNS, where a stale list is
    // a runtime 400 on every host read; max_reel_seconds is the cut's length cap now.
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
      expect(code("get_event_by_qr_token")).toBe(carried);
      expect(latestDefinition("get_event_by_qr_token").file).toContain(
        "reel_hold_sec",
      );
    });

    it("returns the hold after the reel's two settings, as a SECURITY DEFINER read with an empty search_path", () => {
      const body = code("get_event_by_qr_token");
      expect(body).toContain(
        "show_reel boolean, reel_style_id text, reel_hold_sec numeric) language sql stable security definer set search_path to ''",
      );
      expect(body).toContain(
        "e.show_reel, e.reel_style_id, e.reel_hold_sec from public.events e",
      );
      expect(body).toContain(
        "order by (e.qr_token = p_qr_token) desc limit 1;",
      );
    });

    it("drops the old signature first and restates the whole ACL (the client roles, PUBLIC and service_role)", () => {
      const file = grants("get_event_by_qr_token");
      const dropped = file.indexOf(
        "drop function public.get_event_by_qr_token(text);",
      );
      expect(dropped).toBeGreaterThan(-1);
      expect(dropped).toBeLessThan(
        file.indexOf("create function public.get_event_by_qr_token("),
      );
      expect(file).toContain(
        "grant execute on function public.get_event_by_qr_token(text) to anon, authenticated;",
      );
      expect(file).toContain(
        "grant execute on function public.get_event_by_qr_token(text) to public, service_role;",
      );
    });
  });

  describe("event_stills: the dashboard cards' stills, one jsonb", () => {
    it("is SECURITY INVOKER with an empty search_path and answers one jsonb (the row cap cannot cut it)", () => {
      expect(code("event_stills")).toContain(
        "create function public.event_stills(p_event_ids uuid[], p_per_event integer) returns jsonb language sql stable security invoker set search_path = ''",
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
        "where m.event_id = e.id and m.status = 'approved' and m.type = 'photo' and m.removed_at is null and m.preview_key is not null order by m.created_at desc, m.id desc limit least(greatest(p_per_event, 0), 12)",
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
