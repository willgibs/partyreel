import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * GETTING EVERYTHING OUT, ROUND ONE (2026-09-19).
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
 * ★ WHAT IS DELIBERATELY NOT ASKED. No option re-encodes a byte or touches the
 * originals invariant (metadata is stripped at upload, never here). Whether the
 * guest's four dialogs become one sheet is `guest-shape`'s; the bulk bar's
 * grammar and its Download icon are `app-vocabulary`'s; tier gating of export
 * sizes is `app-pricing`'s; the viewer's per-item Save and the reel's own
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

/** Whose dialog it is: the host gets the hidden switch, the guest never does. */
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
    date: "2026-09-19",
    changed:
      "The first round: what Download hands a guest, what a teaser's third chip does, what the wait looks like, what a mint that never answers does, what a hollow zip says, what the item limit does, what the dialog offers as keeping the album, and what the phone does with the file.",
  },
  context:
    "One dialog serves both sides of the album. A host taps Download in the Gallery header; a guest taps Download all above the tiles. Both get Download album, three chips with live counts, a size, and a button that mints a signed token and hands it to a Worker that streams a zip. Every picture here is that dialog and the surfaces around it, at 375 by 812 with 1440 by 900 on the knob, over one wedding of 148 items. Every count and size is the real arithmetic over a fixture summary. Nothing here mints, signs, logs or reaches the Worker.",
  bible: [1, 15, 21, 22],
  asks: [
    {
      id: "means",
      label: "What a guest takes",
      question: "What should Download hand a guest at a party?",
      context:
        "A guest's only download is a small Download all link above the tiles. It opens the host's own dialog and bundles everything they can see, however many hundreds that is, whoever took them.",
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
            "The dialog leads with the ones they added, and the whole album sits beneath as the second bundle. The chips filter whichever is chosen.",
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
        "A guest came back for the ones they took and the few they were in, and today those are buried in a few hundred files they have to sort at home. Their own set is already identified server-side, and a second bundle costs the dialog one row.",
      overrule:
        "If a guest's own uploads cannot be recognised across a cleared browser, one album is the only bundle that is honest.",
      lands:
        "What a guest's Download all means, and how many bundles the shared dialog offers.",
      configs: [SCREEN, ALBUM],
    },
    {
      id: "chips",
      label: "A chip with nothing in it",
      question:
        "What should the Videos chip do for a guest who can only ever have photographs?",
      context:
        "A visitor who has not signed in gets a teaser: the nine newest photographs, never video. The dialog still draws all three chips, and tapping Videos answers Nothing selected with the button dead.",
      options: [
        {
          id: "three",
          label: "Three chips, as today",
          means:
            "Videos renders with a zero under it, takes the tap, and answers Nothing selected. Nothing says why.",
        },
        {
          id: "two",
          label: "The Videos chip goes",
          means:
            "Two chips, both of which can answer. A guest is never told there is video they cannot have.",
        },
        {
          id: "why",
          label: "The chip stays and says why",
          means:
            "Dimmed and unpressable, with the reason under the row and the album's own See all beside it.",
        },
      ],
      recommended: "why",
      because:
        "A control that takes a tap and answers with nothing is the defect; both other options close it. Keeping the chip keeps the fact that the album has more in it, and See all is already the guest album's word for that door.",
      overrule:
        "If a dimmed chip reads as a tease on the host's own album, the chip simply goes and the row holds two.",
      lands:
        "What the dialog draws for an access level that cannot fill it, on every guest album.",
      after: { ask: "means" },
      configs: [SCREEN],
    },
    {
      id: "wait",
      label: "The wait",
      question: "What should the album show while the zip is being made?",
      context:
        "The tap raises a toast, mints a token, posts it to the Worker and closes the dialog. The browser's own download UI is then the only thing that knows anything, and on a phone that is a line in a tray nobody opens.",
      options: [
        {
          id: "toast",
          label: "A toast, then the browser, as today",
          means:
            "Preparing your download, then Your download is starting, then nothing. The dialog is already gone.",
        },
        {
          id: "panel",
          label: "The dialog holds until it lands",
          means:
            "The dialog becomes the progress: what is being zipped, a bar, and Saved when the bytes reach the device. One thing to watch.",
        },
        {
          id: "line",
          label: "A line under the header, and carry on",
          means:
            "The dialog closes and a quiet line sits under the album's own header until the file lands, then says where it went.",
        },
      ],
      recommended: "panel",
      because:
        "The person is standing at the one surface that could tell them and it goes quiet at the exact moment they care. Holding the dialog gives the wait somewhere to live, and gives cancelling and failing somewhere to be said.",
      overrule:
        "If a zip can take minutes on a phone, holding a dialog over the album is a cage, and the line is the kinder answer.",
      lands:
        "Whether the app watches its own download at all, and where a failure could ever be said.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "stuck",
      label: "A tap with no answer",
      question: "What should happen when the mint never comes back?",
      context:
        "The mint has no timeout and no cancel. A request that hangs leaves the toast spinning and the Download button disabled for as long as the page is open, with no way back and nothing said.",
      options: [
        {
          id: "forever",
          label: "It spins, as today",
          means:
            "The spinner never stops and the button never comes back. Reloading the page is the only way out, and nothing says so.",
        },
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
        "If a mint on a party network really does take many seconds, a Cancel is the control, and the timeout becomes its backstop.",
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
        "The Worker skips an object it cannot find, silently. An album emptied between the mint and the stream downloads as a valid zip with nothing in it, and every surface behaves exactly as if it had worked.",
      options: [
        {
          id: "silence",
          label: "Nothing is said, as today",
          means:
            "A valid, empty zip lands in the downloads folder. The host believes they have their album until they open it.",
        },
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
        "The failure that matters is believing you have your album when you do not. Reporting the count covers the whole range, including the common one where six of 148 are missing, which refusing would either ignore or turn into losing the other 142.",
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
      question: "What should the dialog do about the 2,000 item limit?",
      context:
        "An album over 2,000 items cannot be sent at once. Nothing says the number until it blocks you, and then the refusal asks the host to do the splitting by hand. Marketing states the figure; the dialog never has.",
      options: [
        {
          id: "bite",
          label: "Unsaid until it blocks, as today",
          means:
            "The size is replaced by a refusal that names no number and tells the host to pick photos or videos instead.",
        },
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
        "The refusal already tells the host exactly what to do, which means the product knows how to do it. Asking a person to hand-simulate a batch loop is the defect; the limit is a Worker ceiling, not a promise to the host.",
      overrule:
        "If parts arriving as several files is worse than one refusal, naming the number early is the honest middle.",
      lands:
        "Whether a big album can be taken home at all, and what the marketing figure has to match.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "object",
      label: "What keeping it means",
      question: "What should the dialog offer as keeping the album?",
      context:
        "Download album offers exactly one thing: a zip of the originals. An event has no end date and leaves only by being deleted, so the album's own address outlives any copy of it, and the dialog has never said so.",
      options: [
        {
          id: "zip",
          label: "One zip, as today",
          means:
            "Pick a bundle, get a file. Whether the album is still there in a year is never mentioned.",
        },
        {
          id: "link",
          label: "The link first, the zip under it",
          means:
            "The album's own address leads, with Copy link beside it, and the zip is the second way to keep it.",
        },
        {
          id: "straight",
          label: "No dialog: it just starts",
          means:
            "Download takes everything immediately. Anyone who wants less uses select mode, where the chips now live.",
        },
      ],
      recommended: "link",
      because:
        "This is the one moment someone is actively trying to preserve the album, and the strongest thing we have to say is that they do not have to. A guest on a phone with no room is better served by an address than by a file that will not fit.",
      overrule:
        "If someone who tapped Download meets a link first and reads it as a dodge, the zip leads and the promise is a line beneath it.",
      lands:
        "What the download dialog is for, and whether the never-expires promise is ever said in the app.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "phone",
      label: "Where the file lands",
      question: "What should a phone do with the file?",
      context:
        "The download is a top-level form post that answers as an attachment. Nothing in the code, the help or any test says what iOS does with it, and no copy anywhere names where a guest should go looking.",
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
            "The zip goes to the share sheet, so it can be saved, sent on, or dropped to a laptop. It needs the file in memory first.",
        },
      ],
      recommended: "files",
      because:
        "Naming the destination costs one line and removes the whole where did it go moment. The share sheet needs the bytes client-side, which is a few hundred megabytes of a party phone's memory for the ordinary album, and it cannot stream.",
      overrule:
        "If a guest's real intent is to send the album on rather than store it, only the share sheet serves that, and the small albums it suits are the common case.",
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
