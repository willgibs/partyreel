import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST'S SIDE OF THE REEL, ROUND ONE (2026-09-22).
 *
 * Wave 2 of THE REEL ROUND (rulings.md "the reel, reconceived", every
 * sentence his; the plan's "The concept, in one read" and section D). The
 * reel no longer needs a host to make it: it plays itself from the third
 * visible item, spliced by the doorbell, styled by a mood. What is left for
 * a host to actually DO is small and scattered across the surfaces they
 * already visit: set the mood, decide if the reel shows at all, open it on
 * a screen, and know what their own finished cut does to the album.
 *
 * ★ DECIDED, NOT ASKED (the plan's section D, verbatim): the hub's Reel card
 * is the reel's own face, drawn on the sibling `reel-front` board, not here;
 * the style default lives on `events.reel_style_id`, the switch on
 * `events.show_reel` (host-writable, default true); a host's own cut added
 * to the album lands approved, a guest's moderated (never this board's
 * question, only where the album SHOWS a host's landing); the dashboard's
 * "has a reel" flag becomes "the reel is live" (the switch on and three or
 * more items, the plan's own calls); the Studio dies with the round.
 *
 * ★ TWO ASKS NAME A STANDING BOARD'S OWN QUESTION AND STOP THERE.
 * `host-curation.count` (how many places say how many are waiting) and
 * `host-curation.arrivals` (what the queue does when one lands mid-visit)
 * are that board's to answer; `review` below asks only whether the LIVE REEL
 * ever explains its own gap, never how Review counts or receives arrivals.
 */

// ★ "viewport", NEVER "screen": this board's own THIRD ask is named `screen`
// ("Play on a screen"), and `defineExploration` derives one control per ask
// from its id. Two controls sharing "screen" would collide in the dedup
// (`byId` in exploration.ts keeps the first, silently dropping whichever
// this strip is), so the viewport knob every board else calls `screen`
// takes the one id here that cannot clash with an ask of its own.
const VIEWPORT: Control = {
  id: "viewport",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

const DRAFT = defineExploration({
  id: "reel-host",
  title: "The host's side of the reel",
  round: {
    n: 1,
    date: "2026-09-22",
    changed: "New board, cut in wave 2 of THE REEL ROUND.",
  },
  context:
    "The reel now makes itself: no Studio, no publish, no file. What is left for a host is four small acts, scattered today across the hub, the settings sheet and the dashboard. Six decisions on those real surfaces, over Mia and Theo's wedding, eighteen items in, three waiting in Review.",
  bible: [1, 4, 12, 15, 19, 21, 22],
  asks: [
    {
      id: "style",
      label: "Where Style lives",
      question: "Where should the host's Style control live?",
      context:
        "The reel's look defaults to a mood any viewer can switch on their own device for free. The host still sets that default somewhere: the create wizard's Style step is the only precedent for a host picking a mood at all today.",
      options: [
        {
          id: "view",
          label: "In the reel view, the host's control",
          means: "The reel opens like it does for anyone; one extra control in its chrome also sets the event's default.",
        },
        {
          id: "sheet",
          label: "In Settings, eight moods in a row",
          means: "A new Reel card in the settings sheet shows the eight moods as swatches; the host never has to open the reel to change one.",
        },
        {
          id: "both",
          label: "Both: the sheet home, the view a shortcut",
          means: "The settings sheet holds the full picker; the reel view carries a small shortcut to the same choice.",
        },
      ],
      recommended: "sheet",
      because:
        "Style is a setting, not a viewing decision: a host configuring an event is already in Settings for the switch and the visibility, and a swatch row costs one card rather than a second control layered onto a view built for watching.",
      overrule:
        "If the default should be set at the moment it is felt, watching the reel actually play in that mood, the view is the more honest place to decide it.",
      lands: "Whether Style is a settings decision, a viewing-moment decision, or both.",
      configs: [VIEWPORT],
    },
    {
      id: "switch",
      label: "The 'Show the reel' row",
      question: "Where should the 'Show the reel' switch sit?",
      context:
        "The reel defaults on for every event; a host can turn it off. Settings already carries one loud switch beside the guest list, so a second consequential toggle has a real neighbour to sit beside, or a reason to stand apart.",
      options: [
        {
          id: "guestlist",
          label: "Beside the guest list switch",
          means: "A third row in the same Profile & guests card, one sentence of consequence, exactly the shape Show the guest list already wears.",
        },
        {
          id: "first",
          label: "At the head of the sheet, first",
          means: "Its own small card above Details, Visibility and Uploads: the reel is the event's public face now.",
        },
        {
          id: "inview",
          label: "Inside the reel view, the host's toggle",
          means: "No settings row at all; the host turns the reel off from inside the reel, where they can see what turning it off costs.",
        },
      ],
      recommended: "guestlist",
      because:
        "Show the guest list already proved the pattern (a loud one-line consequence beside a switch); the reel's own visibility is exactly that kind of decision, and a host already reads that card end to end for the guest list.",
      overrule:
        "If the reel is meant to read as the event's headline feature rather than one more privacy toggle, the head of the sheet says that with placement alone.",
      lands: "Whether turning the reel off sits with the product's other visibility switches or stands apart.",
      configs: [VIEWPORT],
    },
    {
      id: "screen",
      label: "Where 'Play on a screen' lives",
      question: "Where should 'Play on a screen' live?",
      context:
        "The screen is the flagship moment: the reel full-bleed on a wall with a QR in the corner, opened once and left running all night. It needs exactly one door, reachable without hunting.",
      options: [
        {
          id: "hub",
          label: "A button on the hub, beside the cards",
          means: "A fifth door in the cards row (Review, Reel, Guests, Settings), opening the screen in a new tab.",
        },
        {
          id: "view",
          label: "Inside the reel view, an extra",
          means: "The reel view's own chrome carries a screen control beside Style and Include videos.",
        },
        {
          id: "share",
          label: "The share sheet, a third door",
          means: "Share gathers every way people meet this event; Play on a screen joins the code and the readable link as one more block.",
        },
      ],
      recommended: "hub",
      because:
        "A host sets the wall up before the party starts, at the hub, not mid-scroll inside a player; a button beside Review, Reel and Guests reads as a fourth room rather than a control buried in a chrome bar.",
      overrule:
        "If the screen is really a way of sharing the event rather than a room of its own, the share sheet is the more honest home.",
      lands: "Whether the screen is its own door from the hub, a control inside the reel, or one more thing Share offers.",
      configs: [VIEWPORT],
    },
    {
      id: "pulse",
      label: "The dashboard's line",
      question: "How should the dashboard say the reel is live?",
      context:
        "'Has a reel' becomes 'the reel is live' (the switch on and three or more items). The dashboard's event list already tells a host what an event needs; the reel's aliveness is new information it could carry, or need not.",
      options: [
        {
          id: "live",
          label: "'Reel is live' with the count",
          means: "A small line under the event's card, reading Reel live and the clip count, once the switch is on and three items exist.",
        },
        {
          id: "threshold",
          label: "Nothing until three, then the line",
          means: "Under three items the card says nothing extra; the moment the third lands, the same line appears.",
        },
        {
          id: "cover",
          label: "The card's own cover plays",
          means: "No line, no words: the event card's cover crossfades through the album instead of holding one still, which IS the reel being live.",
        },
      ],
      recommended: "cover",
      because:
        "The reel's whole pitch is that it is watchable, not merely present; a still card with a line describes that, and a card whose own cover moves shows it in the one place a host already looks every morning.",
      overrule:
        "A moving dashboard is also the busiest one on the page; if that reads as noise rather than delight, the plain line says the same fact at rest.",
      lands: "Whether the dashboard states the reel's aliveness as a fact or lets the card demonstrate it.",
      configs: [VIEWPORT],
    },
    {
      id: "cut",
      label: "A host's own cut, added",
      question: "What should happen when a host adds their own cut to the album?",
      context:
        "A finished cut on a paid event can go through 'Add to the album', spending the host's own storage; the live reel skips it. It always lands approved, never a Review queue, so this asks what the album shows, never whether it is held.",
      options: [
        {
          id: "marked",
          label: "Lands approved, a small cut mark",
          means: "The tile carries a small badge distinct from the video play mark, so it reads as made from the reel.",
        },
        {
          id: "plain",
          label: "Lands approved, no mark at all",
          means: "The video sits in the album exactly like any other host upload: a play mark, nothing more.",
        },
        {
          id: "confirm",
          label: "A confirm sheet first",
          means: "Before it lands: 'Add this cut to the album? This uses about 8 MB of your storage.' Cancel or add.",
        },
      ],
      recommended: "confirm",
      because:
        "This is the one reel-related act that spends something real, the host's own storage cap, and every other place in the product that spends a host's bytes on their say-so asks first rather than acting silently.",
      overrule:
        "If the cost is trivial next to the plan, one more sheet is worse than the silence, and the plain landing is the faster path.",
      lands: "Whether adding a cut is a silent act, a marked one, or a confirmed one.",
      configs: [VIEWPORT],
    },
    {
      id: "review",
      label: "Review's interplay with the reel",
      question: "Should anything tell the host that waiting uploads are not in the reel?",
      context:
        "The live reel plays only approved, visible items; a queue waiting in Review never appears in it. Nothing today connects those two facts for a host running a moderated event, who might otherwise wonder why the wall looks thin.",
      options: [
        {
          id: "viewsays",
          label: "The reel view says it",
          means: "A quiet line in the host's own reel chrome, naming the count, with a link straight to Review.",
        },
        {
          id: "roomsays",
          label: "The Review room's header says it",
          means: "Review's own header gains one small sentence: approved items join the live reel right away.",
        },
        {
          id: "nothing",
          label: "Nothing, the queue is the queue",
          means: "No new sentence anywhere. A host who turns on moderation already knows uploads wait for a reason.",
        },
      ],
      recommended: "viewsays",
      because:
        "The reel is where the gap is actually felt (a thin wall, a quiet screen), so the explanation belongs where the question arises, not in a room the host visits separately to clear a queue.",
      overrule:
        "If Review already owns every fact about pending media, folding this into its header keeps the reel's own chrome free of anything but playback.",
      lands: "Whether the live reel ever explains its own gaps, and if so, from which room.",
      configs: [VIEWPORT],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT (`guest-upload`'s own
 * finding, carried by every board since): the SCREEN control six decisions
 * share would otherwise arrive six times.
 */
export const REEL_HOST: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
