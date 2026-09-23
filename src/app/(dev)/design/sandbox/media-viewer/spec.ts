import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PHOTOGRAPH OPENS AS, ROUND ONE.
 *
 * Will (2026-09-19): the app and the guest pages are unprotected, "absolutely
 * everything is up for relitigation or reconcepting from the ground up".
 * This is the surface every album click in the product ends on, one component
 * serving six galleries, and a tap on the live reel may end here too, so it is
 * asked from the foundation and PHONE FIRST: 375 by 812 is the default on every
 * decision, because a guest is standing at a party holding a phone, and 1440 is
 * the knob, because the host curating on Sunday morning is not.
 *
 * ★ EVERY QUESTION STANDS ON THE CURRENT PRODUCT, AND NOTHING A NEWER BOARD ASKS
 * IS ASKED AGAIN (Will, 2026-09-22: a question an earlier pick reached is
 * adapted where its options can still beat the current path, and removed where
 * its context is already solved at its best). Two newer rounds are the ground
 * the answers stand on, never walls:
 *  - THE REEL. The live reel plays everything the album shows, and
 *    `reel-view.tap` asks whether a tap on its picture opens that item here. So
 *    a photograph has TWO ORIGINS, and the three questions that depend on where
 *    it came from (how it arrives, how a video meets a guest, how they get back)
 *    are drawn from both on the `origin` knob. What the reel's own surface does
 *    with a tap is `reel-view`'s question and is not asked here.
 *  - IDENTITY. Every upload carries a name at one of three levels of trust, and
 *    `who` is drawn on that model on the `credit` knob: a confirmed account's
 *    face and page, a typed name's plain disc and Unverified mark, and never an
 *    unproved address in the host's view. What a guest's own menu says about
 *    her state is `identity-door.menu`'s.
 *
 * ★ THE GROUND IS RULED; THE ARRIVAL IS NOT. `glass` r1 `behind=album` put the
 * page a photograph opened out of blurred at half brightness behind the
 * lightbox, and it SHIPPED, so the opening is not a question about a dark room:
 * all three options stand on that ground, from either origin, and what is
 * asked is how the photograph gets there.
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
 * is ruled (`gallery-width`) and worn here as law; the reel's own view is
 * `reel-view`'s and its tile `reel-front`'s. Nor is the pipeline a design
 * variable: the presign, the capability token and the rule that raw R2 keys
 * never reach the browser are untouched by every shape below.
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

/**
 * WHERE IT OPENED FROM, the knob the three origin-bound decisions share. A tile
 * is the door every album has today; the live reel, paused on the photograph a
 * guest tapped, is the second one (`reel-view.tap`).
 */
const ORIGIN: Control = {
  id: "origin",
  label: "Opened from",
  options: [
    { id: "tile", label: "A tile in the album" },
    { id: "reel", label: "The live reel" },
  ],
  default: "tile",
};

/**
 * WHOSE PHOTOGRAPH `who` IS ASKED ON. Priya typed a name and proved nothing, so
 * her credit carries the mark; Leah is a confirmed account with a page, so hers
 * carries a face and a door. A credit judged on one of the two says nothing
 * about the other.
 */
const CREDIT: Control = {
  id: "credit",
  label: "Whose photograph",
  options: [
    { id: "typed", label: "Priya's, a typed name" },
    { id: "confirmed", label: "Leah's, a confirmed account" },
  ],
  default: "typed",
};

const DRAFT = defineExploration({
  id: "media-viewer",
  title: "Opening a photograph",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "Rechecked against the identity and reel rounds: a photograph opens from a tile or the live reel, so the opening, a video and the way out are drawn from both; every credit is drawn on the identity model; the link is asked beside the reel's own address.",
  },
  context:
    "Every album click in the product ends here, one component serves all six galleries, and a tap on the live reel may open it too. Every option is drawn on the real pieces over one open wedding, twenty-six items from nine guests, at 375 by 812 with 1440 on the knob, because a guest is at a party holding a phone. Two things underneath never move and are worn as law: the ruled column rule with the shipped tile, and the ruled ground, the page a photograph opened out of blurred at half brightness behind it.",
  bible: [1, 4, 14, 15, 18],
  asks: [
    {
      id: "opening",
      label: "The opening",
      question:
        "How should a photograph arrive, out of its tile or out of the live reel, on the ground behind it?",
      context:
        "The ground is ruled: whatever it opened from, blurred at half brightness. The arrival is not. A photograph opens from a tile today and from the reel once reel-view.tap is answered, and fades in centred with nothing to say where from.",
      options: [
        {
          id: "fade",
          label: "It fades in centred, as wired",
          means:
            "The photograph appears in the middle of the blurred ground inside a margin, from either origin, with nothing to say where it came from.",
        },
        {
          id: "grow",
          label: "It grows out of where it was",
          means:
            "Out of a tile, the tile expands to fill the screen; out of the reel, the frame lets go of its crop. Closing puts it back in either.",
        },
        {
          id: "sheet",
          label: "A sheet, the origin still lit above it",
          means:
            "The photograph rises on a rounded sheet that stops short of the top, so the album, or the paused reel, stays lit in the gap.",
        },
      ],
      recommended: "grow",
      because:
        "The ground says what is behind the photograph; only a flight says which photograph it was. Out of a tile it is the one beat the arrival never had; out of the reel it is the montage letting go of the frame a guest tapped. Closing puts it back where the eye left it, in either.",
      overrule:
        "If a guest should keep browsing the album, or watching the reel, while a photograph is open, the sheet is the only answer that leaves either in reach.",
      lands:
        "What a tap builds on the ruled ground from either origin, and whether a photograph knows where it came from.",
      tile: "phone",
      configs: [SCREEN, SHOT, ORIGIN],
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
        "Where should the name, the face and the Unverified mark sit on an open photograph?",
      context:
        "Every upload carries a name: a confirmed account's with its face and, once it has a handle, a page; a typed one with the plain disc, the Unverified mark and no page. The host sees an address only where one was proved.",
      options: [
        {
          id: "pill",
          label: "A capsule of its own, as wired",
          means:
            "The name, the mark, the badge and the position together in a second capsule below the icons, at the smallest size.",
        },
        {
          id: "foot",
          label: "The name and the time, on the chrome's line",
          means:
            "Priya, 11:42 pm and the mark at one end of whatever the chrome is, with nothing built around them.",
        },
        {
          id: "face",
          label: "A face-led credit at the top",
          means:
            "The face or the plain disc, the name and the mark beside it, opposite the close circle; a door to the person's page where one exists.",
        },
      ],
      recommended: "face",
      because:
        "The guest list already draws every uploader this way: a face for a confirmed account, the plain disc and the mark for a typed name, a link only where a page exists. A credit in that grammar reads the proof at a glance and at reading size, and the shipped capsule's own comment waits to become a door.",
      overrule:
        "If a photograph should carry as little as possible, the name and the time on the chrome's own line says as much with no new furniture.",
      lands:
        "Whether a face rides a photograph, where the Unverified mark is read, and whether a credit opens a person's page.",
      after: { ask: "holds" },
      tile: "phone",
      configs: [SCREEN, ROLE, CREDIT],
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
        "How should a video meet a guest in the viewer, now the live reel plays a muted window of it and may open the viewer mid-clip?",
      context:
        "Today a clip wears the browser's own controls from its first frame, and 64 px of the foot leaves the swipe for them. The live reel plays a muted window of every clip, so a tap on the reel can open this one mid-clip.",
      options: [
        {
          id: "controls",
          label: "The browser's own controls, as wired",
          means:
            "Another company's bar on the picture before anything has played; opened from the reel, the clip starts over under it.",
        },
        {
          id: "auto",
          label: "It plays muted, one tap for sound",
          means:
            "The clip plays silent and looping the moment it is on screen, and opened from the reel it carries on from the reel's moment.",
        },
        {
          id: "badge",
          label: "The tile's own play mark, grown up",
          means:
            "The first frame under the play badge every tile wears, and controls only once it plays; opened from the reel, the moving clip stops.",
        },
      ],
      recommended: "auto",
      because:
        "The reel made muted motion the product's grammar for a video, and a guest who taps a clip moving in the reel should not watch it freeze into a poster. Silent play from the first frame keeps one grammar across the reel and the viewer, and sound stays one tap away.",
      overrule:
        "If a clip opened from a tile is the guest's own act, and a phone at a party should fetch no video nobody pressed, the badge waits to be played.",
      lands:
        "What a clip looks like arriving from a tile or the reel, whose controls a guest uses, and whether the viewer fetches a video unpressed.",
      tile: "phone",
      configs: [SCREEN, ORIGIN],
    },
    {
      id: "wayout",
      label: "The way out",
      question:
        "How does a guest get back to where a photograph opened: its tile, or the reel?",
      context:
        "Three ways out today: a 32 px circle, an unmarked tap on the middle third, and Escape. The guest's sheet teaches a drag back down in a hand. Opened from the reel, the way out owes the guest the reel again, not the album.",
      options: [
        {
          id: "three",
          label: "The circle, the centre tap and Escape",
          means:
            "Three ways out, one of them invisible between two zones that do the opposite; each lands back in the album or the reel.",
        },
        {
          id: "down",
          label: "Swipe it back down where it came from",
          means:
            "The photograph follows the finger down and drops into its tile, or back into the reel's frame, which picks up again; the circle stays for a mouse.",
        },
        {
          id: "x",
          label: "The circle alone",
          means:
            "One way out in one place, back to the album or the reel, and a tap on the photograph itself does nothing at all.",
        },
      ],
      recommended: "down",
      because:
        "Every full-screen thing a phone opens closes this way, and the guest's sheet teaches it. It is the only way out on the same finger as the way through, and it lands where the guest was: the tile in the album, or the moment in the reel, which picks up again.",
      overrule:
        "If a swipe down has to share its axis with a pinch, one circle in one place beats three ways out that argue with each other.",
      lands:
        "How many ways out there are, what a tap on a photograph does, and whether a guest lands back in the album or the reel where they left it.",
      after: { ask: "holds" },
      tile: "phone",
      configs: [SCREEN, ORIGIN],
    },
    {
      id: "link",
      label: "A link",
      question:
        "Should an open photograph get its own address, as the reel's ?reel will, and should Share hand on the link or the file?",
      context:
        "Nothing about an open photograph reaches the URL, and Share sends the album's link. The reel gets its own address (?reel), and a cut already leaves a phone as a file, so a file may leave; which one Share hands on is open.",
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
            "Opening a photograph writes it into the address beside ?reel, so a refresh returns to it and Share sends this picture inside the album.",
        },
        {
          id: "file",
          label: "Share sends the picture itself",
          means:
            "The phone's sheet carries the image file, the way a cut leaves, so it lands in a chat as a photograph rather than as a link to Partyreel.",
        },
      ],
      recommended: "query",
      because:
        "A link that opens on the photograph you meant is the loop the QR code already runs: every share is a door back into the album, and ?reel already speaks this grammar. A file takes the person out of it and off Partyreel entirely, which the cut already does for anyone who wants one.",
      overrule:
        "The cut settled that a file may leave: if a photograph landing in a chat as itself is worth more than a way back, the file is the one that does it.",
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
