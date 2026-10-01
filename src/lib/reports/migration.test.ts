/**
 * THE CONTRACT OF 20260929140000_triage_r2.sql, LATEST-WINS (admin-triage r2 and the hold rebuilt, Will
 * 2026-09-29). Each rule is read from the definition that wins across the whole migration set, so a later file
 * that replaces one of these functions without carrying its arm fails here, by name:
 *
 *  - ★ every function the file creates or replaces revokes EXECUTE from `public` AND `anon`, and each is granted
 *    to the one role that calls it (a function created through the MCP inherits an anon grant otherwise);
 *  - ★ `kept_media_ids` is the one home of "the purge must keep this row", and every permanent delete asks it;
 *    an open report keeps its event whole;
 *  - ★ the instant hide's guards: a confirmed child-abuse report of an item, never the host's, never a barred
 *    address, 3 an address and 5 an event a day, serialized;
 *  - ★ a host never learns what keeps her row: `purge_asked_at` is granted to no client role and her policy
 *    and her restore leave an asked row out; the reporter is forgotten at the close;
 *  - the meter releases at an operator's removal and never twice; a quietly held row takes her own acts; the
 *    proof mail's switch is seeded off.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DIR = join(process.cwd(), "supabase", "migrations");
const FILE = "20260929140000_triage_r2.sql";
const FILES = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const strip = (sql: string) => sql.replace(/--[^\n]*/g, "");
const collapse = (sql: string) => sql.replace(/\s+/g, " ");
const read = (file: string) => strip(readFileSync(join(DIR, file), "utf8"));

/** This file, comments stripped and whitespace collapsed. */
const OWN = collapse(read(FILE));
/** Every migration, in order, the same way. */
const ALL = FILES.map((f) => collapse(read(f))).join("\n");

/** The newest definition of `public.<name>` across the set: from its `create` to its closing dollar-quote. */
function newest(name: string): string {
  let latest: string | null = null;
  for (const file of FILES) {
    const sql = read(file);
    const opener = new RegExp(
      `create (or replace )?function public\\.${name}\\(`,
      "g",
    );
    for (let m = opener.exec(sql); m; m = opener.exec(sql)) {
      const rest = sql.slice(m.index);
      const as = /as \$([a-z_]*)\$/.exec(rest);
      if (!as) throw new Error(`${name} in ${file} has no body`);
      const tag = `$${as[1]}$`;
      const close = rest.indexOf(tag, as.index + as[0].length);
      latest = collapse(rest.slice(0, close));
    }
  }
  if (!latest) throw new Error(`no migration defines public.${name}`);
  return latest;
}

/** Every function this file creates or replaces, by name. */
function ownFunctions(): string[] {
  const names = [
    ...OWN.matchAll(/create (?:or replace )?function public\.([a-z_]+)\(/g),
  ].map(([, name]) => name);
  return [...new Set(names)];
}

describe("the grants", () => {
  it("★ revokes EXECUTE from public and anon on every function it creates or replaces", () => {
    const names = ownFunctions();
    expect(names).toHaveLength(17); // the set itself is pinned below
    for (const name of names) {
      expect(OWN, `public.${name} keeps its inherited grants`).toMatch(
        new RegExp(
          `revoke (all|execute) on function public\\.${name}\\([^)]*\\) from public, anon`,
        ),
      );
    }
    expect(OWN).not.toMatch(/grant [^;]* to [^;]*\banon\b/);
  });

  it("grants each to the one role that calls it, and a trigger's to none", () => {
    const callers: Record<string, string | null> = {
      kept_media_ids: "service_role",
      defer_kept_due_media: "service_role",
      report_queue_facts: "service_role",
      create_report: "service_role",
      purge_media_rows: "service_role",
      held_event_ids: "service_role",
      standby_hosts: "service_role",
      host_storage_summary: "service_role",
      purge_media_now: "authenticated",
      restore_media: "authenticated",
      restore_event: "authenticated",
      reports_forget_reporter: null,
      media_release_meter: null,
      guard_media_privileged_transitions: null,
      block_from_event: "authenticated",
      get_my_uploads: "authenticated",
      remove_my_upload: "authenticated",
    };
    expect(ownFunctions().sort()).toEqual(Object.keys(callers).sort());
    for (const [name, role] of Object.entries(callers)) {
      const granted = [
        ...OWN.matchAll(
          new RegExp(
            `grant execute on function public\\.${name}\\([^)]*\\) to ([a-z_]+);`,
            "g",
          ),
        ),
      ].map(([, r]) => r);
      expect(granted, name).toEqual(role ? [role] : []);
    }
  });
});

describe("what an open report keeps", () => {
  it("★ is one rule, kept_media_ids: a hold, an item's open report, or an album's", () => {
    const kept = newest("kept_media_ids");
    expect(kept).toContain("m.legal_hold_at is not null");
    expect(kept).toContain("r.status = 'open'");
    expect(kept).toContain(
      "(r.media_id = m.id or (r.media_id is null and r.event_id = m.event_id))",
    );
  });

  it("★ and every permanent delete asks it: the purge refuses, her Delete permanently defers, the sweep defers", () => {
    const rows = newest("purge_media_rows");
    expect(rows).toContain("v_kept := public.kept_media_ids(p_media_ids);");
    expect(rows).toContain("and not (m.id = any (v_kept))");
    const now = newest("purge_media_now");
    expect(now).toContain("v_kept := public.kept_media_ids(v_ids);");
    expect(now).toContain(
      "update public.media set purge_asked_at = now() where id = any(v_kept) and purge_asked_at is null;",
    );
    expect(newest("defer_kept_due_media")).toContain(
      "v_kept := public.kept_media_ids(v_due);",
    );
  });

  it("keeps an event with any open report whole, for expired events and account deletion", () => {
    expect(newest("held_event_ids")).toContain(
      "select r.event_id from public.reports r where r.event_id = any(p_event_ids) and r.status = 'open'",
    );
  });
});

describe("the instant hide (his yes, with the anti-abuse)", () => {
  const report = () => newest("create_report");

  it("★ hides only a confirmed child-abuse report of an item, as an operator's removal", () => {
    expect(report()).toContain(
      "if p_kind = 'child' and v_confirmed and p_media_id is not null then",
    );
    expect(report()).toContain(
      "set status = 'removed', removed_at = now(), removed_by_admin = true",
    );
  });

  it("★ never for the host, never for a barred address, and 3 an address and 5 an event a day, serialized", () => {
    expect(report()).toContain(
      "and p_reporter_user_id is distinct from v_event.host_id",
    );
    // A barred address: since crumbs-33 (20261001100000) the strikes' one home answers it, where this file's
    // inline count of the address's dismissed child-abuse reports used to (db/migration-guards.test.ts, 27).
    expect(report()).toContain(
      "and not coalesce( (public.report_strikes(array[p_reporter_hash]) #>> array['addresses', p_reporter_hash, 'barred'])::boolean, false)",
    );
    expect(newest("report_strikes")).toContain(
      "where r.kind = 'child' and r.status = 'dismissed'",
    );
    expect(report()).toContain(
      "where r.reporter_hash = p_reporter_hash and r.hid_at > now() - interval '24 hours') < 3",
    );
    expect(report()).toContain(
      "where r.event_id = v_event.id and r.hid_at > now() - interval '24 hours') < 5",
    );
    expect(report().match(/pg_advisory_xact_lock/g)).toHaveLength(2);
  });

  it("keeps the address only from a confirmed reporter, and its hash only on a child-abuse report", () => {
    expect(report()).toContain(
      "case when v_confirmed then lower(trim(p_reporter_email)) end",
    );
    expect(report()).toContain(
      "case when v_confirmed and p_kind = 'child' then p_reporter_hash end",
    );
  });
});

describe("what a host never learns", () => {
  it("★ purge_asked_at is granted to no client role, anywhere in the set", () => {
    for (const grant of ALL.matchAll(
      /grant (select|insert|update) \(([^)]*)\) on public\.media/g,
    )) {
      expect(grant[2]).not.toContain("purge_asked_at");
    }
  });

  it("★ her policy and her restore leave an asked row out", () => {
    const policies = [
      ...ALL.matchAll(
        /(?:create|alter) policy media_host_all on public\.media[^;]*;/g,
      ),
    ].map(([p]) => p);
    expect(policies.at(-1)).toContain("and media.purge_asked_at is null");
    expect(newest("restore_media")).toContain("and m.purge_asked_at is null;");
  });

  it("★ the reporter is forgotten at the close, and a closed row can never hold her", () => {
    expect(OWN).toContain(
      "if new.status <> 'open' then new.reporter_email := null; new.proof_token_hash := null; end if;",
    );
    expect(OWN).toContain(
      "before insert or update on public.reports for each row execute function public.reports_forget_reporter();",
    );
    expect(OWN).toContain(
      "check (status = 'open' or (reporter_email is null and proof_token_hash is null))",
    );
  });
});

describe("the meter, the quiet hold and the switch", () => {
  it("releases a row's bytes at an operator's removal or an ask, and the purge never takes them twice", () => {
    expect(OWN).toContain(
      "after update of removed_by_admin, purge_asked_at on public.media",
    );
    expect(newest("purge_media_rows")).toContain(
      "sum(case when d.released then 0 else d.file_size_bytes end)",
    );
  });

  it("★ lets her block take a quietly held row like any other, and counts it; a restore still refuses it", () => {
    expect(newest("block_from_event")).not.toContain("legal_hold_at");
    expect(newest("get_my_uploads")).not.toContain("legal_hold_at");
    expect(newest("remove_my_upload")).not.toContain("legal_hold_at");
    expect(newest("let_back_in")).toContain("and m.legal_hold_at is null");
  });

  it("lets a quietly held row take her own acts, and only the restore RPC takes a row out of Deleted", () => {
    const guard = newest("guard_media_privileged_transitions");
    expect(guard).not.toContain("legal_hold_at");
    expect(guard).toContain(
      "if old.status = 'removed' and new.status is distinct from 'removed' then",
    );
    expect(newest("restore_media")).toContain(
      "if v_media.legal_hold_at is not null then",
    );
  });

  it("seeds the proof mail's switch off", () => {
    expect(OWN).toContain(
      "insert into public.ops_flags (key, enabled) values ('report_proof_mail_enabled', false) on conflict (key) do nothing;",
    );
  });
});
