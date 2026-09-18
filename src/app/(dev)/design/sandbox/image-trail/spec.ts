import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * OUR OWN IMAGE TRAIL (the image-trail lane, 2026-09-18), round one.
 *
 * Will, the night the privacy hero came back none: "Let's create our own cursor
 * tracking version of this effect in the lab as well, to hopefully be used on
 * the marketing site somewhere, else bank for later. If the hero explorations
 * don't pan out, maybe it can serve as one instead." And the bind on all of it:
 * "I think this crisp media motion design is going to be the foundation of our
 * visual identity."
 *
 * ★ SIX DECISIONS, SHAPED PROGRESSIVELY: how close the photographs come, how
 * they go, how they arrive, how big they are, WHERE it lives, and what a phone
 * does. Each is drawn on a whole screen of the real site, and the home is a knob
 * on every step, so any number can be judged over cinema or over paper at any
 * point rather than only after the home is settled.
 *
 * ★ THE NUMBERS IN THE WORDS ARE THE ENGINE'S. `looks.test.ts` holds each
 * option's figures to what `trail-engine.ts` measures on the board's own
 * scripted hand, so a retune turns a test red rather than leaving a tile that
 * says one thing and draws another.
 *
 * Pure data (registry.test.ts): the board route is a server page and reads this
 * for its header.
 */

/**
 * THE HOME, AS A KNOB ON EVERY STEP as well as a decision of its own. It is the
 * gallery-width pattern: one control shared by the steps that need it, so one
 * screen is on show at a time and the ground can be flipped without leaving the
 * question. `defineExploration` derives this control from the `home` decision
 * itself, so the copy below only puts it on the earlier steps' strips.
 */
const HOME: Control = {
  id: "home",
  label: "The home",
  options: [
    { id: "privacy", label: "The privacy hero" },
    { id: "close", label: "The home page's last screen" },
    { id: "notfound", label: "The 404, on paper" },
    { id: "bank", label: "Banked, no page" },
  ],
  default: "privacy",
};

const DRAFT = defineExploration({
  id: "image-trail",
  title: "The image trail",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round of our own cursor trail: photographs born as the cursor travels, sliding to it and decaying behind it. Six decisions, each drawn on a whole screen of the real site at 1440 and 375, with the pointer scripted for the still and live on the desk.",
  },
  bible: [1, 13, 14, 22],
  context:
    "A photograph appears every time the cursor has travelled far enough, lands where the cursor is, then fades and shrinks away behind it. Written from scratch, no new dependency, and the site's own photographs. A PROPOSAL inside every option, say the word and it goes: when you stop moving, the newest photograph does not decay. It holds, lit, under the cursor until you move again, so the screen is never empty and you find you are carrying a picture.",
  asks: [
    {
      id: "density",
      label: "The density",
      question:
        "How far should the cursor travel between one photograph and the next?",
      context:
        "This one number is the whole feel. Smaller means more overlap and more photographs on screen. The overlaps below are at the recommended 240 px photograph, and the counts are measured on the board's own scripted hand.",
      lands:
        "The trail's density everywhere it ships, and with it how many photographs a hero holds at once.",
      options: [
        {
          id: "d60",
          label: "60 px: heavily overlapping",
          means:
            "A photograph every 60 px, each covering three quarters of the one before it. 12 lit at the busiest instant on the scripted hand.",
        },
        {
          id: "d100",
          label: "100 px: overlapping",
          means:
            "The reference's own spacing: each photograph covers about three fifths of the last. 7 lit at the busiest instant.",
        },
        {
          id: "d140",
          label: "140 px: loosely overlapping",
          means:
            "Each covers two fifths of the last, so the trail reads as a line of separate photographs. 5 lit at the busiest instant.",
        },
      ],
      recommended: "d60",
      because:
        "Your note on the privacy hero was that the density needs to increase, and your two screenshots of the reference are tighter than the reference itself: at 60 the trail reads as one moving object made of photographs rather than as a row of them.",
      overrule:
        "If a single photograph can never be read because the next one covers it, 100 is the reference's own answer.",
      configs: [HOME],
    },
    {
      id: "decay",
      label: "The decay",
      question: "How long should a photograph live, and how should it go?",
      after: { ask: "density" },
      context:
        "Behind the cursor each photograph fades and shrinks away. The shrink runs ahead of the fade, so the tail reads as photographs travelling away rather than as a dimmer turned down. Drawn at the density you picked.",
      lands:
        "The length of the tail, and how much of the screen it fills at rest.",
      options: [
        {
          id: "quick",
          label: "Quick: 0.9 seconds",
          means:
            "Gone almost as fast as it arrives, so the trail is short and the cursor is the point. 8 lit at the busiest instant.",
        },
        {
          id: "linger",
          label: "Lingering: 1.4 seconds",
          means:
            "Long enough to look back at what you drew and see it going. 12 lit at the busiest instant.",
        },
        {
          id: "long",
          label: "Long: 2 seconds, a slower shrink",
          means:
            "The tail stays legible right to the end, keeping a third of its size. 15 lit at the busiest instant.",
        },
      ],
      recommended: "linger",
      because:
        "Quick leaves nothing to look at on a hero nobody is scrubbing at; long keeps so much on screen that the words compete with it. Lingering is the one where the trail is still a trail when your eye gets back to it.",
      overrule:
        "If the screen reads as busy behind the headline, quick, which is also the cheapest.",
      configs: [HOME],
    },
    {
      id: "entrance",
      label: "The entrance",
      question: "How should each photograph arrive?",
      after: { ask: "decay" },
      context:
        "Where a photograph is born and what it does on the way to the cursor. All three land it at full size; they differ in the fraction of a second before that. Drawn at your density and decay.",
      lands: "The gesture the whole effect is built on, everywhere it ships.",
      options: [
        {
          id: "slide",
          label: "Behind the cursor, sliding to it",
          means:
            "It appears where the cursor was a moment ago and chases it. The reference's own move, and the one that reads as a photograph being laid down.",
        },
        {
          id: "drift",
          label: "Under the cursor, drifting on",
          means:
            "It appears exactly under the cursor and carries on the way you were going, so the trail reads as thrown forward rather than pulled along.",
        },
        {
          id: "flick",
          label: "Behind it, turned the way you threw it",
          means:
            "The slide, with each photograph turned a few degrees toward the direction of travel, so a sideways stroke fans them and a vertical one leaves them square.",
        },
      ],
      recommended: "slide",
      because:
        "It is the only one of the three with a chase in it: something appears behind your hand and catches up, which is what makes the effect feel alive rather than stamped.",
      overrule:
        "If the chase reads as lag rather than as motion, drift puts every photograph exactly where you asked for it.",
      configs: [HOME],
    },
    {
      id: "size",
      label: "The size",
      question: "How big should a photograph be?",
      after: { ask: "entrance" },
      context:
        "The width of one frame, portrait first. The spacing is fixed by the density you picked, so a bigger photograph overlaps its neighbour more. Each option names what it becomes on a phone.",
      lands: "The card size the trail ships at on both screens.",
      options: [
        {
          id: "s180",
          label: "180 px, and 100 on a phone",
          means:
            "A thumbnail: the trail reads as a texture and the words stay the loudest thing on the screen. Two thirds covered at 60 px.",
        },
        {
          id: "s240",
          label: "240 px, and 132 on a phone",
          means:
            "The size a phone's own tile looks from a laptop's distance, so a face in one reads at a glance. Overlaps its neighbour by three quarters at 60 px.",
        },
        {
          id: "s300",
          label: "300 px, and 164 on a phone",
          means:
            "Big enough to be the subject rather than the backdrop. Four fifths of each one is covered by the next at 60 px.",
        },
      ],
      recommended: "s240",
      because:
        "It is the size the rest of the site already reads faces at (the gallery tile, the home hero's frames), and it is Will's two screenshots of the reference measured: portraits around 180 to 260 px.",
      overrule:
        "If the trail should be atmosphere behind the words rather than the photographs themselves, 180.",
      configs: [HOME],
    },
    {
      id: "home",
      label: "The home",
      question: "Where on the site should this live?",
      after: { ask: "size" },
      context:
        "Three real screens and an honest fourth, each drawn whole at your density, decay, entrance and size. The 404 is the one on paper, so it is where the photographs meet a light ground.",
      lands:
        "Whether the trail ships now and on which page, or waits in the Library for a page that wants it.",
      options: [
        {
          id: "privacy",
          label: "The Privacy and trust hero",
          means:
            "Your own suggestion if the hero explorations do not pan out. The page is the site's quietest, so the trail would be its one loud screen.",
        },
        {
          id: "close",
          label: "The home page's last screen",
          means:
            "The closing chapter, which ends today on a gradient. The film would end on photographs instead, on the screen everybody reaches last.",
        },
        {
          id: "notfound",
          label: "The 404",
          means:
            "A page nobody plans to see, which is the classic home for a rare delight. It is also the light answer: paper ground, dark hairlines.",
        },
        {
          id: "bank",
          label: "Banked: no page yet",
          means:
            "It lands in the Library as a working version and waits for the page that wants it, most likely once the generated photographs arrive.",
        },
      ],
      recommended: "privacy",
      because:
        "It is the page you named, it is the one screen on the site with a bare lockup and nothing behind it, and it answers the privacy hero in the same breath: a trail of guests' own photographs behind the words about keeping them private.",
      overrule:
        "If the privacy page should stay the quiet document it shipped as, the home page's last screen is the loudest place this would be welcome.",
    },
    {
      id: "phone",
      label: "At a phone",
      question:
        "At a phone, where there is no cursor, what should the trail do?",
      after: { ask: "home" },
      tile: "phone",
      context:
        "A phone has no pointer to follow, and a drag on a hero is how a reader scrolls it. Drawn at 375 on the home you picked, at your density, decay, entrance and size.",
      lands: "What the trail does below 640 px, on every page it ships to.",
      options: [
        {
          id: "touch",
          label: "It follows a finger",
          means:
            "Photographs are born under a drag. Nothing happens until somebody touches the hero, and a drag there is also a scroll.",
        },
        {
          id: "walks",
          label: "It draws itself",
          means:
            "The same trail, walking its own path at the same pace, so the screen is alive the moment it is opened and a finger is never asked for.",
        },
        {
          id: "still",
          label: "A still composition",
          means:
            "The trail frozen at one moment, as one photograph of a moving thing. No loop running on a phone at all.",
        },
        {
          id: "none",
          label: "Not on phones",
          means:
            "The page below 640 px is the page it ships as today, with no trail behind the words.",
        },
      ],
      recommended: "walks",
      because:
        "A trail that waits for a finger is an empty hero on the screen most guests arrive on, and a drag there is a scroll. Drawing itself keeps the same object alive on both screens and asks nothing of the reader.",
      overrule:
        "If a hero that moves on its own reads as a video on a phone, still keeps the composition and spends nothing.",
      configs: [HOME],
    },
  ],
});

/**
 * ★ ONE HOME KNOB, NOT SIX. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob the decisions share arrives
 * once per decision and the dock would draw it six times (React warns about the
 * duplicate key). Each decision keeps it on its strip, which is what `configs`
 * is for; the board declares it once. gallery-width and body-type found this
 * first and paid for it the same way: it is a finding for the constructor,
 * which could dedupe by id itself.
 */
export const IMAGE_TRAIL: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
