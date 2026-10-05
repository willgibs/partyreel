/**
 * ★ THE PASS-TO-PRO CREDIT AND THE PASS RECOMPUTE, THE SQL FACTS (billing-integrity, 20261005181000; credit-watch,
 * 20261005201000), pinned latest-wins through the one reader (`testing/migrations.ts`), beside the math (`passes.ts`)
 * and the calls (`event-passes.ts`). The behaviour is proved by each migration's rolled-back check (live) and
 * billing-integrity's two-session lock runs (a throwaway cluster); these hold the facts those checks proved so a later
 * `create or replace` cannot quietly drop one:
 *   1. the claim's table: deny-all, gone with the account, its grant whole and its lease cleared once granted or
 *      released, a released claim never converted;
 *   2. the five functions' shapes and grants: INVOKER with an empty search_path, the service role's alone;
 *   3. ★ her profiles row first in each, the one lock order (database-security.md), before anything else is read;
 *   4. ★ the claim: a released claim answers overlap before anything, a grant on record answers granted forever, a live
 *      lease answers busy, a pass is credited once ever and refused only by what is settled (another checkout's mere
 *      lease is busy, after it), and the lease outlasts any delivery the webhook can run;
 *   5. ★ the conversion: exactly the claim's passes, only after the grant, the chain cleared only when it converted;
 *   6. the recompute: never a Pro profile, nor one whose Pro plan is seconds behind her credited checkout (real time),
 *      the four fields from her unconsumed windows at one instant, one pass's room from tier_limits (tiers.ts' own
 *      number), written in the same transaction as the lock;
 *   7. the route calls the three in order, settles an unsettled overlap with the release, and the old one-arg
 *      conversion nowhere;
 *   8. ★ the release: only a claim another checkout's credit overtook, never one still owed, granted or leased.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

const FILE = "20261005181000_billing_integrity.sql";
const WATCH = "20261005201000_credit_watch.sql";
const CREDIT = [
  "claim_pass_credit",
  "record_pass_credit_grant",
  "convert_pass_credit",
] as const;
const ALL = [
  ...CREDIT,
  "recompute_pass_entitlement",
  "release_pass_credit",
] as const;

/** A function's executable body, from its `as $$` on. */
const bodyOf = (name: string) => {
  const { code } = liveFunction(name);
  return code.slice(code.indexOf("as $$"));
};
const fileCode = (file: string = FILE) =>
  executableMigrations().find((m) => m.file === file)!.sql;
/** The executable file a function's live definition is in: its grants live beside it. */
const liveFileCode = (name: string) => fileCode(liveFunction(name).file);

/** Where a needle sits, failing loudly when it is absent. */
function at(code: string, needle: string): number {
  const i = code.indexOf(needle);
  expect(i, needle).toBeGreaterThan(-1);
  return i;
}

describe("1. the claim's table", () => {
  it("★ is deny-all: RLS on, no policy, and no client role granted anything, in its file or any other", () => {
    const sql = fileCode();
    expect(sql).toContain(
      "alter table public.pass_credits enable row level security;",
    );
    for (const { file, sql: code } of executableMigrations()) {
      expect(code, file).not.toMatch(
        /create policy [^;]* on public\.pass_credits\b/,
      );
      expect(code, file).not.toMatch(
        /grant [^;]* on (table )?public\.pass_credits to [^;]*\b(?:anon|authenticated|public)\b/,
      );
    }
  });

  it("is keyed by the checkout session, gone with the account, its grant whole and its lease cleared once granted", () => {
    const sql = fileCode();
    expect(sql).toContain(
      "create table public.pass_credits ( stripe_session_id text primary key, profile_id uuid not null references public.profiles (id) on delete cascade, credit_cents integer not null check (credit_cents > 0),",
    );
    expect(sql).toContain(
      "pass_ids uuid[] not null check (cardinality(pass_ids) > 0 and array_position(pass_ids, null) is null),",
    );
    expect(sql).toContain(
      "constraint pass_credits_grant_whole check ((granted_at is null) = (balance_transaction_id is null)),",
    );
    expect(sql).toContain(
      "constraint pass_credits_granted_unleased check (granted_at is null or claimed_until is null),",
    );
    expect(sql).toContain(
      "constraint pass_credits_converted_after_grant check (converted_at is null or granted_at is not null)",
    );
  });

  it("★ a released claim is settled for good: never leased, never converted (credit-watch)", () => {
    const sql = fileCode(WATCH);
    expect(sql).toContain(
      "alter table public.pass_credits add column released_at timestamptz;",
    );
    expect(sql).toContain(
      "add constraint pass_credits_released_unleased check (released_at is null or claimed_until is null),",
    );
    expect(sql).toContain(
      "add constraint pass_credits_released_unconverted check (released_at is null or converted_at is null);",
    );
  });
});

describe("2. shapes and grants", () => {
  it.each(ALL)(
    "%s is plpgsql, volatile, INVOKER, with an empty search_path",
    (name) => {
      const { code, file } = liveFunction(name);
      expect(file >= FILE, file).toBe(true);
      expect(code).toMatch(
        new RegExp(
          `^create (or replace )?function public\\.${name}\\([^)]*\\) returns [a-z]+ language plpgsql volatile set search_path = '' as \\$\\$`,
        ),
      );
      // INVOKER: the service role holds every privilege it uses, so a grant that slipped reaches nothing.
      expect(code).not.toMatch(/\bsecurity definer\b/);
    },
  );

  it("★ each is the service role's alone, in its live definition's file and in every file", () => {
    const signatures: Record<(typeof ALL)[number], string> = {
      claim_pass_credit: "text, uuid, integer, uuid[]",
      record_pass_credit_grant: "text, uuid, text",
      convert_pass_credit: "text, uuid",
      recompute_pass_entitlement: "uuid, timestamptz",
      release_pass_credit: "text, uuid, text",
    };
    for (const name of ALL) {
      const sql = liveFileCode(name);
      const fn = `public.${name}(${signatures[name]})`;
      expect(sql).toContain(
        `revoke all on function ${fn} from public, anon, authenticated;`,
      );
      expect(sql).toContain(`grant execute on function ${fn} to service_role;`);
      for (const { file, sql: code } of executableMigrations()) {
        expect(code, file).not.toMatch(
          new RegExp(
            `grant [^;]* on function public\\.${name}\\([^)]*\\) to [^;]*\\b(?:anon|authenticated|public)\\b`,
          ),
        );
      }
    }
  });

  it("refuses a missing argument in words, never a silent answer", () => {
    for (const name of ALL) {
      expect(bodyOf(name), name).toMatch(
        /raise exception '[^']+ needs [^']+' using errcode = 'invalid_parameter_value';/,
      );
    }
  });
});

describe("3. her profiles row first", () => {
  it.each(ALL)(
    "★ %s locks her profiles row before it reads or writes any table",
    (name) => {
      const body = bodyOf(name);
      const lock = body.search(
        /(?:perform 1|select \* into v_profile) from public\.profiles where id = p_host_id for update;/,
      );
      expect(lock, `${name} takes no profiles lock`).toBeGreaterThan(-1);
      // The first table any statement names is that lock's.
      expect(body.search(/\b(?:from|update|into) public\./)).toBe(
        body.indexOf("from public.profiles where id = p_host_id for update"),
      );
    },
  );
});

describe("4. the claim", () => {
  const claim = () => bodyOf("claim_pass_credit");

  it("★ a grant on record answers granted, a live lease busy, and a replay that disagrees is refused in words", () => {
    const body = claim();
    expect(body).toContain(
      "if v_claim.profile_id <> p_host_id or v_claim.credit_cents <> p_credit_cents or v_claim.pass_ids <> v_ids then raise exception 'This checkout''s credit disagrees with its claim.'",
    );
    const granted = at(
      body,
      "if v_claim.granted_at is not null then return jsonb_build_object('state', 'granted', 'balance_transaction_id', v_claim.balance_transaction_id); end if;",
    );
    const busy = at(
      body,
      "if v_claim.claimed_until > now() then return jsonb_build_object('state', 'busy',",
    );
    expect(granted).toBeLessThan(busy);
    // The named set, each once in one order, so a replay compares equal however the session listed it.
    expect(body).toContain(
      "select array_agg(distinct x order by x) into v_ids from unnest(p_pass_ids) x;",
    );
  });

  // Reshaped on purpose (credit-watch): the scar it keeps is "a pass is credited once ever" (a converted pass, or one
  // another checkout's claim GRANTED, is overlap, asked before any claim is written); the reason it dropped is "or
  // holds its lease", which refused for good a checkout whose rival's holder could still die and never grant.
  it("★ a pass is credited once ever: converted already, or another checkout's granted claim, is overlap, saying whether its own claim is unsettled", () => {
    const body = claim();
    const overlap = at(
      body,
      "if exists (select 1 from public.event_passes q where q.id = any(v_ids) and q.consumed_at is not null) or exists ( select 1 from public.pass_credits c where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids and c.granted_at is not null) then return jsonb_build_object('state', 'overlap', 'unsettled', v_claim.stripe_session_id is not null); end if;",
    );
    // ★ Never a lease: the once-ever check names no claimed_until at all.
    expect(body.slice(overlap, body.indexOf("end if;", overlap))).not.toContain(
      "claimed_until",
    );
    // Asked before a first claim is written and before a lapsed one is taken over, never after.
    expect(overlap).toBeLessThan(at(body, "insert into public.pass_credits"));
    expect(overlap).toBeLessThan(
      at(
        body,
        "update public.pass_credits set claimed_until = now() + c_lease",
      ),
    );
    // And every pass a first claim names is hers.
    expect(body).toContain(
      "select count(*) into v_owned from public.event_passes q where q.id = any(v_ids) and q.profile_id = p_host_id;",
    );
  });

  it("★ another checkout's live lease is busy, never overlap: asked after the once-ever check, before any claim is written (credit-watch)", () => {
    const body = claim();
    const overlap = at(
      body,
      "return jsonb_build_object('state', 'overlap', 'unsettled',",
    );
    const lease = at(
      body,
      "select max(c.claimed_until) into v_held_until from public.pass_credits c where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_ids and c.claimed_until > now(); if v_held_until is not null then return jsonb_build_object('state', 'busy', 'held_by', 'another_checkout', 'retry_after_sec', greatest(1, ceil(extract(epoch from (v_held_until - now()))))::integer); end if;",
    );
    expect(overlap).toBeLessThan(lease);
    expect(lease).toBeLessThan(at(body, "insert into public.pass_credits"));
    expect(lease).toBeLessThan(
      at(
        body,
        "update public.pass_credits set claimed_until = now() + c_lease",
      ),
    );
    // This checkout's own live lease says which it is, too.
    expect(body).toContain(
      "if v_claim.claimed_until > now() then return jsonb_build_object('state', 'busy', 'held_by', 'this_checkout',",
    );
  });

  it("★ a released claim answers overlap, settled, before its grant: one released beside a grant never converts (credit-watch)", () => {
    const body = claim();
    const released = at(
      body,
      "if v_claim.released_at is not null then return jsonb_build_object('state', 'overlap', 'unsettled', false); end if;",
    );
    expect(released).toBeLessThan(
      at(
        body,
        "if v_claim.granted_at is not null then return jsonb_build_object('state', 'granted',",
      ),
    );
  });

  it("★ the lease outlasts any delivery the webhook can run, so a holder finishes or dies before it is taken over", () => {
    const lease = claim().match(
      /c_lease constant interval := interval '(\d+) minutes';/,
    );
    expect(lease, "the claim's lease").not.toBeNull();
    const route = readFileSync(
      join(process.cwd(), "src/app/api/stripe/webhook/route.ts"),
      "utf8",
    );
    const maxDuration = route.match(/export const maxDuration = (\d+);/);
    expect(maxDuration, "the webhook's maxDuration").not.toBeNull();
    expect(Number(maxDuration![1])).toBeLessThan(Number(lease![1]) * 60);
  });
});

describe("5. the conversion", () => {
  it("★ converts exactly the passes its claim names, and only after the grant is on record", () => {
    const body = bodyOf("convert_pass_credit");
    const granted = at(
      body,
      "if v_claim.granted_at is null then raise exception 'This checkout''s credit is not granted yet.'",
    );
    const write = at(
      body,
      "update public.event_passes set consumed_at = now(), consumed_reason = 'pro_credit' where profile_id = p_host_id and id = any(v_claim.pass_ids) and consumed_at is null; get diagnostics v_converted = row_count;",
    );
    expect(granted).toBeLessThan(write);
    expect(body).toContain(
      "select * into v_claim from public.pass_credits where stripe_session_id = p_session_id and profile_id = p_host_id for update;",
    );
  });

  it("★ clears the chain only when it converted, so a replay never clears a pass bought since; no tier, room or Stripe column", () => {
    const body = bodyOf("convert_pass_credit");
    expect(body).toContain(
      "if v_converted > 0 then update public.profiles set tier_expires_at = null, event_slots = null where id = p_host_id; end if;",
    );
    // Its one profile write is the chain's: the tier and the room are the subscription events'.
    expect(body.match(/update public\.profiles set [^;]*;/g)).toEqual([
      "update public.profiles set tier_expires_at = null, event_slots = null where id = p_host_id;",
    ]);
  });
});

describe("6. the recompute", () => {
  const recompute = () => bodyOf("recompute_pass_entitlement");

  it("★ never touches a Pro profile, read under the lock it writes under", () => {
    const body = recompute();
    const lock = at(
      body,
      "select * into v_profile from public.profiles where id = p_host_id for update;",
    );
    const pro = at(
      body,
      "if v_profile.tier = 'pro' then return 'skipped_pro'; end if;",
    );
    const write = at(
      body,
      "update public.profiles set tier = v_tier, storage_cap_bytes = v_cap, event_slots = v_slots, tier_expires_at = v_expires where id = p_host_id and tier <> 'pro';",
    );
    expect(lock).toBeLessThan(pro);
    expect(pro).toBeLessThan(write);
  });

  it("derives the four fields from her unconsumed windows at one instant: slots, rooms and the chain's end", () => {
    const body = recompute();
    expect(body).toContain("v_now timestamptz := coalesce(p_now, now());");
    expect(body).toContain(
      "select count(*) filter (where q.start_at <= v_now and q.expires_at > v_now), max(q.expires_at) filter (where q.expires_at > v_now) into v_live, v_chain from public.event_passes q where q.profile_id = p_host_id and q.consumed_at is null;",
    );
    // One pass's room is tier_limits' (tiers.ts' number under its parity test), never restated here.
    expect(body).toContain(
      "v_cap := v_live * (select l.default_storage_cap_bytes from public.tier_limits('event_pass') l);",
    );
    expect(body).not.toMatch(/\d+::bigint \* 1024/);
  });

  it("★ writes nothing for a profile with no live window whose pass became Pro credit within the hour, in real time (credit-watch)", () => {
    const body = recompute();
    expect(body).toContain(
      "c_pro_pending constant interval := interval '1 hour';",
    );
    const windows = at(body, "into v_live, v_chain from public.event_passes q");
    const pending = at(
      body,
      "if v_live = 0 and exists ( select 1 from public.event_passes q where q.profile_id = p_host_id and q.consumed_reason = 'pro_credit' and q.consumed_at > now() - c_pro_pending and q.consumed_at < q.expires_at) then return 'skipped_pro_pending'; end if;",
    );
    const write = at(body, "update public.profiles set tier = v_tier");
    expect(windows).toBeLessThan(pending);
    expect(pending).toBeLessThan(write);
    // Real time: what is in flight is in flight now, whatever instant the sweep asks at.
    expect(body.slice(pending, body.indexOf("end if;", pending))).not.toContain(
      "v_now",
    );
  });
});

describe("7. the calls", () => {
  it("★ the route claims, grants, records and converts; nothing in the app calls the old one-arg conversion", () => {
    const root = join(process.cwd(), "src");
    const credit = readFileSync(
      join(root, "app/api/stripe/webhook/pass-credit.ts"),
      "utf8",
    );
    const claimAt = at(credit, "await claimPassCredit(");
    const recordAt = at(credit, "await recordPassCreditGrant(");
    const convertAt = at(credit, "await convertPassCredit(");
    expect(claimAt).toBeLessThan(recordAt);
    expect(recordAt).toBeLessThan(convertAt);
    const mutations = readFileSync(
      join(root, "lib/db/mutations/event-passes.ts"),
      "utf8",
    );
    expect(mutations).not.toContain("consume_passes_for_pro_credit");
    for (const name of [...CREDIT, "release_pass_credit"]) {
      expect(mutations).toContain(`"${name}"`);
    }
    // ★ An unsettled overlap is looked for on Stripe's side before it is released (credit-watch), never released blind.
    const overlapCase = credit.slice(at(credit, 'case "overlap": {'));
    expect(at(overlapCase, "if (claim.unsettled) {")).toBeLessThan(
      at(overlapCase, "await findGrant(input)"),
    );
    expect(at(overlapCase, "await findGrant(input)")).toBeLessThan(
      at(overlapCase, "await releasePassCredit("),
    );
  });
});

describe("8. the release (credit-watch)", () => {
  const release = () => bodyOf("release_pass_credit");

  it("★ releases only a claim another checkout's credit overtook: a converted pass, or another checkout's granted claim", () => {
    const body = release();
    const owed = at(
      body,
      "if not exists (select 1 from public.event_passes q where q.id = any(v_claim.pass_ids) and q.consumed_at is not null) and not exists ( select 1 from public.pass_credits c where c.profile_id = p_host_id and c.stripe_session_id <> p_session_id and c.pass_ids && v_claim.pass_ids and c.granted_at is not null) then raise exception 'This checkout''s passes are not another checkout''s to credit: it is still owed.'",
    );
    expect(owed).toBeLessThan(at(body, "update public.pass_credits"));
  });

  it("★ never a granted claim (it converts) nor one a delivery holds right now, refused before the write", () => {
    const body = release();
    const write = at(body, "update public.pass_credits");
    expect(
      at(
        body,
        "if v_claim.granted_at is not null then raise exception 'This checkout''s credit is granted: it converts, never releases.'",
      ),
    ).toBeLessThan(write);
    expect(
      at(
        body,
        "if v_claim.claimed_until > now() then raise exception 'This checkout''s credit is held by a delivery right now.'",
      ),
    ).toBeLessThan(write);
    // A replay answers what is on record, before any refusal.
    expect(
      at(
        body,
        "if v_claim.released_at is not null then return case when v_claim.granted_at is null then 'released' else 'released_granted' end; end if;",
      ),
    ).toBeLessThan(at(body, "if v_claim.granted_at is not null then raise"));
  });

  it("writes only its own claim: released and unleased, with the grant Stripe holds on record beside it when one is named", () => {
    const body = release();
    expect(body).toContain(
      "update public.pass_credits set released_at = now(), claimed_until = null, balance_transaction_id = p_balance_transaction_id, granted_at = case when p_balance_transaction_id is null then null else now() end where stripe_session_id = p_session_id;",
    );
    expect(
      body.match(/\b(?:update|insert into|delete from) public\.\w+/g),
    ).toEqual(["update public.pass_credits"]);
  });
});
