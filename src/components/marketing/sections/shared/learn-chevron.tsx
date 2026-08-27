/**
 * The bare learn-more-hover chevron (24-learn-more-hover, marketing.css chapter
 * 2): arms spread into an arrow while the glyph slides, keyed off an ANCESTOR
 * carrying .mkt-learn — so it can sit inside a card/row Link where nesting
 * LearnMoreLink (its own <Link>) would be invalid HTML. Same markup DemoCtaLink
 * and LearnMoreLink ship inline; new paper surfaces compose this instead of
 * re-duplicating the SVG. (Folding the existing inline copies onto this atom is
 * a one-move cleanup left to the owning tracks.)
 */
export function LearnChevron() {
  return (
    <span className="mkt-learn-chevron inline-flex" aria-hidden>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path className="mkt-learn-arm mkt-learn-arm-top" d="M6 4L10 8" />
        <path className="mkt-learn-arm mkt-learn-arm-bot" d="M10 8L6 12" />
      </svg>
    </span>
  );
}
