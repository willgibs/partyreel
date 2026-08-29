import { ContentControlStrip } from "./press-lab-shared";
import { PressContactSheetDirection } from "./press-contact-sheet-direction";
import { PressSpecimenDirection } from "./press-specimen-direction";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: PRESS IDENTITY (the /press redesign, 2026-08-28).
 *
 * /press is the last wireframe-grade page on the marketing site: five centered reading
 * columns, reveal="none" everywhere so there is zero motion below the fold, and a hero
 * copy-pasted verbatim from /careers and /about. Every other elevated surface here is a
 * physical object (the ink slab, the desk, the stretch ticket, the printed index, the
 * film strip). /press has none, and inventing one is the whole point of this round.
 *
 * ★ WILL'S GOVERNING CONSTRAINT: "our logo will completely change prior to launch. This
 * is focused on creating the working system." So the mark is a SLOT, never a shrine, and
 * the page never says so out loud (a "our logo is changing" banner advertises being
 * unfinished and becomes a lie the day the new mark lands). Both directions render from
 * the PRESS_KIT manifest, and every rule is written against the mark's own box, so a new
 * mark set drops in with no component changes.
 *
 * BOTH DIRECTIONS RENDER IDENTICAL CONTENT (press-lab-shared.tsx) and the same IA:
 * masthead, assets, rules, boilerplate, facts, close. The ruling is about identity, and
 * nothing else. Expand the control strip below to see the shared content.
 *
 * The axis of the choice: GROUND (an ink plate and a plane change, vs all paper),
 * DENSITY (a 3px album grid vs hairline editorial rows), MOTION BUDGET (a cut arrival
 * plus a hover isolate, vs the furniture drawing itself in), and WHERE THE ASSETS LIVE
 * (a field of frames vs a margin index).
 *
 * A HYBRID IS A LIKELY VERDICT ("V1's sheet with V2's register"), so the sheet and the
 * register are separate components inside their direction files: recombining them is a
 * move, not a rebuild.
 *
 * SCROLL BOTH TO THE MIDDLE BEFORE JUDGING. V2's argument is cumulative and a cropped
 * hero hides it. Both scroll with the page, deliberately un-framed, so they are compared
 * at real width rather than inside a browser mock.
 */
export function PressIdentityVariants() {
  return (
    <div className="flex flex-col gap-14 py-4">
      <ContentControlStrip />

      <Variant
        n={1}
        name="The contact sheet"
        rationale="The kit as a photographic proof sheet. A paper masthead, then one ink plate where every asset is a numbered frame on the 3px album grid: three marks, the ink, the type, a working QR, two rooms. Frames land as hard film cuts in index order; hovering one steps the rest of the sheet back, the way you isolate a frame at a light table. Each media frame carries its licence in the margin, which no SaaS brand page does and every picture editor needs."
        framed={false}
      >
        <PressContactSheetDirection />
      </Variant>

      <Variant
        n={2}
        name="The specimen sheet"
        rationale="The kit as a type-foundry specimen. All paper, no photography: the name at display size opens it (the word survives a logo change; the glyph does not), then a ruled register against a real 1:1 tick rail, so minimum size is shown at ACTUAL size rather than described. Downloads are a quiet margin index. The type never moves; only the hairlines draw themselves in."
        framed={false}
      >
        <PressSpecimenDirection />
      </Variant>
    </div>
  );
}
