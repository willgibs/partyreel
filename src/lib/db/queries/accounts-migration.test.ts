/**
 * ★ EVERY LISTED HOST'S UPLOADS IN ONE READ, THE SQL FACTS (billing-locks, 20261005130000), pinned latest-wins through
 * the one reader (`testing/migrations.ts`), beside the call (`accounts.ts`'s `readAccountsUploads`).
 *
 * /admin/accounts asked `uploads_used` once a row, 50 calls a page view, and a lapsed pass read "0 B" of an allowance
 * no live pass held while every upload of hers was refused. `uploads_windows` answers the page's hosts in one keyset
 * read. What these hold:
 *   1. ★ PARITY BY CONSTRUCTION: each figure IS `uploads_used(host, her own tier)`, the function every refusal reads,
 *      called per row, never a sum of its own; the rolled-back proof at the file's foot compares them row by row.
 *   2. ★ THE LAPSED FLAG IS THE COMPLETES' OWN PREDICATE, "since" is when her last pass stopped being live, and
 *      "converted" whether that was its conversion to Pro credit; each row answers the plan it was asked with.
 *   3. Its pages and grants: keyset on the profile id, clamped to 1,000; INVOKER, the service role's alone.
 *   4. The call's argument names and the row's columns are the function's (PostgREST resolves a call by its names).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

const FILE = "20261005130000_billing_locks.sql";
const read = () => liveFunction("uploads_windows");

describe("1. parity by construction", () => {
  it("★ each figure is uploads_used asked with the profile's own id and tier, exactly as the refusals ask it", () => {
    const { code } = read();
    expect(code).toContain("public.uploads_used(p.id, p.tier),");
    // No figure of its own: it reads neither meter uploads_used reads, so it cannot drift from it.
    const body = code.slice(code.indexOf("as $$"));
    expect(body).not.toMatch(
      /\bstorage_ledger\b|\buploaded_bytes\b|\bcumulative_bytes\b/,
    );
    // And every refusal asks the same function the same way (the completes with the profile they locked).
    for (const name of ["create_media", "create_media_as_host"]) {
      expect(liveFunction(name).code, name).toContain(
        "v_uploaded := public.uploads_used(v_event.host_id, v_profile.tier);",
      );
    }
    expect(liveFunction("meter_upload").code).toContain(
      "public.uploads_used(v_host, v_tier) + p_bytes > v_allowance",
    );
  });
});

describe("2. the lapsed flag and since when", () => {
  it("★ is the completes' own lapsed-pass predicate, over the same rows", () => {
    const { code } = read();
    const ours = code.match(
      /select p\.tier = 'event_pass' and not exists \( (select 1 from public\.event_passes q where .*?)\) as lapsed/,
    );
    expect(ours, "the read's lapsed flag").not.toBeNull();
    for (const name of ["create_media", "create_media_as_host"]) {
      const theirs = liveFunction(name).code.match(
        /if v_profile\.tier = 'event_pass' and not exists \( (select 1 from public\.event_passes q where .*?)\) then raise exception 'Upload limit reached for this plan\.'/,
      );
      expect(theirs, `${name}'s lapsed pass refusal`).not.toBeNull();
      expect(ours![1], name).toBe(
        theirs![1].replace(
          "q.profile_id = v_event.host_id",
          "q.profile_id = p.id",
        ),
      );
    }
  });

  it("★ says since when and how only while lapsed: the latest end among her passes that ever were live", () => {
    const { code } = read();
    expect(code).toContain(
      "left join lateral ( select least(q.expires_at, coalesce(q.consumed_at, q.expires_at)) as ended_at, (q.consumed_at is not null and q.consumed_at < q.expires_at) as converted from public.event_passes q where w.lapsed and q.profile_id = p.id and q.start_at <= now() and q.start_at < least(q.expires_at, coalesce(q.consumed_at, q.expires_at)) order by 1 desc, 2 desc limit 1 ) e on true",
    );
    // Nothing lapses unless the predicate says so, and a row that is not lapsed is never converted.
    expect(code).toContain(
      "w.lapsed, e.ended_at, coalesce(e.converted, false)",
    );
  });

  it("★ answers the plan each figure was asked with, from the same row, so the page holds it to that plan's allowance", () => {
    expect(read().code).toContain(
      "select p.id, p.tier, p.storage_cap_bytes, public.uploads_used(p.id, p.tier),",
    );
  });
});

describe("3. its pages and grants", () => {
  it("is one signature: the ids, a keyset cursor and a limit, seven columns out, sql, stable, INVOKER, an empty search_path", () => {
    const { code, file, params, returns } = read();
    expect(file >= FILE, file).toBe(true);
    expect(params).toBe(
      "p_host_ids uuid[], p_after_id uuid default null, p_limit integer default null",
    );
    expect(returns).toBe(
      "table ( host_id uuid, tier public.tier_type, storage_cap_bytes bigint, used_bytes bigint, pass_lapsed boolean, pass_lapsed_at timestamptz, pass_converted boolean )",
    );
    expect(code).toContain("language sql stable set search_path = '' as $$");
    expect(code).not.toMatch(/\bsecurity definer\b/);
  });

  it("★ reads only the ids asked, in id order after the cursor, at most 1,000 a page (a null limit, all)", () => {
    expect(read().code).toContain(
      "where p.id = any(p_host_ids) and (p_after_id is null or p.id > p_after_id) order by p.id limit case when p_limit is null then null else least(p_limit, 1000) end;",
    );
  });

  it("★ is the service role's alone, in its file and in every file", () => {
    const code = read()
      .fileSql.replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ");
    expect(code).toContain(
      "revoke all on function public.uploads_windows(uuid[], uuid, integer) from public, anon, authenticated;",
    );
    expect(code).toContain(
      "grant execute on function public.uploads_windows(uuid[], uuid, integer) to service_role;",
    );
    for (const { file, sql } of executableMigrations()) {
      expect(sql, file).not.toMatch(
        /grant [^;]* on function public\.uploads_windows\([^)]*\) to [^;]*\b(?:anon|authenticated|public)\b/,
      );
    }
  });
});

describe("4. the call is the function's", () => {
  const ts = readFileSync(
    join(process.cwd(), "src/lib/db/queries/accounts.ts"),
    "utf8",
  );

  it("★ passes every argument by the function's own names (PostgREST resolves a call by them)", () => {
    const names = read()
      .params.split(",")
      .map((p) => p.trim().split(" ")[0]!);
    expect(names).toEqual(["p_host_ids", "p_after_id", "p_limit"]);
    const call = ts.slice(ts.indexOf('rpc("uploads_windows", {'));
    const args = call.slice(0, call.indexOf("})"));
    for (const name of names) expect(args, name).toContain(`${name}:`);
  });

  it("reads every column the function answers, by its name", () => {
    const columns = [...read().returns.matchAll(/(?:\( |, )([a-z_]+) /g)].map(
      (m) => m[1]!,
    );
    expect(columns).toEqual([
      "host_id",
      "tier",
      "storage_cap_bytes",
      "used_bytes",
      "pass_lapsed",
      "pass_lapsed_at",
      "pass_converted",
    ]);
    for (const column of columns) expect(ts, column).toContain(`row.${column}`);
  });
});
