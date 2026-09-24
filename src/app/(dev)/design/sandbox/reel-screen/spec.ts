import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE REEL ON A BIG SCREEN, ROUND TWO (2026-09-24).
 *
 * Round one asked eight things about a separate "wall"; he answered two
 * (`qr=corner`, `name=none`), found two repeats of reel-view's own questions
 * and stopped there ("Noticing some repeats; calling an end to the review
 * here"), then ruled in chat: "The view is the wall." One full-screen view
 * serves phones, laptops and event screens; Play on a screen opens that same
 * view with the event's code shown and a one-tap Start that takes fullscreen
 * and keeps the screen awake; the viewer's hold applies.
 *
 * ★ ALREADY DECIDED, AND NOT ASKED HERE (his answers, carried as givens):
 *   - the screen is the view, not a mode of its own: its glass bar, its dock,
 *     its top-left arrival feed and his 3 s hold, adjustable, are the view's;
 *   - the code lives in a corner, a white plate bottom right with "Scan to add
 *     yours" and the readable address (`qr=corner`);
 *   - no event name on the screen (`name=none`); the only words are the code's;
 *   - nothing counts up in public before the minimum (reel-front `states=nothing`),
 *     and the minimum is TWO.
 * Also standing from round one: the Start plate exists because fullscreen and
 * the wake lock both need a press in the tab that asks, and it returns whenever
 * fullscreen is left; the host's own press overrides reduced motion; the room's
 * music is the room's, so the screen is silent.
 *
 * ★ WHERE ROUND ONE'S OTHER SIX WENT. `caption` (the just-added beat) and
 * `pacing` (the wall's hold) are answered on reel-view: his arrival chip is
 * the screen's too, and the three holds this board ran (3.6, 5 and 7 s) are
 * steps of the view's Hold control now. `panel` and `interstitial` left with
 * `qr=corner`. `open` (the way in) and `review` (a waiting queue on a public
 * screen) are the host's questions and moved to reel-host as merged
 * questions, every option kept. Two questions are left for a television.
 */

/**
 * The television, at two sizes. Every drawing is on both, and the composition
 * is the same at each (every length is a share of the screen), so the default
 * is the size that fits a reviewer's laptop whole at 1:1.
 *
 * ★ 1440 FIRST, NOT 1920 (round two's own finding): a 1920 frame at the lab's
 * 1:1 default scrolls sideways on a laptop and the capture keeps only what is
 * in the window, so round one's corner code reached the review sheet cut in
 * half. The real television's pixels are one press away on the knob.
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
      "The view is the wall (his ruling). Round one's code and name are carried; caption and pacing left as answered on reel-view; open and review moved to reel-host. The two left are redrawn on the view with no name and no public count.",
  },
  context:
    "Play on a screen opens the reel's own full-screen view on the venue's television: the code in its corner, no name, the viewer's hold. Two decisions are left that only a big screen asks: what it shows before the reel starts at the second photo, and what the host presses to start it. Drawn at 1440 by 810 with a real 1920 on the knob, every reel frame the real engine.",
  carried: [
    {
      id: "look",
      question: "Which mood does the screen wear while these are judged?",
      taken:
        "Sunset, full bleed. The default, Cinematic, letterboxes a 16:9 screen and would put the corners over black bars.",
      overrule:
        "Worth knowing alone: a host who touches nothing gets Cinematic, about a sixth of a television spent on bars.",
    },
    {
      id: "plate-code",
      question: "Does the code ride the Start plate, before anyone presses?",
      taken:
        "Yes, in its corner on every plate: the room can scan while the host is still at the laptop.",
      overrule:
        "If the plate is the host's alone, the code waits for Start and the three plates lose their corner.",
    },
    {
      id: "one-photo",
      question: "How many photographs are there before the reel starts?",
      taken:
        "One: the only count under the minimum of two with a picture to show. With none yet, the stills option is the code alone.",
      overrule:
        "Nothing turns on it but the stills option, which is drawn at the one case it has.",
    },
  ],
  asks: [
    {
      id: "idle",
      label: "Before it starts",
      question:
        "What should a big screen show before the reel starts at the second photo?",
      context:
        "The host puts the view on the screen before anyone arrives, so for the first half hour the screen is pure invitation. Nothing counts up in public and no name is on screen.",
      options: [
        {
          id: "code",
          label: "The code alone, as big as it goes",
          means:
            "The code and the address fill the screen, unmissable from anywhere in the room. It is what both of his answers already describe.",
        },
        {
          id: "invite",
          label: "The code, and what it waits for",
          means:
            "A large code, \"Scan to add yours\", the address, and one line: \"The reel starts with the second photo.\" No count.",
        },
        {
          id: "stills",
          label: "The photograph there is, held slow",
          means:
            "The one photograph already added fills the screen with the code in its corner, as the view will look. With none yet, the code alone.",
        },
      ],
      recommended: "code",
      because:
        "It is the one option his answers already describe, no name and no count, with the code at a size a phone reads from the back of the room while the screen has nothing else to do.",
      overrule:
        "If a code with no words reads as a fault on a television, the invitation says what the screen is for in one line.",
      lands:
        "What every big screen shows before its reel starts, and whether a public screen ever says what it is waiting for.",
      configs: [SCREEN],
    },
    {
      id: "start",
      label: "The Start plate",
      question: "What should the host press to start the reel on a big screen?",
      context:
        "Fullscreen and the wake lock both need a press in the tab that asks, so Play on a screen opens on a plate, and the plate returns whenever fullscreen is left.",
      options: [
        {
          id: "frame",
          label: "The reel's first frame, with a play mark",
          means:
            "The picture is already there behind a dimmed glass play mark. Pressing it lifts the dimming and the reel runs.",
        },
        {
          id: "button",
          label: "One button, and what it does",
          means:
            "\"Start the reel\" on a dark plate, and one line saying it fills the screen and keeps it awake.",
        },
        {
          id: "countdown",
          label: "A countdown, with a way past it",
          means:
            "A large three counting down and \"Start now\". At zero it plays in the window; only a press can take the whole screen.",
        },
      ],
      recommended: "frame",
      because:
        "The plate is the only thing between the host and the screen, and showing the reel behind it makes the press feel like lifting a cover rather than launching an application.",
      overrule:
        "A plate with no words never warns a host that the screen will fill and stay awake; the plain button says both.",
      lands:
        "The first thing anyone sees of Play on a screen, and how a surface that needs a press introduces itself.",
      configs: [SCREEN],
    },
  ],
});
