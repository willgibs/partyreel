import { describe, expect, it } from "vitest";

import { REPORT_STATUSES, REPORT_STATUS_META } from "@/lib/admin/reports";
import { filesUnder, read } from "@/testing/source-tree";

/**
 * ★ EVERY REPORT IS REVIEWED, AND ITS VERDICT IS THE REVIEW (crumbs-41; ROADMAP: "`report_status`'s `reviewed` is
 * written by no code path while the marketing and legal copy promise every report is reviewed; a verdict writes it,
 * or the promise changes").
 *
 * The answer is neither as worded. An operator's verdict IS the review the copy promises (actor-free, as the
 * neutralization doctrine wants): Dismissed and Actioned each record who decided and when (`resolved_by`,
 * `resolved_at`), and an open report keeps its item and its album from every purge until one lands, so every report
 * is reviewed. `reviewed` stays an unused value of the enum (dropping one rebuilds the type), never a fourth word of
 * the inbox. What changed is the clause that said more than is true: "reviewed before anything comes down" stopped
 * holding when the instant hide began (a child-abuse report from a confirmed email hides its item at once, pending
 * review), so the marketing lines name that one exception, as the help article always did.
 *
 * The legal pages are not read here: they are rewritten once, before launch, and say the old clause until then
 * (the lane's Handoff names each line).
 */

function sources(dir: string): string[] {
  return filesUnder(dir).filter(
    (path) => /\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path),
  );
}

describe("a report's review is its verdict", () => {
  it("★ no code writes `reviewed`: the inbox speaks Open, Dismissed and Actioned, and nothing else sets the value", () => {
    expect(REPORT_STATUSES).toEqual(["open", "dismissed", "actioned"]);
    // The value stays in the enum's mirror (and so in its meta), and nowhere else in the product's source.
    expect(REPORT_STATUS_META.reviewed.label).toBe("Reviewed");
    const allowed = new Set([
      "src/lib/admin/reports.ts",
      // Generated from the database's enum.
      "src/lib/db/types.ts",
    ]);
    const writers = sources("src").filter(
      (file) => !allowed.has(file) && /["']reviewed["']/.test(read(file)),
    );
    expect(writers).toEqual([]);
  });

  it("★ no marketing line promises review before ANY removal: each names the instant hide's one exception", () => {
    const promises = [
      "src/components/marketing/sections/features/privacy/privacy-faq.ts",
      "src/components/marketing/sections/features/privacy/report-review.tsx",
      "src/lib/constants/about.ts",
    ];
    for (const file of promises) {
      const copy = read(file).replace(/\s+/g, " ");
      expect(copy, file).not.toMatch(
        /reviewed before anything (?:comes down|is removed)/i,
      );
      expect(copy, file).toMatch(/child[- ]abuse/i);
    }
    // And nowhere else in the marketing source or its copy constants.
    const marketing = [
      ...sources("src/components/marketing"),
      ...sources("src/app/(marketing)"),
      ...sources("src/lib/constants").filter((f) => !/legal-/.test(f)),
    ];
    const overclaims = marketing.filter((file) =>
      /reviewed before anything (?:comes down|is removed)/i.test(
        read(file).replace(/\s+/g, " "),
      ),
    );
    expect(overclaims).toEqual([]);
  });
});
