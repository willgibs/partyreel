import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PHOTOGRAPH OPENS AS, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app and the guest pages are
 * unprotected, "absolutely everything is up for relitigation or reconcepting
 * from the ground up". This is the surface every album click in the product
 * ends on, one component serving six galleries, so it is asked from the
 * foundation and PHONE FIRST: 375 by 812 is the default on every decision,
 * because a guest is standing at a party holding a phone, and 1440 is the knob,
 * because the host curating on Sunday morning is not.
 *
 * ★ THE ORDER IS THE SURFACE. Four decisions are roots and can be taken in any
 * order (what a tap opens, how the next photograph comes, how a video meets a
 * guest, whether a photograph has an address); four wait on one of those,
 * because they only exist once it is answered. What stands beside the
 * photograph depends on what the photograph opened INTO; who took it has no
 * place to be said until that chrome has a shape; the way out shares its
 * gesture with the chrome (a centre tap cannot both close and summon); and how
 * close a guest may get shares an axis with how the next one arrives.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The MATERIAL is `glass`'s round, already on
 * the desk: the backdrop behind the photograph, the pills' blur and their
 * grades are its `behind`, `recipe` and `grades`, so every option here wears
 * the shipped material and none of them answers that question sideways.
 * Whether a guest can take a photograph back is `guest-shape`'s `yours`; the
 * tile grammar and the bulk toolbar are `app-vocabulary`'s; the album's column
 * rule is ruled (`gallery-width`) and worn here as law; the reel is its own
 * board. Nor is the pipeline a design variable: the presign, the capability
 * token and the rule that raw R2 keys never reach the browser are untouched by
 * every shape below.
 *
 * ★ AND THE GESTURE PINS SURVIVE EVERY OPTION. `media-lightbox.test.tsx` holds
 * seventeen pins on the physics (the 10 px axis lock, 20 percent or 0.25 px/ms
 * to commit, the 240 ms settle, the tap thirds, the video strip, the host
 * curate wiring). They pin FUNCTION, never look. Every gesture option here is a
 * visual double drawn for the board, never a change to the engine.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. 375 by default and everywhere: this is the phone-first
 * round, and a laptop answer that contradicts the phone is a finding.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Whose viewer it is: the guest's three actions, or the host's six. */
const ROLE: Control = {
  id: "role",
  label: "Whose viewer",
  options: [
    { id: "guest", label: "A guest looking" },
    { id: "host", label: "The host curating" },
  ],
  default: "guest",
};

/** The shape of the photograph, which is what the viewer handles differently. */
const SHOT: Control = {
  id: "shot",
  label: "The photograph",
  options: [
    { id: "portrait", label: "A portrait, as a phone shoots" },
    { id: "landscape", label: "A landscape" },
  ],
  default: "portrait",
};

const DRAFT = defineExploration({
  id: "media-viewer",
  title: "Opening a photograph",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what a tap opens, what stands beside the photograph, how it says who took it, how the next one comes, whether a guest can get close to one, how a video meets them, how they get back to the album, and whether an open photograph has an address.",
  },
  context:
    "Every album click in the product ends here, and one component serves all six galleries. Every option is drawn on the real pieces over one open wedding, twenty-six items from nine guests, at 375 by 812 with 1440 on the knob, because a guest is at a party holding a phone. The album underneath never moves: the ruled column rule and the shipped tile. Nothing here opens a real dialog, mounts a provider or touches the network beyond the album's own stills and one committed clip.",
  bible: [1, 4, 14, 15, 18],
  asks: [
    {
      id: "opening",
      label: "The opening",
      question: "What should a tap on a photograph open?",
      context:
        "A tap opens a dialog over the page: the album goes behind a black wash at 90 percent and the photograph appears wherever it fits, with a close circle, two pills and a counter. Nothing says which tile it came from.",
      options: [
        {
          id: "dialog",
          label: "The dark room, as today",
          means:
            "The album dims behind a black wash and the photograph floats in the middle of it, with a margin all round.",
        },
        {
          id: "grow",
          label: "The photograph grows out of its tile",
          means:
            "The tile itself expands to fill the screen on solid black, and closing puts it back where it was in the grid.",
        },
        {
          id: "sheet",
          label: "A sheet, the album still lit above it",
          means:
            "The photograph rises on a rounded sheet that stops short of the top, so the album stays lit and scrolled in the gap.",
        },
      ],
      recommended: "grow",
      because:
        "The album is the product and the viewer is a page-sized hole punched in it. A photograph that comes out of its own tile says which one opened, gives the arrival the one beat the product never gave it, and puts it back where the eye left it.",
      overrule:
        "If a guest should keep browsing the album while a photograph is open, the sheet is the only answer that leaves it reachable.",
      lands:
        "What a tap builds, what the ground behind a photograph is, and whether the album survives the viewer.",
      tile: "phone",
      configs: [SCREEN, SHOT],
    },
    {
      id: "holds",
      label: "What it holds",
      question: "What should stand on the screen beside the photograph?",
      context:
        "Today: a close circle, an action pill of five icons, an attribution capsule under it, a counter inside that, and a chevron at each edge. All of it is on from the first frame to the last and none of it ever leaves.",
      options: [
        {
          id: "pills",
          label: "Two capsules and a counter, as today",
          means:
            "Five icons in one capsule over a second capsule carrying the name and the position, both on at all times.",
        },
        {
          id: "quiet",
          label: "Nothing until a tap asks for it",
          means:
            "The photograph alone, edge to edge. One tap brings the chrome up, another takes it away, and it leaves by itself.",
        },
        {
          id: "strip",
          label: "One strip at the foot",
          means:
            "A single row: who took it and when at one end, the actions at the other, instead of two floating capsules.",
        },
      ],
      recommended: "strip",
      because:
        "Two stacked capsules is furniture around what is one sentence and one row of icons. A strip also has room for the fact the viewer has never carried at all: when the photograph was taken.",
      overrule:
        "If a photograph deserves the whole screen with nothing on it, chrome that arrives on a tap is what every serious photo viewer does.",
      lands:
        "How much of a photograph is chrome at rest, and whether a guest must tap before they can act on one.",
      after: { ask: "opening" },
      tile: "phone",
      configs: [SCREEN, ROLE],
    },
    {
      id: "who",
      label: "Who took it",
      question: "How should a photograph say who took it?",
      context:
        "The name sits in a capsule of its own under the actions at 11 px, with a Host badge, Anonymous and an info tip, the host-only email, and the counter on the same line. Half of this album is from people the host has never met.",
      options: [
        {
          id: "pill",
          label: "A capsule of its own, as today",
          means:
            "The name, the badge and the position together in a second capsule below the icons, at the page's smallest size.",
        },
        {
          id: "foot",
          label: "The name and the time, on the chrome's line",
          means:
            "Priya, 11:42 pm, at one end of whatever the chrome is, with nothing built around it.",
        },
        {
          id: "none",
          label: "No name on the photograph",
          means:
            "The album is the host's and the photographs are the album's; who pressed the shutter is not on the picture.",
        },
      ],
      recommended: "foot",
      because:
        "Twenty-six photographs from nine people is what a guest album IS, and the name is what makes it a party rather than a folder. It does not need a capsule of its own to say one word.",
      overrule:
        "If a name on a photograph makes a guest think twice before sending one, no name is the answer that protects the uploads.",
      lands:
        "Whether a guest's name rides their photograph, and where a host reads the email behind an upload.",
      after: { ask: "holds" },
      tile: "phone",
      configs: [SCREEN, ROLE],
    },
    {
      id: "next",
      label: "The next one",
      question:
        "How should the next photograph come, and how should a guest know where they are?",
      context:
        "A finger drags the photograph and the neighbour follows it in; a mouse gets a chevron at each edge and the arrow keys. The position is spelled out at the foot at all times, in an album that can run to hundreds.",
      options: [
        {
          id: "swipe",
          label: "Swipe, chevrons and a count, as today",
          means:
            "The neighbour follows the finger, a chevron sits in each 30 percent band, and the foot says 17 of 26 at all times.",
        },
        {
          id: "film",
          label: "A filmstrip of the neighbours at the foot",
          means:
            "Nine small frames under the photograph with the current one lifted, so a guest can see what is coming and jump.",
        },
        {
          id: "peek",
          label: "The neighbours peek at the edges",
          means:
            "A sliver of the one before and the one after at each side, so the album says there is more and no number is needed.",
        },
      ],
      recommended: "peek",
      because:
        "The counter's whole job is to say there is more and roughly where you are, and a sliver of the next photograph says both in the album's own material, at no reading cost. It draws the gesture for a first-time guest as well.",
      overrule:
        "If browsing three hundred photographs is the act rather than looking at one, the filmstrip is the only option a guest can jump with.",
      lands:
        "What the viewer draws at its edges, whether a counter survives, and how a guest reaches a photograph nine along.",
      tile: "phone",
      configs: [SCREEN, SHOT],
    },
    {
      id: "closeup",
      label: "Close up",
      question: "Should a guest be able to get close to a photograph?",
      context:
        "The viewer has no zoom of its own: pinch is left to the browser, which cannot honour it inside a fixed dialog over a scroll-locked page. A wedding photograph of twelve people is twelve faces nobody can see.",
      options: [
        {
          id: "browser",
          label: "Leave it to the browser, as today",
          means:
            "Nothing in the viewer answers a pinch. The photograph stays at the size that fits, and a face in it stays that size.",
        },
        {
          id: "double",
          label: "Double-tap fills the screen",
          means:
            "One double-tap scales the photograph to cover the screen, a second returns it, and a drag moves it while it is close.",
        },
        {
          id: "pinch",
          label: "Pinch inside the viewer",
          means:
            "Two fingers scale the photograph in place up to three times, one finger pans it, and letting go under the fit size settles back.",
        },
      ],
      recommended: "pinch",
      because:
        "The photographs are the product and there is no way to look at one. Pinch is the gesture every guest already tries; the cost is that a one-finger drag has to mean pan while a photograph is close, rather than next.",
      overrule:
        "If the swipe's axis lock cannot survive a second finger, double-tap gets most of the value and leaves the gesture engine alone.",
      lands:
        "Whether a face in a group photograph can be seen, and what one finger means while a photograph is close.",
      after: { ask: "next" },
      tile: "phone",
      configs: [SCREEN, SHOT],
    },
    {
      id: "video",
      label: "A video",
      question: "How should a video meet a guest?",
      context:
        "A video in the viewer is a native element with the browser's own controls: the OS bar sits on the picture from the first frame, 64 px of the foot is taken out of the swipe for it, and nothing plays until it is pressed.",
      options: [
        {
          id: "controls",
          label: "The browser's own controls, as today",
          means:
            "Another company's bar, in another company's style, on the photograph, before anything has played.",
        },
        {
          id: "auto",
          label: "It plays muted, one tap for sound",
          means:
            "The clip starts the moment it is the one on screen, silent and looping, with a small speaker to turn the sound on.",
        },
        {
          id: "badge",
          label: "A play button alone",
          means:
            "The first frame with one round play button on it, as the tile has, and controls that arrive only once it plays.",
        },
      ],
      recommended: "badge",
      because:
        "A video nobody has played is a photograph and should look like one. The browser's bar is the only piece of someone else's design language anywhere in the product, and it sits on the picture.",
      overrule:
        "If an album should feel like the night moving rather than a wall of stills, muted autoplay is what every social viewer does.",
      lands:
        "What an unplayed clip looks like, whose controls a guest uses, and whether an album plays by itself.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "wayout",
      label: "The way out",
      question: "How should a guest get back to the album?",
      context:
        "Three ways out, and they are not equally findable: a 32 px circle at the top right, a tap on the middle third that nothing announces, and Escape. The outer thirds step forward and back, so a tap meant for back often goes on instead.",
      options: [
        {
          id: "three",
          label: "The circle, the centre tap and Escape",
          means:
            "Three ways out, one of them invisible and sitting between two zones that do the opposite of closing.",
        },
        {
          id: "down",
          label: "Swipe it back down into the album",
          means:
            "The photograph follows the finger down and drops into its place in the grid; the circle stays for a mouse.",
        },
        {
          id: "x",
          label: "The circle alone",
          means:
            "One way out in one place, and a tap on the photograph itself does nothing at all.",
        },
      ],
      recommended: "down",
      because:
        "Every full-screen thing a phone opens closes this way, and it is the only way out on the same finger as the way through. It answers where you were as well: the tile it lands on is your place in the album.",
      overrule:
        "If a swipe down has to share its axis with a pinch, one circle in one place beats three ways out that argue with each other.",
      lands:
        "How many ways out there are, what a tap on a photograph does, and whether the album keeps a guest's place.",
      after: { ask: "holds" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "link",
      label: "A link",
      question: "Should an open photograph have an address of its own?",
      context:
        "Nothing about an open photograph reaches the URL. A refresh at a party on bad Wi-Fi puts a guest back at the top of the album, and Share sends the album's link, so whoever opens it lands on the grid and has to hunt for the picture.",
      options: [
        {
          id: "none",
          label: "No address, as today",
          means:
            "The album's link is the only link there is. A refresh loses the photograph and Share sends the whole album.",
        },
        {
          id: "query",
          label: "The album's link, with the photograph on it",
          means:
            "Opening a photograph writes it into the address, so a refresh returns to it and Share sends this picture inside the album.",
        },
        {
          id: "file",
          label: "Share sends the picture itself",
          means:
            "The phone's sheet carries the image file, so it lands in a chat as a photograph rather than as a link to Partyreel.",
        },
      ],
      recommended: "query",
      because:
        "A link that opens on the photograph you meant is the loop the QR code already runs: every share is a door back into the album. Sending the file takes the person out of it, and off Partyreel entirely.",
      overrule:
        "Whether a guest's photograph may leave the album as a file is a privacy call rather than a design one, and until it is ruled no address is the safe default.",
      lands:
        "Whether a photograph can be linked to, what Share hands on, and whether a refresh keeps a guest's place.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob eight decisions share arrives eight times: the dock would
 * draw it eight times and React would warn on the duplicate key. Each decision
 * keeps it on its own strip (that is what `configs` is for); the board declares
 * it once. The finding `gallery-width` left for the constructor, which could
 * dedupe by id itself, still stands.
 */
export const MEDIA_VIEWER: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
