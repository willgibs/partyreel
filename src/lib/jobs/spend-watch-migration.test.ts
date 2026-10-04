/**
 * THE SPEND WATCH'S MIGRATION (20261003190000), its load-bearing facts pinned (database-security.md: "a new
 * load-bearing fact earns a guard"): the one definer read pinned and the service role's alone, the readings an
 * INVOKER read that never lets one failed section take the rest, and the three switches seeded ON under the keys the
 * code reads.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { jobById } from "@/app/admin/jobs/catalog";
import { SWITCH_KEYS } from "@/lib/jobs/spend-watch";

const FILE = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261003190000_spend_watch.sql",
);

/** The file's executable SQL: the rolled-back check at its foot is commented out. */
const sql = readFileSync(FILE, "utf8")
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

function bodyOf(name: string): string {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  expect(start, name).toBeGreaterThanOrEqual(0);
  const end = sql.indexOf("$$;", sql.indexOf("as $$", start));
  return sql.slice(start, end);
}

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
    for (const section of [
      "ledger",
      "album",
      "lifecycle_mail",
      "sign_ins",
      "downloads",
      "purge_runs",
    ]) {
      expect(readings).toContain(
        `v_errors := v_errors || jsonb_build_object('${section}', sqlerrm);`,
      );
    }
    expect(readings.match(/exception when others then/g)).toHaveLength(6);
    // And no lifecycle kind is typed in SQL: the app passes send-kinds.ts's list, and none named is an error.
    expect(readings).toContain(
      "raise exception 'no lifecycle kinds were named';",
    );
    expect(readings).not.toMatch(/'inactivity_warning'|'renewal_nudge'/);
  });

  it("seeds the three switches ON under the keys the code reads, never overwriting a set one", () => {
    expect(sql).toContain(
      "insert into public.ops_flags (key, enabled) values\n  ('spend_watch_enabled', true),\n  ('uploads_enabled', true),\n  ('lifecycle_mail_enabled', true)\non conflict (key) do nothing;",
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
