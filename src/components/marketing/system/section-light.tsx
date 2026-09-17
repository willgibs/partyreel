import { type ReactNode } from "react";

import { Glow, type GlowVars } from "@/components/shared/glow";

/**
 * THE AURORA'S FIELD: the house light itself, at rest, at chapter scale.
 *
 * Will kept three forms of the coloured light he calls the AURORA (2026-09-17),
 * and they are one family rather than three effects:
 *
 *   the seam   a band where two grounds meet. Ships as the footer's lamp, the
 *              film strip's backlight, every screen lamp.
 *   the throw  a cast from a point on an object, outward. `<Glow shape="throw">`.
 *   the field  THIS: a chapter's own two boundaries lit, with the copy sitting
 *              in the clean band between them. "Assuming this, similar to seam
 *              and throw, is another alternative way to infuse the Aurora into
 *              our UI." It is.
 *
 * Code keeps the engine's names (Glow, --glw-*, SPILL); the Library and the
 * docs speak his. This is the ONE mount for the field, modelled on
 * screen-lamp.tsx: a chapter ASKS for light instead of assembling two bands and
 * four custom properties, so the register and the clock cannot drift per call
 * site the way three near-identical underlight files once did.
 *
 * ★ A FIELD IS NOT A FILL. Two bands at the section's own EDGES, never one wash
 * behind everything: the copy then sits IN the light instead of in the clean
 * band between two of them, and that is the half of the grammar a wiring round
 * is most likely to get wrong. `middle` and `behind` are on the light board as
 * warnings; neither is a value here.
 *
 * ★ THE BOTTOM BAND IS THE TOP BAND FLIPPED ON ITS OWN AXIS. The engine has no
 * bottom-seam shape and should not grow one: the geometry is identical and only
 * the vector differs, and law 2 says a vector is the caller's to turn.
 *
 * ★ NEVER ON A LIGHT GROUND. Enforced in globals.css, not here, so a chapter
 * that turns to paper later goes quiet on its own rather than leaving the
 * "weird shadow or stray artifact" Will named. See the [data-section-light]
 * rule there for why the selector mirrors the `dark` variant inverted.
 *
 * ★ IT IS A SIBLING OF THE CONTENT, AND THE CONTENT IS POSITIONED. The lamp
 * comes first in DOM order and the children come after inside their own
 * `relative` wrapper, so the light stays behind the copy with no z-index
 * anywhere. A static wrapper would let an absolutely-positioned lamp paint over
 * the H1, which reads as "the effect is too strong" and sends you tuning
 * opacity instead of fixing the stack.
 *
 * No production call site yet, on purpose: the placement Will picks (the light
 * board's round eight asks it) decides which chapters carry one, and a lamp
 * mounted before that answer is a placement nobody ruled.
 */

/** The four placements that ship. `middle` and `behind` are fenced, not typed. */
export type SectionLightPlacement = "both" | "top" | "bottom" | "room";

/**
 * THE ACCENT REGISTER, and the only one. Will, 2026-09-17: "Identity feels way
 * too weak. Let's use accent as the global register, and we can modify it as
 * needed in the future if it feels too strong." So identity is not a prop value
 * and there is no register axis to get wrong: one section on a page carries the
 * light, at these numbers.
 *
 * A low base with a band near zero is what separates a FIELD from a LAMP: the
 * footer's seam ships 0.62 / 0.62 across 210px, and the same numbers across a
 * chapter would be a wash. The blur scales with the band instead of the ratio
 * (--glw-blur is a literal): 16px on a 210px seam is the same softness as
 * roughly 38px on a 560px one.
 *
 * ★ THE CLOCK IS READ FROM ITS TOKEN, NEVER WRITTEN AS A LITERAL. A field the
 * size of a chapter moving at a lamp's clock reads as a screensaver, so the
 * Aurora runs three laps of it (24s against the ruled 8s) through
 * --aurora-cadence, which globals.css declares beside --spill-cadence. This
 * lands INLINE, so it outranks the engine's own --glw-dur and there is nothing
 * behind it: were the token undeclared, the band would FREEZE rather than fall
 * back (the whole story is on the token's declaration).
 */
const AURORA_VARS: GlowVars = {
  "--glw-base": "0.30",
  "--glw-strength": "0.13",
  "--glw-dur": "var(--aurora-cadence)",
  "--glw-blur": "38px",
};

/**
 * Each band is 42 percent of the SECTION's height, so the light reaches a
 * chapter's own proportion rather than a pixel count that is right on one
 * section and wrong on the next. The engine sizes the lamp from --glw-h, so the
 * wrapper carries the fraction and the lamp fills it.
 */
const BAND_HEIGHT = "42%";

/**
 * ★ THE TRANSFORM DRIVE, DELIBERATELY. The mask drive is the footer's shipped
 * mechanic and it repaints the masked layer every frame; at chapter scale that
 * is the wrong trade twice over, and a field's light reads better travelling
 * WITH the window anyway. It also makes this the first shipped lamp on that
 * drive, which is why globals.css now declares its resting translate.
 */
function Band({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      data-section-light
      className="pointer-events-none absolute inset-x-0"
      style={{
        top: edge === "top" ? 0 : undefined,
        bottom: edge === "bottom" ? 0 : undefined,
        height: BAND_HEIGHT,
        // The flip, on the band's own axis. `scale` is the standalone property
        // (Tailwind v4's translate/scale utilities write these), so it composes
        // with nothing and needs no transform of its own.
        ...(edge === "bottom" ? { scale: "1 -1" } : {}),
      }}
    >
      <Glow
        shape="seam"
        drive="transform"
        vars={{ ...AURORA_VARS, "--glw-h": "100%" }}
      />
    </div>
  );
}

/**
 * The room: one origin-anchored cast from the section's own floor, for a
 * chapter with nothing at its edges to light. Still a vector (law 2), which is
 * the whole difference between this and the fenced `behind`: that one sits the
 * origin at 46% and becomes the fill this doctrine refuses.
 */
function Room() {
  return (
    <div
      aria-hidden
      data-section-light
      className="pointer-events-none absolute inset-0"
    >
      <Glow
        shape="throw"
        drive="transform"
        vars={{
          ...AURORA_VARS,
          "--glw-blur": "48px",
          "--glw-from-x": "50%",
          "--glw-from-y": "88%",
          "--glw-reach": "120%",
        }}
      />
    </div>
  );
}

export function SectionLight({
  children,
  placement = "both",
}: {
  children: ReactNode;
  /** Which of the section's boundaries carry the light. */
  placement?: SectionLightPlacement;
}) {
  return (
    <div className="relative isolate">
      {placement === "room" ? (
        <Room />
      ) : (
        <>
          {placement !== "bottom" ? <Band edge="top" /> : null}
          {placement !== "top" ? <Band edge="bottom" /> : null}
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
