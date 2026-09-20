import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PERSON IS ON PARTYREEL, ROUND TWO: THE THREE HE LEFT OPEN
 * (2026-09-19).
 *
 * Round one answered whole (docs/reviews/profile-page.json; verbatim in
 * docs/design/rulings.md, the fourth batch): whether a person has a page,
 * what stands above it, what fills it, what its top says, block, who is
 * named, the claim, and the closed shape of a big guest list (`list=faces`).
 * `profile-wiring` lands all eight on the real profile and guest list at this
 * same cut. Three of his own notes on that batch stayed questions rather than
 * answers, and this round is those three, drawn on the SAME board:
 *
 *  - `list=faces`, verbatim: "let's add an option to expand that into the
 *    full list. For bigger lists, we should continue to have pagination to
 *    expand into groups. I can imagine an edge case with a thousand guests,
 *    and you click 'View All', and all of a sudden you have a page 100
 *    screens tall all at once. Could use an exploration on how to view all
 *    from this condensed view (modal, sheet, page, going down existing spot
 *    on page, etc)." → `view-all`.
 *  - `exists=page`, verbatim: "the 'cards/sheets that open' can be used as a
 *    'quick-look' mini version of looking at profiles, with the full page at
 *    its own address as the complete version a second click away. That way
 *    if I'm looking at a guest list and click 10 different guests, I can see
 *    a little more about each." → `quick-look`.
 *  - `head=guest`, verbatim: "Seems like it'd be very easy to get far away
 *    from the original event you scanned if you start clicking guests,
 *    risking not getting back in certain cases... maybe not the best overall
 *    solution for our nav in general here." → `way-back`.
 *
 * ★ ROUND ONE'S EIGHT ASKS ARE GONE FROM `asks` ON PURPOSE (the `privacy-hero`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for ever; the board only ever carries what is
 * still open. `profile.tsx` (Head, Identity, Body, Acts, Foot, ProfilePage)
 * stays untouched and now renders every preview WEARING his eight picks (the
 * guest header, the line bio, event covers, the Report menu) as the ground,
 * because that is what these three questions sit on top of, not what they
 * are about. `album.tsx` keeps its bases (`AlbumHead`, `Album`, `Section`,
 * `FacesRow`, `NamesSheet`) and drops the three retired showcases; `reach.tsx`
 * is new, one function per question.
 *
 * ★ A 240-NAME FIXTURE, BECAUSE THE QUESTION IS COST AT SCALE. `view-all`'s
 * `count` control switches the wedding between round one's 24 (`GUESTS`) and
 * `GUESTS_BIG`, a quarter of the thousand Will imagined: every option is read
 * at both, not asserted at one and described at the other.
 *
 * ★ THE PRIVACY DOCTRINE STILL BINDS (profiles-social.md), unchanged by any
 * option here: no public counts, the follow graph stays owner-private, and a
 * "way back" is a link to an event the viewer already reached (their own
 * recent navigation), never a new grant to anyone who has not been there.
 */

/**
 * THE SCREEN, the knob every decision shares. Declared HERE as pure data
 * rather than imported from the board's scene: a spec is what a SERVER page
 * reads, and a control lifted out of a client module drags that module's
 * tree along with it.
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

/** Whose page: `quick-look` and `way-back` both draw a profile, and the cast
 *  is round one's (a host, a guest who only attends, somebody with nothing
 *  yet). `view-all` does not use this: it has no profile in it at all. */
const WHO: Control = {
  id: "who",
  label: "Whose page",
  options: [
    { id: "maya", label: "Maya, who hosts" },
    { id: "priya", label: "Priya, who only attends" },
    { id: "noor", label: "Noor, with nothing yet" },
  ],
  default: "priya",
};

/** `view-all`'s own knob: the wedding at round one's ordinary size, and at
 *  Will's imagined edge case, a quarter scale. */
const COUNT: Control = {
  id: "count",
  label: "Party size",
  options: [
    { id: "small", label: "24, an ordinary wedding" },
    { id: "big", label: "240, Will's edge case" },
  ],
  default: "big",
};

/** `way-back`'s own knob: whether this visit began on the album a chip was
 *  tapped from, or landed on the profile some other way (a shared link, a
 *  search result, a second tab). Only `pill` and `menu` read it. */
const ARRIVED: Control = {
  id: "arrived",
  label: "Arrived from",
  options: [
    { id: "album", label: "Tapped a name on the wedding" },
    { id: "direct", label: "Opened the link directly" },
  ],
  default: "album",
};

const DRAFT = defineExploration({
  id: "profile-page",
  title: "What a person is here",
  round: {
    n: 2,
    date: "2026-09-19",
    changed:
      "Round one's eight decisions are ruled and `profile-wiring` wires them; this round drops them and asks the three he left open: how the full list opens from the faces row, what a name opens first, and how a profile keeps the scanned event reachable.",
  },
  context:
    "Maya hosts, Priya only attends, Noor has nothing yet: round one's cast. Every option is the shipped guest list or the shipped profile with one thing changed, phone first with 1440 on the knob. `view-all` adds a 240-name fixture, a quarter of the thousand Will imagined, so a group's cost is measured rather than described. Nothing here reaches a Server Function or a row: the social controls stay forked to local state, as round one forked them.",
  bible: [1, 4, 12, 15, 21, 22],
  asks: [
    {
      id: "view-all",
      label: "View all",
      question: "How should the full guest list open from the faces row?",
      context:
        "Round one's faces row is ruled; `profile-wiring` ships a tap as an in-place expansion for now. Every option here is that same tap, at 24 names (an ordinary wedding) and 240 (Will's own edge case, a quarter of his imagined thousand).",
      options: [
        {
          id: "inline",
          label: "Expand in place, in groups",
          means:
            "The row becomes the list, 24 names at a time with Back and Next. The album keeps growing under it. The interim profile-wiring ships.",
        },
        {
          id: "sheet",
          label: "A sheet over the album",
          means:
            "The list rises from the foot and scrolls in its own capped region. The album and the row underneath never resize, at 24 or 240.",
        },
        {
          id: "modal",
          label: "The centred modal, as drawn",
          means:
            "The same dialog list=faces already opens, unchanged: centred, capped, scrolling within itself.",
        },
        {
          id: "page",
          label: "Its own page, /e/<token>/guests",
          means:
            "A real destination: a heading, a count, ordinary document flow. The only option allowed to be long, because a page is meant to scroll.",
        },
      ],
      recommended: "sheet",
      because:
        "It is the only option that keeps the album's own height untouched at any scale, 24 or 240 alike, with no pagination clicks, and it reads as how a phone already shows a list of people rather than a document.",
      overrule:
        "If a new surface is more than one row deserves, the in-place groups profile-wiring already ships are the free answer, just paginated.",
      lands:
        "Whether View all opens a new surface at all, and whether the guest list ever gets a page of its own.",
      tile: "phone",
      configs: [SCREEN, COUNT],
    },
    {
      id: "quick-look",
      label: "Quick-look",
      question: "What should a name in the guest list open first?",
      context:
        "Round one ruled that a click opens a small look first: a mini so ten taps down a list cost nothing, the full profile a click away. What that mini is, and whether it changes shape at a desk, is this round's question.",
      options: [
        {
          id: "sheet",
          label: "A bottom sheet, on both screens",
          means:
            "The face, the name, the line and the parties as small covers, plus Open full profile. The same sheet at 375 and 1440.",
        },
        {
          id: "adaptive",
          label: "A popover at 1440, the sheet at 375",
          means:
            "The same card, anchored beside the name at a desk; the full-width sheet only at a phone.",
        },
        {
          id: "none",
          label: "Straight to the page, no mini",
          means:
            "The name is a plain link to /u/<slug>. Ten taps down a list is ten full page loads, and ten trips back.",
        },
      ],
      recommended: "adaptive",
      because:
        "A phone wants the sheet's thumb reach, but a full-width sheet at a desk hides the whole list behind one small card; a popover keeps the rest of the names in view, closer to a look than a modal is.",
      overrule:
        "If one component beats a split by screen, the sheet everywhere is the simpler build and still answers what he asked for.",
      lands: "Whether quick-look is one component or two, and whether a tap ever skips it.",
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "way-back",
      label: "Way back",
      question: "How should a profile keep the scanned event reachable?",
      context:
        "Click ten names down a guest list and the album is ten navigations behind. Will's words: it would be easy to get far away from the original event and risk not getting back. Drawn on Priya's profile, arrived from Maya's wedding.",
      options: [
        {
          id: "pill",
          label: "A 'Back to <event>' pill under the header",
          means:
            "One link under the header, shown only when the visit began on that album. Works whether the visitor is signed in or not.",
        },
        {
          id: "menu",
          label: "One more row in the account menu",
          means:
            "The signed-in menu names the event. A signed-out visitor, who has no menu at all, gets nothing extra.",
        },
        {
          id: "none",
          label: "Nothing: the browser's own back",
          means: "No new surface. A shared link or a second tab has no back at all.",
        },
      ],
      recommended: "pill",
      because:
        "It is the only option that works for a signed-out guest too, which most people at a party are; it costs one line, and naming the host's event under the header is bible 4's own ask, not a new one.",
      overrule:
        "If the chrome should stay this quiet, the account menu keeps it to one row for whoever is signed in, and the rest keep the browser's back.",
      lands:
        "Whether a profile carries any memory of where a visit began, and whether a signed-out guest gets a way back at all.",
      tile: "phone",
      configs: [SCREEN, WHO, ARRIVED],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * flattens every decision's `configs` into the board's controls, so a screen
 * knob two decisions share arrives twice: the dock would draw it twice and
 * React would warn on the duplicate key (`guest-upload` found it first).
 * Each decision keeps it on its own strip; the board declares it once.
 */
export const PROFILE_PAGE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
