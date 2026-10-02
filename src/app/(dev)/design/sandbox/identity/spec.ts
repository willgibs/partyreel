import { defineExploration } from "@/components/lab/exploration";

import { SCREEN, SHOW } from "./knobs";

/**
 * PARTYREEL'S OWN ATOMS (the identity track, cut 2026-10-02).
 *
 * Will's library prompt: the component library "still substantially
 * resembles the original shadcn foundation", so however bespoke a page's
 * layout, the product "present[s] as a Shadcn library at the atomic level".
 * The goal is a sum, not a set of restyled parts. So round one asks for a
 * FAMILY: one identity across every atom (actions, fields and selection,
 * surfaces and layers, status) and the material, type, light and motion they
 * stand on, drawn as four contenders as far apart as the real answers are.
 *
 * ★ EACH FAMILY IS ONE STYLESHEET OVER PRODUCTION (`families/`): its token set
 * (grounds, text steps, corners, shadows), then every atom by the hooks its
 * primitive already writes (`data-slot`, `data-variant`, `data-size`,
 * `data-state`), then the few parts of the three screens that are not atoms
 * yet. The frames load the board's own scene route (`scene/page.tsx`) and
 * mount production's components wearing the sheet, so the comparison is
 * honest and the pick wires at its source (`globals.css` and
 * `src/components/ui/`), moving every screen at once.
 *
 * ★ WHY A ROUTE AND NOT A PORTAL: production's popups ask the WINDOW which
 * shape to be (`useMediaQuery`), and a portalled scene's window is the lab's,
 * so a 375 frame drew Settings as a desk's panel and the Add as a desk's menu.
 * A document of its own answers for the frame.
 *
 * Nothing here asks what another board asks: the hub's head is
 * `event-header`'s (this board only dresses it), the dashboard is
 * `host-dashboard`'s. `event-header`'s five new atoms (photo-filled type, the
 * shutter, the white primary and glass rounds on a photograph, the code chip,
 * the number door) are drawn in every specimen, in each family's terms.
 */
export const IDENTITY = defineExploration({
  id: "identity",
  title: "Partyreel's own atoms",
  surface: "shared",
  desk: 10,
  lives: [
    "docs/systems/design-system.md",
    "src/components/ui/",
    "src/app/globals.css",
    "src/app/theme.css",
    "src/lib/glass.ts",
    "src/app/(dev)/design/(shell)/library/components/",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "Four atomic families drawn whole over production, each judged on a specimen of every atom in its states and on three real screens, at 1440 and 375.",
  },
  opening: {
    about:
      "Partyreel's atoms (buttons, fields, chips, cards, layers and marks) as one identity of our own: four families, each a whole, as far apart as the answers.",
    settled: [
      "Two faces stay (Inter to read, Urbanist to be loud), and one token set serves the app and the site: each family is one set.",
      "State keeps its colour in every family: like rose, save blue, approve green, waiting amber, delete red.",
      "Pages are their boards': the hub's head is event-header's, the dashboard host-dashboard's. This board asks only the atoms.",
      "Production is untouched: each family is one stylesheet the frames wear, which is what wiring the pick at the source does.",
    ],
    earlier: [
      "Your library note, 2026-10-02: we still present as a shadcn library at the atomic level; feel distinct as a sum, not part by part.",
      "This round's direction: bespoke and experiential, sleek and modern, sophisticated, never tilted or playful, minimal yet high-information.",
    ],
  },
  terms: [
    {
      term: "family",
      means:
        "One identity across every atom: its material, type, light and motion, drawn as a whole.",
    },
    {
      term: "specimen",
      means: "One sheet holding every atom of a family, in its states.",
    },
    {
      term: "atom",
      means:
        "A primitive every screen is built from: a button, a field, a chip, a card, a menu, a toast, a mark.",
    },
    {
      term: "pearl",
      means:
        "Crystal's primary: a solid, lit pane, light in the room and ink on paper.",
    },
    {
      term: "lock",
      means:
        "Viewfinder's focus: four corner marks that close in on whatever has focus or is chosen.",
    },
  ],
  carried: [
    {
      id: "parts",
      question: "Do the screens' own parts wear the family too?",
      taken:
        "Yes: the room cards, the checklist and the door's choices are drawn as each family's card, chip and segment, as wiring would make them.",
      overrule:
        "Only the atoms change; a screen's own parts keep today's look until their own board.",
    },
    {
      id: "photos",
      question: "Do photographs change with the family?",
      taken:
        "Yes: a photograph's corner and the album's gap follow each family's tile (square, 8px, 6px, 2px), as the gap is pinned to it.",
      overrule: "Every family keeps today's 4px photograph.",
    },
  ],
  asks: [
    {
      id: "family",
      label: "The atoms' family",
      question:
        "Which family should every Partyreel control, surface and mark belong to?",
      where: ["Shared", "Every control", "At rest, pressed, open"],
      when: "Anywhere a host or a guest presses, types, reads a mark or opens a layer, on the app and the site alike.",
      matters:
        "Atoms left at a generator's defaults read as shadcn however bespoke the page above them, so the identity is their sum.",
      lands:
        "Partyreel's token set and every atom in src/components/ui, wired at the source so every screen moves at once.",
      context:
        "Each family is one stylesheet over production: a specimen of every atom in its states, then the hub's head tonight, Settings on the door and a guest's Add, all production's own components. The theme toggle draws paper or the room.",
      options: [
        {
          id: "today",
          label: "As today",
          means:
            "Production's atoms: Inter 500 at 14px, 8px cards in a hairline ring, rounded actions, the shadcn foundation lightly tuned.",
          gains: "Nothing to change: every screen already wears it.",
          costs:
            "Reads as the shadcn library at the atomic level, which is what this board exists to fix.",
        },
        {
          id: "editorial",
          label: "Editorial: type and hairlines",
          means:
            "The printed page: an action is an ink slab or an ink line in small capitals, a field a line to write on, a card opens under a rule.",
          gains:
            "The calmest and most sophisticated: type does the work, and only the photographs have depth.",
          costs:
            "Square corners and capitals read cool beside a party; thin lines are harder targets in a hand.",
        },
        {
          id: "soft",
          label: "Soft: tonal, round, pressable",
          means:
            "Objects a thumb presses: pills and 16px surfaces, no line anywhere, depth by tone and a soft light from above, Urbanist on controls.",
          gains:
            "The warmest and easiest in a hand: 40px controls, and nothing reads as a border.",
          costs:
            "Bends the elevation rule (a card takes a shadow); nearest a phone's own system look.",
        },
        {
          id: "crystal",
          label: "Crystal: the glass, on everything",
          means:
            "Partyreel's own glass becomes every control and layer: panes that let the page and its photographs through, lit on the edge, with a pearl primary.",
          gains:
            "Experiential: a layer takes the colour of the photograph under it, so the media colours the chrome.",
          costs:
            "Bends 'no surface is translucent'; every pane is a blur a phone pays for; nearest Apple's look.",
        },
        {
          id: "viewfinder",
          label: "Viewfinder: a camera's instruments",
          means:
            "The camera everyone is holding: a matte body, keys and round dials, readouts in spaced capitals, and focus as four corner marks that lock in.",
          gains:
            "The most Partyreel: the party's own act, shooting, is the language of every control.",
          costs:
            "Strongest where people shoot, a costume on billing; a red signal light joins the palette.",
        },
      ],
      recommended: "crystal",
      today: "today",
      because:
        "It makes the material only Partyreel wears the whole product's, and lets every photograph colour the chrome laid over it.",
      overrule:
        "If glass on every surface is too much, Viewfinder is the boldest identity and Editorial the calmest.",
      configs: [SHOW, SCREEN],
    },
  ],
});
