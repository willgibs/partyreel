/**
 * THE OVER-CAPACITY SWEEP'S CANDIDATE READ, PINNED IN ITS SQL (crumbs-75, 20261005060000). The sweep's tests answer
 * `over_capacity_candidates` from a stand-in over the fake's tables; these hold the migration to the facts that
 * stand-in, the sweep and database-security.md assume, read from the latest definition across the migration set, so a
 * later `create or replace` that drops one fails here. Its behavior on the live schema is the migration's own
 * rolled-back check.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DIR = join(process.cwd(), "supabase", "migrations");

/** Every migration, comments stripped and whitespace collapsed, in file order. */
const MIGRATIONS = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => ({
    file: f,
    sql: readFileSync(join(DIR, f), "utf8")
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " "),
  }));

/** The latest definition of the function, from `create` to its body's closing dollar quote. */
function latestDefinition(name: string): string {
  let found: string | null = null;
  for (const { sql } of MIGRATIONS) {
    const re = new RegExp(
      `create (?:or replace )?function public\\.${name} ?\\(([\\s\\S]*?)\\$\\$([\\s\\S]*?)\\$\\$`,
      "g",
    );
    for (const m of sql.matchAll(re)) found = m[0];
  }
  if (!found) throw new Error(`no definition of ${name}`);
  return found;
}

/** Every grant or revoke statement naming the function, across the set, in order. */
function grantsOf(name: string): string[] {
  const out: string[] = [];
  for (const { sql } of MIGRATIONS) {
    const re = new RegExp(
      `(?:grant|revoke) [^;]* on function public\\.${name}\\([^)]*\\)[^;]*;`,
      "g",
    );
    for (const m of sql.matchAll(re)) out.push(m[0]);
  }
  return out;
}

describe("over_capacity_candidates", () => {
  const def = latestDefinition("over_capacity_candidates");

  it("is a SECURITY INVOKER read with its search_path pinned, so it reaches nothing its caller cannot", () => {
    expect(def).toMatch(/\bsecurity invoker\b/);
    expect(def).not.toMatch(/\bsecurity definer\b/);
    expect(def).toMatch(/set search_path = ''/);
    expect(def).toMatch(/\bstable\b/);
  });

  it("is the service role's alone: revoked from PUBLIC and both client roles, granted to the service role only", () => {
    const grants = grantsOf("over_capacity_candidates");
    expect(grants).toEqual([
      "revoke all on function public.over_capacity_candidates(uuid, integer) from public, anon, authenticated;",
      "grant execute on function public.over_capacity_candidates(uuid, integer) to service_role;",
    ]);
  });

  it("pages on a keyset of id with a clamped p_limit, a null limit reading everything", () => {
    expect(def).toMatch(
      /over_capacity_candidates ?\(p_after uuid default null, p_limit integer default null\)/,
    );
    expect(def).toContain(
      "order by c.id limit case when p_limit is null then null else least(p_limit, 1000) end;",
    );
    expect(def).toMatch(/p\.id > p_after/);
  });

  it("★ judges what she keeps (the summary: active plus Deleted less the system's) against her own write line", () => {
    // The line `create_media*` admit up to and `capWithWriteHeadroom` mirrors: the cap and a tenth of it.
    expect(def).toContain(
      "s.active_bytes + s.standby_bytes - s.system_bytes > c.cap + c.cap / 10",
    );
    expect(def).toContain(
      "cross join lateral public.host_storage_summary(c.id) s",
    );
    // Her own cap, else her tier's default from the one SQL home (under the tiers.ts parity test).
    expect(def).toContain(
      "coalesce(p.storage_cap_bytes, d.default_cap) as cap",
    );
    expect(def).toContain("cross join lateral public.tier_limits(t.tier) as l");
  });

  it("★ sums only an account in a grace or with a meter past her line, in id order behind a fence, under the limit", () => {
    expect(def).toMatch(
      /p\.storage_grace_until is not null or p\.storage_used_bytes > coalesce\(p\.storage_cap_bytes, d\.default_cap\) \+ coalesce\(p\.storage_cap_bytes, d\.default_cap\) \/ 10/,
    );
    // The fence keeps the meter's filter and the id order below the per-account sum, so the sum is the inner side of a
    // nested loop the limit stops (a page of 100 summed 153 accounts on the 20,000-profile stand-in, never them all).
    expect(def).toMatch(/order by p\.id offset 0 \) c cross join lateral/);
  });

  it("answers the columns the sweep reads, its Deleted under the sweep's own name", () => {
    expect(def).toMatch(
      /returns table \( id uuid, email text, tier public\.tier_type, storage_cap_bytes bigint, storage_grace_until timestamptz, active_bytes bigint, deleted_bytes bigint, system_bytes bigint \)/,
    );
  });
});
