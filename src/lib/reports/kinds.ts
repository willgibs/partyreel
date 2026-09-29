/**
 * WHAT A REPORT SAYS IT IS (admin-triage r2, Will 2026-09-29, `harm=kinds`): "The form asks one of five kinds
 * or Something else. Harm arrives in front, worst first, the worst covered; Something else joins the sweep."
 * One home for the kinds, their words on the guest's form, their chips in the operator's queue and the order
 * the queue reads them in. Pure, so the form, the route, the queue, the alert and their tests read one list.
 *
 * ★ THE FIVE ARE THE BOARD'S, THE WORST SPLIT IN TWO. The board drew "Sexual content, or a child at risk" as one
 * kind; his chat made a child-abuse report from a confirmed address hide its item at once, and a kind that also
 * held adult nudity would hand that power to every report of a revealing photo (his flip side: "anyone to
 * effectively takedown other photos knowing CA reports are immediate takedown"). So the album's form asks five
 * kinds of harm or Something else: a child's first, sexual content second, then the board's three. The person
 * form (`/u/<slug>`) asks no kind; its report files as Something else and waits under People.
 *
 * The SQL mirror is `public.report_kind` (20260929140000); `kinds.test.ts` reads it off the migration.
 */

export const REPORT_KINDS = [
  "child",
  "sexual",
  "violence",
  "private",
  "consent",
  "other",
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

/** The words a guest picks from on the Report form, in the form's order (worst first, Something else last). */
export const KIND_WORDS: Record<ReportKind, string> = {
  child: "A child in sexual or abusive content",
  sexual: "Nudity or sexual content",
  violence: "Violence, a threat or hate",
  private: "Someone's private details on show",
  consent: "Me or my child, and I want it down",
  other: "Something else",
};

/** The shorter name the operator's queue wears on its chip. */
export const KIND_CHIP: Record<ReportKind, string> = {
  child: "Child abuse",
  sexual: "Sexual content",
  violence: "Violence or a threat",
  private: "Private details",
  consent: "Me or my child",
  other: "Something else",
};

/** Worst first: the order the front of the queue is read in (a lower number is worse). */
const SEVERITY: Record<ReportKind, number> = {
  child: 0,
  sexual: 1,
  violence: 2,
  private: 3,
  consent: 4,
  other: 9,
};

/** A kind of harm: it arrives in front and is judged one at a time, never swept. */
export function isHarmKind(kind: ReportKind): boolean {
  return kind !== "other";
}

/**
 * The worst kinds arrive with their frame COVERED (the runbook's "keep human viewing to a minimum": confirm
 * plausibility, never study the content), one press away from being looked at once.
 */
export function isCoveredKind(kind: ReportKind): boolean {
  return kind === "child" || kind === "sexual";
}

/**
 * The one kind a confirmed reporter's report hides at once (create_report's instant hide), and the one no
 * operator ever asks proof of: asking a stranger to send proof of it would invite exactly what must never be
 * sent.
 */
export const INSTANT_HIDE_KIND: ReportKind = "child";

/** Compare two kinds, worst first (for a sort). */
export function bySeverity(a: ReportKind, b: ReportKind): number {
  return SEVERITY[a] - SEVERITY[b];
}

/** The worst among several reports' kinds (an item reported twice wears the worse). */
export function worstKind(kinds: readonly ReportKind[]): ReportKind {
  return kinds.reduce<ReportKind>(
    (worst, k) => (SEVERITY[k] < SEVERITY[worst] ? k : worst),
    "other",
  );
}

/** A raw value as a kind: anything unknown (an old row, a missing field) is Something else. */
export function parseReportKind(raw: unknown): ReportKind {
  return typeof raw === "string" &&
    (REPORT_KINDS as readonly string[]).includes(raw)
    ? (raw as ReportKind)
    : "other";
}
