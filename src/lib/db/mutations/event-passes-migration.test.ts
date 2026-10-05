/**
 * ★ THE PASS-TO-PRO CREDIT'S CONVERSION, THE SQL FACTS (billing-locks, 20261005130000), pinned latest-wins across the
 * whole migration set through the one reader (`testing/migrations.ts`), beside the call (`event-passes.ts`).
 *
 * Every capacity body takes the host's profiles row first (database-security.md), and an upload's complete holds it
 * while it counts on her live pass. The conversion wrote the passes, then the profile, two PostgREST requests apart:
 * joined in that order in one transaction, as atomicity wants, it deadlocks with a complete (measured on a throwaway
 * cluster, the lane's pre-flight); kept apart, a host sat between them with her passes consumed and her chain set.
 * `consume_passes_for_pro_credit` is one transaction, her profiles row first. What these hold:
 *   1. its shape and its grants: INVOKER with an empty search_path, the service role's alone;
 *   2. ★ its order: the profiles row lock is its first table access, before the passes and the chain;
 *   3. what it writes: every unconsumed pass marked pro_credit and the chain cleared, never the tier, the cap or a
 *      Stripe column (the subscription events' own);
 *   4. ★ the order holds for every writer of `event_passes`' rows, so no later body can reopen the cycle, and no
 *      TypeScript writes the conversion past it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
  liveFunctions,
} from "@/lib/db/testing/migrations";

const FILE = "20261005130000_billing_locks.sql";
const consume = () => liveFunction("consume_passes_for_pro_credit");

/** Where a needle sits in a body's code, failing loudly when it is absent. */
function at(code: string, needle: string | RegExp): number {
  const i =
    typeof needle === "string" ? code.indexOf(needle) : code.search(needle);
  expect(i, String(needle)).toBeGreaterThan(-1);
  return i;
}

describe("1. its shape and its grants", () => {
  it("is one signature, a host's id, answering a count: plpgsql, volatile, INVOKER, an empty search_path", () => {
    const { code, file } = consume();
    expect(file >= FILE, file).toBe(true);
    expect(code).toMatch(
      /^create (or replace )?function public\.consume_passes_for_pro_credit\(p_host_id uuid\) returns integer language plpgsql volatile set search_path = '' as \$\$/,
    );
    // INVOKER: the service role holds every privilege it uses, so a grant that slipped reaches nothing.
    expect(code).not.toMatch(/\bsecurity definer\b/);
  });

  it("★ is the service role's alone, in its file and in every file", () => {
    const { fileSql } = consume();
    const code = fileSql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    expect(code).toContain(
      "revoke all on function public.consume_passes_for_pro_credit(uuid) from public, anon, authenticated;",
    );
    expect(code).toContain(
      "grant execute on function public.consume_passes_for_pro_credit(uuid) to service_role;",
    );
    for (const { file, sql } of executableMigrations()) {
      expect(sql, file).not.toMatch(
        /grant [^;]* on function public\.consume_passes_for_pro_credit\([^)]*\) to [^;]*\b(?:anon|authenticated|public)\b/,
      );
    }
  });

  it("refuses a missing host in words, never a silent zero", () => {
    expect(consume().code).toContain(
      "if p_host_id is null then raise exception 'consume_passes_for_pro_credit needs a host.' using errcode = 'invalid_parameter_value'; end if;",
    );
  });
});

describe("2. its order", () => {
  it("★ takes her profiles row first: no table is read or written before the lock", () => {
    const { code } = consume();
    const body = code.slice(code.indexOf("as $$"));
    const lock = at(
      body,
      "perform 1 from public.profiles where id = p_host_id for update;",
    );
    // The first table any statement names is that lock's.
    expect(body.search(/\b(?:from|update|into) public\./)).toBe(
      body.indexOf("from public.profiles where id = p_host_id for update"),
    );
    expect(lock).toBeLessThan(at(body, "update public.event_passes"));
    expect(lock).toBeLessThan(at(body, "update public.profiles"));
  });
});

describe("3. what it writes", () => {
  it("★ every unconsumed pass, marked pro_credit at the transaction's instant, its count the answer", () => {
    const { code } = consume();
    expect(code).toContain(
      "update public.event_passes set consumed_at = now(), consumed_reason = 'pro_credit' where profile_id = p_host_id and consumed_at is null; get diagnostics v_consumed = row_count;",
    );
    expect(code).toContain("return v_consumed;");
  });

  it("★ clears the chain in the same transaction, and writes no tier, cap or Stripe column", () => {
    const { code } = consume();
    expect(code).toContain(
      "update public.profiles set tier_expires_at = null, event_slots = null where id = p_host_id;",
    );
    expect(code).not.toMatch(
      /\b(?:tier|storage_cap_bytes|stripe_[a-z_]+)\s*=(?!=)/,
    );
  });
});

describe("4. the order holds for every writer of a pass's row", () => {
  it("★ each live body that updates event_passes locks the host's profiles row before it", () => {
    const writers = liveFunctions().filter((f) =>
      /\bupdate public\.event_passes\b/.test(f.code),
    );
    // The scan is not vacuous: the two completes and the conversion are among them (a new writer joins the rule below).
    expect(writers.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        "consume_passes_for_pro_credit",
        "create_media",
        "create_media_as_host",
      ]),
    );
    for (const f of writers) {
      const lock = at(
        f.code,
        /from public\.profiles where id = [^;]* for update/,
      );
      expect(lock, f.name).toBeLessThan(
        f.code.indexOf("update public.event_passes"),
      );
    }
  });

  it("★ no TypeScript writes the conversion itself: consumed_reason has one writer, the SQL", () => {
    const root = join(process.cwd(), "src");
    const offenders = (readdirSync(root, { recursive: true }) as string[])
      .map((f) => String(f).replace(/\\/g, "/"))
      .filter(
        (f) =>
          /\.tsx?$/.test(f) &&
          !/\.test\.tsx?$/.test(f) &&
          f !== "lib/db/types.ts" &&
          !f.startsWith("lib/db/testing/"),
      )
      .filter((f) =>
        /\bconsumed_reason\s*:/.test(readFileSync(join(root, f), "utf8")),
      );
    expect(offenders).toEqual([]);
  });
});
