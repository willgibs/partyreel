/**
 * THE SPEND WATCH'S MIGRATION (20261003190000), its load-bearing facts pinned (database-security.md: "a new
 * load-bearing fact earns a guard"): the one definer read pinned and the service role's alone, the readings an
 * INVOKER read that never lets one failed section take the rest, and the three switches seeded ON under the keys the
 * code reads.
 */
import { describe, expect, it } from "vitest";

import { jobById } from "@/app/admin/jobs/catalog";
import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";
import { SWITCH_KEYS } from "@/lib/jobs/spend-watch";

const FILE = "20261003190000_spend_watch.sql";

/** The file as code (comments gone, whitespace collapsed): the rolled-back check at its foot is commented out. */
const sql = (() => {
  const found = executableMigrations().find(({ file }) => file === FILE);
  if (!found) throw new Error(`${FILE} is gone`);
  return found.sql;
})();

/**
 * A function's winning body, as code: the definition that wins across the whole migration set
 * (`testing/migrations.ts` replays its creates AND drops in order), so a function a later file drops throws here,
 * naming the file, instead of reading as the body this file gave it. The grants and the seeds below are this
 * migration's own statements, read from `sql`.
 */
const bodyOf = (name: string): string => liveFunction(name).code;

describe("the spend watch's migration", () => {
  it("★ reads auth.users only inside a pinned SECURITY DEFINER count", () => {
    const signIns = bodyOf("spend_watch_sign_ins");
    expect(signIns).toMatch(/security definer\s+set search_path = ''/);
    expect(signIns).toContain("from auth.users u");
    expect(signIns).toMatch(/returns bigint/);
    // The readings never read auth.* themselves: they ask the definer count.
    const readings = bodyOf("spend_watch_readings");
    expect(readings).toMatch(/security invoker\s+set search_path = ''/);
    expect(readings).not.toContain("auth.");
    expect(readings).toContain("public.spend_watch_sign_ins(v_since, p_now)");
  });

  it("★ gives both functions to the service role alone, PUBLIC's default revoked first", () => {
    for (const signature of [
      "public.spend_watch_sign_ins(timestamptz, timestamptz)",
      "public.spend_watch_readings(timestamptz, text[])",
    ]) {
      const revoke = sql.indexOf(
        `revoke all on function ${signature} from public, anon, authenticated;`,
      );
      const grant = sql.indexOf(
        `grant execute on function ${signature} to service_role;`,
      );
      expect(revoke, signature).toBeGreaterThan(0);
      expect(grant, signature).toBeGreaterThan(revoke);
    }
    expect(sql).not.toMatch(/to (anon|authenticated)/);
  });

  it("★ traps each section's failure alone, so one missing reading never takes the rest", () => {
    const readings = bodyOf("spend_watch_readings");
    // The winning body (drive-wiring's cloud_export added `drive_bytes`): every section traps its own failure, so the
    // count of handlers is the count of sections, named once here.
    const sections = [
      "ledger",
      "album",
      "lifecycle_mail",
      "sign_ins",
      "downloads",
      "purge_runs",
      "drive_bytes",
    ];
    for (const section of sections) {
      expect(readings).toContain(
        `v_errors := v_errors || jsonb_build_object('${section}', sqlerrm);`,
      );
    }
    expect(readings.match(/exception when others then/g)).toHaveLength(
      sections.length,
    );
    // And no lifecycle kind is typed in SQL: the app passes send-kinds.ts's list, and none named is an error.
    expect(readings).toContain(
      "raise exception 'no lifecycle kinds were named';",
    );
    expect(readings).not.toMatch(/'inactivity_warning'|'renewal_nudge'/);
  });

  it("seeds the three switches ON under the keys the code reads, never overwriting a set one", () => {
    expect(sql).toContain(
      "insert into public.ops_flags (key, enabled) values ('spend_watch_enabled', true), ('uploads_enabled', true), ('lifecycle_mail_enabled', true) on conflict (key) do nothing;",
    );
    expect(jobById("spend_watch")?.flagKey).toBe("spend_watch_enabled");
    expect(SWITCH_KEYS).toEqual(
      expect.arrayContaining(["uploads_enabled", "lifecycle_mail_enabled"]),
    );
  });

  it("counts only what costs: minted zips, the purge's working runs, the day to p_now", () => {
    const readings = bodyOf("spend_watch_readings");
    expect(readings).toContain("and x.outcome = 'minted'");
    expect(readings).toContain("and r.status <> 'skipped'");
    expect(readings).toContain(
      "v_since constant timestamptz := p_now - interval '24 hours';",
    );
  });
});
