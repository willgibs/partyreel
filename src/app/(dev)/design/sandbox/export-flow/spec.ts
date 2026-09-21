import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * GETTING EVERYTHING OUT, ROUND ONE (2026-09-19; reshaped by the overtaken
 * audit, 2026-09-21).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app and the guest pages are
 * unprotected, "absolutely everything is up for relitigation or reconcepting
 * from the ground up". Taking the album home is the act the whole product is
 * a promise about, and today it is one dialog, one toast and then silence.
 *
 * ★ THE APP GOES BLIND AT THE TAP, AND THAT IS THE FINDING THAT SHAPED THE
 * ROUND. The click mints a signed token, form-POSTs it to the Worker and closes
 * the dialog; from there the browser's own download UI is the only thing that
 * knows anything. So a mint that never answers spins forever, a zip that comes
 * back with nothing in it says nothing, and a phone that puts the file
 * somewhere is never named. Three of the eight decisions are that one gap.
 *
 * ★ THE PHONE LEADS. A guest at a party is holding one, and the guest half of
 * this flow has never been designed for anything else: 375 is the default on
 * every decision and 1440 is the knob.
 *
 * ★ THE OVERTAKEN AUDIT (Will, 2026-09-21: "For any open questions that have
 * been 'overtaken', please evaluate whether they should be reshaped or
 * removed... I'd rather you lean into reshape if you aren't confident in
 * removal"). All eight of this board's questions were badged by a later
 * ruling and none of them was removed. Each one now carries the ruling that
 * reached it INSIDE its own context, five options a ruling forbids outright
 * are dropped (`chips.three`, `stuck.forever`, `hollow.silence`, `cap.bite`,
 * `object.link`), and the surface they are all drawn on is the one responsive
 * sheet `guest-shape` r1 ruled every guest dialog onto: a side panel at a desk,
 * a bottom sheet in a hand. Nothing is answered; the round is still round one.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. No option re-encodes a byte or touches the
 * originals invariant (metadata is stripped at upload, never here). The bulk
 * bar's grammar and its Download icon are `app-vocabulary`'s; tier gating of
 * export sizes is `app-pricing`'s; the viewer's per-item Save and the reel's own
 * download are sibling lanes. Nothing on this board mints, signs, logs, reaches
 * the limiter or wakes the Worker.
 */

/** The screen, the knob every decision shares. A guest is on a phone. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Which album is being taken home, which is what the foot is made of. */
const ALBUM: Control = {
  id: "album",
  label: "The album",
  options: [
    { id: "wedding", label: "A wedding, 148 items" },
    { id: "small", label: "A small album, 12" },
    { id: "over", label: "Over the limit, 2,440" },
    { id: "teaser", label: "A teaser, 9 photographs" },
  ],
  default: "wedding",
};

/** Whose sheet it is: the host gets the hidden switch, the guest never does. */
const WHO: Control = {
  id: "who",
  label: "Who is asking",
  options: [
    { id: "host", label: "The host" },
    { id: "guest", label: "A guest" },
  ],
  default: "host",
};

const DRAFT = defineExploration({
  id: "export-flow",
  title: "Getting everything out",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "The overtaken audit: all eight questions reshaped with the rulings that reached them folded in, five dead options dropped (the third chip, the endless spinner, the silent hollow zip, the unsaid cap, the link-first lead), and the surface redrawn as the one ruled sheet.",
  },
  context:
    "One surface serves both sides of the album. A host taps Download in the Gallery header; a guest taps Download all above the tiles. Both get Download album, three chips with live counts, a size, and a button that mints a signed token and hands it to a Worker that streams a zip. It is drawn here as the one responsive sheet the guest's dialogs are ruled onto, at 375 by 812 with 1440 by 900 on the knob, over one wedding of 148 items. Every count and size is the real arithmetic over a fixture summary. Nothing here mints, signs, logs or reaches the Worker.",
  bible: [1, 15, 21, 22],
  asks: [
    {
      id: "means",
      label: "What a guest takes",
      question: "What should Download hand a guest at a party?",
      context:
        "A guest's only download is a small Download all link, and it bundles everything they can see. The product now knows their own photographs for good: the tiles carry a mark, and the View menu's Yours lens is that filter.",
      options: [
        {
          id: "album",
          label: "The whole album, as today",
          means:
            "One link, one zip of everything they can see. The 14 they took themselves are in there somewhere, unsorted.",
        },
        {
          id: "mine",
          label: "Their own shots first, the album under",
          means:
            "The sheet leads with the set the Yours lens already defines, and the whole album sits beneath it as the second bundle.",
        },
        {
          id: "picked",
          label: "Tap what you want, then take it",
          means:
            "The guest gets a select mode of their own: tap tiles, and the bar takes exactly those. Download all stays for everything.",
        },
      ],
      recommended: "mine",
      because:
        "A guest came back for the ones they took and the few they were in, and today those are buried in a few hundred files. The set is marked on every tile and filtered by a lens that ships, so leading with it costs the sheet one row and no new machinery.",
      overrule:
        "If the commonest tap is take the lot, a second bundle makes it one step longer and the album should lead.",
      lands:
        "What a guest's Download all means, and how many bundles the shared sheet offers.",
      configs: [SCREEN, ALBUM],
    },
    {
      id: "chips",
      label: "A chip with nothing in it",
      question:
        "Should a guest who can only ever have photographs be told there is video?",
      context:
        "A visitor who has not signed in gets a teaser: nine photographs, never video. A band with nothing real in it is ruled absent, and a locked control is ruled to say why and offer the way through rather than sit there dead.",
      options: [
        {
          id: "two",
          label: "The Videos chip goes",
          means:
            "Two chips, both of which can answer. A guest is never told there is video in this album that they cannot have.",
        },
        {
          id: "why",
          label: "The chip stays and says why",
          means:
            "Dimmed and unpressable, with the reason under the row and the album's own See all beside it as the way through.",
        },
      ],
      recommended: "why",
      because:
        "The dead chip is closed by the ruling either way, so all this decides is whether the fact survives. Saying why and offering the door is the house answer for a control a person cannot use, and See all is already the guest album's word for that door.",
      overrule:
        "If a dimmed chip reads as a tease on someone else's album, the row simply holds two.",
      lands:
        "What the sheet draws for an access level that cannot fill it, on every guest album.",
      after: { ask: "means" },
      configs: [SCREEN],
    },
    {
      id: "wait",
      label: "The wait",
      question: "What should the album show while the zip is being made?",
      context:
        "The tap raises a toast, mints a token, posts it to the Worker and closes the sheet. Bytes in flight are ruled to be narrated in place and silently, and a run that did not finish is read on one surface at its end.",
      options: [
        {
          id: "toast",
          label: "A toast, then the browser, as today",
          means:
            "Preparing your download, then Your download is starting, then nothing. The sheet is already gone.",
        },
        {
          id: "panel",
          label: "The sheet holds until it lands",
          means:
            "The sheet becomes the progress: what is being zipped, a bar, and Saved when the bytes reach the device. One thing to watch.",
        },
        {
          id: "line",
          label: "A line under the header, and carry on",
          means:
            "The sheet closes and a quiet line sits under the album's own header until the file lands, then says where it went.",
        },
      ],
      recommended: "panel",
      because:
        "The person is standing at the one surface that could tell them and it goes quiet at the exact moment they care. The sheet is where the end of a run is ruled to be said, and holding it gives cancelling, failing and a hollow file one home.",
      overrule:
        "If a zip can take minutes on a phone, a sheet over the album is a cage and the quiet line is the narration in place.",
      lands:
        "Whether the app watches its own download at all, and where a failure could ever be said.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "stuck",
      label: "A tap with no answer",
      question: "What should happen when the mint never comes back?",
      context:
        "The mint has no timeout and no cancel, so a request that hangs leaves the spinner going and the button dead. A failure is ruled to put its ways out on real buttons, so a spinner nobody can end is gone.",
      options: [
        {
          id: "timeout",
          label: "It gives up and offers Try again",
          means:
            "After about ten seconds it says it could not start, hands the button back and offers Try again.",
        },
        {
          id: "cancel",
          label: "Cancel from the first second",
          means:
            "A Cancel sits beside the spinner from the moment it appears, so the way out never depends on a timer.",
        },
      ],
      recommended: "timeout",
      because:
        "A mint normally answers in well under a second, so a Cancel is a control almost nobody will ever want and every host will see. A timeout costs nothing when it works and is the only thing that helps when it does not.",
      overrule:
        "If a mint on a party network really does take many seconds, Cancel is the control and the timeout is its backstop.",
      lands:
        "Whether a hung download is recoverable, and what the button does while it waits.",
      after: { ask: "wait" },
      configs: [SCREEN, WHO],
    },
    {
      id: "hollow",
      label: "A zip with nothing in it",
      question: "What should be said when the zip comes back hollow?",
      context:
        "The Worker skips an object it cannot find, silently, so an album emptied between the mint and the stream downloads as a valid zip with nothing in it. He refuses a gap a person has to check for themselves.",
      options: [
        {
          id: "after",
          label: "It says what did not make it",
          means:
            "The Worker reports what it skipped and the album says so: how many of the items asked for are really in the file.",
        },
        {
          id: "refuse",
          label: "Nothing downloads at all",
          means:
            "A zip that would be empty is refused outright, and the album says it changed while the file was being made.",
        },
      ],
      recommended: "after",
      because:
        "Counting covers the whole range, including the common one where six of 148 are missing, which refusing would either ignore or turn into losing the other 142.",
      overrule:
        "If the Worker cannot tell the page anything without holding the stream open, refusing an empty zip is the one case worth the seam.",
      lands:
        "Whether a download that quietly lost everything can ever be noticed.",
      after: { ask: "wait" },
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "cap",
      label: "The limit",
      question: "What should the sheet do about the 2,000 item limit?",
      context:
        "An album over 2,000 items cannot be sent at once. Marketing states the figure and the sheet never has. A refusal that names no number is ruled out, and the act states its terms before the files fly.",
      options: [
        {
          id: "near",
          label: "Said in the foot when it is close",
          means:
            "A quiet line appears beside the size as the selection nears the limit, and the same line becomes the refusal.",
        },
        {
          id: "split",
          label: "The product splits it, and never refuses",
          means:
            "Over the limit the zip arrives in numbered parts, the foot says how many, and the button says so. No album is ever refused.",
        },
      ],
      recommended: "split",
      because:
        "The refusal already tells the host exactly what to do, which means the product knows how to do it. Asking a person to hand simulate a batch loop is the defect; the limit is a Worker ceiling, not a promise to the host.",
      overrule:
        "If parts arriving as several files is worse than one refusal, naming the number early is the honest middle.",
      lands:
        "Whether a big album can be taken home at all, and what the marketing figure has to match.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "object",
      label: "Whether it opens at all",
      question: "Should Download open a sheet of bundles, or simply start?",
      context:
        "Download album offers a zip of the originals. The album's own address and its copy button are ruled onto the event page twice over, so this sheet no longer has to lead with the promise that it outlives a copy.",
      options: [
        {
          id: "zip",
          label: "The sheet of bundles, as today",
          means:
            "Pick a bundle, get a file. The chips, the size, the host's hidden switch and the wait all keep the one home they have.",
        },
        {
          id: "straight",
          label: "No sheet: it just starts",
          means:
            "Download takes everything immediately. Anyone who wants less uses select mode, where the chips would have to live.",
        },
      ],
      recommended: "zip",
      because:
        "Everything else this board decides lives on that surface: the bundles, the chip that says why, the number before the limit bites, and the only place a hollow file or a hung mint could ever be said. Starting straight away has to find all four another home.",
      overrule:
        "If the commonest tap is take the lot, the sheet is a toll on it and select mode can hold the chips.",
      lands:
        "Whether Download opens a surface at all, and where the chips and the wait live if it does not.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "phone",
      label: "Where the file lands",
      question: "What should a phone do with the file?",
      context:
        "The download is a top level form post that answers as an attachment, and no copy anywhere names where a guest should go looking. On the way IN he took our own sheet over the system's own chooser.",
      options: [
        {
          id: "today",
          label: "The attachment, and whatever iOS does",
          means:
            "The browser takes it. Where it went is the browser's business, and the album never mentions it again.",
        },
        {
          id: "files",
          label: "The copy names where it lands",
          means:
            "The button says it saves to Files before the tap, and the album says which folder it went to after.",
        },
        {
          id: "share",
          label: "Hand it to the phone's share sheet",
          means:
            "The zip goes to the system sheet, so it can be saved, sent on, or dropped to a laptop. It needs the file in memory first.",
        },
      ],
      recommended: "files",
      because:
        "Naming the destination costs one line, removes the whole where did it go moment, and keeps the words ours, which is the lean he took on the way in. The share sheet needs the bytes client side, which no party phone has for an ordinary album.",
      overrule:
        "If a guest's real intent is to send the album on rather than store it, only the system sheet serves that.",
      lands:
        "What the download says on a phone, and whether the album ever tells a guest where their copy went.",
      after: { ask: "object" },
      // No screen knob: this one is only ever a phone, so the tile IS that column.
      tile: "phone",
      configs: [ALBUM],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob six decisions share arrives six times and the dock draws
 * it six times (React warns on the duplicate key). Each decision keeps it on
 * its own strip, which is what `configs` is for; the board declares it once.
 */
export const EXPORT_FLOW: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
