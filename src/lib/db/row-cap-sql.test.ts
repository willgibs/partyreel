/**
 * THE ROW CAP, ON THE SQL SIDE (the 1,000-row round, migrations 20260924010000/020000/030000).
 *
 * PostgREST cuts every table read and every set-returning RPC at `max_rows` (1,000 on this project,
 * `supabase/config.toml` [api]) with no error and no flag. The TypeScript side reads through
 * `readAllPages`, which takes a page shorter than it asked for as the end; the SQL side's half of the
 * contract is that no set-returning function can hand PostgREST more rows than one page. So every
 * set-returning function's WINNING definition either:
 *   * pages: takes a keyset cursor (a parameter named p_after* or p_before*) and `p_limit`, and
 *     clamps it in SQL with `least(p_limit, <max_rows>)`, or
 *   * returns at most one row by construction, and sits on SINGLE_ROW with the reason, or
 *   * is bounded by its callers on purpose, and sits on CALLER_BOUNDED with the reason.
 * A function that returns one value (a scalar, a jsonb, a uuid[]) is not set-returning at all, which is
 * how this round answers counts, covers, holds and metrics.
 *
 * ★ DROP-AWARE. `migration-guards.test.ts`' latestDefinition sees only `create` statements, so a
 * function that a later file drops (20260923130000 drops `get_saved_events`) would still look alive
 * there. This reader replays creates AND drops in file order, so the list below is what the live
 * database holds, and each allow-list entry must still describe a live function (a stale entry fails,
 * the way a baseline that may only shrink does).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

/** The live cap, read from the one place it is declared for this project. */
const MAX_ROWS = (() => {
  const toml = readFileSync(join(ROOT, "supabase", "config.toml"), "utf8");
  const api = toml.slice(toml.indexOf("[api]"));
  const match = api
    .slice(0, api.indexOf("\n[", 1))
    .match(/^max_rows = (\d+)$/m);
  if (!match) throw new Error("supabase/config.toml has no [api] max_rows");
  return Number(match[1]);
})();

/**
 * One row by construction. Each entry is WHY, and the test below fails if an entry stops being a
 * live set-returning function without p_limit (then it no longer belongs here).
 */
const SINGLE_ROW: Record<string, string> = {
  get_event_by_qr_token:
    "keyed on events.qr_token, which is UNIQUE: zero rows or one",
  host_storage_summary: "one aggregate row (two SUMs, no GROUP BY)",
  tier_limits: "one row: the tier's limits, a constant per tier",
  purge_media_rows:
    "one row per host among at most its input; callers pass at most 1,000 ids (the cron) and purge_media_now sums it in SQL",
};

/**
 * Take p_limit but deliberately never page. Each entry is WHY; a stale entry fails too.
 */
const CALLER_BOUNDED: Record<string, string> = {
  get_my_uploads:
    "the owner's Uploads feed reads the newest p_limit (the app asks 200) and flags `truncated`, so the page says so; no cursor by design",
  get_my_likes:
    "the owner's Likes feed reads the newest p_limit (the app asks 200) and flags `truncated`, so the page says so; no cursor by design",
};

type Definition = {
  file: string;
  /** From `create` to the body's closing dollar-quote, comments stripped, whitespace collapsed. */
  sql: string;
  /** The parameter list between the name's parens. */
  params: string;
  /** What follows RETURNS, up to the language/volatility clauses. */
  returns: string;
};

/** Strip `--` comments (a quoted example is not code) and collapse whitespace. */
function executable(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

/** The index of the paren that closes the one opened at `open`. */
function closingParen(sql: string, open: number): number {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/**
 * Every public function the migration set leaves standing, by name, with its winning definition:
 * creates and drops replayed statement by statement in file order.
 */
function liveFunctions(): Map<string, Definition> {
  const live = new Map<string, Definition>();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const statement =
    /\b(create (?:or replace )?function|drop function(?: if exists)?) public\.([a-z_0-9]+) ?\(/g;
  for (const file of files) {
    const sql = executable(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    for (const match of sql.matchAll(statement)) {
      const [, verb, name] = match;
      if (verb.startsWith("drop")) {
        live.delete(name);
        continue;
      }
      const open = match.index! + match[0].length - 1;
      const close = closingParen(sql, open);
      expect(
        close,
        `${file}: ${name}'s parameter list never closes`,
      ).toBeGreaterThan(open);
      const rest = sql.slice(close + 1);
      const opener = rest.match(/ as (\$[a-z_]*\$)/);
      expect(
        opener,
        `${file}: ${name} has no dollar-quoted body`,
      ).not.toBeNull();
      const bodyEnd = rest.indexOf(
        opener![1],
        opener!.index! + opener![0].length,
      );
      expect(bodyEnd, `${file}: ${name}'s body never closes`).toBeGreaterThan(
        0,
      );
      const returns = rest.match(
        /^ returns (.*?) (?:language|stable|immutable|volatile|security|set) /,
      );
      live.set(name, {
        file,
        sql:
          sql.slice(match.index!, close + 1) +
          rest.slice(0, bodyEnd + opener![1].length),
        params: sql.slice(open + 1, close).trim(),
        returns: returns ? returns[1] : "",
      });
    }
  }
  return live;
}

const LIVE = liveFunctions();
const setReturning = [...LIVE].filter(([, d]) =>
  /^(table|setof)\b/.test(d.returns),
);
const takesLimit = (d: Definition) =>
  /\bp_limit (?:integer|int)\b/.test(d.params);
const clamps = (d: Definition) => d.sql.includes(`least(p_limit, ${MAX_ROWS})`);

describe("the reader replays the set the way the database does", () => {
  it("is drop-aware: a function a later file drops is not live", () => {
    // 20260923130000_drop_saves.sql drops get_saved_events and save_event after an earlier file made them,
    // and the live reel's drop (20260924110000) takes the stored reel's one-row guest read.
    expect(LIVE.has("get_saved_events")).toBe(false);
    expect(LIVE.has("save_event")).toBe(false);
    expect(LIVE.has("get_event_reel_by_qr_token")).toBe(false);
  });

  it("sees the round's functions under their final signatures", () => {
    // The live reel's expand (20260924100000) recreated the album with reel_eligible appended to
    // its RETURNS TABLE and the row cap's four parameters untouched.
    expect(LIVE.get("get_event_media_by_qr_token")?.params).toBe(
      "p_qr_token text, p_before_created_at timestamptz default null, p_before_id uuid default null, p_limit integer default null",
    );
    expect(LIVE.get("get_event_media_by_qr_token")?.returns).toMatch(
      /^table\( id uuid, .*, created_at timestamptz, reel_eligible boolean \)$/,
    );
    expect(LIVE.get("list_guest_rows_by_email")?.params).toBe(
      "p_after_at timestamptz default null, p_after_id uuid default null, p_limit integer default null",
    );
    expect(LIVE.get("event_covers")?.returns).toBe("jsonb");
  });

  it("finds a real population of set-returning functions (the scan is not vacuous)", () => {
    expect(setReturning.length).toBeGreaterThanOrEqual(10);
  });
});

describe("every set-returning function pages, or returns one row", () => {
  it("the SQL clamp is the live cap declared in supabase/config.toml", () => {
    expect(MAX_ROWS).toBe(1000);
  });

  for (const [name, def] of setReturning) {
    it(`${name} (${def.file})`, () => {
      if (name in SINGLE_ROW) {
        expect(
          takesLimit(def),
          `${name} takes p_limit: move it off SINGLE_ROW`,
        ).toBe(false);
        return;
      }
      expect(
        takesLimit(def),
        `${name} returns a set with no p_limit: page it (a keyset cursor and least(p_limit, ${MAX_ROWS})) or put it on SINGLE_ROW with the reason`,
      ).toBe(true);
      if (name in CALLER_BOUNDED) {
        expect(
          clamps(def),
          `${name} clamps now: move it off CALLER_BOUNDED`,
        ).toBe(false);
        return;
      }
      expect(
        clamps(def),
        `${name} must clamp with least(p_limit, ${MAX_ROWS})`,
      ).toBe(true);
      expect(
        /\bp_(after|before)[a-z_]* /.test(def.params),
        `${name} takes p_limit but no keyset cursor (a p_after* or p_before* parameter)`,
      ).toBe(true);
    });
  }
});

describe("the allow-lists only name live functions they still describe", () => {
  for (const [name, why] of Object.entries({
    ...SINGLE_ROW,
    ...CALLER_BOUNDED,
  })) {
    it(`${name}: ${why}`, () => {
      const def = LIVE.get(name);
      expect(def, `${name} is no longer defined: drop its entry`).toBeDefined();
      expect(
        /^(table|setof)\b/.test(def!.returns),
        `${name} no longer returns a set: drop its entry`,
      ).toBe(true);
      expect(why.length).toBeGreaterThan(20);
    });
  }
});

describe("a NULL p_limit on a paged function means 'no limit', never a silent 1,000", () => {
  // `least` IGNORES a null argument, so a bare `limit least(p_limit, 1000)` answers a call without
  // p_limit with 1,000 rows from SQL: exactly the silent cut this round removes, moved into the
  // database. Every paged function spells the rule out instead (the deployed builds call without it).
  for (const [name, def] of setReturning) {
    if (!takesLimit(def) || name in CALLER_BOUNDED) continue;
    it(name, () => {
      expect(def.sql).toContain(
        `limit case when p_limit is null then null else least(p_limit, ${MAX_ROWS}) end`,
      );
      expect(def.params).toContain("p_limit integer default null");
    });
  }
});
