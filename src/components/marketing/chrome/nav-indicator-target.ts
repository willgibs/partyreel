/**
 * Which nav item the header indicator should sit under, as a pure function so
 * the precedence is testable without a DOM (the DOM-bound measuring lives in
 * nav-indicator.tsx).
 *
 * PRECEDENCE IS THE POINT: hover beats focus beats open. Hover leads because
 * the indicator is the FIRST feedback the cursor gets — it starts travelling
 * during the ~100ms hover-intent window, before Radix has decided to open
 * anything, which is what makes the bar feel like it answers instantly. Falling
 * back to `open` is what parks the indicator under the live panel once the
 * cursor moves off the trigger row and down into the panel itself.
 */
export function pickIndicatorTarget({
  hoverIndex,
  focusIndex,
  openIndex,
}: {
  hoverIndex: number | null;
  focusIndex: number | null;
  openIndex: number | null;
}): number | null {
  return hoverIndex ?? focusIndex ?? openIndex;
}
