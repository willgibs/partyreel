import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PERSON IS ON PARTYREEL, ROUND TWO: THE THREE HE LEFT OPEN
 * (2026-09-19).
 *
 * Round one answered whole (docs/reviews/profile-page.json; the fourth
 * batch, verbatim): whether a person has a page,
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
 * ★ THE GROUND IS THE IDENTITY MODEL (rechecked 2026-09-22). A guest is a
 * typed name (Unverified: the plain disc, the mark, no page), a confirmed
 * account without a handle (no page), or an account with a handle, whose page
 * shows only the events its owner turned on. The wedding is a names-mode
 * party, so its list is mostly typed names, drawn after the confirmed ones
 * exactly as the album lists them. `quick-look` is reshaped for that: most
 * names have no page, so it asks what a tap on ANY name opens, with a knob of
 * its own (`tapped`) for the three kinds. What a claimed page with nothing on
 * it says is `identity-profile.page`'s question, so Noor, who stood for that
 * page here, left the cast; `way-back` draws Maya's page and Priya's.
 *
 * ★ THE PRIVACY DOCTRINE STILL BINDS (profiles-social.md), unchanged by any
 * option here: no public counts, the follow graph stays owner-private, and a
 * "way back" is a link to an event the viewer already reached (their own
 * recent navigation), never a new grant to anyone who has not been there.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21). `view-all`'s bespoke "centred
 * modal" is renamed `centred` and re-argued against a real precedent (the
 * shipped welcome-to-Pro dialog, app-pricing r1) rather than "as drawn";
 * `inline` moves to the back of the array as the cheap fourth it always was.
 * `quick-look`'s bespoke "popover at 1440" is gone: `app-shape r1` ruled both
 * the responsive Sheet and a mini-modal into existence, so the option set is
 * now those two real objects (`sheet`, renamed `mini-modal`), and the
 * recommendation flips to the Sheet now that its real desk shape (a
 * right-edge panel, never full-width) already answers the objection that
 * used to favour a split. `way-back` keeps its three options; its context
 * folds in where the crumb trail actually lives (the host's own bar, not a
 * guest's), the guest's own second-round chrome, and the account menu's
 * standing-row precedent.
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

/** Whose page `way-back` draws: a host's, and a guest's who chose what shows.
 *  A claimed page with nothing on it is `identity-profile.page`'s to say. */
const WHO: Control = {
  id: "who",
  label: "Whose page",
  options: [
    { id: "maya", label: "Maya, who hosts" },
    { id: "priya", label: "Priya, who chose two events" },
  ],
  default: "priya",
};

/** `quick-look`'s own knob: one name of each kind the guest list holds. Nina
 *  first and by default, because at a names-mode party hers is the commonest. */
const TAPPED: Control = {
  id: "tapped",
  label: "Whose name is tapped",
  options: [
    { id: "nina", label: "Nina, a typed name (Unverified)" },
    { id: "jay", label: "Jay, confirmed, no handle" },
    { id: "priya", label: "Priya, a page with two events" },
  ],
  default: "nina",
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
    date: "2026-09-22",
    changed:
      "Rechecked against the identity round: the guest list redrawn as it ships (the confirmed first, then each Unverified name, marked, no link) and truly open in every view-all option; quick-look reshaped for names with no page; way-back's reasons restated for a verified-by-default party.",
  },
  context:
    "Maya hosts; Priya has a page and chose two events for it; Jay confirmed and never claimed a handle; Nina typed a name: a names-mode wedding, so most of its guest list is Unverified. Every option is the shipped guest list or the shipped profile with one thing changed, phone first with 1440 on the knob. view-all reads the list at 24 and at 240, a quarter of the thousand Will imagined. Nothing here reaches a Server Function or a row: the social controls stay forked to local state, as round one forked them.",
  bible: [1, 4, 12, 15, 21, 22],
  asks: [
    {
      id: "view-all",
      label: "View all",
      question: "How should the full guest list open from the faces row?",
      context:
        "The faces row is ruled; the list opens in place, 24 at a time: the confirmed, then each typed name, marked. The Sheet ships (app-shape r1); no centred float survives at a desk (guest-shape r2), but Pro's modal centres (app-pricing r1).",
      options: [
        {
          id: "sheet",
          label: "A sheet over the album",
          means:
            "The one responsive Sheet the app ships now (bottom in a hand, a right-edge panel at a desk): its own capped scroll, the row and album beneath never resizing.",
        },
        {
          id: "page",
          label: "Its own page, /e/<token>/guests",
          means:
            "A real destination: a heading, a count, ordinary document flow. The only option allowed to be long, because a page is meant to scroll.",
        },
        {
          id: "centred",
          label: "The centred list",
          means:
            "A capped, centred dialog like the one the app already celebrates Pro in: scrolling within itself, closer to a decision moment than a browse.",
        },
        {
          id: "inline",
          label: "Expand in place, in groups",
          means:
            "The row becomes the list, 24 at a time with Back and Next. The album keeps growing under it: the cheap fourth, free of a new surface.",
        },
      ],
      recommended: "sheet",
      because:
        "It is now the product's own dialog primitive (guest-shape r1, app-shape r1), not just this board's favourite: it keeps the album's own height untouched at 24 or 240 alike, with no pagination clicks, and it reads as how a phone already shows a list of people.",
      overrule:
        "A centred list is real again too (Pro's own modal centres at a laptop): a decision moment beats a browse there; inline is the free answer already shipped.",
      lands:
        "Whether View all opens a new surface at all, and whether the guest list ever gets a page of its own.",
      tile: "phone",
      configs: [SCREEN, COUNT],
    },
    {
      id: "quick-look",
      label: "Quick-look",
      question:
        "What should tapping a name in the guest list open first, when most names have no page behind them?",
      context:
        "Most names at a names-mode party are Unverified, and a confirmed account without a handle has no page either; a page shows only what its owner chose. Today a name without a page opens nothing. An empty page is identity-profile.page's.",
      options: [
        {
          id: "sheet",
          label: "A look in the one Sheet, for every name",
          means:
            "Any name opens the face, the mark where it is Unverified and what they added to this album; a page adds its events and Open full profile.",
        },
        {
          id: "mini-modal",
          label: "The same look, in the mini-modal",
          means:
            "The same look in the small centred dialog the app already opens the QR in: capped, anchored to nothing, closer to a peek than a page.",
        },
        {
          id: "none",
          label: "Straight to the page, as shipped",
          means:
            "A name with a page links straight to it (ten taps, ten page loads); every other name opens nothing, which at a names-mode party is most of the list.",
        },
      ],
      recommended: "sheet",
      because:
        "A look that opens only for a page leaves most of the list inert; the photographs a guest added here are the one thing every name has, already public on the album, and the Sheet shows them without leaving the list (a right-edge panel at a desk).",
      overrule:
        "If a look should stay a peek at a page, the mini-modal is its closer cousin; if names with no page should stay quiet, as shipped costs nothing.",
      lands:
        "Whether a name on the guest list always opens something, and whether a look is one component or two.",
      tile: "phone",
      configs: [SCREEN, TAPPED],
    },
    {
      id: "way-back",
      label: "Way back",
      question: "How should a profile keep the scanned event reachable?",
      context:
        "Click ten names down a list and the album is ten navigations behind. A crumb trail rides the host's bar (app-shape r1); the guest's chrome had a second round (guest-shape r2); the menu carries a standing row too (app-pricing r1).",
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
            "The signed-in menu names the event. A signed-out visitor, who has no account menu at all, gets nothing extra here.",
        },
        {
          id: "none",
          label: "Nothing: the browser's own back",
          means: "No new surface. A shared link or a second tab has no back at all.",
        },
      ],
      recommended: "pill",
      because:
        "It is the only option that works whether or not the visitor is signed in: at a verified party every guest is, at a names-mode one most are not. It costs one line, and naming the host's event under the header is bible 7's own ask, not a new one.",
      overrule:
        "If the chrome should stay quiet, the account menu reaches every guest at a verified party; at a names-mode party most keep only the browser's back.",
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
