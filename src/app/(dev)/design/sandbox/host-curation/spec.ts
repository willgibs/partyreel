import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST'S ACT OF REVIEWING WHAT GUESTS SEND, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app is unprotected,
 * "absolutely everything is up for relitigation or reconcepting from the ground
 * up". This is the one act in the product where a host judges another person's
 * photograph, so it is asked from the foundation and LAPTOP FIRST: 1440 is the
 * default screen because a host clearing forty uploads is sitting down, and 375
 * is the knob on every decision because the tile row collapses to two chips
 * there and a queue that only works at 1440 is a finding.
 *
 * ★ THE ORDER IS THE ACT. Six decisions are roots and can be taken in any
 * order: how a waiting photograph is SHOWN, what the refusing button is CALLED,
 * what a bulk act OFFERS afterwards, what the queue does when one LANDS
 * mid-visit, how many places say the COUNT, and whether the guest is TOLD. Two
 * wait: what a tap opens can only be asked once the grid under it is settled,
 * and the keyboard can only be asked once a tap has a meaning.
 *
 * ★ WHAT THIS ROUND DELIBERATELY DOES NOT MOVE. The state machine is not a
 * design variable and no option here touches it: `media.status` stays the one
 * enum, approve is pending to approved, refusing is pending to HIDDEN and never
 * removed, remove is a separate act into a 30-day Trash and the purge stays
 * R2-first and irreversible. Nor is the vocabulary under it: the empty and
 * loading treatments, the two toolbars' grammar, the tile-action models, the
 * tile-size control and the confirm switch are `app-vocabulary`'s, cited here
 * and never re-judged; the event page's section order and chrome are
 * `app-shape`'s; the media viewer's own shape is `media-viewer`'s.
 *
 * ★ ONE DECISION RELITIGATES A RULING OF HIS OWN, and says so: the uniform
 * review grid is his (2026-06-22, "standardized selection hit-targets").
 * Bible 22 is what makes that legal and the context is what makes it honest.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. Declared HERE rather than imported from the board's scene:
 * a spec is pure data a server page reads, and a control lifted out of a client
 * module drags that module's tree along with it.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

const DRAFT = defineExploration({
  id: "host-curation",
  title: "Reviewing what guests send",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: how a waiting photograph is shown, what refusing one is called, what a tap opens, whether the keyboard can clear a queue, what a bulk act offers afterwards, what happens when one lands mid-visit, how many places say the count, and whether the guest ever finds out.",
  },
  context:
    "A host turned on \"Review uploads before they appear\". Every upload now waits in a queue above their album until they approve it or put it down. Every option is the shipped review surface with one thing changed, over one wedding's seven waiting uploads, at 1440 with 375 on the knob. Nothing here approves, hides or removes anything: the triage machine is forked so its two Server Functions are a resolved promise.",
  bible: [1, 4, 12, 21, 22],
  asks: [
    {
      id: "queue",
      label: "The queue",
      question: "How should a photograph waiting for approval be shown?",
      context:
        "Seven uploads wait in a grid of 4:5 boxes, every one cropped to the same shape so selection targets line up. The host is being asked to judge photographs they cannot see whole.",
      options: [
        {
          id: "uniform",
          label: "The 4:5 grid, as today",
          means:
            "Every waiting upload the same box, cropped to fit. Tidy to select from, and a landscape loses its edges.",
        },
        {
          id: "natural",
          label: "The album's own shapes",
          means:
            "The masonry the gallery already uses, so a photograph is judged at the shape it was taken at.",
        },
        {
          id: "one",
          label: "One at a time, whole",
          means:
            "The queue becomes a room: one upload uncropped, Approve and Hide under it, the rest as a strip.",
        },
      ],
      recommended: "natural",
      because:
        "Judging is looking, and a crop hides the part of a photograph a host would have refused it for. The uniform box was chosen for selection, which is the mode a host is in least.",
      overrule:
        "The uniform grid is his own ruling of 2026-06-22. If select mode is the real job, it stands.",
      lands:
        "What the review queue draws, and whether judging and selecting want the same grid.",
      configs: [SCREEN],
    },
    {
      id: "verb",
      label: "The verb",
      question: "What should the button that refuses an upload be called?",
      context:
        "It says Hide, and so does the chip on an album tile. One word covers two different acts: refusing something nobody has seen, and taking down something everyone has.",
      options: [
        {
          id: "today",
          label: "Hide for both, as today",
          means:
            "One word, two acts. The album shows what it produced: dimmed tiles with no trace of which act put them there.",
        },
        {
          id: "reject",
          label: "Reject at the door, Hide after",
          means:
            "Two acts, two words. The row lands in exactly the same state; only what the host is told changes.",
        },
        {
          id: "chip",
          label: "One word, and the tile says",
          means:
            "Hide everywhere, plus a Hidden chip on the album tile, so the state carries the meaning the word drops.",
        },
      ],
      recommended: "reject",
      because:
        "Hide reads as taking something down. In a queue of photographs nobody has seen it describes a thing that has not happened, and the host is left guessing what it will do.",
      overrule:
        "If one verb across the product beats two precise ones, the chip does the same work without a second word.",
      lands:
        "The word on the review bar, the lightbox and the settings line. The row state never changes.",
      configs: [SCREEN],
    },
    {
      id: "peek",
      label: "The peek",
      question: "What should a tap on a waiting photograph open?",
      context:
        "A full-bleed look with one close button and no verdict on it. To act, the host closes it, finds the tile again, and decides from the thumbnail they just left.",
      options: [
        {
          id: "readonly",
          label: "A look, as today",
          means:
            "Look, close, then decide from the grid. Its own comment promises Escape closes it; nothing listens for Escape.",
        },
        {
          id: "verdict",
          label: "A look you can act in",
          means:
            "Approve and Hide on the look itself, so the judgement happens where the photograph is big enough to judge.",
        },
        {
          id: "viewer",
          label: "The media viewer, curating",
          means:
            "The look becomes the product's one viewer: arrows, who sent it, and the verdict on its pill.",
        },
      ],
      recommended: "verdict",
      because:
        "The peek exists so a host can judge, and it is the only surface in the act where they cannot. Adding two buttons costs a row and closes the loop the grid opened.",
      overrule:
        "If there should be one viewer in the product, this is `media-viewer`'s question and not a second one.",
      lands: "What a tap in the queue does, and where a verdict can be given.",
      after: { ask: "queue" },
      configs: [SCREEN],
    },
    {
      id: "keys",
      label: "The keyboard",
      question: "Should a host be able to clear a queue from the keyboard?",
      context:
        "There is no keyboard triage anywhere. A host at a laptop with forty uploads makes forty round trips with a mouse. Press the keys inside the frame; they are really bound here.",
      options: [
        {
          id: "none",
          label: "Taps only, as today",
          means:
            "Every verdict is a tap. The only keys in the product are the viewer's arrows.",
        },
        {
          id: "jk",
          label: "j and k, a and h",
          means:
            "The power idiom, and nothing on the page says it exists. Fast for whoever finds it.",
        },
        {
          id: "arrows",
          label: "Arrows, with a hint row",
          means:
            "Arrows move, Enter approves, Backspace hides, and one quiet row under the header says so.",
        },
      ],
      recommended: "arrows",
      because:
        "A queue of forty is the one place in this product where a keyboard beats a mouse, and a shortcut nobody is told about is not a feature. The hint row is the whole difference.",
      overrule:
        "If the host app is a phone product first, the row is furniture at 375 and buys nothing.",
      lands:
        "Whether the queue takes keys at all, and whether the product ever teaches a shortcut.",
      after: { ask: "peek" },
      configs: [SCREEN],
    },
    {
      id: "undo",
      label: "After a bulk act",
      question: "After approving or hiding several at once, what should the toast offer?",
      context:
        "Approve all is one tap over the whole queue. It lands as a plain sentence, and nothing in the product carries an Undo. Fired for real here: five approved on arrival.",
      options: [
        {
          id: "plain",
          label: "The sentence, as today",
          means:
            "Approved 5 photos, then gone. Both acts are reversible, one photograph at a time, once you find them again.",
        },
        {
          id: "undo",
          label: "An Undo on the toast",
          means:
            "The same sentence with one button, for the seconds the product still knows which five you meant.",
        },
        {
          id: "hold",
          label: "Five seconds before it commits",
          means:
            "The tiles leave, a hairline drains, and the server is only called when it runs out.",
        },
      ],
      recommended: "undo",
      because:
        "The cost of a wrong bulk act is not that it cannot be reversed; it is that the five are now five of two hundred. The toast is the last moment anything knows which ones they were.",
      overrule:
        "If an act should never feel provisional, the plain sentence is the honest one and the album is the place to fix it.",
      lands:
        "Whether Undo enters the product's vocabulary, and how a bulk act commits.",
      configs: [SCREEN],
    },
    {
      id: "arrivals",
      label: "One lands mid-visit",
      question: "A photograph lands while the host is reviewing: what should the queue do?",
      context:
        "Nothing. The guest's album polls; the host's page does not. A host can clear the queue, read all caught up, and leave with uploads waiting. Three land here after a moment.",
      options: [
        {
          id: "silence",
          label: "Nothing, as today",
          means:
            "They exist in the database and on no screen the host is looking at, including the one that says caught up.",
        },
        {
          id: "prompt",
          label: "A line that says how many",
          means:
            "Three new above the grid, folded in on a tap, so nothing ever moves under a selection.",
        },
        {
          id: "live",
          label: "Straight in at the top",
          means:
            "They join the queue as they land, unless something is selected, in which case they wait behind a prompt.",
        },
      ],
      recommended: "prompt",
      because:
        "All caught up is a promise this page cannot keep. A prompt keeps it honest and keeps the surface still, which matters most on the one screen a host is working down methodically.",
      overrule:
        "If a host would rather the queue simply be right, live insertion is the same build with one rule dropped.",
      lands:
        "Whether the host page learns about new uploads, and what it costs a selection.",
      configs: [SCREEN],
    },
    {
      id: "count",
      label: "The count",
      question: "How many places should tell a host how many uploads are waiting?",
      context:
        "Three: the header bell, the event card's amber chip, and the event page's Review header. None of them is live, none links to the work, and after a clear the bell still says nine.",
      options: [
        {
          id: "three",
          label: "All three, as today",
          means:
            "An aggregate that lands on the dashboard, a per-event chip, and a header count, disagreeing quietly.",
        },
        {
          id: "deeplink",
          label: "Three that agree, and lead somewhere",
          means:
            "The bell names the event and opens its queue; all three read the same number.",
        },
        {
          id: "one",
          label: "One count, on the card",
          means:
            "The chip on the event card is the only one. The bell drops its review row; the header keeps the queue.",
        },
      ],
      recommended: "deeplink",
      because:
        "A count is a call to action, and the bell's is the only one a host meets when they are not already looking at the event. It should land on the queue, not on a list of events.",
      overrule:
        "If three numbers is two too many whatever they say, the card's chip is the one a host actually decides from.",
      lands:
        "Where a waiting count is said, what it links to, and which surfaces own it.",
      configs: [SCREEN],
    },
    {
      id: "told",
      label: "The guest",
      question: "Should a guest whose photograph was refused ever be told?",
      context:
        "A guest is told once, at upload, that the host reviews uploads. After that, nothing, ever, including in their own feed. The marketing FAQ answers this in public with \"Never\".",
      options: [
        {
          id: "never",
          label: "Never, as today",
          means:
            "They sent ten and can see nine. Nothing on any page, or in any email, accounts for the tenth.",
        },
        {
          id: "line",
          label: "A quiet line in their own feed",
          means:
            "The photograph stays theirs, dimmed, marked not in the album. No reason, no appeal, nobody else sees it.",
        },
        {
          id: "message",
          label: "A message",
          means:
            "A notice that names the event and says one of theirs was not added.",
        },
      ],
      recommended: "never",
      because:
        "A refusal is the host's private judgement about their own party. Telling a guest turns a quiet act of curation into a social event at a wedding, and the FAQ already promises silence in public.",
      overrule:
        "This is the one on this board to overrule. If a guest has a right to know where their own photograph went, the line says it to them alone.",
      lands:
        "A public FAQ answer, what the guest's own feed shows, and whether a refusal ever sends anything.",
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
export const HOST_CURATION: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
