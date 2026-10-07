import { describe, expect, it } from "vitest";

import {
  CREDIT_WHY,
  UPLOADS_CREDIT_MAX_LIVE,
  UPLOADS_CREDIT_MIN_BYTES,
  UPLOADS_CREDIT_REASON_MAX,
} from "@/app/admin/accounts/uploads-credit";
import {
  executableMigrations,
  liveFunction,
  liveFunctions,
} from "@/lib/db/testing/migrations";

/**
 * ★ THE OPERATOR'S AUDITED UPLOADS CREDIT, THE SQL FACTS THAT MUST NOT QUIETLY GO (crumbs-92, 20261008060000; X6).
 * Pinned latest-wins through the one reader (`testing/migrations.ts`), the way the other migrations' guards are, because
 * each of these is a place a later `create or replace` could drop a promise and every other test would still pass:
 *
 *   1. THE CREDIT IS ADDITIVE. The spend watch diffs `storage_ledger.cumulative_bytes`, and a pass's count is the
 *      allowance's meter: the one function that writes a credit touches neither, and the credit is read in exactly the
 *      three bodies that need it (the figure, the line and the grant).
 *   2. THE OPERATOR IS CHECKED IN SQL, THE HOST'S ROW IS LOCKED FIRST, THE BOUND IS READ UNDER THE LOCK, and the credit and
 *      its log row are one transaction, written once per key.
 *   3. DENY-ALL TO EVERY CLIENT, APPEND-ONLY TO THE SERVICE ROLE: no policy, no client grant, the log never rewritten.
 *   4. THE FIGURES THE APP MIRRORS (the least, the most live, the reason's length) and the refusals it has words for are
 *      the SQL's.
 */

const grant = () => liveFunction("grant_uploads_credit");
const code = (sql: string) => sql.replace(/\s+/g, " ");

describe("1. additive: the ledger the spend watch reads is never edited", () => {
  it("★ the grant writes the log and the credit and nothing else, and reads no count to change", () => {
    const body = grant().code;
    expect(body).toContain("insert into public.admin_actions");
    expect(body).toContain("insert into public.uploads_credits");
    expect(body).not.toMatch(/\bstorage_ledger\b|\bcumulative_bytes\b/);
    expect(body).not.toMatch(/\buploaded_bytes\b|update public\.event_passes/);
    // The only updates or deletes in the body: none.
    expect(body).not.toMatch(/\b(update|delete from)\s+public\./);
  });

  it("★ only the figure, the line and the grant read the credit", () => {
    // (The credit's own definition names itself in its header, so it is the reader's own and not a reader.)
    const readers = liveFunctions()
      .filter((fn) => fn.name !== "uploads_credit")
      .filter((fn) => /\buploads_credit\(/.test(fn.code))
      .map((fn) => fn.name)
      .sort();
    expect(readers).toEqual([
      "grant_uploads_credit",
      "uploads_refused",
      "uploads_used",
    ]);
    // And nothing that writes the meter reads it: the writers ask the line (`uploads_refused`) and never the credit.
    for (const fn of liveFunctions().filter((f) =>
      /insert into public\.storage_ledger/.test(f.code),
    )) {
      expect(fn.code, fn.name).not.toMatch(/\buploads_credit\(/);
    }
  });

  it("the credit sums the live ones: a window that has ended is nothing", () => {
    const fn = liveFunction("uploads_credit");
    expect(fn.code).toContain(
      "select coalesce(sum(c.bytes), 0)::bigint from public.uploads_credits c where c.host_id = p_host_id and c.window_ends_at > now()",
    );
    expect(code(fn.raw)).toMatch(/security definer set search_path = ''/);
  });
});

describe("2. the operator, the lock, the bound, the key", () => {
  it("★ is definer with an empty search path and answers a jsonb", () => {
    const { raw, returns } = grant();
    expect(code(raw)).toMatch(/security definer set search_path = ''/);
    expect(returns).toBe("jsonb");
  });

  it("★ checks the operator is an admin profile in SQL, before it reads or writes anything of hers", () => {
    const body = grant().code;
    const operator = body.indexOf(
      "exists (select 1 from public.profiles o where o.id = p_operator_id and o.is_admin)",
    );
    expect(operator).toBeGreaterThan(-1);
    expect(body).toContain("using errcode = 'insufficient_privilege'");
    expect(operator).toBeLessThan(body.indexOf("for update"));
  });

  it("★ locks the host's row FOR UPDATE once, first, before the key, the bound or any write", () => {
    const body = grant().code;
    const locks = body.match(/for update/g) ?? [];
    expect(locks).toHaveLength(1);
    const lock = body.indexOf(
      "from public.profiles where id = p_host_id for update",
    );
    expect(lock).toBeGreaterThan(-1);
    for (const later of [
      "from public.admin_actions where request_id = p_request_id",
      "select min(q.expires_at)",
      "from public.uploads_credits c where c.host_id = p_host_id",
      "insert into public.admin_actions",
      "insert into public.uploads_credits",
    ]) {
      expect(body.indexOf(later), later).toBeGreaterThan(lock);
    }
    // No second profiles row is ever locked or written (the operator's is only read).
    expect(body).not.toMatch(
      /public\.profiles[^;]*for (no key )?update[^;]*public\.profiles/,
    );
  });

  it("★ bounds her live credits by one more of her plan's allowance, without an overflow, and by count", () => {
    const body = grant().code;
    expect(body).toContain(
      "v_allowance := public.upload_allowance(v_profile.tier, v_profile.storage_cap_bytes)",
    );
    expect(body).toContain("if p_bytes > v_allowance - v_live then");
    expect(body).toContain("if v_live_count >= c_credit_live then");
    // An unmetered plan and a lapsed pass are refused before the bound, in words.
    expect(body.indexOf("'why', 'unmetered'")).toBeLessThan(
      body.indexOf("if p_bytes > v_allowance - v_live then"),
    );
    expect(body).toContain("public.pass_lapsed(p_host_id, v_profile.tier)");
  });

  it("★ ends the credit with the window it was made in: the month (the ledger's key, same zone) or her soonest live pass", () => {
    const body = grant().code;
    expect(body).toContain(
      "v_ends := date_trunc('month', now()) + interval '1 month'",
    );
    expect(body).toContain(
      "select min(q.expires_at) into v_ends from public.event_passes q where q.profile_id = p_host_id and q.consumed_at is null and q.start_at <= now() and q.expires_at > now()",
    );
    // The ledger's key is the session zone's month, as this one is.
    expect(liveFunction("uploads_gross").code).toContain(
      "l.period = to_char(now(), 'YYYY-MM')",
    );
  });

  it("★ is idempotent per key: a replay answers its credit, and another act's key is refused", () => {
    const body = grant().code;
    expect(body).toContain(
      "select * into v_action from public.admin_actions where request_id = p_request_id",
    );
    expect(body).toContain("'replayed', true");
    expect(body).toContain("that request key belongs to another act");
  });

  it("★ writes the log row before the credit it owns, in the one body (one transaction)", () => {
    const body = grant().code;
    expect(body.indexOf("insert into public.admin_actions")).toBeLessThan(
      body.indexOf("insert into public.uploads_credits"),
    );
  });
});

describe("3. deny-all to clients, append-only to the service role", () => {
  const all = () =>
    executableMigrations()
      .map(({ sql }) => sql)
      .join("\n");

  it("★ RLS is on and no policy exists for either table", () => {
    const sql = all();
    for (const table of ["admin_actions", "uploads_credits"]) {
      expect(sql).toContain(
        `alter table public.${table} enable row level security;`,
      );
      expect(sql).not.toMatch(
        new RegExp(`create policy [^;]*on public\\.${table}\\b`, "i"),
      );
      expect(sql).toContain(
        `revoke all on table public.${table} from public, anon, authenticated;`,
      );
      expect(sql).not.toMatch(
        new RegExp(
          `grant [^;]*on (table )?public\\.${table} to [^;]*\\b(anon|authenticated|public)\\b`,
          "i",
        ),
      );
    }
  });

  it("★ the log is never rewritten by the service role", () => {
    expect(all()).toContain(
      "revoke update, delete, truncate on table public.admin_actions from service_role;",
    );
  });

  it("★ the functions are the service role's alone", () => {
    const sql = all();
    for (const sig of [
      "public.grant_uploads_credit(uuid, uuid, bigint, text, uuid)",
      "public.uploads_credit(uuid)",
      "public.uploads_gross(uuid, public.tier_type)",
    ]) {
      expect(sql).toContain(
        `revoke all on function ${sig} from public, anon, authenticated;`,
      );
      expect(sql).toContain(
        `grant execute on function ${sig} to service_role;`,
      );
      expect(sql).not.toMatch(
        new RegExp(
          `grant execute on function ${sig.replace(/[().]/g, "\\$&")} to [^;]*\\b(anon|authenticated|public)\\b`,
        ),
      );
    }
  });

  it("★ the account's deletion takes its credits and its log with it", () => {
    const sql = all();
    expect(sql).toContain(
      "account_id uuid not null references public.profiles (id) on delete cascade",
    );
    expect(sql).toContain(
      "host_id uuid not null references public.profiles (id) on delete cascade",
    );
    expect(sql).toContain(
      "action_id uuid not null unique references public.admin_actions (id) on delete cascade",
    );
  });
});

describe("4. the figures and the refusals the app mirrors are the SQL's", () => {
  const constant = (name: string): number => {
    const found = /c_(\w+) constant (?:bigint|integer) := (\d+);/g;
    for (const m of grant().raw.matchAll(found)) {
      if (m[1] === name) return Number(m[2]);
    }
    throw new Error(`grant_uploads_credit sets no c_${name}`);
  };

  it("★ the least a credit is, how many an account holds, and the reason's length", () => {
    expect(UPLOADS_CREDIT_MIN_BYTES).toBe(constant("credit_min"));
    expect(UPLOADS_CREDIT_MAX_LIVE).toBe(constant("credit_live"));
    expect(UPLOADS_CREDIT_REASON_MAX).toBe(constant("reason_max"));
  });

  it("★ the table refuses a reason longer than the function allows, and a credit below the least", () => {
    const sql = executableMigrations()
      .map(({ sql }) => sql)
      .join("\n");
    expect(sql).toContain(
      `check (char_length(btrim(reason)) between 1 and ${UPLOADS_CREDIT_REASON_MAX})`,
    );
    expect(sql).toContain(
      `check (bytes between ${UPLOADS_CREDIT_MIN_BYTES} and`,
    );
  });

  it("★ the app has words for exactly the refusals the function answers", () => {
    const answered = [...grant().raw.matchAll(/'why', '(\w+)'/g)].map(
      (m) => m[1],
    );
    expect([...new Set(answered)].sort()).toEqual([...CREDIT_WHY].sort());
  });
});
