import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR INTO THE HOST APP, ROUND TWO: THE WELCOME TOUR ALONE (2026-09-20).
 *
 * Round one ruled whole (docs/reviews/app-door.json; verbatim in
 * docs/design/rulings.md, "the sixth batch"). Six of its seven asks are ruled
 * and wired (`door-wiring`, `f7075a73`): `lead=code`, `surfaces=one`,
 * `page=beside`, `existing=tell`, `failure=paths`, and `return=tap` flagged
 * and shipped as `back` with passkeys dark behind a flag. Only `welcome`
 * returns, because his ruling named it by hand in the same breath it ruled
 * `tour` in: "This is more introductory than immediately creating an event.
 * That way, event creation can feel more focused within its own wizard and
 * prompted as the primary CTA at the end of the tour (but skippable, as in
 * preview). However, this welcome tour could use a huge redesign to feel
 * more alive."
 *
 * ★ SO THE ROUND ASKS WHAT THE TOUR IS, NOT WHETHER ONE EXISTS. His ruling
 * already fixed the two ends of it: the required name step (a write path
 * nothing here touches) and a closing pair, primary and skippable, into the
 * wizard. What is open is everything between them, and it is ONE decision
 * because four real shapes answer it better than four separate questions
 * about pacing, pictures and screen count would: a reviewer is judging which
 * whole tour to walk through, not assembling one from parts.
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `privacy-hero`
 * and `glass` round-two precedent: a round replaces its questions rather than
 * accreting them). The ledger keeps their answers for ever, the RULINGS row
 * names them as ruled, and the board carries only what is still open. Its
 * fixtures went with them: `methods.tsx`, `edges.tsx` and `surfaces.tsx` are
 * deleted, and `shells.tsx` keeps only the screen sizes, the `Still` safety
 * wrapper and the two pieces every shape below stacks its screens in.
 *
 * ★ AND NOTHING HERE AUTHENTICATES. `SetNameStep` is the real component, and
 * every button below it is a real `Button`; every press is captured before it
 * reaches its handler (`shells.tsx`, `Still`), so no preview writes a display
 * name, calls Supabase or leaves the frame.
 */

/**
 * THE SCREEN, the knob the ask shares with round one: one real viewport on
 * the stage at a time. 1440 by default for the same reason round one opened
 * there — /welcome runs inside the host app's own laptop-first chrome — and
 * 375 is one press away, where `stage`'s "beside" columns collapse to a band.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

export const APP_DOOR = defineExploration({
  id: "app-door",
  title: "The door into the host app",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Six of round one's seven asks are ruled and wired (`door-wiring`, `f7075a73`); only `welcome` returns, alone, because his note asked for it by name: the tour itself, redesigned to feel more alive, four whole shapes drawn on the real /welcome.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-19",
      changed:
        "The first round: what the door asks for first, how many account surfaces the product has, what stands between a new account and the app, what /login is as a page, what happens when a new account's email already has one, how the door fails, and what a returning host meets.",
    },
  ],
  context:
    "Round one ruled welcome=tour: the name, then a tour, closing on a primary-and-skippable pair into the wizard so event creation stays the wizard's own focused thing. His note in the same breath: \"this welcome tour could use a huge redesign to feel more alive.\" This round is that redesign, alone: the name step and the closing pair both fixed by his ruling, one decision on everything between them, four whole shapes on the real /welcome, from the shipped cards to no tour at all.",
  bible: [1, 12, 14, 21, 22],
  asks: [
    {
      id: "tour",
      label: "The tour",
      question: "What should the tour between a new account and the app be?",
      context:
        "A host with no display name lands on /welcome: the name step, then the tour, then the close every shape ends on: Create my first event, primary, and I'll look around first, skippable. Drawn on the real /welcome at 1440 and 375.",
      options: [
        {
          id: "cards",
          label: "The three cards with dots, as today",
          means:
            "As shipped, its copy corrected. Four screens: the name, then the tutorial's three dot-tracked cards. Zero cost, answering none of his note.",
        },
        {
          id: "stage",
          label: "A staged tour on the product's real screens",
          means:
            "Five screens: the name, three screens (the code, a guest's phone, the album filling) beside their copy, then a peek at the wizard. New fixtures to build.",
        },
        {
          id: "film",
          label: "The twelve bespoke pictures, in motion",
          means:
            "Five screens: the name, three bespoke pictures in motion with copy overlapping each, then a fourth closing it. The pictures exist; only the motion is new.",
        },
        {
          id: "one",
          label: "One screen, no tour at all",
          means:
            "One screen: the name, one line of promise, the two doors. No tour, and no in-app home left for the tutorial's copy; it survives only on the marketing site.",
        },
      ],
      recommended: "film",
      because:
        "The pictures already exist, art-directed for this exact story on the marketing site, so motion is the only new cost and it is the literal word of his ask. Reusing them also makes a host's first minute look like the site that just sold them on it, not a fourth register invented per screen.",
      overrule:
        "If a new host should see the product working rather than an illustration of it, stage is the more honest promise, at the cost of fixtures nothing else needs.",
      lands:
        "What /welcome is end to end, and whether the how-it-works copy keeps an in-app home or lives on the marketing site alone.",
      configs: [SCREEN],
    },
  ],
});
