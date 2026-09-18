import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRIVACY PAGE'S HERO, ROUND TWO (the image-trail lane, 2026-09-18).
 *
 * Round one answered NONE. Verbatim: "I just started my review with the new
 * privacy and trust hero. None feel right. I think the density needs to increase
 * as well as the speed. Also, when I said 'decaying trail,' I meant of the
 * trailing images, not an actual separate trail effect." And the ask: "Let's
 * rework these explorations to be tighter with images effectively overlapping, a
 * bit faster pace and a polished image trail behind, like the attached
 * screenshots."
 *
 * ★ THE MECHANISM IS REPLACED, NOT RETUNED. Round one threw frames out of a
 * turning nozzle and drew a wake beside them; a decaying trail OF THE TRAILING
 * IMAGES is not a thing you add behind that, it is what a trail is. So the hero
 * is now the image trail engine with a PATH where the cursor would be: two
 * points sweep out of the lockup's rim and every photograph either one drops
 * fades and shrinks where it lies. `wake`, `echoes` and `none` left with the
 * mechanism, which is the instruction (remove what round one made obsolete
 * rather than stacking options); `pace`, `gap`, `trail` and `phone` keep their
 * ids because their questions survive, so the ledger joins.
 *
 * ★ FIVE DECISIONS, SHAPED PROGRESSIVELY: the tempo, the figure the two points
 * draw, how close the photographs sit, how long they take to go, and the phone.
 * Both paces are OVER the home hero, because round one recommended its own tempo
 * and came back none.
 *
 * ★ THE NUMBERS IN THE WORDS ARE THE ENGINE'S. `paths.test.ts` holds each
 * option's figures to what the engine measures walking the real paths inside the
 * real canvas, so a retune turns a test red rather than leaving a tile that says
 * one thing and draws another.
 *
 * Pure data (registry.test.ts): the board route is a server page and reads this
 * for its header.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  round: {
    n: 2,
    date: "2026-09-18",
    changed:
      "None felt right: the density and the speed both needed to increase, and a decaying trail meant the trailing images rather than a separate effect. So the field is now the image trail with a path where the cursor would be, faster and tighter, each photograph fading and shrinking where it lies.",
  },
  bible: [1, 13, 14, 22],
  context:
    "Two points sweep out of the lockup's rim, each dropping a photograph every time it has travelled far enough, and each photograph fades and shrinks where it lies. Everything here is measured against the shipped home hero, which launches a pair every 1,250 ms and holds 12 photographs at once.",
  asks: [
    {
      id: "pace",
      label: "The pace",
      question: "How often should a photograph arrive?",
      context:
        "Both options are over the home hero's own tempo, which round one ran at and you answered none. The counts are measured inside the 1440 frame, so a photograph past the edge is not counted as lit.",
      lands:
        "The tempo of the privacy hero: how often a photograph lands and how many are on screen.",
      options: [
        {
          id: "over",
          label: "A notch over the home hero",
          means:
            "A photograph every 458 ms on each arm, and 14 on screen at the busiest instant. The home hero launches a pair every 1,250 ms and holds 12.",
        },
        {
          id: "rush",
          label: "Two notches over",
          means:
            "Every 340 ms, and 18 on screen. Half again as fast as the notch above it, and the busiest this hero gets before the words start to fight it.",
        },
      ],
      recommended: "over",
      because:
        "It is nearly three times round one's tempo, which is the increase you asked for, while still reading as the same site as the home hero: two notches makes the privacy page the fastest screen we have, which is a strange thing for the page about restraint.",
      overrule: "If it still reads as slow beside the home hero, two notches.",
    },
    {
      id: "path",
      label: "The figure",
      question: "What shape should the two points draw?",
      after: { ask: "pace" },
      context:
        "The photographs land wherever the point has been, so the figure it walks is the composition. Both draw two of them on opposite sides of the words. Drawn at your pace.",
      lands: "The shape the privacy hero's field reads as, at both screens.",
      options: [
        {
          id: "spiral",
          label: "Two arms, winding outward",
          means:
            "Each point leaves the rim of the words and winds out to the edge as it turns, then starts again at the rim. 14 on screen. The figure you liked on round three.",
        },
        {
          id: "wander",
          label: "Two drifts around the words",
          means:
            "Each point drifts near the words on a slow walk that never repeats. 15 on screen, and no figure to read: photographs simply keep arriving nearby.",
        },
      ],
      recommended: "spiral",
      because:
        "It is the picture you asked for by name: images popping in spiralling opposite two sides. The wander is the calmer object and it is here to be seen beside it, but it gives up the one thing you said you loved.",
      overrule:
        "If the arms read as a mechanism rather than as photographs, the wander hides the machine.",
    },
    {
      id: "gap",
      label: "The gap",
      question: "How close should the photographs sit along each arm?",
      after: { ask: "path" },
      context:
        "Centre to centre in photograph widths, at a 200 px frame. It starts at round one's tightest and goes tighter. The pace is held, so a tighter gap means a slower point rather than a faster hero. Drawn at your pace and figure.",
      lands: "How much of each photograph the next one covers.",
      options: [
        {
          id: "overlap",
          label: "Three quarters of a width apart",
          means:
            "150 px between them, so each covers a quarter of the last. Round one's tightest option, which is where this scale now starts.",
        },
        {
          id: "tight",
          label: "Half a width apart",
          means:
            "110 px, so each covers nearly half of the last and the arm reads as one ribbon of photographs rather than a row of them.",
        },
        {
          id: "stack",
          label: "Two fifths of a width apart",
          means:
            "80 px, so only a strip of each one is ever visible. The point crawls at 171 px a second to keep your pace.",
        },
      ],
      recommended: "tight",
      because:
        "Your screenshots of the reference are about this tight: enough of each photograph showing to be a photograph, and enough covered that the arm is one object. At two fifths a face is a sliver.",
      overrule:
        "If a single photograph can never be read, three quarters of a width.",
    },
    {
      id: "trail",
      label: "The trail",
      question: "How long should the photographs behind the leader take to go?",
      after: { ask: "gap" },
      context:
        "Each one fades and shrinks where it lies, the shrink ahead of the fade so the tail reads as photographs going away rather than as a dimmer. This is the decaying trail, and the only thing behind the leader.",
      lands:
        "The length of each arm's tail, and how full the screen is at rest.",
      options: [
        {
          id: "quick",
          label: "1.2 seconds",
          means:
            "A short arc at the head of each arm and nothing behind it. 12 on screen at the busiest instant.",
        },
        {
          id: "linger",
          label: "2 seconds",
          means:
            "The arm reads its whole length, bright at the head and nearly gone at the tail. 14 on screen.",
        },
        {
          id: "long",
          label: "3 seconds, keeping a third of its size",
          means:
            "The tail is still legible where it started, so the two arms almost meet. 18 on screen, the busiest option here.",
        },
      ],
      recommended: "linger",
      because:
        "It is the one where the arm is a comet: unmistakably brightest where the photographs land and unmistakably going behind that. Quick leaves no trail to decay; long leaves the screen full of half photographs.",
      overrule: "If the hero should be quieter behind the words, 1.2 seconds.",
    },
    {
      id: "phone",
      label: "At a phone",
      question: "At a phone, where should the photographs land?",
      after: { ask: "trail" },
      tile: "phone",
      context:
        "At 375 the words fill the column, so a photograph is only ever seen in the strips above and below them. Drawn at your pace, figure, gap and trail.",
      lands: "The privacy hero's field below 640 px.",
      options: [
        {
          id: "same",
          label: "The same figure, sized to the column",
          means:
            "One object on both screens. 14 on screen, but the arms spend part of every sweep behind the words, where nothing can be seen.",
        },
        {
          id: "strips",
          label: "Two sweeps, one above and one below",
          means:
            "Each point crosses the column inside the band it can be seen in, so both strips always hold photographs. 13 on screen and never a dark one.",
        },
      ],
      recommended: "strips",
      because:
        "Round one measured the reason and it still holds: at 375 a turning arm points into the words' own width for half of every sweep, and the strips go dark while it does.",
      overrule:
        "If the phone should read as the same object as the desktop, the same figure.",
    },
  ],
});
