import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PHOTOGRAPH OPENS AS, ROUND ONE (2026-09-19; RESHAPED 2026-09-21).
 *
 * Will (2026-09-19): the app and the guest pages are unprotected, "absolutely
 * everything is up for relitigation or reconcepting from the ground up".
 * This is the surface every album click in the product
 * ends on, one component serving six galleries, so it is asked from the
 * foundation and PHONE FIRST: 375 by 812 is the default on every decision,
 * because a guest is standing at a party holding a phone, and 1440 is the knob,
 * because the host curating on Sunday morning is not.
 *
 * ★ RESHAPED, NEVER ANSWERED BY PRECEDENT (the overtaken audit, Will
 * 2026-09-21: a question that "fits the flow of potentially offering a better
 * solution than the earlier selection that overtook it ... should be reshaped
 * to be a more current question with updated context"). Seven of these eight
 * questions wore a badge naming a ruling that had landed on top of them since
 * they were drawn. Every one of those badges is now FOLDED INTO ITS QUESTION:
 * the ruling is stated as the ground the answer stands on rather than as a note
 * beside it. The board stays at round one and stays unanswered. `closeup` was
 * never reached by anything and is untouched.
 *
 * ★ WHAT THE FOLD CHANGED, BESIDES WORDS. One option went, because a ruling
 * forbids it outright: `who=none` ("no name on the photograph") cannot survive
 * an identity shape where every upload carries a name, verified or marked. One
 * concept arrived, because two rulings made it possible: `who=face`, the credit
 * led by the seeded avatar every account now has and pressable as the door to
 * that person's page, which is what the shipped capsule's own comment says it
 * is waiting to become. And one option was redrawn rather than reworded: see
 * the ground below.
 *
 * ★ THE GROUND IS RULED; THE ARRIVAL IS NOT. `glass` r1 `behind=album` put the
 * album blurred at half brightness behind the lightbox and it SHIPPED, so the
 * opening is no longer a question about a dark room: all three options stand on
 * that ground and what is asked is how the photograph gets there. The option
 * that used to be "the dark room, as today" is drawn on the ruled ground and
 * named for what it actually is, a centred fade.
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
 * ★ WHAT IS DELIBERATELY NOT ASKED. The MATERIAL is `glass`'s, ruled whole
 * (Crystal, the double edge, the album behind): the backdrop, the pills' blur
 * and their grades are settled, and every option here wears the shipped
 * material rather than answering that question sideways. Whether a guest can
 * take a photograph back is ruled (`guest-shape`: theirs, for ever); the tile
 * grammar and the bulk toolbar are `app-vocabulary`'s; the album's column rule
 * is ruled (`gallery-width`) and worn here as law; the reel is its own board.
 * Nor is the pipeline a design variable: the presign, the capability token and
 * the rule that raw R2 keys never reach the browser are untouched by every
 * shape below.
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
    date: "2026-09-21",
    changed:
      "Reshaped by the overtaken audit: seven questions now carry the rulings that reached them as their own context, the opening is asked on the ruled ground rather than against a dark room, the no-name option is gone, and a face-led credit is added.",
  },
  context:
    "Every album click in the product ends here, and one component serves all six galleries. Every option is drawn on the real pieces over one open wedding, twenty-six items from nine guests, at 375 by 812 with 1440 on the knob, because a guest is at a party holding a phone. Two things underneath never move and are worn as law: the ruled column rule with the shipped tile, and the ruled ground, the album blurred at half brightness behind the photograph.",
  bible: [1, 4, 14, 15, 18],
  asks: [
    {
      id: "opening",
      label: "The opening",
      question:
        "How should a photograph arrive on the ground the album makes behind it?",
      context:
        "The ground is ruled and shipped: the album blurred at half brightness behind the lightbox. The arrival is not. Today a photograph fades in centred inside a margin, with nothing to say which tile it came from.",
      options: [
        {
          id: "fade",
          label: "It fades in centred, as wired",
          means:
            "The photograph appears in the middle of the blurred album inside a margin, with nothing to say where it came from.",
        },
        {
          id: "grow",
          label: "The photograph grows out of its tile",
          means:
            "The tile itself expands to fill the screen over the blurred album, and closing puts it back where it was in the grid.",
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
        "The ground already says the album is still there. What it cannot say is which photograph opened. A picture that comes out of its own tile says that, gives the arrival the one beat the product never gave it, and puts it back where the eye left it.",
      overrule:
        "If a guest should keep browsing the album while a photograph is open, the sheet is the only answer that leaves it reachable.",
      lands:
        "What a tap builds on the ruled ground, and whether a photograph knows which tile it came from.",
      tile: "phone",
      configs: [SCREEN, SHOT],
    },
    {
      id: "holds",
      label: "What it holds",
      question:
        "What shape should the chrome take at rest, now that it carries every action?",
      context:
        "Ruled: on a phone every action on a photograph lives here, never on its tile; and a crowded top level folds its extras behind one button. Today it is a five-icon capsule over a second capsule, both always on, and a host carries six.",
      options: [
        {
          id: "pills",
          label: "Two capsules and a counter, as wired",
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
        "Two stacked capsules is furniture around one sentence and one row of icons, and it is the shape with the least room for the host's six. A strip also has room for the fact the viewer has never carried at all: when the photograph was taken.",
      overrule:
        "If a photograph deserves the whole screen with nothing on it, chrome that arrives on a tap is what every serious photo viewer does.",
      lands:
        "How much of a photograph is chrome at rest, and what room the extras have to fold into.",
      after: { ask: "opening" },
      tile: "phone",
      configs: [SCREEN, ROLE],
    },
    {
      id: "who",
      label: "Who took it",
      question:
        "Where should the name, the face and the unverified mark sit on an open photograph?",
      context:
        "Every upload carries a name now, verified or marked, and every account has a seeded face of its own. Today one capsule under the icons carries the name, a Host badge, the position and the host's email, at the smallest size.",
      options: [
        {
          id: "pill",
          label: "A capsule of its own, as wired",
          means:
            "The name, the badge, the mark and the position together in a second capsule below the icons, at the smallest size.",
        },
        {
          id: "foot",
          label: "The name and the time, on the chrome's line",
          means:
            "Priya, 11:42 pm and the mark at one end of whatever the chrome is, with nothing built around them.",
        },
        {
          id: "face",
          label: "A face-led credit at the top, pressable",
          means:
            "The seeded avatar, the name beside it and the mark on its corner, opposite the close circle, opening the person's page.",
        },
      ],
      recommended: "face",
      because:
        "Every account has a face now and every name carries a proof state, so a credit is three things rather than one word. A face reads all three at a glance, at reading size, and the shipped capsule's own comment says it is waiting to become a door.",
      overrule:
        "If a photograph should carry as little as possible, the name and the time on the chrome's own line says as much with no new furniture.",
      lands:
        "Whether a face rides a photograph, where the unverified mark is read, and whether a credit opens a person's page.",
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
        "A finger drags the photograph and the neighbour follows; a mouse gets a chevron at each edge, and the position is written at the foot in an album of hundreds. He kept the swipe for galleries by name, and the upload act draws a strip.",
      options: [
        {
          id: "swipe",
          label: "Swipe, chevrons and a count, as wired",
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
        "If browsing three hundred is the act rather than looking at one, the filmstrip is the only option a guest can jump with, and the upload act draws one.",
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
      question:
        "How should a video meet a guest: playing, waiting, or wearing the browser's bar?",
      context:
        "A video here is a native element with the browser's own controls: the OS bar sits on the picture from the first frame and 64 px of the foot leaves the swipe for it. One tile draws every grid now and carries the play mark as state.",
      options: [
        {
          id: "controls",
          label: "The browser's own controls, as wired",
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
          label: "The tile's own play mark, grown up",
          means:
            "The first frame wearing the shipped play badge exactly as every tile wears it, and controls only once it is playing.",
        },
      ],
      recommended: "badge",
      because:
        "A video nobody has played is a photograph and should look like one. The badge is not a new mark: it is the one glyph every tile in the product already carries, at the size a full screen needs.",
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
        "Three ways out, unequally findable: a 32 px circle, a tap on the middle third that nothing announces, and Escape, with the outer thirds stepping on and back. The product teaches a drag back down in a hand now: the guest's sheet.",
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
        "Every full-screen thing a phone opens closes this way, and the product has the gesture now: the guest's sheet teaches it. It is the only way out on the same finger as the way through, and the tile it lands on is your place in the album.",
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
      question:
        "Should an open photograph have an address of its own, and what should Share hand on?",
      context:
        "Nothing about an open photograph reaches the URL: a refresh puts a guest back at the top of the album, and Share sends the album's link. The host's share sheet carries that link for a guest to pass on themselves now.",
      options: [
        {
          id: "none",
          label: "No address, as wired",
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
