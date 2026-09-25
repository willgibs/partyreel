"use client";

/**
 * THE PUBLISH LIGHT: a shared reel rests lit, in the house five.
 *
 * The moment a host shares a reel used to be two flat violet box-shadows (one
 * breathing INSIDE the Studio's frame, one riding out of the share card), both
 * decaying to nothing. Both halves were settled on the light board:
 *
 *   the colour  "Let's keep it consistent with the rest of our glows. Don't need
 *               a single stray glow color, let's use either our house five or
 *               sampled depending on whether it "bleeds" from media." He answered
 *               house five for this beat, so neither lamp here takes `colors`.
 *   the shape   the bloom, kept: "A one-shot that decays to a base, never to
 *               nothing, so the object stays lit afterwards." A shared reel looks
 *               different from a draft for as long as it is shared, and goes dark
 *               when the host unshares.
 *   the fence   "Do not like as a button wrapper, only to light objects from
 *               behind." The Share BUTTON never wears a glow; the lit object is
 *               the reel's frame, or the card.
 *   the ground  "No light ground usage is a decision for now."
 *   the places  "custom and bespoke, not a couple of identity components reused
 *               everywhere in the same way constantly."
 *
 * WHY ONE FILE AND TWO MOUNTS. The two places share a RULE, not a look: the
 * engine's bloom, the house five, mounted only while the reel is shared, the
 * swell owed to the tap and the base to the state (`restOrSwell` below). What
 * they do not share is geometry, so each is composed for its own object and
 * there is no mode prop to pick between them. They live side by side so the
 * rule cannot drift between two files, and so the lab's Publish moment and the
 * contract (publish-light.test.tsx) mount the very lamps that ship: the Studio
 * is behind sign-in and cannot be rendered on a board, and a specimen that
 * re-types a recipe is how a board ends up showing a light production never had.
 *
 * ★ THE CALLER OWNS THE WRAPPER, AND IT HAS THREE DUTIES. Each mount is
 * `position: absolute` against the nearest positioned ancestor, so the call site
 * (1) wraps its object in `relative isolate`, (2) puts the mount FIRST and the
 * object after it, positioned, so the light stays behind by DOM order with no
 * z-index, and (3) never clips (`overflow-hidden` on the wrapper cuts the
 * falloff to a straight edge; glow-placement.test.ts). The engine's own third
 * invariant holds here too: the lamp never takes a className.
 */

import { Glow, type GlowVars } from "@/components/shared/glow";

/** What a surface knows about the share (useReelPublish hands both over). */
export type PublishLightState = {
  /** highlight_reels.guest_visible, optimistic. No light is mounted while false. */
  shared: boolean;
  /** The current shared state came from a Share tap on this page (see the hook). */
  sharedHere: boolean;
};

/**
 * ★ THE SWELL IS OWED TO THE TAP; THE BASE IS OWED TO THE STATE.
 *
 * The engine arms a bloom on ARRIVAL, which is right for the QR plate (the hero
 * arriving IS its moment) and wrong here: a reel shared last week would swell
 * every time its host opened the room. The engine is not this lane's to change,
 * so the gate is the one knob it exposes: with `--glw-strength` at 0 the armed
 * one-shot has no peak to reach.
 *
 * It is not a still, and that is a fact about the engine worth knowing before
 * tuning anything here: glw-bloom's last keyframe is `opacity: var(--glw-base)`
 * whatever the strength, so a gated band eases from nothing up to the base over
 * the same 1400ms and stops. Both roads therefore REST at the same level (base
 * under band-at-base), and only the tap overshoots on the way. Under reduced
 * motion the engine never runs the animation at all, so the band stays away and
 * the base alone is the light: FALLOFF's arrival, with no swell on either road.
 */
function restOrSwell(vars: GlowVars, sharedHere: boolean): GlowVars {
  return sharedHere ? vars : { ...vars, "--glw-strength": "0" };
}

/**
 * THE STUDIO'S: behind the reel's frame, never over it.
 *
 * A host is judging their reel's look in this room, so nothing may tint the
 * media: the lamp sits BEHIND an opaque frame and only its falloff is ever seen.
 * The room is wide and the frame is tall, so the light is composed as WINGS: a
 * field much wider than the frame and barely taller, which puts the visible
 * light at the frame's two sides (blue and violet to the left, amber and green
 * to the right, the coral hidden behind the reel) and almost none above or
 * below, where the header's controls and the dock's thumbnails are. On a phone
 * the room leaves about 24px beside a 9:16 frame and the wings run off the
 * screen's edge, which is the one straight cut a light may end on.
 *
 * ★ THE INSETS ARE PERCENTAGES OF THE FRAME, NOT PIXELS, because the frame is
 * height-fit: 360 wide on a tall desktop, 327 on a phone, under 300 on a short
 * laptop, 640 across in landscape. A radial lamp's `--glw-reach` is a fraction
 * of the WHOLE field and its transparent stop sits at 78 percent of that
 * radius, so the falloff finishes inside the field only while reach stays
 * under about 64 percent (qr-hero.tsx has the measurement). Percent insets keep
 * that arithmetic, and the composition, identical at every frame size.
 *
 * The room is dark in BOTH themes (a literal near-black, not a token), so this
 * lamp is never fenced: the light-ground fence would switch it off in the app's
 * light mode over a ground that is not light.
 */
const STUDIO_VARS: GlowVars = {
  "--glw-from-x": "50%",
  "--glw-from-y": "50%",
  "--glw-reach": "60%",
  "--glw-strength": "0.95",
  // What the swell decays TO, and all a returning host ever sees.
  "--glw-base": "0.34",
  "--glw-blur": "26px",
};

export function StudioPublishLight({ shared, sharedHere }: PublishLightState) {
  if (!shared) return null;
  return (
    <div
      aria-hidden
      data-rxp-framelight
      className="pointer-events-none absolute -inset-x-[45%] -inset-y-[22%]"
    >
      <Glow shape="bloom" vars={restOrSwell(STUDIO_VARS, sharedHere)} />
    </div>
  );
}

/**
 * THE SHARE CARD'S: a pool under the card, never a ring around it.
 *
 * The card is the last row of the feed's Reel section, 12px under the poster,
 * and the poster is the reel's own media. A lamp centred behind the card would
 * spill up onto that media, so this one is centred on the card's BOTTOM edge:
 * the upper half of the falloff is spent behind the opaque card, and the lower
 * half pools into the section gap beneath it, brightest right at the edge the
 * light leaks from. `inset-x-0` on purpose: the card spans the page's gutter, and
 * a field wider than the card would hand a phone a horizontal scrollbar (the
 * event page scrolls; the Studio's fixed room does not have this problem).
 *
 * Its register is lower than the Studio's because its geometry is franker: a
 * lamp centred behind its object only ever shows its outer falloff, and this one
 * shows its core.
 *
 * ★ `data-rxp-cardlight` IS THE FENCE'S HOOK. The card follows the app's theme,
 * and the Aurora never lights a light ground, so globals.css's ONE fence rule
 * names this attribute beside [data-section-light]. It sits on the LIGHT and
 * never on the card: `display: none` on the card would take the Share button
 * with it on every light-mode page.
 */
const CARD_VARS: GlowVars = {
  "--glw-from-x": "50%",
  "--glw-from-y": "50%",
  "--glw-reach": "62%",
  "--glw-strength": "0.8",
  "--glw-base": "0.22",
  "--glw-blur": "18px",
};

export function ShareCardPublishLight({
  shared,
  sharedHere,
}: PublishLightState) {
  if (!shared) return null;
  return (
    <div
      aria-hidden
      data-rxp-cardlight
      className="pointer-events-none absolute inset-x-0 -bottom-8 h-16"
    >
      <Glow shape="bloom" vars={restOrSwell(CARD_VARS, sharedHere)} />
    </div>
  );
}
