import { defineExploration } from "@/components/lab/exploration";

/**
 * THE LIVE DEMO'S DOORS, ROUND TWO: A BETTER OBJECT THAN THE ONE THE FOOTER
 * ALREADY HAD (2026-09-20).
 *
 * Round one answered whole (docs/reviews/demo-event.json; verbatim in
 * docs/design/rulings.md, the sixth batch) and `demo-wiring` landed all seven
 * on the real site: the demo's own arrival (`role`), the Demo mark that pins
 * the header (`tag`), the turn card after an upload (`turn`), "Start your
 * own" in the action row plus a closing card (`slot`), the footer's photo
 * pile as the rule everywhere a door stands (`pile`), the phone pair on one
 * channel (`pair`), and one party (`one`). His note on `doors=pile`, verbatim:
 * "I'd be curious to see better designs of this. Looks like we're just
 * reusing what's in the footer. However, labeling the QR (option 2) doesn't
 * look very polished in the otherwise text-free visuals." So this round drops
 * the other six and asks the one he flagged: not whether the pile is the
 * rule (it is), but whether the OBJECT itself, wherever it stands, is the
 * best a text-free page can show.
 *
 * ★ A FOURTH PLACE JOINED SINCE ROUND ONE. `demo-wiring`'s Handoff: the
 * Features mega-panel's featured pane is empty now that `DemoTicket` retired
 * (the panel's own no-card fallback), so every option here also says what, if
 * anything, stands in that pane.
 *
 * ★ TODAY IS UNEVEN, WHICH IS THE FINDING THIS ROUND SURFACES. Reading the
 * actual wiring rather than assuming it: `demo-wiring`'s own diff touched only
 * `mega-panel.tsx` and `demo-ticket.tsx`. The footer's fan pile (`FooterDemo`)
 * predates this round entirely; the home hero's plate (`cinema-hero.tsx`'s
 * `DemoQr`) is bare on its own real photograph corridor; a feature page's line
 * (`DemoCtaLink`) is words and a chevron, no image at all. "The footer's pile
 * becomes the rule" was a ruling, not yet a build outside the footer and the
 * retirement, which is exactly why every place needs one real answer now.
 *
 * ★ WHY NONE OF THE FOUR ADDS WORDS. Round one already tried naming the party
 * (`named`) against showing it (`pile`), and showing it won; his complaint
 * about the retired ticket was a caption glued beside a code, not the idea of
 * a QR object. So every option here is read as strictly visual: the object
 * carries nothing beyond its own link name, and the page's own surrounding
 * copy (the footer's "Explore a demo event.", the line's "Try the live demo,
 * no signup.") is untouched furniture around it, not part of what is judged.
 * A call taken, his to overrule (doors.tsx carries the same note): "text-free
 * but the demo's name" could instead mean the party's own name prints ON the
 * object, which the Handoff lists as a question.
 */

const DRAFT = defineExploration({
  id: "demo-event",
  title: "The live demo",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one's seven decisions are ruled and wired whole by demo-wiring; this round drops them and asks the one he flagged: a better door object than reusing the footer's pile, text-free, now drawn at a fourth place too, the nav panel's empty pane.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-19",
      changed:
        "The first round: what the demo's first seconds are, how it keeps admitting it is a demo, what the one simulated upload is for, where the way out sits, what a door promises before it is opened, what a scan off a laptop does, and how many parties the demo is. Laptop first, on the shipped components.",
    },
  ],
  context:
    "Four places point at the same album: the home hero, the footer, a feature page's line, and the nav panel's pane. Only the footer already carries an object; the hero's plate is bare, the line is words alone, and the pane is empty since its ticket retired. Every option below is one object, redrawn, carrying no words of its own, at all four places, at 375 and 1440.",
  bible: [1, 8, 10, 18],
  asks: [
    {
      id: "door",
      label: "The door",
      question:
        "What should the one object behind every demo door look like, now that it also has to fill an empty nav pane?",
      context:
        "Only the footer already commits to an object today (the fan pile); the hero's plate is bare on its corridor, a feature page's line is words alone, and the nav pane is empty. Drawn text-free at every place, at 375 and 1440.",
      options: [
        {
          id: "pile",
          label: "The footer's pile, everywhere",
          means:
            "As wired at the footer: photographs fanned under a plate. Proposed everywhere else; free where it stands, new at the pane.",
        },
        {
          id: "frame",
          label: "One photograph, framed",
          means:
            "A single photograph in a plain mat, the code tucked into its corner. The fixtures it needs are already on the site.",
        },
        {
          id: "stage",
          label: "The album's own fall, settled",
          means:
            "The falling engine's own rest frame, the code centred over it. The real engine is a running loop; a still cannot show that cost.",
        },
        {
          id: "ticket",
          label: "A redrawn ticket stub",
          means:
            "A die-cut stub: a photograph beside a perforated pane holding the code, notched, no label this time.",
        },
      ],
      recommended: "frame",
      because:
        "One photograph in a frame reads as intentional rather than reused, costs only a fixture the site already holds, and stays legible down to the nav pane's small slot; the pile already proved the idea but repeats what he asked to see bettered.",
      overrule:
        "If the party itself is the sell, the pile still shows the most of it at once and already stands at the footer, needing only the other three places.",
      lands:
        "Every demo affordance on the marketing site, and what, if anything, fills the nav panel's empty featured pane.",
      configs: [
        {
          id: "place",
          label: "Which place",
          options: [
            { id: "hero", label: "The home hero" },
            { id: "footer", label: "The footer" },
            { id: "line", label: "A feature page's line" },
            { id: "nav", label: "The nav panel's empty pane" },
          ],
          default: "hero",
        },
        {
          id: "screen",
          label: "Screen",
          options: [
            { id: "1440", label: "1440, a laptop" },
            { id: "375", label: "375, a phone" },
          ],
          default: "1440",
        },
      ],
    },
  ],
});

export const DEMO_EVENT: typeof DRAFT = DRAFT;
