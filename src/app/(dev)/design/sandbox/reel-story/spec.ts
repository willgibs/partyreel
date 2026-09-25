import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * THE MARKETING STORY OF THE REEL, ROUND TWO (2026-09-25).
 *
 * Round one is answered (`docs/reviews/reel-story.json`) and its picks are
 * reel-sweep's to build tonight, so they are drawn here as ground: the /reel
 * page runs the live reel, then the screen, then clips (the party, then the
 * morning after); the pricing rows name the clip; the loop's last steps are
 * "Watch the reel grow" and "Make your clip"; the help category stays
 * "Highlight reel"; clip is the noun; no two pages close on the same reel
 * beat; no centred portrait video leaves a desktop blank beside it.
 *
 * ★ HIS NOTES, AS DIRECTION.
 * - thesis, none picked: "The home screen and the feature hub's reel door
 *   don't have to be tied together with this copy... they're for different
 *   purposes", and "Roll credits on the group chat" made readers "think too
 *   much". So the one constant splits: `close` is the home's last invitation
 *   in its own words (a direction that never names the reel is fair), `card`
 *   is what the reel is, on its door and, as ground his to overrule, as the
 *   /reel hero's heading, so the door and the room it opens agree.
 * - events=wall: "the left card is beautiful for production, only needing
 *   shorter copy that reduces it to 2 lines max", and the right side "could
 *   use a ton of redesign work around the reel presentation". So the door is
 *   ground (its line cut, measured in the real type at both widths) and
 *   `wall` redraws only the reel's side, as the door's equal.
 * - teaser=poster, as a short looped clip with a play mark that launches "a
 *   demo reel experience", or a modal "that contextualizes what they're
 *   watching with some CTA". `play` draws where the press leads: the
 *   Orchestrator's overlay (his two merged), his route, his modal.
 *
 * ★ ROUND ONE'S FRAMES RETIRED. They were plain boxes, so every breakpoint
 * inside answered the lab window instead of the frame (the "375" events column
 * was the desktop grid squeezed); git has them. Every option now draws in a
 * real frame at its own width, with the reel on the real engine.
 *
 * Nothing here asks what another standing board asks: the footer under the
 * close is `site-chrome`'s (`foot-after`), the reel view's own chrome is
 * `reel-view`'s, and the album tile is `reel-front`'s.
 */
export const REEL_STORY = defineExploration({
  id: "reel-story",
  title: "The marketing story of the reel",
  round: {
    n: 2,
    date: "2026-09-25",
    changed:
      "The thesis splits into the home's close and the reel's card, each in its own words; the events column becomes the reel beside the demo door, redrawn as its equal; the poster becomes a looped clip, and the ask is where its play mark leads. Every frame is a real viewport now.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-25",
      changed:
        "The noun is clip now: every option that offered cut offers clip, and the two asks that drew clip beside cut (the pricing rows, the steps) fold each pair into one option. Nothing else moved, and it stays round one.",
    },
  ],
  context:
    "Round one's answers are ground: the /reel page runs the live reel, then the screen, then clips; the pricing rows and the loop's last steps name the clip; help stays Highlight reel. You turned down every thesis line and asked that the home's close and the reel's card stop sharing one, and for a redesign of the reel beside the demo door. Four asks, each in its real section, in a real frame at 1440 and 375, the reel on the real engine.",
  carried: [
    {
      id: "door-line",
      question: "What does the demo door say, cut to two lines?",
      taken:
        '"A real album, open with no sign-up." Read off the frame: two lines at 1440 and at 375.',
      overrule:
        "Any line that measures two at 375 in the door's type; /how-it-works keeps its longer subhead either way.",
    },
    {
      id: "start-label",
      question: "What does the button in the overlay and the modal say?",
      taken:
        '"Start free", the site\'s one start label, rather than a new "Start your event".',
      overrule:
        "A label for one place is one string; everywhere else keeps the one.",
    },
    {
      id: "teaser-words",
      question: "What do the teaser's own words say around the play mark?",
      taken:
        "Its heading as shipped, a stand-in line where the retired style-picking subhead was, and no style strip, judged for size.",
      overrule:
        "The section's words are the wiring's; this round asks only where the press leads.",
    },
    {
      id: "card-sizes",
      question: "Does the reel door keep a longer second line on the hub?",
      taken:
        "No: one line at both sizes (the hub's lead and the related row), and the /reel heading takes it.",
      overrule:
        "A longer hub line can come back as the door's second string, and the heading would take the short one.",
    },
  ],
  asks: [
    {
      id: "close",
      label: "The home's close",
      question:
        "How should the home page close: its heading, the line under it and its buttons?",
      context:
        'The home\'s last section, above the footer (the footer is site-chrome\'s). Today it reads "Roll credits on the group chat." over "Every event ends with a reel." Its job: the last invitation to start, read in one pass.',
      options: [
        {
          id: "starts",
          label: '"Your next event starts here."',
          means:
            "The plainest invitation, on the verb you picked for the empty states, with free to host and one scan for guests under it.",
        },
        {
          id: "every-photo",
          label: '"Get every photo from your next event."',
          means:
            "Names the payoff every section above it promised, the photos collected, as the reason to start. No reel in it.",
        },
        {
          id: "big-screen",
          label: '"Put your next event on the big screen."',
          means:
            "Ends on the reel's most vivid use, the screen at the party, with the demo reel as a second button: the one close on the site built on the reel.",
        },
        {
          id: "hosting",
          label: '"Hosting something soon?"',
          means:
            "A question in the reader's own words, low pressure, with the minute it takes and the one album it makes under it.",
        },
      ],
      recommended: "starts",
      because:
        "It is the last invitation and says only that, in words nobody has to decode, on the verb you picked because it invites the first move; a visitor who signs up meets the same verb on their first empty album.",
      overrule:
        "If the close should restate why rather than invite, the photos; if the page should end on the reel it just showed, the big screen.",
      lands:
        "The close's heading, line and buttons in cinema-close.tsx, which stops reading the shared thesis constant.",
      configs: [SCREEN],
    },
    {
      id: "card",
      label: "The reel's card",
      question:
        "Which line should tell a reader what the highlight reel is, on its card and as the /reel page's heading?",
      context:
        "The hub's lead door (its title kept), the same door in /features/sharing's related row, and the /reel hero, whose heading takes the line. Today all three say \"Every event ends with a reel.\" by a 0:08 chip; the live reel has neither.",
      options: [
        {
          id: "as-it-happens",
          label: '"Your event, playing as it happens."',
          means:
            "The one new fact, that it is live, said the way a guest would say it. The chip is the view's own resting bar, with no length on it.",
        },
        {
          id: "cut-together",
          label: '"Everyone\'s photos, cut together live."',
          means:
            "What it is made of and that nobody edits it: every guest's photos and videos, cut into one reel as they arrive.",
        },
        {
          id: "joins",
          label: '"Every new photo joins it in seconds."',
          means:
            "The concrete proof that it is alive, with the arrival beat the view draws when a guest adds one as its chip.",
        },
      ],
      recommended: "as-it-happens",
      because:
        "It is the shortest true answer to what the reel is, the only one a reader feels rather than parses, and it carries a heading's weight on /reel as well as a door's line on the hub.",
      overrule:
        "If the card should say what the reel is made of rather than how it feels, everyone's photos; if it should prove it, the arrival.",
      lands:
        "The reel door's line (one string at both sizes), its chip, and the /reel hero's heading.",
      configs: [SCREEN],
    },
    {
      id: "wall",
      label: "The reel beside the door",
      question:
        "How should the reel stand beside the demo door on the event pages?",
      context:
        "The event pages' proof: the demo door as shipped, its line cut to two, and the reel beside it as its equal, never a thumbnail. The same words and the demo album's live reel in every option; only how the reel stands changes.",
      options: [
        {
          id: "pair",
          label: "The door's twin card",
          means:
            "The reel takes the door's own card: its corner, ring, floor and height beside it, playing full bleed with the words on its floor. Your seven and five stay.",
        },
        {
          id: "screen",
          label: "The screen at the party",
          means:
            "The reel as the screen it plays on at the event, wearing the real screen's code plate (it scans to the demo); the columns even out so the wall stands tall.",
        },
        {
          id: "bleed",
          label: "Past the page's edge",
          means:
            "No box at all: the reel runs from the door to the window's edge, as tall as the door, the words on its floor; on a phone, edge to edge.",
        },
      ],
      recommended: "pair",
      because:
        "Equal reads fastest when the two share a shape: the same card at the same height is a designed pair, keeps the layout you liked, and gives the reel as much of the page as the album.",
      overrule:
        "If the reel should show where it plays rather than match the door, the screen; if the page should feel boldest, the bleed.",
      lands:
        "The reel side of event-door.tsx on every type page, and the door's shorter line.",
      configs: [SCREEN],
    },
    {
      id: "play",
      label: "Where the play mark leads",
      question: "Where should the home teaser's play mark lead?",
      context:
        "The home's reel section plays a short muted loop with a play mark (a stand-in video until the demo album's own clip exists). Each option is drawn pressed; press Close to see where it returns.",
      options: [
        {
          id: "overlay",
          label: "The demo's reel, over the page",
          means:
            "The view full screen over the home page, with one line of context, Start free and the demo album a press away. Close returns to the teaser.",
        },
        {
          id: "route",
          label: "Into the demo album, reel open",
          means:
            "A new page: the demo album with its reel open, and Close lands in the album. Today the demo's welcome comes first, so it would wait for the reel to close.",
        },
        {
          id: "modal",
          label: "A contained player",
          means:
            "A landscape player in a panel over the dimmed page, with a caption and Start free; small on a phone. Close returns to the teaser.",
        },
      ],
      recommended: "overlay",
      because:
        "It shows a visitor the real reel a host gets, full screen, without leaving the page they were deciding on, and turns watching into starting with one line and one button; the album stays a press away.",
      overrule:
        "If the demo album is a better argument than its reel, the route; if a full-screen takeover is too much for a homepage, the modal.",
      lands:
        "What the teaser's play mark opens, and whether the home mounts the reel's view over itself.",
      configs: [SCREEN],
    },
  ],
});
