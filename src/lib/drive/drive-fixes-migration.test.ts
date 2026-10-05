/**
 * THE DRIVE WALK'S FIXES (20261005180000), their load-bearing facts pinned on the definitions that win (database-
 * security.md: "a later create or replace that drops one fails the gate"): ★ a checking send closes only once its walk
 * is through; ★ Disconnect, and another Google account's connect, forget every Google id before the connection goes,
 * and a sent item may hold no file id only once forgotten; ★ a dying lane counts once a Queue message, the two-argument
 * word gone. And the file's own hygiene: every function a pinned SECURITY DEFINER, PUBLIC revoked before the service
 * role's grant, the two helpers no served role's, the connection row the first lock, no client grant. The rolled-back
 * check at the file's foot proves the transitions on the live schema (the Handoff).
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

const FILE = "20261005180000_cloud_export_fixes.sql";
const sql = executableSql(readFileSync(join(MIGRATIONS_DIR, FILE), "utf8"));

const HELPERS = ["cloud_export_settle", "cloud_connection_forget"];
const SERVED = [
  "cloud_connection_upsert",
  "cloud_connection_disconnect",
  "cloud_connection_lane_failed",
];

describe("20261005180000's functions", () => {
  it("are the five it writes, each winning on the live set", () => {
    for (const name of [...HELPERS, ...SERVED]) {
      expect(liveFunction(name).file, name).toBe(FILE);
    }
  });

  it("★ are each a SECURITY DEFINER with an empty search_path, answering one value", () => {
    for (const name of [...HELPERS, ...SERVED]) {
      const fn = liveFunction(name);
      expect(fn.code, name).toMatch(/security definer set search_path = ''/);
      expect(fn.returns, name).toMatch(/^(jsonb|integer|text)$/);
    }
  });

  it("★ revoke PUBLIC's default first, then grant the service role alone; the helpers no served role", () => {
    for (const name of SERVED) {
      const revoke = sql.search(
        new RegExp(
          `revoke all on function public\\.${name}\\([^)]*\\) from public, anon, authenticated;`,
        ),
      );
      const grant = sql.search(
        new RegExp(
          `grant execute on function public\\.${name}\\([^)]*\\) to service_role;`,
        ),
      );
      expect(revoke, `${name} is never revoked from public`).toBeGreaterThan(
        -1,
      );
      expect(
        grant,
        `${name} is never granted after its revoke`,
      ).toBeGreaterThan(revoke);
    }
    for (const name of HELPERS) {
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}\\(uuid\\) from public, anon, authenticated, service_role;`,
        ),
      );
      expect(sql).not.toMatch(
        new RegExp(`grant execute on function public\\.${name}\\(`),
      );
    }
    expect(sql).not.toMatch(/grant [^;]* to (anon|authenticated|public)\b/);
    expect(sql).not.toMatch(/create policy/);
  });

  it("take the connection row first wherever they lock", () => {
    for (const name of SERVED) {
      const code = liveFunction(name).code;
      const first = code.indexOf("for update");
      expect(first, name).toBeGreaterThan(-1);
      expect(code.slice(Math.max(0, first - 220), first), name).toMatch(
        /public\.cloud_connections/,
      );
    }
    expect(liveFunction("cloud_connection_forget").code).not.toMatch(
      /for update/,
    );
  });
});

describe("what they do", () => {
  it("★ close a checking send only once its walk is through: no sent file past the check's cursor", () => {
    const settle = liveFunction("cloud_export_settle").code;
    const guard = settle.search(
      /if v_job\.status = 'checking' and exists \( select 1 from public\.cloud_export_items i where i\.job_id = p_job and i\.status = 'sent' and \(v_job\.check_after is null or i\.media_id > v_job\.check_after\)\) then return 'checking'; end if;/,
    );
    const close = settle.search(
      /then 'partly_done' else 'done' end, closed_at = now\(\)/,
    );
    expect(guard, "the walk's guard").toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(guard);
  });

  it("★ forget every Google id before the connection goes, at Disconnect and at another account's connect", () => {
    const forget = liveFunction("cloud_connection_forget").code;
    for (const cleared of [
      "drive_file_id = null",
      "drive_md5 = null",
      "session_uri = null",
      "session_offset = null",
      "lease_token = null",
      "forgotten_at = now()",
      "folder_id = null, folder_url = null",
    ]) {
      expect(forget, cleared).toContain(cleared);
    }
    for (const name of [
      "cloud_connection_disconnect",
      "cloud_connection_upsert",
    ]) {
      const code = liveFunction(name).code;
      const forgets = code.indexOf("public.cloud_connection_forget(");
      const goes = code.indexOf("delete from public.cloud_connections");
      expect(forgets, `${name} forgets`).toBeGreaterThan(-1);
      expect(goes, `${name} forgets before the row goes`).toBeGreaterThan(
        forgets,
      );
    }
    expect(sql).toContain(
      "add constraint cloud_export_items_sent_with_file check (status <> 'sent' or drive_file_id is not null or forgotten_at is not null);",
    );
  });

  it("★ count a dying lane once a Queue message, and leave no two-argument word standing", () => {
    const lanes = liveFunctions().filter(
      (f) => f.name === "cloud_connection_lane_failed",
    );
    expect(lanes.map((f) => f.types)).toEqual([["uuid", "text", "text"]]);
    const code = lanes[0]!.code;
    const repeat = code.indexOf("= any (v_conn.lane_failed_messages)");
    const counts = code.indexOf("set lane_failures =");
    expect(repeat, "a message counted before is looked for").toBeGreaterThan(
      -1,
    );
    expect(counts).toBeGreaterThan(repeat);
    expect(code).toContain("'repeat', true");
    expect(sql).toContain(
      "add constraint cloud_connections_lane_failed_messages_len check (cardinality(lane_failed_messages) <= 20);",
    );
  });
});
