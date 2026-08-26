import { cn } from "@/lib/utils";

/**
 * A PAPER CHAPTER: a group of sections forced onto the light ("paper") theme
 * inside a forced-dark cinema page. The theme switch is a CHAPTER CUT (the
 * ruled chapter doctrine): cinema = the event, paper = the morning after /
 * the host's desk. Cuts are hard (hairline + plane change) — the editorial
 * page-turn; no gradients.
 *
 * Every root attribute is load-bearing:
 *  - `surface-paper` flips the token subtree light (globals.css aliases the
 *    :root light block; the dark-variant guard stops shadcn `dark:` utilities
 *    inside).
 *  - `bg-background text-foreground` must be EXPLICIT: inherited `color` is a
 *    resolved value, not a live var() — without them the chapter inherits the
 *    cinema wrapper's computed near-white ink (the same bug class the cinema
 *    layout documents).
 *  - `data-mkt` re-declares the [data-mkt] token block ON this element so
 *    derived tokens re-resolve against the LIGHT values (--mkt-pulse-ring is
 *    declared as a color-mix over var(--foreground), and unregistered custom
 *    properties substitute at the DECLARING element — without data-mkt here
 *    the ring inherits pre-baked 18%-white from the cinema wrapper and turns
 *    invisible on paper). Same reason portalSkinProps re-applies data-mkt.
 *  - The stacked-viewport variant compresses the child sections' py-20/24 to
 *    py-14 below lg (the wrapper's extra type-selector specificity beats the
 *    child utility): the cut double-stacked two section paddings into a long
 *    quiet stretch on phones (Will's checkpoint note). Desktop keeps the full
 *    rhythm — the straddle needs the room.
 *
 * NO chapter-label slot, on purpose: a floating "On paper" kicker confused
 * its first reader (Will, checkpoint review) — chapters announce through
 * their sections' own eyebrows and headers, the device that already works.
 * Don't reintroduce a kicker.
 *
 * Doctrine (do NOT relax):
 *  - NEVER put `data-mkt-skin` on a chapter — `body:has([data-mkt-skin=...])`
 *    rules key page-level chrome off that attribute and a chapter would flip
 *    the whole body.
 *  - NEVER rely on `dark:` utilities on this element ITSELF (the variant
 *    guard excludes descendants only) or anywhere inside a chapter.
 *  - Always-dark media inside a chapter rides --gallery* tokens, never a
 *    nested `.dark`.
 *  - No overflow-hidden here: seam-straddling visuals (a card pulled across
 *    the cut with negative margin) must be free to overhang the chapter box.
 */
export function PaperChapter({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-mkt
      className={cn(
        "surface-paper border-y bg-background text-foreground",
        "max-lg:[&>section]:py-14",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
