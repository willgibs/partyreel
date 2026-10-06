/**
 * WHAT THE EXPORT WORKER SAW, ON THE EXPORT'S ROW (lane `export-ends`, 20261001235500), held LATEST-WINS across
 * the migration set and against the code that writes and reads it. Its own file, because other lanes write
 * migrations beside this one.
 *
 * What it pins:
 *   1. ★ export_log carries the seven Worker columns, and no later file drops one: the report route writes them
 *      and the walk's status poll and the portal read them by name (`queries/exports.ts`).
 *   2. ★ The outcome CHECK names exactly the outcomes the Worker reports and the walk hears (`report.ts`'s
 *      `STREAM_OUTCOMES`), so an outcome added on one side is refused by the database until it joins the other.
 *   3. ★ The nonce is unique: every report and every status poll finds the export's row by it.
 *   4. No client role is granted anything on export_log, in any file: it stays deny-all.
 */
import { describe, expect, it } from "vitest";

import { readMigrations } from "@/lib/db/testing/migrations";
import { STREAM_OUTCOMES } from "@/lib/export/report";

const FILE = "20261001235500_export_worker_reports.sql";

/** Strip `--` comments (the rolled-back check at the foot is not code) and collapse whitespace. */
function executable(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

const SQL = readMigrations().map(({ file, sql }) => ({
  file,
  sql: executable(sql),
}));

const ALL = SQL.map((f) => f.sql).join(" ");

const COLUMNS: [string, string][] = [
  ["checked_at", "timestamptz"],
  ["check_found", "integer"],
  ["stream_started_at", "timestamptz"],
  ["stream_ended_at", "timestamptz"],
  ["stream_outcome", "text"],
  ["stream_files", "integer"],
  ["stream_missing", "uuid[]"],
];

describe("export_log's Worker columns (20261001235500)", () => {
  it("is in the migration set", () => {
    expect(SQL.map((f) => f.file)).toContain(FILE);
  });

  it("★ adds the seven columns, and no later file drops one", () => {
    for (const [column, type] of COLUMNS) {
      expect(ALL).toContain(`add column ${column} ${type}`);
      expect(ALL).not.toMatch(
        new RegExp(`drop column (if exists )?${column.replace("[]", "")}\\b`),
      );
    }
  });

  it("★ checks exactly the outcomes the Worker reports and the walk hears", () => {
    const check = ALL.match(
      /export_log_stream_outcome_known check \(stream_outcome is null or stream_outcome in \(([^)]*)\)\)/,
    );
    expect(check).not.toBeNull();
    const listed = check![1].split(",").map((s) => s.trim().replace(/'/g, ""));
    expect(listed).toEqual([...STREAM_OUTCOMES]);
    expect(ALL).toContain(
      "export_log_stream_ended_with_outcome check ((stream_ended_at is null) = (stream_outcome is null))",
    );
  });

  it("★ makes the nonce unique, and no later file drops that", () => {
    expect(ALL).toContain(
      "create unique index export_log_jti_key on public.export_log (jti) where jti is not null",
    );
    expect(ALL).not.toMatch(
      /drop index (if exists )?(public\.)?export_log_jti_key/,
    );
  });

  it("grants no client role anything on export_log, in any file", () => {
    expect(ALL).not.toMatch(
      /grant [^;]* on (table )?public\.export_log to [^;]*(anon|authenticated)/,
    );
  });
});
