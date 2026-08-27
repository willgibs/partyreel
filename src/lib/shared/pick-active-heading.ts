/**
 * The scroll-spy decision, pure (R6 help ToC): the active heading is the LAST
 * one whose top sits at/above the offset line (the sticky header's bottom edge
 * plus breathing room), or the first heading before any is reached. Geometry
 * decides so a programmatic jump (hash nav, back-forward restore) that skips
 * IntersectionObserver's band can never strand the highlight; the observer is
 * only the cheap trigger for recomputing this. Headings arrive in document
 * order.
 */
export function pickActiveHeading(
  headings: readonly { id: string; top: number }[],
  offset: number,
): string | null {
  if (headings.length === 0) return null;
  let active = headings[0].id;
  for (const heading of headings) {
    if (heading.top <= offset) active = heading.id;
    else break;
  }
  return active;
}
