/**
 * ★ MAY THIS ACCOUNT STILL ADD: ONE HOME, THE SQL FACTS (billing-integrity, 20261005181000), pinned latest-wins through
 * the one reader (`testing/migrations.ts`), beside the presign's meter (`server-pipeline-meter.ts`).
 *
 * The three upload advisories (the guest's context, the guest gate, the host's context) read a lapsed pass (her profile
 * still a pass's, no window of hers live) as not full, so her album's door opened and the presign refused: each body
 * judged the uploads line with its own copy of it, and only some copies knew the lapsed pass. Now the line has one home,
 * `uploads_refused` (her plan's own number over its window, or `pass_lapsed`), and every body that judges an upload asks
 * it: the two completes with the HEAD's size, the meter with the declared size, the advisories with one byte (at the
 * allowance is full). The operator's read asks `pass_lapsed` too. The behaviour on a lapsed pass, at the allowance and a
 * byte under it is proved by the migration's rolled-back check; these hold the construction:
 *   1. the two homes: their bodies, INVOKER with an empty search_path; uploads_refused the owner's alone (definer bodies
 *      read it), pass_lapsed the service role's too (the operator's INVOKER read asks it);
 *   2. ★ every judge asks the one home with her own figures, and the advisories ask it of the smallest file;
 *   3. ★ no live body restates the lapsed predicate or compares a window's count to an allowance but the homes.
 */
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
  liveFunctions,
} from "@/lib/db/testing/migrations";

const FILE = "20261005181000_billing_integrity.sql";
const bodyOf = (name: string) => {
  const { code } = liveFunction(name);
  return code.slice(code.indexOf("as $$"));
};

describe("1. the two homes", () => {
  it("pass_lapsed: her profile still a pass's, and no live window of hers", () => {
    const { code, file } = liveFunction("pass_lapsed");
    expect(file >= FILE, file).toBe(true);
    expect(code).toBe(
      "create function public.pass_lapsed(p_host_id uuid, p_tier public.tier_type) returns boolean language sql stable set search_path = '' as $$ select p_tier = 'event_pass' and not exists ( select 1 from public.event_passes q where q.profile_id = p_host_id and q.consumed_at is null and q.start_at <= now() and q.expires_at > now()); $$;",
    );
  });

  // ★ Reshaped by crumbs-92 (20261008060000; scar kept: these bytes past her plan's own number over its window, a strict
  // line, none when unmetered, or a lapsed pass): the window's count is the gross one and the number carries her
  // operator's live credit. The expired reason: the count was `uploads_used`, now the gross count less the credit and
  // clamped at zero, which refused a file bigger than the plan's own number past a credit that made room for it.
  it("uploads_refused: these bytes past her plan's own number plus her live credit over its window (a strict line; none when unmetered), or a lapsed pass", () => {
    const { code, file } = liveFunction("uploads_refused");
    expect(file >= FILE, file).toBe(true);
    expect(code).toBe(
      "create or replace function public.uploads_refused( p_host_id uuid, p_tier public.tier_type, p_storage_cap_bytes bigint, p_bytes bigint ) returns boolean language sql stable set search_path = '' as $$ select case when a.allowance is null then false else public.uploads_gross(p_host_id, p_tier) + p_bytes > a.allowance + public.uploads_credit(p_host_id) end or public.pass_lapsed(p_host_id, p_tier) from (select public.upload_allowance(p_tier, p_storage_cap_bytes) as allowance) a; $$;",
    );
  });

  it("★ grants: uploads_refused the owner's alone, pass_lapsed the service role's, neither a client role's anywhere", () => {
    const sql = executableMigrations().find((m) => m.file === FILE)!.sql;
    expect(sql).toContain(
      "revoke all on function public.uploads_refused(uuid, public.tier_type, bigint, bigint) from public, anon, authenticated, service_role;",
    );
    expect(sql).not.toMatch(
      /grant [^;]* on function public\.uploads_refused\(/,
    );
    expect(sql).toContain(
      "revoke all on function public.pass_lapsed(uuid, public.tier_type) from public, anon, authenticated; grant execute on function public.pass_lapsed(uuid, public.tier_type) to service_role;",
    );
    for (const { file, sql: code } of executableMigrations()) {
      expect(code, file).not.toMatch(
        /grant [^;]* on function public\.(?:uploads_refused|pass_lapsed)\([^)]*\) to [^;]*\b(?:anon|authenticated|public)\b/,
      );
    }
  });
});

describe("2. every judge asks the one home", () => {
  it("★ the two completes, with the HEAD's size, refused in the allowance's words", () => {
    for (const name of ["create_media", "create_media_as_host"]) {
      expect(bodyOf(name), name).toContain(
        "if public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, p_file_size_bytes) then raise exception 'Upload limit reached for this plan.' using errcode = 'check_violation'; end if;",
      );
    }
  });

  it("★ the presign's meter, with the declared size, refused under the wire's 'monthly'", () => {
    expect(bodyOf("meter_upload")).toContain(
      "if public.uploads_refused(v_host, v_tier, v_storage_cap, p_bytes) then return jsonb_build_object('ok', false, 'reason', 'monthly'); end if;",
    );
  });

  it.each(["get_upload_context", "get_upload_gate", "get_host_upload_context"])(
    "★ %s asks it of the smallest file, so a lapsed pass reads full where the presign refuses it",
    (name) => {
      expect(bodyOf(name)).toContain(
        "v_at_monthly_cap := coalesce( public.uploads_refused(v_event.host_id, v_profile.tier, v_profile.storage_cap_bytes, 1), false);",
      );
    },
  );

  it("the operator's read asks pass_lapsed of each row's own plan", () => {
    expect(bodyOf("uploads_windows")).toContain(
      "cross join lateral (select public.pass_lapsed(p.id, p.tier) as lapsed) w",
    );
  });
});

describe("3. no copy of the line outside its homes", () => {
  it("★ no live body but pass_lapsed restates the lapsed predicate", () => {
    const copies = liveFunctions()
      .filter((f) => f.name !== "pass_lapsed")
      .filter((f) =>
        /tier = 'event_pass' and not exists \(/.test(
          f.code.slice(f.code.indexOf("as $")),
        ),
      )
      .map((f) => f.name);
    expect(copies).toEqual([]);
  });

  // ★ Reshaped by crumbs-92 (20261008060000; scar kept: no body judges an upload against an allowance but the one home):
  // `grant_uploads_credit` bounds a CREDIT by one more of the plan's allowance (its `v_allowance`), which is no upload's
  // judgement, and it never reads a window's count to do it (held below). The expired reason: every `v_allowance` was
  // an upload's.
  it("★ no live body but uploads_refused holds a window's count to an allowance", () => {
    const copies = liveFunctions()
      .filter((f) => f.name !== "uploads_refused")
      .filter((f) => f.name !== "grant_uploads_credit")
      .filter((f) => {
        const body = f.code.slice(f.code.indexOf("as $"));
        return (
          /public\.uploads_used\([^)]*\)\s*(?:\+[^<>]*)?(?:>|>=)/.test(body) ||
          /\bv_allowance\b/.test(body)
        );
      })
      .map((f) => f.name);
    expect(copies).toEqual([]);
    // The credit's bound reads her credits, never a window's count: it cannot be a second copy of the line.
    expect(bodyOf("grant_uploads_credit")).not.toMatch(
      /\buploads_(?:used|gross)\(/,
    );
  });
});
