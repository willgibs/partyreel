import { cn } from "@/lib/utils";

/**
 * A CINEMA CHAPTER: a group of sections forced onto the dark ("cinema") ground
 * inside a forced-light paper page. The exact inverse of PaperChapter, and the
 * half of the chapter doctrine the system was missing — until this existed the
 * site could only go light-inside-dark, which is a real reason the paper pages
 * read flatter than the cinema ones.
 *
 * The theme switch is a CHAPTER CUT (the ruled chapter doctrine): cinema = the
 * event, paper = the morning after / the host's desk. Cuts are hard (a plane
 * change); no gradients.
 *
 * ── WHY THIS PAINTS WITH --gallery*, AND REDECLARES TOKENS LOCALLY ──
 *
 * This is the MarketingFooter's ink-slab recipe extracted into a box, so future
 * chapters get it without re-deriving the trap. --gallery* is the system's
 * always-dark family, declared once in :root and deliberately never overridden
 * in .dark. A `.dark` wrapper here would be wrong twice: globals.css rules it
 * out ("never nest .dark inside .surface-paper"), and it would silently neuter
 * every `dark:` utility in the subtree, because the custom variant is
 * `:is(.dark *):not(.surface-paper *)`.
 *
 * ★ But bg-gallery alone is a trap. --ring, --border, --foreground,
 * --muted-foreground, --brand, --card and --input are NOT in that family, so
 * under .surface-paper they keep their LIGHT values: `* { outline-ring/50 }`
 * paints focus rings at 1.44:1 against a 3:1 requirement, muted text lands at
 * 2.62:1 against 4.5:1, and a bare border paints a near-white hairline. NONE of
 * it is visible while developing, because the identical markup looks correct
 * inside .dark on a cinema page. So the chapter redeclares what it needs and
 * everything inside is then correct by construction rather than by vigilance.
 *
 * Three of these are things the footer does not teach, because the footer has no
 * child that consumes them:
 *  - ★ --shadow-float must be the INVISIBLE value, never `none`. globals.css
 *    states the reason where .dark does the same thing: "Dark mode has NO
 *    shadows; an invisible value keeps the utility valid." Tailwind composes
 *    --tw-shadow into a comma-separated box-shadow beside the ring/inset slots,
 *    and a `none` inside that list invalidates the whole declaration, taking any
 *    ring on the same element with it.
 *  - ★ --card-foreground travels WITH --card. shadcn Card is
 *    `bg-card text-card-foreground`; redeclaring only --card makes a Card
 *    ink-on-ink, i.e. invisible. Same for --muted / --muted-foreground.
 *  - ★ --brand must be redeclared DIRECTLY, not via --primary. A var() inside a
 *    custom property is substituted at the element that DECLARES it, so
 *    `--brand: var(--primary)` already resolved to ink back at :root and
 *    inherits down resolved.
 *
 * --secondary / --accent are derived from the gallery pair rather than copied
 * from .dark's literals, so they cannot drift out of sync with globals.css.
 *
 * ── SCOPE: type and media, not controls ──
 *
 * A chapter deliberately does NOT re-ramp the state colors (--destructive,
 * --success, --warning, --like, --save, --reel). .dark brightens every one of
 * them so they pop against near-black, and mirroring those literals here would
 * fork globals.css. Nor does it fix native form controls: the page-level
 * `color-scheme: light` still applies, so date pickers, selects and any
 * overflow region's scrollbars render light inside a chapter. Keep controls and
 * status UI OUTSIDE a chapter; it is for type and media.
 *
 * Radix popovers/menus portal to document.body, outside this subtree entirely,
 * so redeclaring --popover* here would do nothing. portalSkinProps already
 * solves that problem.
 *
 * Doctrine (do NOT relax):
 *  - NEVER put `data-mkt-skin` on a chapter — `body:has([data-mkt-skin=...])`
 *    rules key page-level chrome off that attribute and a chapter would flip
 *    the whole body.
 *  - NEVER rely on `dark:` utilities on this element or anywhere inside it.
 *  - No border-y. PaperChapter's hairline works because it draws with the LIGHT
 *    --border against dark; reversed it resolves to --gallery-border (2.49:1),
 *    which paints nothing against paper. A dark slab meeting paper IS the seam.
 *  - No overflow-hidden: a seam-straddling child (a plate pulled across the cut
 *    with a negative margin) must be free to overhang. ★ Such a child carries
 *    `surface-paper` ITSELF, which re-aliases the whole light block including
 *    --shadow-float — so the attribute that makes it straddle is also the one
 *    that gives back the shadow this chapter turns off.
 *  - A chapter changes the GROUND, never the type ladder: section h2s inside a
 *    chapter on a paper page stay text-2xl sm:text-3xl.
 *
 * `data-mkt` re-declares the [data-mkt] token block ON this element so derived
 * tokens re-resolve against the DARK values (--mkt-pulse-ring is a color-mix
 * over var(--foreground), and unregistered custom properties substitute at the
 * DECLARING element). Same reason PaperChapter and portalSkinProps re-apply it.
 */
export function CinemaChapter({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-mkt
      className={cn(
        // The local token redeclaration (see the header note). Keep together;
        // cinema-chapter-contract.test.ts pins every line of it.
        "[--background:var(--gallery)] [--border:var(--gallery-border)] [--foreground:var(--gallery-foreground)] [--muted-foreground:var(--gallery-muted)] [--ring:var(--gallery-foreground)]",
        "[--card-foreground:var(--gallery-foreground)] [--card:var(--gallery)] [--muted:var(--gallery)]",
        "[--accent-foreground:var(--gallery-foreground)] [--accent:color-mix(in_oklab,var(--gallery-foreground)_11%,var(--gallery))] [--secondary-foreground:var(--gallery-foreground)] [--secondary:color-mix(in_oklab,var(--gallery-foreground)_11%,var(--gallery))]",
        "[--brand-foreground:var(--gallery)] [--brand:var(--gallery-foreground)] [--input:var(--gallery-border)] [--primary-foreground:var(--gallery)] [--primary:var(--gallery-foreground)]",
        "[--shadow-float:0_0_0_0_oklch(0_0_0/0)]",
        // isolate + relative give a seam hairline something to pin to without
        // it escaping over the page above.
        "relative isolate bg-background text-foreground",
        // The stacked-viewport rule PaperChapter learned: below lg the cut
        // double-stacks two section paddings into a long dead stretch.
        "max-lg:[&>section]:py-14",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
