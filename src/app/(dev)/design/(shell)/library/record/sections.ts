import "server-only";

import { headingsOf, readDoc } from "@/app/(dev)/design/_data/docs";
import { RULINGS, type Ruling } from "@/app/(dev)/design/touchpoints";

export const RECORD_FILE = "docs/decisions/design-record.md";

/**
 * THE RECORD, IN THREE GROUPS (the Library x Lab round, 2026-09-15).
 *
 * The record lived in two places that had to agree by hand: `RULINGS` in
 * `touchpoints.ts` and a markdown table at the top of `design-record.md`
 * listing the same ids, surfaces and verdicts. They had already drifted
 * (`event-feed` had a table row and a section and no registry entry, which is
 * how a link in the docs reached a page that did not exist). The table is
 * deleted; this module derives the same thing from the registry and the doc's
 * own headings, and `record.test.ts` fails on any new drift in either
 * direction.
 *
 * Three groups rather than the old two, because the third was the drift:
 * OPEN (a board still standing), RULED (in the registry, decided), and RECORD
 * ONLY (a section in the doc with no registry entry: history the lab kept
 * without a touchpoint).
 */
export type RecordOnly = { id: string; title: string };

export type RecordGroups = {
  open: Ruling[];
  ruled: Ruling[];
  recordOnly: RecordOnly[];
  /** A registry entry whose long form the doc has never carried. */
  missingSection: Ruling[];
};

/** Every `##` heading in the record doc: one per ruling the doc wrote up. */
export function recordSections(): { id: string; text: string }[] {
  return headingsOf(readDoc(RECORD_FILE).body, 2)
    .filter((h) => h.depth === 2)
    .map((h) => ({ id: h.id, text: h.text }));
}

export function recordGroups(): RecordGroups {
  const sections = recordSections();
  const known = new Set<string>(RULINGS.map((r) => r.id));
  const written = new Set(sections.map((s) => s.id));
  return {
    open: RULINGS.filter((r) => r.board !== undefined),
    ruled: RULINGS.filter((r) => r.board === undefined),
    recordOnly: sections
      .filter((s) => !known.has(s.id))
      .map((s) => ({ id: s.id, title: s.text })),
    missingSection: RULINGS.filter((r) => !written.has(r.id)),
  };
}
