import { Check, Link2 } from "lucide-react";

/**
 * The copy-link affordance every reading surface shares (R6; lifted out of
 * mdx-components in the legal round so the legal shell, which is not MDX, emits
 * the same markup). Server-rendered only: a real anchor (no-JS still jumps)
 * that the ONE HeadingAnchorsDelegate island upgrades to copy-the-deep-link +
 * the icon-swap check (the 09-icon-swap recipe). Trailing inline so it never
 * disturbs heading wrap; opacity-revealed on the heading's hover (`group` on
 * the heading) or its own focus.
 */
export function HeadingAnchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      data-anchor-copy={id}
      aria-label="Copy link to this section"
      className="ml-2 inline-flex rounded-md align-baseline text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
    >
      <span className="mkt-icon-swap" data-state="a" aria-hidden>
        <Link2 className="mkt-icon size-4" data-icon="a" />
        <Check className="mkt-icon size-4 text-success" data-icon="b" />
      </span>
    </a>
  );
}

// The scroll margin rides --mkt-header-h (the one chrome-height knob; same calc
// as SectionShell) so a TOC/anchor jump clears the sticky header even if its
// height is ever retuned (the old hardcoded scroll-mt-24 silently coupled to h-16).
export const HEADING_SCROLL_MT =
  "scroll-mt-[calc(var(--mkt-header-h,4rem)+1rem)]";
