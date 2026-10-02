/**
 * THE STRIKE'S LAPSE, ANSWERED BY THE RULE (lane `crumbs-41`, 20261001233100), resolved LATEST-WINS across the whole
 * migration set the way `db/migration-guards.test.ts` resolves its own, so a later `create or replace` of
 * `report_strikes` that drops one of these fails here, by name. Its own file, because other lanes write migrations
 * beside this one.
 *
 * What it pins:
 *   1. ★ `report_strikes` answers its lapse as a duration, `lapse_seconds`, read off the one constant that defines it
 *      (`c_strike_lapse`), so no reader derives the lapse from `fresh_lapses_at` and a clock, and the reopen of a
 *      child-abuse dismissal (Will's #60) and every closed line read the rule's own number.
 *   2. ★ That constant is whole DAYS: `resolved_at + lapse_seconds` lands where the rule's `resolved_at +
 *      c_strike_lapse` does only while the interval has no months (a month's epoch is 30 days, its arithmetic the
 *      calendar's), so a rule that moves to months must answer instants instead, and this says so first.
 *   3. It stays the service role's alone (the reads are the portal's, behind requireAdmin and AAL2).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const FILES = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** Strip `--` comments (a quoted example is not code) and collapse whitespace. */
function executable(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

const SQL = FILES.map((file) => ({
  file,
  sql: executable(readFileSync(join(MIGRATIONS_DIR, file), "utf8")),
}));

/** The winning definition of `public.report_strikes`: the last file that creates it, and its body. */
function latestStrikes(): { file: string; body: string } {
  let found: { file: string; body: string } | null = null;
  const opener = /create (?:or replace )?function public\.report_strikes ?\(/g;
  for (const { file, sql } of SQL) {
    for (const match of sql.matchAll(opener)) {
      const rest = sql.slice(match.index!);
      const tag = rest.match(/ as (\$[a-z_]*\$)/)!;
      const start = tag.index! + tag[0].length;
      found = { file, body: rest.slice(start, rest.indexOf(tag[1], start)) };
    }
  }
  if (!found) throw new Error("public.report_strikes is never created");
  return found;
}

describe("report_strikes answers its lapse as a duration (crumbs-41, 20261001233100)", () => {
  it("★ the winning definition answers `lapse_seconds`, the whole seconds of the one constant", () => {
    const { body } = latestStrikes();
    expect(body).toContain(
      "'lapse_seconds', extract(epoch from c_strike_lapse)::bigint",
    );
    // Beside the rule's other two answers, which every reader still takes.
    expect(body).toContain("'strikes', c_strikes");
    expect(body).toContain("'fresh_lapses_at', now() + c_strike_lapse");
  });

  it("★ the lapse is whole days, never months, so `resolved_at + lapse_seconds` is the rule's own instant", () => {
    const { body } = latestStrikes();
    const lapse =
      /c_strike_lapse constant interval := interval '([^']+)';/.exec(body);
    expect(lapse, "c_strike_lapse is declared as one interval").not.toBeNull();
    expect(lapse![1]).toMatch(/^\d+ days?$/);
  });

  it("stays the service role's alone, revoked from every client role first", () => {
    const statement =
      /(?:grant|revoke) [^;]* on function public\.report_strikes\(text\[\]\) [^;]*;/g;
    const grants = SQL.flatMap(({ sql }) =>
      [...sql.matchAll(statement)].map((m) => m[0]),
    );
    expect(grants.at(-2)).toBe(
      "revoke all on function public.report_strikes(text[]) from public, anon, authenticated;",
    );
    expect(grants.at(-1)).toBe(
      "grant execute on function public.report_strikes(text[]) to service_role;",
    );
  });
});
