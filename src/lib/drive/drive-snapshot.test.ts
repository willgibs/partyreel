/**
 * ★ WHAT A SEND HOLDS IS HER DOWNLOAD PANEL'S ORIGINALS (the migration's header): the snapshot and the preview take
 * `chosenRows` over what `media_host_all` lets her read. Pinned three ways: the SQL's predicate as written, the
 * policy's conjuncts it leans on, and the same rows chosen both ways over every status a row can hold.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { chosenRows } from "@/lib/export/build-manifest";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const sql = readFileSync(join(MIGRATIONS, "20261005120000_cloud_export.sql"), "utf8")
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

function bodyOf(name: string): string {
  const start = sql.indexOf(`create function public.${name}(`);
  expect(start, name).toBeGreaterThanOrEqual(0);
  return sql.slice(start, sql.indexOf("$$;", start));
}

/** The SQL's predicate, as a function: what the snapshot takes of one row the host can read. */
function sqlTakes(row: { status: string; purge_asked_at: string | null }, includeHidden: boolean): boolean {
  return row.status !== "removed" && row.purge_asked_at === null && (includeHidden || row.status === "approved");
}

describe("the snapshot's predicate", () => {
  it("is written once in the press and once in the preview, the same", () => {
    for (const name of ["cloud_export_create", "cloud_export_preview"]) {
      const body = bodyOf(name);
      expect(body, name).toContain("m.status <> 'removed'");
      expect(body, name).toContain("m.purge_asked_at is null");
      expect(body, name).toMatch(/\(coalesce\(p_include_hidden, false\) or m\.status = 'approved'\)/);
      // ★ A quiet legal hold is not a filter (trust-safety-forensics.md): her zip includes a held row.
      expect(body, name).not.toContain("legal_hold_at");
    }
  });

  it("leans on the policy that reads her album: an operator's removal and an asked purge are out of it", () => {
    const executable = (f: string) =>
      readFileSync(join(MIGRATIONS, f), "utf8")
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n");
    const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
    const last = files.filter((f) => /(alter|create) policy media_host_all on public\.media/.test(executable(f))).pop();
    expect(last).toBeDefined();
    const text = executable(last!);
    const at = text.search(/(alter|create) policy media_host_all on public\.media[\s\S]*$/);
    const policy = text.slice(at, text.indexOf(";", at));
    expect(policy).toContain("and media.purge_asked_at is null");
    expect(policy).toContain("not (media.status = 'removed' and media.removed_by_admin)");
  });

  it("★ chooses the rows chosenRows chooses, over every status and either choice of hidden", () => {
    const statuses = ["approved", "pending", "hidden", "removed"];
    const rows = statuses.map((status, i) => ({
      id: `m${i}`,
      type: "photo" as const,
      original_key: `events/e/originals/m${i}.jpg`,
      file_size_bytes: 1,
      status,
      created_at: "2026-10-01T00:00:00Z",
      purge_asked_at: null as string | null,
    }));
    for (const includeHidden of [false, true]) {
      const zip = chosenRows(rows as never, "all", includeHidden).map((r) => r.id);
      const send = rows.filter((r) => sqlTakes(r, includeHidden)).map((r) => r.id);
      expect(send, `include hidden: ${includeHidden}`).toEqual(zip);
    }
  });
});
