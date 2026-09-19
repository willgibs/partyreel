import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PERSON IS ON PARTYREEL, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19, "the overnight round"): the guest
 * pages are unprotected, "at worst, net neutral and fully deleted". So this is
 * asked from the foundation and PHONE FIRST: 375 is the default screen because
 * the only thing that links to a profile is a chip on an album somebody is
 * looking at while standing at a party, and 1440 is a knob on every page
 * decision because a host puts their handle in a bio.
 *
 * ★ THE BOARD IS TWO INDEPENDENT PIECES, NOT ONE LADDER. `exists` asks whether
 * a person has a page at all, and the head, the body, the top block and the
 * block affordance are all staged behind it, drawn in whichever container he
 * picks. `named` asks who an album publishes, and the claim moment and the
 * list's shape are staged behind that. The two roots can be taken in either
 * order, and neither answer constrains the other.
 *
 * ★ WHAT THIS ROUND DELIBERATELY DOES NOT MOVE. The privacy doctrine is ruled
 * and no option here crosses it without saying so: a profile is public by
 * existence, the follow graph is owner-private and never counted in public, the
 * attended arm is gated on the host's key, the guest's own hide and the album
 * being OPEN, and attendance is not a capability grant (no option adds a link
 * to a party you merely went to). The two places an option would LOOSEN the
 * scope say which gate they would need, and both are in the manifest's
 * Questions rather than assumed.
 *
 * ★ AND ONE DECISION RELITIGATES A RULING OF HIS OWN, and says so: the guest
 * list has one key, the host's, because a per-guest opt-in "lands guest lists
 * near-empty". `named` is asked because the marketing page promises the
 * opposite of what that ruling produces, and the recommendation KEEPS the
 * ruling and moves the sentence.
 */

/**
 * THE SCREEN, the knob every decision shares. Declared HERE as pure data rather
 * than imported from the board's scene: a spec is what a SERVER page reads, and
 * a control lifted out of a client module drags that module's tree along with
 * it.
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

/** Whose page. A host, a guest who has never hosted, and somebody who joined
 *  and has not been anywhere: the three pages the product really serves. */
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

/** Who is looking. The block affordance is the only decision that changes with
 *  it, and the blocked pair is the state where the page must NOT change shape. */
const VIEWER: Control = {
  id: "viewer",
  label: "Seen by",
  options: [
    { id: "stranger", label: "A signed-in stranger" },
    { id: "self", label: "Themselves" },
    { id: "blocked", label: "Someone they blocked" },
  ],
  default: "stranger",
};

const DRAFT = defineExploration({
  id: "profile-page",
  title: "What a person is here",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: whether a person has a page at all, what stands above it, what fills it, what its top says about them, who an album names, when a handle is offered, how a big guest list draws, and how blocking is reached.",
  },
  context:
    "Maya hosts. Priya has only ever gone to parties, which is most people. Every option is the shipped profile or the shipped guest list with one thing changed, over one cast at one wedding, phone first with 1440 on the knob. Nothing here follows, blocks or saves: both social controls open with a Server Function against Supabase, so they are forked to local state and a press moves the picture and never a row.",
  bible: [1, 4, 12, 21, 22],
  asks: [
    {
      id: "exists",
      label: "The page",
      question: "Should a person have a page of their own on Partyreel?",
      context:
        "A claimed handle is an address today: partyreel.com/u/maya, open to anyone, indexable, carrying the albums they hosted and the parties they went to. Nothing in the product links to it except a chip on an album's guest list.",
      options: [
        {
          id: "page",
          label: "A page at its own address, as today",
          means:
            "One URL to put in a bio, share and be found at. The only Partyreel page about a person rather than a party.",
        },
        {
          id: "card",
          label: "A card that opens where the name is",
          means:
            "No address: a chip on the guest list raises the person over the album. Nothing to share, nothing to index, and a handle stops being a link.",
        },
        {
          id: "none",
          label: "No person page at all",
          means:
            "Chips stop linking, the handle leaves the account, and the follow graph loses its only home. Albums are all Partyreel publishes.",
        },
      ],
      recommended: "page",
      because:
        "The page is how one album becomes the next: a guest reads a name, opens it, and finds a host they can ask. A card cannot be shared, indexed or put in a bio, which is the whole reason anyone claims a handle.",
      overrule:
        "If Partyreel is albums and nothing else, none is the honest answer, and it deletes a social layer nothing currently feeds.",
      lands:
        "Whether /u/<slug> stays a route, and whether the handle, the follow graph and the block menu have anywhere to live.",
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "head",
      label: "The head",
      question: "What should stand above a person's page?",
      context:
        "A logo on the left and one button on the right, which says Dashboard when you are signed in and Start for free when you are not. The album next door runs a fuller header with an account menu, so two headers do one job.",
      options: [
        {
          id: "today",
          label: "The logo and one button, as today",
          means:
            "The shortest header in the product. A signed-in visitor loses their account menu the moment they tap a name.",
        },
        {
          id: "guest",
          label: "The album's own header",
          means:
            "One header for every guest-side page: the logo, and the account menu when signed in. The two stop drifting.",
        },
        {
          id: "bare",
          label: "Nothing above them",
          means:
            "The page opens on the face. The only Partyreel in it is the line at the foot, which is already there.",
        },
      ],
      recommended: "guest",
      because:
        "Two headers doing one job is how one goes stale, and someone signed in should not lose their way back into the app by tapping a name.",
      overrule:
        "If the profile is the person's page and not Partyreel's, nothing above them is braver, and the foot still carries the loop.",
      lands:
        "Which header the guest side runs, and whether a profile is a Partyreel page or a person's.",
      after: { ask: "exists" },
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "made-of",
      label: "What fills it",
      question: "What should a person's page be made of?",
      context:
        "The albums a host published, as cards, then the parties they attended as grey names with no links and no pictures. Priya has never hosted anything, which is most people: her page is two names and two dates.",
      options: [
        {
          id: "events",
          label: "Hosted albums, then a list of names",
          means:
            "As today. Pictures for what they ran, text for everywhere else they turned up, and nothing on the page is theirs.",
        },
        {
          id: "covers",
          label: "Every party as a card",
          means:
            "The parties they attended become cards too, one cover each, still with no link. The page is pictures all the way down.",
        },
        {
          id: "wall",
          label: "Their photographs",
          means:
            "The frames this person added, in place of the list of names. A new publication: one person's pictures, gathered from open albums.",
        },
      ],
      recommended: "covers",
      because:
        "The problem is that the page has no pictures, not that it has none of theirs. A cover per party fixes it inside the scope already ruled; a wall of someone's own frames is a new publication and Will's call.",
      overrule:
        "If a profile is for the work, the wall is the answer, and it wants the three gates the attended list already passes.",
      lands:
        "What fills a profile, and whether Partyreel ever gathers one person's photographs in one place.",
      after: { ask: "exists" },
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "identity",
      label: "The top",
      question: "What should the top of a person's page say about them?",
      context:
        "An 80px avatar or one letter, the name, the handle, and Joined June 2026. No counts, by design. Nothing a person writes. At 375 the shipped row squeezes all of it into 90px, so every option below wraps the controls under it.",
      options: [
        {
          id: "today",
          label: "The face, the name, the month they joined",
          means:
            "The only fact the page carries about a person is the least interesting one available.",
        },
        {
          id: "counts",
          label: "With what they have here",
          means:
            "Two numbers beside the handle: albums hosted, parties attended. Never followers, which stays owner-private.",
        },
        {
          id: "line",
          label: "With one line of their own",
          means:
            "A short line written in the account, capped so a page cannot become a homepage. A line is also a line to abuse.",
        },
      ],
      recommended: "line",
      because:
        "Joined June 2026 is a record, not a person. One line is the cheapest thing that makes a page feel like somebody, and it costs one input and one column.",
      overrule:
        "If a public page should carry nothing a person can type, the counts say something true with nothing to moderate.",
      lands:
        "What the identity block holds, and whether the account gains a field and the operator an inbox.",
      after: { ask: "exists" },
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "block",
      label: "Block",
      question: "How should a person block another person?",
      context:
        "A second button beside Follow opens a menu with exactly one row in it, and that row opens a dialog explaining the whole thing. Nothing anywhere in the product lets a person report a person. The menus are drawn open.",
      options: [
        {
          id: "overflow",
          label: "A menu with one row, as today",
          means:
            "A whole affordance for one act, beside Follow on every signed-in stranger's view of every person.",
        },
        {
          id: "inline",
          label: "A quiet word under Follow",
          means:
            "No menu: small text with the same confirm behind it. One less control on the page.",
        },
        {
          id: "report",
          label: "Inside a Report menu, drawn as a future",
          means:
            "One menu for both: report this person, or block them. Reporting a person does not exist yet; the inbox for reported media does.",
        },
      ],
      recommended: "report",
      because:
        "Someone who wants to block usually wants to tell somebody, and there is an operator inbox for reported photographs and none for reported people. One menu covers both and the confirm is unchanged.",
      overrule:
        "If reporting a person is a year away, the quiet word is the smaller page and the menu can come back with the inbox.",
      lands:
        "How blocking is reached, and whether a person can be reported at all.",
      after: { ask: "exists" },
      tile: "phone",
      configs: [SCREEN, VIEWER],
    },
    {
      id: "named",
      label: "The named",
      question: "Who should be named on an album's guest list?",
      context:
        "When a host turns the list on, every signed-in person who added a photograph is named and pictured on the album, handle or no handle. The features page promises the opposite, and both surfaces are on the frame.",
      options: [
        {
          id: "everyone",
          label: "Everyone signed in, and fix the sentence",
          means:
            "The list stays full and the marketing line stops promising invisibility: your name appears on albums you add to, and a handle buys a page.",
        },
        {
          id: "handles",
          label: "Only people with a handle",
          means:
            "Claiming becomes the consent act and the sentence is true as written. This wedding's list of 24 becomes a list of 5.",
        },
        {
          id: "optout",
          label: "Everyone, with one switch that removes you",
          means:
            "Named by default, plus one line in the account that takes a person off every album's list, so the promise can be kept by whoever wants it.",
        },
      ],
      recommended: "everyone",
      because:
        "The ruled reason for one key holds: every photograph already carries its uploader's name on the same screen, and an opt-in list lands empty. What is wrong is a sentence on a marketing page, so fix it there.",
      overrule:
        "If the promise is the product, handles is clean, and the handle has to stop being a paid feature the same day.",
      lands:
        "Who an album names, and which of the two, the list or the marketing line, moves to match the other.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "claim",
      label: "The claim",
      question: "When should a person be offered a handle?",
      context:
        "In one place: a card at the foot of the account page, Pro only, found by whoever goes looking. A guest who just added twelve photographs to a wedding is never told a handle exists, which is why 19 of 24 chips are not links.",
      options: [
        {
          id: "account",
          label: "At the account page, as today",
          means:
            "Pro only, and silent everywhere else. The guest list fills with names that go nowhere.",
        },
        {
          id: "after",
          label: "Right after their photographs land",
          means:
            "One line on the album when an upload finishes: their name is on this album now, and a handle makes it a page.",
        },
        {
          id: "inline",
          label: "On their own chip in the list",
          means:
            "The guest list carries the offer, on the one chip that is theirs, and nobody else can see the mark.",
        },
      ],
      recommended: "after",
      because:
        "The only moment anyone cares about their name on Partyreel is the moment it appears on an album, and that moment is silent today. It costs one line on one surface.",
      overrule:
        "If nothing may stand between a guest and the album, the chip carries it quietly and asks for no attention at all.",
      lands:
        "Where a handle is offered, and whether it stays behind Pro: both new options draw it free to claim.",
      after: { ask: "named" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "list",
      label: "The list",
      question: "How should an album's guest list draw when a party is big?",
      context:
        "One component serves the host's event page and the guest's album on purpose, and it wraps chips forever. Twenty-four signed-in uploaders is an ordinary wedding. The number under each frame is measured, not claimed.",
      options: [
        {
          id: "wrap",
          label: "Every name, wrapping, as today",
          means:
            "Complete and honest, and at a phone it is the tallest thing between the album and the footer.",
        },
        {
          id: "cap",
          label: "The first twelve, then the rest",
          means:
            "One rule for both surfaces; the remaining names open in a sheet over the album.",
        },
        {
          id: "faces",
          label: "A row of faces and a count",
          means:
            "Overlapping avatars on one line with the count beside them. The names are one tap away.",
        },
      ],
      recommended: "faces",
      because:
        "On an album the list's job is to say who was here, which a row of faces says in one line and two dozen chips say in twelve. The measurement under each frame is the argument.",
      overrule:
        "If the point of naming people is that they are named, the cap keeps the names visible and still ends the wrapping.",
      lands:
        "How the guest list draws on both surfaces, and how a big party reads at a phone.",
      after: { ask: "named" },
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * flattens every decision's `configs` into the board's controls, so a screen
 * knob eight decisions share arrives eight times: the dock would draw it eight
 * times and React would warn on the duplicate key (`guest-upload` found it).
 * Each decision keeps it on its own strip; the board declares it once.
 */
export const PROFILE_PAGE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
