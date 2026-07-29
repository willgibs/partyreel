/**
 * The REAL tiers.ts <-> public.tier_limits() drift guard (QA #25).
 *
 * WHY this file exists: the block in tiers.test.ts that claimed to be the parity test only ever
 * re-asserted the TypeScript constants against themselves. It never opened the SQL, so the guard
 * every doc references ("a Vitest parity test guards the pairing") did not exist, and the two
 * halves of the pricing model, the TS numbers the UX quotes and the SQL numbers the upload RPCs
 * ENFORCE, could drift silently. A host could be shown 75 GB and be cut off at 2 GB (or the
 * reverse: sold a cap the DB never enforces).
 *
 * So: parse the newest committed definition of `public.tier_limits()` out of supabase/migrations
 * and compare every tier's every number against tiers.ts. Editing ONE side fails this test.
 *
 * TEXT-parsed, not executed: Vitest has no Postgres. The SQL fn is a pure `case p_tier` lookup,
 * which is exactly the shape a small parser can read faithfully; anything it can NOT read (a
 * plpgsql rewrite, a computed value, a new column) throws instead of passing quietly, so an
 * unreadable redefinition is a LOUD failure rather than a silent hole. That fail-closed posture is
 * the point: the previous version failed OPEN.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BILLING_TIERS,
  DEFAULT_STORAGE_CAP_BYTES,
  INGRESS_CAP_MULTIPLIER,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  MONTHLY_INGRESS_BYTES,
  type Tier,
} from "@/lib/constants/tiers";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** Matches every way the fn gets (re)defined; a return-type change forces DROP + CREATE. */
const DEFINITION_RE =
  /create\s+(?:or\s+replace\s+)?function\s+public\.tier_limits\s*\(/;

/**
 * The migration that most recently defines tier_limits(). Filenames are timestamp-prefixed, so
 * lexical sort = apply order. Taking the LAST one is what makes this test self-updating: a future
 * migration that redefines the fn is picked up automatically, with no list to maintain.
 */
function newestDefinition(): { file: string; sql: string } {
  const hits = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(MIGRATIONS, file), "utf8"),
    }))
    .filter(({ sql }) => DEFINITION_RE.test(sql));
  if (hits.length === 0) {
    throw new Error("No migration defines public.tier_limits().");
  }
  return hits[hits.length - 1];
}

/** Strip `-- ...` line comments without eating a `--` that sits inside a quoted literal. */
function stripComments(sql: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (inString) {
      out += c;
      if (c === "'") inString = false;
      continue;
    }
    if (c === "'") {
      inString = true;
      out += c;
      continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    out += c;
  }
  return out;
}

/** Split on commas that sit at paren depth 0 (so `case … end::integer, case …` splits cleanly). */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";
  for (const c of text) {
    if (inString) {
      current += c;
      if (c === "'") inString = false;
      continue;
    }
    if (c === "'") inString = true;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += c;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Evaluate one `then`/`else` value. Only `null` and a product of integer literals are accepted
 * (`75::bigint * 1024 * 1024 * 1024`); anything else throws, because a value this parser cannot
 * read is a value it cannot guard.
 */
function evalSqlNumber(expr: string): number | null {
  const cleaned = expr
    .replace(/::\s*(bigint|integer|int4|int8|int)/gi, "")
    .replace(/[()]/g, "")
    .trim();
  if (/^null$/i.test(cleaned)) return null;
  const factors = cleaned.split("*").map((f) => f.trim());
  let product = 1;
  for (const factor of factors) {
    if (!/^\d+$/.test(factor)) {
      throw new Error(`tier_limits(): unparseable value expression "${expr}"`);
    }
    product *= Number(factor);
  }
  return product;
}

/** `case p_tier when 'free' then X … else Y end` → per-tier values (else covers the rest). */
function parseCase(
  expr: string,
  column: string,
): Record<string, number | null> {
  if (!/^case\s+p_tier\b/i.test(expr)) {
    throw new Error(
      `tier_limits().${column} is no longer a "case p_tier" lookup.`,
    );
  }
  const body = expr
    .replace(/^case\s+p_tier\b/i, "")
    .replace(/\bend\b[\s\S]*$/i, "");
  const branches: Record<string, number | null> = {};
  const whenRe =
    /when\s+'([a-z_]+)'\s+then\s+([\s\S]*?)(?=\s+when\s+'|\s+else\s|$)/gi;
  for (const m of body.matchAll(whenRe)) branches[m[1]] = evalSqlNumber(m[2]);
  const elseMatch = body.match(/\belse\s+([\s\S]*?)$/i);
  branches.__else__ = elseMatch ? evalSqlNumber(elseMatch[1]) : null;
  return branches;
}

/** column name -> tier -> value, as the committed SQL actually defines it. */
function parseTierLimits(
  sql: string,
): Record<string, Record<Tier, number | null>> {
  const clean = stripComments(sql);
  const start = clean.search(DEFINITION_RE);
  const bodyStart = clean.indexOf("as $$", start);
  const bodyEnd = clean.indexOf("$$;", bodyStart);
  if (start < 0 || bodyStart < 0 || bodyEnd < 0) {
    throw new Error("Could not locate the tier_limits() body.");
  }

  const returnsBlock = clean.slice(start, bodyStart);
  const cols = returnsBlock.match(
    /returns\s+table\s*\(([\s\S]*?)\)\s*language/i,
  );
  if (!cols)
    throw new Error("tier_limits() no longer declares a returns table.");
  const columns = splitTopLevel(cols[1]).map((c) => c.split(/\s+/)[0]);

  const body = clean.slice(bodyStart + "as $$".length, bodyEnd).trim();
  const select = body.replace(/^select\b/i, "").replace(/;\s*$/, "");
  const exprs = splitTopLevel(select);
  if (exprs.length !== columns.length) {
    throw new Error(
      `tier_limits(): ${columns.length} declared columns but ${exprs.length} select expressions.`,
    );
  }

  const out: Record<string, Record<Tier, number | null>> = {};
  columns.forEach((column, i) => {
    const branches = parseCase(exprs[i], column);
    out[column] = Object.fromEntries(
      BILLING_TIERS.map((t) => [
        t,
        t in branches ? branches[t] : branches.__else__,
      ]),
    ) as Record<Tier, number | null>;
  });
  return out;
}

/**
 * The TS side, keyed by SQL column name. `ingress_cap_multiplier` is DERIVED rather than written
 * out: a tier with a static monthly meter has no multiplier, which is exactly the SQL's own
 * `when 'free' then null else 3`. Keeping it derived means this table cannot drift from tiers.ts
 * either.
 */
const TS_LIMITS: Record<string, Record<Tier, number | null>> = {
  max_events: MAX_EVENTS,
  monthly_ingress_bytes: MONTHLY_INGRESS_BYTES,
  default_storage_cap_bytes: DEFAULT_STORAGE_CAP_BYTES,
  ingress_cap_multiplier: Object.fromEntries(
    BILLING_TIERS.map((t) => [
      t,
      MONTHLY_INGRESS_BYTES[t] === null ? INGRESS_CAP_MULTIPLIER : null,
    ]),
  ) as Record<Tier, number | null>,
  max_reel_seconds: MAX_REEL_SECONDS,
};

const { file, sql } = newestDefinition();
const sqlLimits = parseTierLimits(sql);

describe(`tiers.ts <-> tier_limits() parity (${file})`, () => {
  it("declares exactly the columns tiers.ts knows how to mirror", () => {
    // A new SQL column with no TS counterpart (or vice versa) is drift by definition.
    expect(Object.keys(sqlLimits).sort()).toEqual(
      Object.keys(TS_LIMITS).sort(),
    );
  });

  for (const column of Object.keys(TS_LIMITS)) {
    it(`${column} matches for every billing tier`, () => {
      for (const tier of BILLING_TIERS) {
        expect(
          sqlLimits[column]?.[tier],
          `tier_limits().${column} for "${tier}" is ${String(sqlLimits[column]?.[tier])} but tiers.ts says ${String(TS_LIMITS[column][tier])}. Change BOTH sides (tiers.ts is the human-authored source, the SQL is the enforcement).`,
        ).toBe(TS_LIMITS[column][tier]);
      }
    });
  }

  it("reads real numbers out of the SQL (proves the parser is not vacuous)", () => {
    // If the parser ever silently returned empty/undefined everywhere, the assertions above would
    // pass only if TS were empty too. Pin one concrete SQL-derived value as the canary.
    expect(sqlLimits.default_storage_cap_bytes.free).toBe(2 * 1024 ** 3);
    expect(sqlLimits.max_reel_seconds.pro).toBe(60);
    expect(sqlLimits.max_events.pro).toBeNull();
  });
});
