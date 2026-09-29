import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  bySeverity,
  INSTANT_HIDE_KIND,
  isCoveredKind,
  isHarmKind,
  KIND_CHIP,
  KIND_WORDS,
  parseReportKind,
  REPORT_KINDS,
  worstKind,
} from "@/lib/reports/kinds";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** The enum's labels as the newest migration that creates `public.report_kind` spells them. */
function sqlKinds(): string[] {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let labels: string[] | null = null;
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8").replace(
      /--[^\n]*/g,
      "",
    );
    const m = sql.match(/create type public\.report_kind as enum \(([^)]*)\);/);
    if (m) labels = [...m[1].matchAll(/'([a-z_]+)'/g)].map(([, l]) => l);
  }
  if (!labels) throw new Error("No migration creates public.report_kind.");
  return labels;
}

describe("the report kinds", () => {
  it("★ are the SQL enum's, in its order (one list, two languages)", () => {
    expect([...REPORT_KINDS]).toEqual(sqlKinds());
  });

  it("the form asks five kinds of harm or Something else", () => {
    expect(REPORT_KINDS.filter(isHarmKind)).toHaveLength(5);
    expect(REPORT_KINDS.at(-1)).toBe("other");
    expect(KIND_WORDS.other).toBe("Something else");
  });

  it("every kind has its words and its chip, and no two say the same", () => {
    for (const kind of REPORT_KINDS) {
      expect(KIND_WORDS[kind].length).toBeGreaterThan(3);
      expect(KIND_CHIP[kind].length).toBeGreaterThan(3);
    }
    expect(new Set(Object.values(KIND_WORDS)).size).toBe(REPORT_KINDS.length);
    expect(new Set(Object.values(KIND_CHIP)).size).toBe(REPORT_KINDS.length);
  });

  it("reads worst first: a child's, then sexual content, then the rest, Something else last", () => {
    const sorted = [...REPORT_KINDS].reverse().sort(bySeverity);
    expect(sorted).toEqual([...REPORT_KINDS]);
    expect(worstKind(["other", "consent", "sexual"])).toBe("sexual");
    expect(worstKind(["other", "child", "violence"])).toBe("child");
    expect(worstKind([])).toBe("other");
  });

  it("covers the two sexual kinds, and hides at once only on a child's", () => {
    expect(REPORT_KINDS.filter(isCoveredKind)).toEqual(["child", "sexual"]);
    expect(INSTANT_HIDE_KIND).toBe("child");
    // The instant-hide kind is the one SQL keys the hide on (create_report's `p_kind = 'child'`).
    const sql = readFileSync(
      join(MIGRATIONS, "20260929140000_triage_r2.sql"),
      "utf8",
    );
    expect(sql).toContain(`if p_kind = '${INSTANT_HIDE_KIND}' and v_confirmed`);
  });

  it("reads anything unknown as Something else", () => {
    expect(parseReportKind("child")).toBe("child");
    expect(parseReportKind("sexual_content")).toBe("other");
    expect(parseReportKind(null)).toBe("other");
    expect(parseReportKind(undefined)).toBe("other");
  });
});
