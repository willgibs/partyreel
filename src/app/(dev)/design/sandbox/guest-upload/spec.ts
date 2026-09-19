import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE MOMENT A GUEST ADDS A PHOTOGRAPH, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app and the guest pages are
 * unprotected, "absolutely everything is up for relitigation or reconcepting
 * from the ground up". This is the act the whole product exists for, so it is
 * asked from the foundation and PHONE FIRST: 375 by 812 is the default screen
 * on every decision, because a guest is standing at a party holding a phone,
 * and 1440 is the knob, because the host and half the people a link is
 * forwarded to are not.
 *
 * ★ THE ORDER IS THE ACT. Four decisions are roots and can be taken in any
 * order (the tap, one file flying, a held upload, a refused file); four wait on
 * one of those, because they only exist once it is answered: a dozen at once
 * and the moment of landing are both the sending answer at a different scale,
 * what the page says first sits under whatever the tap affordance became, and
 * the size of the sentences is asked once the failed tile has a shape.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The pipeline is not a design variable and
 * no option moves it: metadata is stripped byte-level, HEIC and video pass
 * through untouched, the limits come from one source mirrored in SQL, the
 * presign is server-side, the session token is the only capability and raw R2
 * keys never reach the browser. Nor is the page around the act: the album's
 * chrome, the Live signal and what a guest may do about a photograph hours
 * later are `guest-shape`'s round, and the column rule and the tile are
 * `gallery-width`'s ruling, worn here as settled law. The behaviour pins
 * (`guest-upload.test.tsx`, `limits.test.ts`) guard function, never look: the
 * one-at-a-time queue, the silent just-in-time join, the progress patching and
 * the rule that a refused file errors only its own tile survive every shape
 * below.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. 375 by default and everywhere: this is the phone-first
 * round, and a laptop answer that contradicts the phone is a finding.
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

/** Which file is in the air: the common one, or the one that takes a while. */
const FILE: Control = {
  id: "file",
  label: "The file",
  options: [
    { id: "photo", label: "A photograph, two seconds" },
    { id: "video", label: "A 212 MB clip, a minute" },
  ],
  default: "photo",
};

/** Whether anything of THIS guest's is waiting, which the banner cannot tell. */
const MINE: Control = {
  id: "mine",
  label: "Yours, waiting",
  options: [
    { id: "yours", label: "One of yours is waiting" },
    { id: "others", label: "Nothing of yours is waiting" },
  ],
  default: "yours",
};

/** Which refusal the server sent back, in its own words. */
const WHY: Control = {
  id: "why",
  label: "Why it failed",
  options: [
    { id: "big", label: "Over this event's cap" },
    { id: "type", label: "A video, photos only" },
    { id: "drop", label: "The connection dropped" },
  ],
  default: "big",
};

const DRAFT = defineExploration({
  id: "guest-upload",
  title: "Adding a photograph",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the tap opens, how one photograph reads while it flies, what a dozen at once does to the album, the moment it lands, what a held upload draws, what a refused file says, what a guest is told first, and how big the sentences are.",
  },
  context:
    "A guest taps Add, the phone's own chooser opens, and the files go one at a time straight to R2. Every option here is drawn on one open wedding at 375 by 812, because a guest is at a party holding a phone, with 1440 on the knob. The album under them is settled law and never moves: the ruled column rule, the shipped tile, and the chrome guest-shape is asking about. Nothing on this board uploads, presigns or joins anything.",
  bible: [1, 4, 12, 21],
  asks: [
    {
      id: "tap",
      label: "The tap",
      question: "What should happen the instant a guest taps Add?",
      context:
        "One hidden input takes every Add: photos and videos, many at once, and no capture flag, so the phone's own chooser decides between the camera and the library. Nothing on the page names those as two different acts.",
      options: [
        {
          id: "os",
          label: "The phone's chooser, as today",
          means:
            "One tap to either door, in the system's words, on a sheet that is not ours. The camera is in there; nothing on the page says so.",
        },
        {
          id: "sheet",
          label: "Our own sheet, naming both",
          means:
            "One tap opens our sheet: take a photo, or choose from your album. The camera is then one more tap and the library two.",
        },
        {
          id: "split",
          label: "Two buttons, no sheet at all",
          means:
            "A camera-first primary and a quieter library button, each one tap from where the guest is looking. It costs a row in the action block.",
        },
      ],
      recommended: "split",
      because:
        "At a party the photograph that matters most has not been taken yet, and nothing on the page says a guest can take one now. Two inputs is the only answer that names both acts and still puts each a single tap away.",
      overrule:
        "If the system's chooser is already both doors, one button is the least furniture and the page stays the host's.",
      lands:
        "Whether the page carries a capture input, how many taps reach a camera, and what the action block holds.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "sending",
      label: "Sending",
      question: "What should a guest see while their own photograph is flying?",
      context:
        "The file lands at the head of the album the instant it is picked, with a thin white bar in a black scrim at the tile's foot and no words anywhere. Most photographs off a phone finish before a guest can read anything.",
      options: [
        {
          id: "strip",
          label: "The silent strip, as today",
          means:
            "A bar at the tile's foot from the first byte to the last, on every file, with nothing to read.",
        },
        {
          id: "word",
          label: "The strip, and one word",
          means:
            "Sending, in white beside the bar, so the tile says what it is doing rather than leaving it to be inferred.",
        },
        {
          id: "late",
          label: "Nothing, until it is worth saying",
          means:
            "The tile simply lands and the bytes go behind it. A strip appears only on a file still flying after two seconds.",
        },
      ],
      recommended: "late",
      because:
        "A bar that is over before it is read is chrome for a state nobody was in. The only upload worth narrating is the one taking a while, and that is the clip on venue Wi-Fi, not the photograph.",
      overrule:
        "If a guest needs to see the phone start before they put it away, the strip from the first byte is the reassurance.",
      lands:
        "What every in-flight tile draws, and whether an ordinary upload is narrated at all.",
      tile: "phone",
      configs: [SCREEN, FILE],
    },
    {
      id: "batch",
      label: "A dozen at once",
      question: "A dozen at once: what should the top of the album do?",
      context:
        "A guest clears the night off their camera roll. Twelve tiles take the head of the album, and because the queue runs one file at a time only one of them is ever really moving. Drawn three in, nine still going.",
      options: [
        {
          id: "each",
          label: "One tile per file, as today",
          means:
            "Every file takes a tile at the album's head, drawn however one file is drawn, until its own bytes land.",
        },
        {
          id: "one",
          label: "One tile for one pick",
          means:
            "The batch is a single stacked tile counting down, and each photograph leaves it for the album as it lands.",
        },
        {
          id: "line",
          label: "They land, and a line counts",
          means:
            "All twelve are in the album at once under one line, so a refusal has to take one back out of a place it was seen.",
        },
      ],
      recommended: "one",
      because:
        "One pick is one act. Nine of a guest's own tiles take nearly half a phone's screen before most of them are really in the album, which is the cost Will named when he banked the shimmer; a stack says it in one.",
      overrule:
        "If a guest wants to watch each of their own twelve arrive, the line keeps them visible and takes the state off the photographs.",
      lands:
        "What the album's head does during a batch, and whether a tile may appear before its bytes have landed.",
      after: { ask: "sending" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "landing",
      label: "The moment it lands",
      question: "How should a guest's own photograph say it arrived?",
      context:
        "The tile re-keys in place and wears a small green check at its corner for about two and a half seconds, then the badge is simply gone with no exit at all. It is the one beat the product gives the act it exists for.",
      options: [
        {
          id: "check",
          label: "The green check, as today",
          means:
            "A state colour on a photograph for two and a half seconds, then nothing. Keeping it means giving it the exit it lacks.",
        },
        {
          id: "sweep",
          label: "The banked shimmer, spent here",
          means:
            "One pass of light across their own tile, once. Only the newest takes it, so a batch never stacks it up the gallery.",
        },
        {
          id: "none",
          label: "No mark of its own",
          means:
            "The photograph is simply in the album, and whatever the album does for an arrival it does for this one too.",
        },
      ],
      recommended: "sweep",
      because:
        "This is the act the product exists for and a status dot is what it gets. The shimmer was banked as a delight moment and refused as a gallery-wide one; a single tile, once, is exactly the first half and never the second.",
      overrule:
        "If a guest needs to know it is IN rather than that it arrived, the check is a state and light is not.",
      lands:
        "What the guest's own tile does at the moment it lands, and where the banked shimmer finally lives.",
      after: { ask: "sending" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "held",
      label: "Waiting for the host",
      question: "What should a guest see when the host approves uploads first?",
      context:
        "On a hold-for-approval event a finished upload draws no tile at all: one toast, and the photograph is gone. A standing banner says the host reviews uploads, in the same words whether or not anything of theirs is waiting.",
      options: [
        {
          id: "toast",
          label: "A toast, then nothing, as today",
          means:
            "The photograph vanishes on send. The banner was there before they uploaded and says the same thing after.",
        },
        {
          id: "tile",
          label: "A tile that waits",
          means:
            "Their photograph sits at the album's head, dimmed under a clock, until the host approves it. Only this device sees it.",
        },
        {
          id: "line",
          label: "A line that keeps the count",
          means:
            "No tile, but the banner becomes their own count: three of yours are waiting for Maya, and it clears itself.",
        },
      ],
      recommended: "tile",
      because:
        "A photograph that disappears the moment you send it reads as a failure, and the banner said the same sentence before you tapped. A tile that waits is the only answer where a guest sees what they sent.",
      overrule:
        "If nothing unapproved may be drawn on a host's album, even to the person who sent it, the counted line says it without a picture.",
      lands:
        "What a held upload draws, and whether the standing banner knows anything about this guest.",
      tile: "phone",
      configs: [SCREEN, MINE],
    },
    {
      id: "failed",
      label: "A file that will not go",
      question: "What should a guest see when one file will not go?",
      context:
        "The tile dims to 40 percent and the whole thing becomes a Tap to retry button at 12px. Why it failed rides a toast that leaves after a few seconds, and the rest of the batch carries on regardless.",
      options: [
        {
          id: "retry",
          label: "Dimmed, Tap to retry, as today",
          means:
            "The tile is a button and the reason is elsewhere, in a toast that has usually gone by the time it is read.",
        },
        {
          id: "reason",
          label: "The tile keeps the reason",
          means:
            "The photograph stays bright under a small mark, with what happened and a Retry on one line beneath it.",
        },
        {
          id: "sheet",
          label: "One sheet at the end",
          means:
            "Nothing interrupts while the files go; when the run is over, one surface lists what did not make it and why.",
        },
      ],
      recommended: "reason",
      because:
        "What happened and the tap that fixes it are the two things a guest needs, and today they sit in different places, one of which disappears. Dimming a perfectly good photograph says broken about the wrong thing.",
      overrule:
        "If failures are rare enough not to earn a sentence on a photograph, the end-of-batch sheet keeps the album clean.",
      lands:
        "What a failed tile draws, where a refusal is read, and how precise the sentence has to be.",
      tile: "phone",
      configs: [SCREEN, WHY],
    },
    {
      id: "warning",
      label: "Before they fly",
      question: "What should a guest be told before their files fly?",
      context:
        "Nothing, today. The size and type gates live at presign, after the picker has closed and the bytes have started, and the host's own per-event cap is a number the page already holds and never says.",
      options: [
        {
          id: "after",
          label: "Nothing until the server refuses",
          means:
            "As shipped. The page is silent, the upload starts, and a toast explains after the fact.",
        },
        {
          id: "before",
          label: "The terms, under the button",
          means:
            "One line at the act: what this event takes and how big, in the host's own number, before the picker opens.",
        },
        {
          id: "both",
          label: "The terms, and a file we can name",
          means:
            "That line, plus a named stand-in for a file the browser cannot draw, which today uploads as an empty black box.",
        },
      ],
      recommended: "both",
      because:
        "The one file a guest is least sure about is the one the page shows nothing of: an iPhone clip draws an empty tile for its whole upload. Saying the terms costs a line, and naming the file costs a tile.",
      overrule:
        "If the terms read as a warning on a page that should feel like an invitation, the line alone is enough.",
      lands:
        "Whether the upload act states its limits, and what a file the browser cannot draw looks like in flight.",
      after: { ask: "tap" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "words",
      label: "The smallest sentences",
      question: "How big should the two sentences a guest most needs be?",
      context:
        "The moderation banner and the retry label are 12px, the smallest type on a page whose reading copy is 15. They are also the two sentences that decide whether a guest uploads again, read in bad light at a party.",
      options: [
        {
          id: "xs",
          label: "12px, as they are",
          means:
            "The two sentences that matter most stay the smallest type on the page.",
        },
        {
          id: "read",
          label: "15px, where they are",
          means:
            "Both come up to the guest's reading size and nothing else about them moves.",
        },
        {
          id: "tiles",
          label: "15px, and the banner goes",
          means:
            "Nothing stands above the album stating a rule; the words live on the tiles they describe, so nothing is said until it applies.",
        },
      ],
      recommended: "read",
      because:
        "A guest reads these at a party, in the dark, on a phone held in one hand. Neither is a label on a photograph, and the page's own reading size is 15.",
      overrule:
        "If the review rule has to be read BEFORE the first upload, a standing banner is the only place it can be.",
      lands:
        "The size of every sentence the upload act says, and whether a standing banner survives at all.",
      after: { ask: "failed" },
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob eight decisions share arrives eight times: the dock would
 * draw it eight times and React would warn on the duplicate key. Each decision
 * keeps it on its own strip (that is what `configs` is for); the board declares
 * it once. The finding `gallery-width` left for the constructor, which could
 * dedupe by id itself, still stands.
 */
export const GUEST_UPLOAD: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
