import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE REEL ON A BIG SCREEN, ROUND TWO, REFRESHED (2026-09-24).
 *
 * The screen is a posture of the reel's own full-screen view: one view serves
 * phones, laptops and event screens, and Play on a screen opens it with the
 * event's code on and one press that takes fullscreen. The questions a hand and
 * a screen share (how an arrival is announced, how long a photograph holds) are
 * the view's, and where the host's door sits and what a waiting queue says are
 * the host's (reel-host). Two are left that only a big screen asks: what it
 * shows before the reel starts, and what the host presses to start it.
 *
 * ★ WHAT EVERY DRAWING STANDS ON, AND WHY IT IS GROUND RATHER THAN A FENCE. The
 * picks already made are drawn as the surface is: the code in its corner while
 * the reel plays (the room scans it without losing the picture), no name over
 * the reel (the photographs are the show), a minimum of two (one photograph is
 * not yet a reel). The empty screen is its own case, with its own reasons, so
 * two of its options try one of those picks there: a title card that names the
 * event, and two seats that count to the reel.
 *
 * ★ THE GUEST BUILD HOLDING FOR THE REEL ROUND already draws two of these
 * options (`code` below the minimum, `frame` for the plate), so an answer here
 * either keeps what it built or restyles it.
 */

/**
 * The television, at two sizes. Every drawing is on both, and the composition
 * is the same at each (every length is a share of the screen), so the default
 * is the size that fits a reviewer's laptop whole at 1:1.
 *
 * ★ 1440 FIRST, NOT 1920: a 1920 frame at the lab's 1:1 default scrolls
 * sideways on a laptop, and the capture keeps only what is in the window, so a
 * corner code reached the review sheet cut in half. The real television's
 * pixels are one press away on the knob.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, the whole screen in view" },
    { id: "1920", label: "1920, a real television's pixels" },
  ],
  default: "1440",
};

export const REEL_SCREEN = defineExploration({
  id: "reel-screen",
  title: "The reel on a big screen",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "Refreshed: before it starts gains a title card with the event's name and two seats that count to the reel, each trying an earlier pick on the empty screen's own case; the Start plate gains a way in with no plate at all.",
  },
  context:
    "Play on a screen opens the reel's own full-screen view on the venue's television: the code in its corner, no name over the reel, the viewer's hold. Two decisions only a big screen asks: what it shows before the reel starts at the second photo, and what the host presses to start it. Drawn at 1440 by 810 with a real 1920 on the knob; every reel frame is the real engine's.",
  carried: [
    {
      id: "plate-code",
      question: "Does the code ride the Start plate, before anyone presses?",
      taken:
        "Yes, in its corner on every plate, so the room can scan while the host is still at the laptop.",
      overrule:
        "If the plate is the host's alone, the code waits for the press, as the guest build's plate has it now.",
    },
    {
      id: "one-photo",
      question: "How many photographs are there before the reel starts?",
      taken:
        "One: the only count under the minimum of two with a picture to show. With none, the two options that show it draw their empty state.",
      overrule:
        "Nothing turns on it but the stills and the seats, each drawn at the one case it has.",
    },
    {
      id: "after-start",
      question: "Is the empty screen drawn before or after the host's press?",
      taken:
        "After: what the room reads for the half hour. Before it, each keeps a quiet Start under its words, as the guest build does.",
      overrule:
        "If the empty screen should wait behind the plate the way the reel does, the Start question's answer covers it too.",
    },
  ],
  asks: [
    {
      id: "idle",
      label: "Before it starts",
      question:
        "What should a big screen show before the reel starts at the second photo?",
      context:
        "The host puts the view on the screen before anyone arrives, so for the first half hour it is pure invitation. The reel itself carries no name and no count; the empty screen is its own case, so one option tries each.",
      options: [
        {
          id: "code",
          label: "The code alone, as big as it goes",
          means:
            "The code and the readable address fill the screen, unmissable from the back of the room, and not another word. The guest build ships this.",
        },
        {
          id: "invite",
          label: "The code, and what it waits for",
          means:
            'A large code, "Scan to add yours", the address, and one line: "The reel starts with the second photo." No name and no count.',
        },
        {
          id: "stills",
          label: "The photograph there is, held slow",
          means:
            "The one photograph already added fills the screen with the code in its corner, as the reel will look. With none yet, the code alone.",
        },
        {
          id: "welcome",
          label: "A title card with the event's name",
          means:
            "The event's name and day as a title card, then the code in the printed sign's words. The name lives on the empty screen only; the reel keeps none.",
        },
        {
          id: "seats",
          label: "Two seats the room fills",
          means:
            'Two frames, the photograph there is in one and the other waiting, under "One more photo starts the reel". The second lands in its seat and the reel begins.',
        },
      ],
      recommended: "welcome",
      because:
        "A screen with nothing to play yet is a title card, and a room expects one: the event's name says whose night this is, the code beneath says how to join it, in the words the printed sign already uses, and the reel stays nameless.",
      overrule:
        "If a public screen should never carry the event's name, the seats invite with the photograph there is and say what the screen waits for.",
      lands:
        "What every big screen shows before its reel starts, and whether an empty screen may name the event or count to the reel.",
      configs: [SCREEN],
    },
    {
      id: "start",
      label: "The Start plate",
      question: "What should the host press to start the reel on a big screen?",
      context:
        "Fullscreen needs a press in the tab that asks, and Play on a screen opens a new tab, so there is always something to press. Behind a plate the reel waits for it, and again when fullscreen is left; without one it plays in the window.",
      options: [
        {
          id: "frame",
          label: "The reel's first frame, with a play mark",
          means:
            "The picture is already there behind a dimmed glass play mark. The press lifts the dimming, fills the screen and runs the reel. The guest build ships this.",
        },
        {
          id: "button",
          label: "One button, and what it does",
          means:
            '"Start the reel" on a dark plate, and one line saying it fills the screen and keeps it awake.',
        },
        {
          id: "countdown",
          label: "A countdown, with a way past it",
          means:
            'A large three counting down and "Start now". At zero it plays in the window; only a press can take the whole screen.',
        },
        {
          id: "window",
          label: "No plate, ever: it plays at once",
          means:
            "The reel plays in the window from the moment it opens, the code in its corner, and a quiet pill asks for the one press that fills the screen.",
        },
      ],
      recommended: "window",
      because:
        "A screen's worst moment is a stray Escape or a guest brushing the laptop. Behind a plate the room's reel stops and dims until someone presses again; playing in the window, it loses only the fullscreen, and the pill asks for it back.",
      overrule:
        "If a reel should never play inside the browser's own bars on a television, the first frame behind a play mark holds it until the press.",
      lands:
        "The first thing anyone sees of Play on a screen, and what the wall does when fullscreen is lost.",
      configs: [SCREEN],
    },
  ],
});
