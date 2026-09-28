import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * GETTING EVERYTHING OUT, ROUND ONE (2026-09-19; the overtaken audit,
 * 2026-09-21; a genuine third to every binary, 2026-09-24; `object` retired at
 * its answer, desk-trim, 2026-09-27; the flow refresh, 2026-09-28).
 *
 * Taking the album home is the act the whole product is a promise about, and
 * it is one menu, one toast and then the browser.
 *
 * ★ THE APP GOES BLIND AT THE TAP, AND THAT IS THE FINDING THAT SHAPED THE
 * ROUND. A row mints a signed token, form-POSTs it to the Worker and the menu
 * has already closed; from there the browser's own download UI is the only
 * thing that knows anything. So a mint that never answers spins forever, a
 * zip that comes back with nothing in it says nothing, and a phone that puts
 * the file somewhere is never named. Three of the six decisions are that one
 * gap.
 *
 * ★ THE PHONE LEADS. A guest at a party is holding one: 375 is the default on
 * every decision and 1440 is the knob.
 *
 * ★ THE FLOW REFRESH (2026-09-28): the board is drawn on the menu that ships
 * (`popups` r1 `choices=menu`: `export-dialog.tsx` on
 * `ui/responsive-menu.tsx`), a menu under the button at a desk and rows at the
 * thumb in a hand, no longer on the old centred sheet. Four asks moved:
 *  - `means`: mine-none took the own-tile mark `mine` argued from, and View
 *    beside Download all has Yours, so `mine` is a Yours row at the menu's top.
 *  - `wait`: his voice-guest note ("notify the user where they are without
 *    real interruption, if we even need to notify them at all") and a menu
 *    that closes on tap left `panel` nothing to hold. It is today's toast
 *    against a quiet line and the Download button itself (`button`, in
 *    `panel`'s slot, the recommendation now); `stuck` and `hollow` wear it.
 *  - `hollow`: his `failed=exact` ("2 of 8 didn't upload", Retry both) settles
 *    how a short zip is said, so the ask narrows to whether an EMPTY zip is
 *    refused. `after` (a count with no way to fix it) loses to `offer` and
 *    leaves; a knob draws the settled short zip beside the empty one.
 *  - `cap` and `phone`: redrawn on the menu's rows (a dead row, a row "in 2
 *    zips", a row saying what it left out; Save to Photos above the rows).
 * `stuck` is unchanged but for the ground and its `button` drawing.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. No option re-encodes a byte or touches the
 * originals invariant (metadata is stripped at upload, never here). The Album
 * row's grammar and its Download icon are `app-vocabulary`'s; tier gating of
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

/** Which album is being taken home, which is what the rows are worth. */
const ALBUM: Control = {
  id: "album",
  label: "The album",
  options: [
    { id: "wedding", label: "A wedding, 148 items" },
    { id: "small", label: "A small album, 12" },
    { id: "over", label: "Over the limit, 2,440" },
  ],
  default: "wedding",
};

/** Whose menu it is: the host gets the hidden switch, the guest never does. */
const WHO: Control = {
  id: "who",
  label: "Who is asking",
  options: [
    { id: "host", label: "The host" },
    { id: "guest", label: "A guest" },
  ],
  default: "host",
};

/**
 * What the Worker found (`hollow`): the open question is the empty zip, drawn
 * by default; the short one is settled by his `failed=exact` and drawn on the
 * knob, the same under both options by design.
 */
const CAME: Control = {
  id: "came",
  label: "What came back",
  options: [
    { id: "none", label: "Nothing, all 148 gone" },
    { id: "short", label: "142 of 148" },
  ],
  default: "none",
};

const DRAFT = defineExploration({
  id: "export-flow",
  title: "Getting everything out",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "The flow refresh: every ask drawn on the shipped Download menu. Mine becomes a Yours row; the wait is today's toast against a quiet line and the button itself; hollow asks only whether an empty zip is refused.",
  },
  context:
    "One surface serves both sides of the album. A host taps Download in the Album header; a guest taps Download all in the album's row. Both open the Download album menu, under the button at a desk and rows at the thumb with Cancel beneath in a hand: Everything, Photos and Videos, each with its count and size, and a row is the act. Drawn at 375 by 812 with 1440 by 900 on the knob, over one wedding of 148 items, every number the menu's own arithmetic over a fixture. Nothing here mints, signs, logs or reaches the Worker.",
  carried: [
    {
      id: "panel-leaves",
      question:
        "Where does the wait's panel go, now the menu closes at the tap?",
      taken:
        "It leaves: the Download button itself takes its slot and the recommendation, and stuck and hollow are drawn there.",
      overrule:
        "Keep a fourth option, a menu that stays open until the browser has the zip, if a held surface is still wanted.",
    },
    {
      id: "after-leaves",
      question: "Does the hollow zip's bare count (after) stay an option?",
      taken:
        "No: it has no way to fix the failure, so it loses to offer and leaves; the ask is only whether an empty zip is refused.",
      overrule:
        "Keep it as a losing third if the count alone, with no Try again, should stay on the record.",
    },
  ],
  asks: [
    {
      id: "means",
      label: "What a guest takes",
      question: "What should Download hand a guest at a party?",
      context:
        "Download all opens the menu: Everything, Photos or Videos of all she can see, a row the act. Her photos wear no mark on the tiles (mine-none); View beside it has Yours, the set she added. Her own cut (reel-cut) is a sibling.",
      options: [
        {
          id: "album",
          label: "The whole album, as today",
          means:
            "Three rows, Everything, Photos or Videos, of the whole album. The 14 she took are in there somewhere, unsorted.",
        },
        {
          id: "mine",
          label: "A Yours row at the top",
          means:
            "Yours, the set View already names, leads the menu as a fourth row with its own count and size; the album's three sit under it.",
        },
        {
          id: "picked",
          label: "Tap what you want, then take it",
          means:
            "The guest gets a select mode of her own: tap tiles, and the bar takes exactly those. Download all stays for everything.",
        },
      ],
      recommended: "mine",
      today: "album",
      because:
        "A guest came back for the ones she took, buried in a few hundred files. View already calls that set Yours, beside Download all, so one row named the same takes it home in one tap and costs no new machinery.",
      overrule:
        "If Yours is too small a set to earn a row most nights, the album's three rows stay the whole menu.",
      lands:
        "What a guest's Download all offers, and whether the menu carries a row of her own.",
      configs: [SCREEN, ALBUM],
    },
    {
      id: "wait",
      label: "The wait",
      question:
        "Once a row is tapped and the menu closes, what should say the zip is coming?",
      context:
        "A row is the act, so the menu is gone at the tap. The app mints a token and hands the zip to the browser, whose own bar shows the bytes; the app sees only the second between. Today a toast. His note: say it where she is, if at all.",
      options: [
        {
          id: "toast",
          label: "A toast, as today",
          means:
            "Preparing your download at the top of the screen, then Your download is starting, then the browser's own bar.",
        },
        {
          id: "line",
          label: "A quiet line under the album's row",
          means:
            "No toast: a line under the album's row says Preparing your zip, then Downloading, and goes once the browser has it.",
        },
        {
          id: "button",
          label: "On the Download button itself",
          means:
            "The button she tapped carries it: a spinner and Preparing, a tick and Downloading, then Download again. Nothing else appears.",
        },
      ],
      recommended: "button",
      today: "toast",
      because:
        "His note asks for it where she is, without interruption. The button she just tapped is exactly there: no new surface, no layout shift, only what the app knows, and the browser's own bar takes the bytes from there.",
      overrule:
        "If a failure or a missing file needs a sentence, a button has no room for one; the quiet line does.",
      lands:
        "Whether use-export-download keeps its toast, and where a failed or short download can be said.",
      configs: [SCREEN, ALBUM, WHO],
    },
    {
      id: "stuck",
      label: "A tap with no answer",
      question: "What should happen when the mint never comes back?",
      context:
        "The mint has no timeout and no cancel: a hang leaves the loading toast spinning forever, since the menu that asked for it is already gone. A failure's way out belongs on a real control, not a toast nobody can act on.",
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
        {
          id: "retry",
          label: "It tries twice more, quietly",
          means:
            "Two silent re-attempts before either the button or the spinner says anything; a third miss becomes the timeout.",
        },
      ],
      recommended: "retry",
      because:
        "A party network drops a request far more often than a mint truly fails, so self-healing beats making every host read a spinner or reach for Cancel over a hiccup that fixes itself a second later.",
      overrule:
        "If a mint on a party network really does take many seconds, silent retries only delay the one control that actually helps: Cancel, from the first second.",
      lands:
        "Whether a hung download is recoverable, and what the guest sees while it waits.",
      after: { ask: "wait" },
      configs: [SCREEN, WHO],
    },
    {
      id: "hollow",
      label: "A zip with nothing in it",
      question: "When nothing at all reaches the zip, should it be refused?",
      context:
        "The Worker skips a file it cannot find and tells no one, so saying anything needs it to report. His failed=exact settles a short zip: 142 of 148 are in your zip, Try again for the 6. Open: a zip holding nothing (142 of 148 on the knob).",
      options: [
        {
          id: "refuse",
          label: "Refused: nothing downloads",
          means:
            "The Worker finds nothing and sends no file; the album says Nothing downloaded: the album changed, with Try again.",
        },
        {
          id: "offer",
          label: "It lands, said like a short one",
          means:
            "The empty zip still downloads and is said as a short one is: None of the 148 are in your zip, with Try again.",
        },
      ],
      recommended: "refuse",
      because:
        "An empty zip is a file that lies in her Files. Refusing it leaves nothing to clean up and says the one true thing, that the album changed; a short zip still lands, counted. A bare count (after) loses to both: it has no way to fix the failure.",
      overrule:
        "If one rule for every hollow zip is simpler to build and to read, the empty one lands and is counted like the rest.",
      lands:
        "Whether the Worker reports what it skipped, and whether it may refuse a zip it would send empty.",
      after: { ask: "wait" },
      configs: [SCREEN, WHO, CAME],
    },
    {
      id: "cap",
      label: "The limit",
      question: "What should the menu do about the 2,000 item limit?",
      context:
        "A bundle over 2,000 items or 20 GB cannot be sent at once. The menu draws it as a dead row, and its note names no number (Too large to download all at once...), though here Photos is over too. Drawn on an album of 2,440.",
      options: [
        {
          id: "near",
          label: "The note names the number",
          means:
            "The rows over it stay dead, and the note says why: a download holds up to 2,000 items or 20 GB, and which rows are over.",
        },
        {
          id: "split",
          label: "The row takes it, in numbered zips",
          means:
            "Over the limit the row still works and reads Everything, in 2 zips: the album comes home in parts and is never refused.",
        },
        {
          id: "auto",
          label: "The row keeps the newest 2,000",
          means:
            "Over the limit the row still works, keeps the newest it can in one zip, and says how many it left out.",
        },
      ],
      recommended: "split",
      because:
        "The refusal tells the host what to do, which means the product knows how to do it. Asking a person to hand-simulate a batch loop is the defect: the limit is a Worker ceiling, not a promise to the host.",
      overrule:
        "If one zip beats several files even at the cost of leaving some behind, the automatic trim is the simpler build and still never refuses.",
      lands:
        "Whether a big album can be taken home at all, and what the marketing figure has to match.",
      configs: [SCREEN, WHO],
    },
    {
      id: "phone",
      label: "Where the file lands",
      question:
        "A zip can never enter Photos: what should a phone's Download reach for first?",
      context:
        "On a phone Download all rises as rows at the thumb, each a zip, and a zip only reaches Files. Single files reach Photos through the share sheet's Save, which the viewer's Save already opens. His note: the native way first, every way kept.",
      options: [
        {
          id: "zip",
          label: "The zip to Files, as today",
          means:
            "The three rows as they ship, each one zip that lands in Files. Never the native library.",
        },
        {
          id: "batch",
          label: "Every file to the share sheet",
          means:
            "No zip at all: a row hands its files to the system sheet at once, whose own Save leads into Photos. Needs them all in memory first.",
        },
        {
          id: "both",
          label: "Save to Photos above the rows",
          means:
            "A Save to Photos row leads the menu, one tap to the share sheet as the viewer's Save is; the zip rows stay under it, to Files.",
        },
      ],
      recommended: "both",
      today: "zip",
      because:
        'His own note: the native library should lead, and "we\'re not looking to reduce ways to download, just include the expected native way as the default." One row above keeps every zip and makes Photos the first tap.',
      overrule:
        "If holding every file in memory before the sheet opens is too slow on a party network, the zip alone is the safe default and Photos becomes the special case.",
      lands:
        "Whether a phone's bulk download ever reaches the native Photos library, or stays inside Files.",
      // No screen knob: this one is only ever a phone, so the tile IS that column.
      tile: "phone",
      configs: [ALBUM],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls and dedupes them by id itself now; this filter predates that and
 * stays correct (deduping twice is deduping once).
 */
export const EXPORT_FLOW: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
