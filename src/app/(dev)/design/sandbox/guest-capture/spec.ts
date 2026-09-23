import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * KEEPING WHAT SHE JUST ADDED, ROUND ONE.
 *
 * A BOARD ON HIS WORD ("the identity reshape", approval verdict, verbatim):
 * "You can wire it now as you recommended, but I'd like to get this in the lab
 * for refinement." The capture flow is live: a name-only guest adds
 * photographs under a typed name, and once the first lands a card offers to
 * keep them (`save-account-prompt.tsx`); when she confirms an email the same
 * slot says what she now holds and offers the host to follow
 * (`follow-moment-card.tsx`, the slot owned by `claim-handle-prompt.tsx`).
 * Nothing here is a one-way door: the flow is live and this board is its
 * refinement catalog, lab-only, no production byte.
 *
 * ★ ONE GUEST, THE WHOLE BOARD. Every option is Priya, the guest
 * `media-viewer`'s own board already marked Unverified on its `who.face` tile,
 * at Maya and Jay's wedding, a names-mode party. A reader who has just
 * answered that board meets her again here, on her own side of the mark.
 *
 * ★ THE ORDER IS HER OWN PATH THROUGH IT: when the second ask first reaches
 * her, what it looks like, where she is offered a follow once she confirms,
 * and what becomes of the name she typed in a hurry. All four are roots — he
 * can take them in any order — because each one holds the other three at
 * today's shape and moves only its own piece.
 *
 * ★ WHAT THE BOARDS ABOVE IT ASK, THIS ONE DOES NOT. The door's own optional
 * email and where it sits (`identity-door.field`) are why this offer is the
 * SECOND ask; how the album points at photographs waiting under her address
 * (`identity-claims.pointer`), what Finish leaves her looking at
 * (`identity-claims.after`), when a page is first offered
 * (`identity-profile.prompt`) and how one is set up, handle included
 * (`identity-profile.setup`), are theirs. So the landing (album, profile or
 * dashboard) left this board: a profile is a 404 until a handle exists, and
 * the dashboard is the destination `identity-claims.pointer` asks how to
 * point at, with the album as the ground all three identity boards stand on.
 * The reel's tile at the album's head is `reel-front`'s: drawn here in every
 * scene, wearing that board's recommendations, and never asked about.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. Whether an event requires a verified
 * email at all is ruled; a name-only guest existing is the premise this board
 * stands on, not a question inside it. The Unverified mark's own material,
 * the album's column rule and the guest header's shell are
 * `guest-shape`/`gallery-width`'s and worn here as law. The claim's mechanics
 * (the claim by capability session, the claim by a confirmed address per
 * event, one email one identity) are unmoved; every option changes only what
 * a screen says and where it says it. And what confirming keeps is not a
 * question either: the event and every photograph, in her account; nothing
 * reaches a profile until she chooses it.
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

const DRAFT = defineExploration({
  id: "guest-capture",
  title: "Keeping what she just added",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "Rechecked against the identity and reel rounds: the offer is the second ask now (the door's optional email comes first), the reel's tile stands at the album's head, the copy promises her account, never a profile, the landing is gone, and the name keeps silent against confirm.",
  },
  context:
    "Every option is the same guest at the same wedding, Priya at Maya and Jay's, a names-mode party, with only the piece being asked moved. The door already offered her an optional email under her name (identity-door); this board asks about the second ask, once her first photographs land: when it reaches her, what it looks like, where she is offered a follow of Maya once she confirms, and what becomes of the name she typed. Confirming keeps the event and every photo in her account; nothing reaches a profile until she chooses it. The reel's tile sits at the album's head throughout (reel-front).",
  bible: [4, 14, 15, 19, 22],
  asks: [
    {
      id: "moment",
      label: "The moment",
      question:
        "The door already offered an optional email. When should the second ask, to keep what she added, first reach Priya?",
      context:
        'Today it waits from the moment her first photo lands, in the door\'s sheet, so it meets her as the album opens. She skipped the door\'s optional email (typed, it prefills this door). The reel\'s tile below wears reel-front\'s "Yours is in it".',
      options: [
        {
          id: "first",
          label: "After the first photo, as shipped",
          means:
            'The instant she has sent anything: the card waits as the album opens, a minute after the door\'s own ask, above the reel\'s "Yours is in it".',
        },
        {
          id: "tenth",
          label: "Held until the tenth photo",
          means:
            "Nothing until ten have landed, so an email she just skipped is not asked for again straight away; the same card then counts all 10.",
        },
        {
          id: "yours",
          label: "The moment she taps Yours",
          means:
            "The album's own filter to her photographs is the trigger: the ask meets her the instant she asks to see what is hers.",
        },
      ],
      recommended: "first",
      because:
        "The door's ask was about coming back; this is the first with something of hers to keep. A guest who adds one or two photographs and never returns is the common case, so waiting for a tenth, or a tap she may never make, means most never see it.",
      overrule:
        "If asking again a minute after she skipped the door's field reads as nagging, the tenth photo respects that no and arrives when she has more to lose.",
      lands:
        "Whether the second ask reaches every contributing guest once, or a smaller, more invested slice.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "shape",
      label: "The offer's shape",
      question:
        "Should the second ask stand in its own card, ride the photograph it is about, or close the door's own sheet?",
      context:
        "Today it is a bordered card in the words column, with the reel's tile between it and her photographs (reel-front). The sheet she sent her first photo from is the door's own, which offered the optional email a minute earlier.",
      options: [
        {
          id: "card",
          label: "A card in the words column, as shipped",
          means:
            "A self-contained card in the words column, then the reel's tile, then the album: two large objects before her first photograph.",
        },
        {
          id: "inline",
          label: "A line under her own photograph",
          means:
            "The caption sits under the photograph it is about, first in the album, as narrow as its column; the reel's tile keeps the album's head.",
        },
        {
          id: "sheet-step",
          label: "The door sheet's last screen",
          means:
            "The door does not close onto the album: its last screen is the ask, in the same sheet that offered the optional email a minute earlier.",
        },
      ],
      recommended: "inline",
      because:
        'A line under the photograph she just added says "this one" without new chrome, the restraint bible 4 asks of a guest surface, and it leaves the album\'s head to the reel\'s tile instead of stacking a second large object above it.',
      overrule:
        "A caption in a grid she is scrolling past is the easiest of the three to miss; a card is the only shape certain to be seen once.",
      lands:
        "How much new surface the ask gets, and whether it reads as part of the album or apart from it.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "follow",
      label: "The follow surface",
      question:
        "Once she confirms, where should Priya be offered a follow of Maya, her host: on the moment card, in the Guests list, or on Maya's page?",
      context:
        "The moment card has its own row for Maya today. The Guests list sits under the whole album, a Follow only on a name with a page: here most are Unverified. The card's other rows are identity-profile.prompt's and identity-claims.pointer's.",
      options: [
        {
          id: "card",
          label: "The moment card's own row, as shipped",
          means:
            "The card keeps its own row for Maya with its own Follow; the Guests list under the album keeps one on each name with a page.",
        },
        {
          id: "list",
          label: "Folded into the Guests list",
          means:
            "Maya leads the Guests list under the album, marked Host, with a Follow; the card drops its row and points down instead.",
        },
        {
          id: "jump",
          label: "A link to her profile",
          means:
            "The card's host line is a link to Maya's own page, where the real Follow button lives, rather than a button here.",
        },
      ],
      recommended: "card",
      because:
        "Maya is the one follow every guest here can make, and the card is where Priya is certainly looking when she confirms; the Guests list sits under the whole album and, at a names-mode party, is mostly Unverified names with no Follow at all.",
      overrule:
        "If the card needs its room for the pointer or the page invite (identity-claims, identity-profile), folding Maya into the list keeps one follow surface.",
      lands:
        "Whether the album carries one follow surface or two, and whether the host is a card row or a marked list entry.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "name",
      label: "What the name becomes",
      question:
        "When the name Priya typed becomes her account's name, should she get one look at it first?",
      context:
        "The shipped write is silent: Will's identity ruling names a nameless profile from the claimed row, editable from Account. That name then credits her wherever she adds photos. Her handle is identity-profile.setup's question.",
      options: [
        {
          id: "silent",
          label: "Silent, as ruled and shipped",
          means:
            "Named the instant she confirms, from whatever she typed at the door; she can change it from Account later.",
        },
        {
          id: "confirm",
          label: "A quick confirm step",
          means:
            '"Is this right?", one editable field, stands between confirming and the name being written anywhere.',
        },
      ],
      recommended: "silent",
      because:
        "The name has credited her all evening already and the ruling keeps it editable; asking again at the moment of success is a second question whose answer is almost always the same.",
      overrule:
        'If a name typed for one party (a nickname, "Priya from work") is often wrong everywhere else, one field now is cheaper than an edit she never finds.',
      lands:
        "Whether a guest's name at every party after this one is ever chosen on purpose, or carried over from one door.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ONE KNOB PER ID (`media-viewer`'s own finding, still standing): every ask
 * declares the same SCREEN control on its own strip, so the constructor
 * would draw it four times without this dedupe.
 */
export const GUEST_CAPTURE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
