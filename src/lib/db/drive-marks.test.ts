/**
 * DRIVE'S CRUMBS (20261006130000), their load-bearing facts pinned on the definitions that win (database-security.md: "a
 * later create or replace that drops one fails the gate"): ★ a send says whether its album folder was found by its
 * mark, and its lease carries that, so a re-send after a reconnect looks each file up before it goes; ★ the closing
 * check holds its cursor at the first file Google did not answer for, so "every one checked" follows an answer for
 * every one. And the file's own hygiene: the dropped signature gone, every grant restated (PUBLIC revoked first), the
 * column no client's. The rolled-back proof at the Handoff runs the transitions on the live schema.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  executableSql,
  liveFunction,
  liveFunctions,
  MIGRATIONS_DIR,
} from "@/lib/db/testing/migrations";

const FILE = "20261006130000_drive_marks.sql";
const sql = executableSql(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8"));
const FUNCTIONS = [
  "cloud_export_ready",
  "cloud_export_lease",
  "cloud_export_check_page",
];

describe("20261006130000's functions", () => {
  it("are the three it writes, each winning on the live set, a SECURITY DEFINER with an empty search_path", () => {
    for (const name of FUNCTIONS) {
      const fn = liveFunction(name);
      expect(fn.file, name).toBe(FILE);
      expect(fn.code, name).toMatch(/security definer set search_path = ''/);
    }
  });

  it("★ leave one cloud_export_ready standing, the three-argument one (two would make every call ambiguous)", () => {
    const ready = liveFunctions().filter(
      (f) => f.name === "cloud_export_ready",
    );
    expect(ready).toHaveLength(1);
    expect(sql).toMatch(
      /drop function public\.cloud_export_ready\(uuid, text\);/,
    );
    expect(sql).toMatch(
      /create function public\.cloud_export_ready\(p_job uuid, p_folder_id text, p_found boolean default false\)/,
    );
  });

  it("★ revoke PUBLIC's default first, then grant the service role alone, for each signature", () => {
    for (const signature of [
      "cloud_export_ready\\(uuid, text, boolean\\)",
      "cloud_export_lease\\(uuid\\)",
      "cloud_export_check_page\\(uuid, jsonb, integer, text\\)",
    ]) {
      const revoke = sql.search(
        new RegExp(
          `revoke all on function public\\.${signature} from public, anon, authenticated;`,
        ),
      );
      const grant = sql.search(
        new RegExp(
          `grant execute on function public\\.${signature} to service_role;`,
        ),
      );
      expect(revoke, signature).toBeGreaterThan(-1);
      expect(grant, signature).toBeGreaterThan(revoke);
    }
    expect(sql).not.toMatch(/grant [^;]* to (anon|authenticated)/);
  });
});

describe("★ a re-send after a reconnect adds only what is missing", () => {
  it("keeps on the send whether its folder was found, never granting it to a client", () => {
    expect(sql).toMatch(
      /alter table public\.cloud_exports add column folder_found boolean not null default false;/,
    );
    expect(liveFunction("cloud_export_ready").code).toMatch(
      /folder_found = coalesce\(p_found, false\)/,
    );
  });

  it("hands it to the lane with a send's lease", () => {
    expect(liveFunction("cloud_export_lease").code).toContain(
      "'folder_found', v_job.folder_found",
    );
  });

  it("keeps everything the capture time's lease said (its key, the prior file)", () => {
    const lease = liveFunction("cloud_export_lease").code;
    expect(lease).toContain("'captured_at', m.captured_at");
    expect(lease).toContain("'prior_file_id'");
  });
});

describe("★ every one checked means every one answered", () => {
  const body = () => liveFunction("cloud_export_check_page").code;

  it("holds the cursor below the first unknown", () => {
    expect(body()).toMatch(/where r ->> 'state' = 'unknown'/);
    expect(body()).toMatch(
      /\(v_hold is null or v_item\.media_id < v_hold\) and \(v_last is null or v_item\.media_id > v_last\)/,
    );
  });

  it("never sends again on a doubt: only ok and missing are acted on", () => {
    expect(body()).toMatch(
      /if v_entry ->> 'state' not in \('ok', 'missing'\) then\s+continue;/,
    );
  });

  it("paces a held page (its lease kept a minute) and counts no progress for a page answered nothing", () => {
    expect(body()).toMatch(
      /when v_hold is not null then c_now \+ interval '1 minute' else c_now end/,
    );
    expect(body()).toMatch(
      /last_progress_at = case when v_answered > 0 then c_now else last_progress_at end/,
    );
  });

  it("takes the check's own slow down as the connection's, and never reopens a send it paused", () => {
    expect(body()).toMatch(/if p_finding = 'throttled' then/);
    expect(body()).toMatch(/if v_status = 'checking' then/);
  });
});
