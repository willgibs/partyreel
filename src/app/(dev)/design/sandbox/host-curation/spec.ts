import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST'S ACT OF REVIEWING WHAT GUESTS SEND, ROUND ONE (2026-09-19;
 * RESHAPED 2026-09-21).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app is unprotected,
 * "absolutely everything is up for relitigation or reconcepting from the ground
 * up". This is the one act in the product where a host judges another person's
 * photograph, so it is asked from the foundation and LAPTOP FIRST: 1440 is the
 * default screen because a host clearing forty uploads is sitting down, and 375
 * is the knob on every decision because the tile row collapses to two chips
 * there and a queue that only works at 1440 is a finding.
 *
 * ★ RESHAPED, NEVER ANSWERED BY PRECEDENT (the overtaken audit, Will
 * 2026-09-21: a question that "fits the flow of potentially offering a better
 * solution than the earlier selection that overtook it ... should be reshaped
 * to be a more current question with updated context"). Seven of these eight
 * questions wore a badge naming a ruling that had landed on top of them since
 * they were drawn, and one of the seven had conceded outright. Every badge is
 * FOLDED INTO ITS QUESTION now: the ruling is the ground the answer stands on
 * rather than a note beside it. No option was dropped here, because none of
 * the rulings forbids one; the board stays at round one and stays unanswered.
 * `keys` was never reached by anything and is untouched.
 *
 * ★ THE ONE CONCESSION IS OPEN AGAIN, AND THAT IS THE REASON THE AUDIT EXISTS.
 * `peek` conceded to the rule that every action on a photograph lives in the
 * lightbox's controls; he then narrowed that rule to a PHONE in his own words
 * ("Desktop should still support hover on cards"). So the phone's half is
 * ruled, the desk's half never was, and the question is reshaped to the half
 * that is still open rather than deleted for the half that is not.
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
    date: "2026-09-21",
    changed:
      "Reshaped by the overtaken audit: seven questions now carry the rulings that reached them as their own context, the peek is asked at a desk because the phone's half is ruled, the crop is named as the exception one tile would have to build, and the queue answers a guest's waiting tile.",
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
        "Seven uploads wait in 4:5 boxes, cropped the same so selection targets line up. One tile draws every other grid now, so this crop is the exception; the guest sees the same photograph dimmed under a clock, waiting for the host.",
      options: [
        {
          id: "uniform",
          label: "The 4:5 grid, the exception to build",
          means:
            "Every waiting upload the same box, cropped to fit. Tidy to select from, a landscape loses its edges, and one tile draws every other grid.",
        },
        {
          id: "natural",
          label: "The album's own shapes",
          means:
            "The masonry the one tile already draws everywhere else, so a photograph is judged at the shape it was taken at.",
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
        "Judging is looking, and a crop hides the part of a photograph a host would have refused it for. The uniform box was chosen for selection, the mode a host is in least, and it is the only grid in the product that crops now.",
      overrule:
        "The uniform grid is his own ruling of 2026-06-22. If select mode is the real job it stands, and the exception is worth its code.",
      lands:
        "What the review queue draws, and whether the one tile carries an exception for this room.",
      configs: [SCREEN],
    },
    {
      id: "verb",
      label: "The verb",
      question: "What should the button that refuses an upload be called?",
      context:
        "It says Hide, and so does the chip on an album tile: one word for refusing what nobody has seen and for taking down what everyone has. A tile carries a fourth mark now, so a Hidden chip has a precedent and a place to sit.",
      options: [
        {
          id: "today",
          label: "Hide for both, as wired",
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
            "Hide everywhere, plus a Hidden chip beside the own-tile mark, so the state carries the meaning the word drops.",
        },
      ],
      recommended: "reject",
      because:
        "Hide reads as taking something down. In a queue of photographs nobody has seen it describes a thing that has not happened, and the host is left guessing what it will do.",
      overrule:
        "If one verb across the product beats two precise ones, the chip does the same work without a second word, on a tile that carries marks already.",
      lands:
        "The word on the review bar, the lightbox and the settings line. The row state never changes.",
      configs: [SCREEN],
    },
    {
      id: "peek",
      label: "The peek",
      question: "What should a tap on a waiting photograph open at a desk?",
      context:
        "A full-bleed look with one close button and no verdict on it: close, find the tile, decide from the thumbnail you left. On a phone the verdict is ruled into the one viewer's controls; at a desk a card still takes hover actions.",
      options: [
        {
          id: "readonly",
          label: "A look, as wired",
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
            "The look becomes the product's one viewer: arrows, who sent it, and the verdict on its pill, which is what a phone gets already.",
        },
      ],
      recommended: "verdict",
      because:
        "The peek exists so a host can judge, and it is the only surface in the act where they cannot. The phone's answer is ruled; what a mouse gets is not, and two buttons there cost a row and close the loop the grid opened.",
      overrule:
        "If there should be one viewer at every width, this is `media-viewer`'s question and not a second one.",
      lands:
        "What a tap in the queue does at a desk, and where a verdict can be given.",
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
        "Approve all is one tap over the whole queue, landing as a plain sentence; nothing in the product carries an Undo. The review bar and the gallery's bulk bar are one component now, and a run's outcome is read on one surface at its end.",
      options: [
        {
          id: "plain",
          label: "The sentence, as wired",
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
        "Whether Undo enters the product's vocabulary, and how a bulk act commits on the one bar.",
      configs: [SCREEN],
    },
    {
      id: "arrivals",
      label: "One lands mid-visit",
      question:
        "A photograph lands while the host is reviewing with a selection held: what should the queue do?",
      context:
        "Nothing. The host's hub is live now, a tile arriving under the glow with the count moving, but the Review room is not: a host can clear it, read all caught up, and leave with uploads waiting. Three land here, one tile selected.",
      options: [
        {
          id: "silence",
          label: "Nothing, as wired",
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
        "All caught up is a promise this page cannot keep, and the hub beside it keeps that promise already. A prompt keeps it honest and the surface still, which matters most on the one screen a host works down methodically.",
      overrule:
        "If a host would rather the queue simply be right, live insertion is the same build with one rule dropped.",
      lands:
        "Whether the Review room learns what the hub already knows, and what it costs a selection.",
      configs: [SCREEN],
    },
    {
      id: "count",
      label: "The count",
      question: "How many places should tell a host how many uploads are waiting?",
      context:
        "Three: the header bell, the event card's amber chip, and the Review header, which moves live now. They disagree and none links to the work. The dashboard's aggregate is the pulse, and a single event's prompt there is refused.",
      options: [
        {
          id: "three",
          label: "All three, as wired",
          means:
            "The pulse on the dashboard, a per-event chip, and a live header count, disagreeing quietly.",
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
        "A count is a call to action, and the bell's is the only one a host meets when they are not already looking at the event. It should land on the queue. The pulse answers the aggregate, so the chip and the bell are what is left.",
      overrule:
        "He refuses a single event's prompt on the dashboard. If the bell is one of those, the card's chip is the count a host decides from.",
      lands:
        "Where a waiting count is said beside the pulse, what it links to, and which surfaces own it.",
      configs: [SCREEN],
    },
    {
      id: "told",
      label: "The guest",
      question: "Should a guest whose photograph was refused ever be told?",
      context:
        "A guest is told once, at upload, that the host reviews; after that nothing, ever, and the FAQ answers this in public with \"Never\". Since: a guest owns their photographs, their tiles carry a mark, and they may keep a profile.",
      options: [
        {
          id: "never",
          label: "Never, as wired",
          means:
            "They sent ten and can see nine. Nothing on any page, or in any email, accounts for the tenth.",
        },
        {
          id: "line",
          label: "A quiet line in their own feed",
          means:
            "The photograph stays theirs, dimmed on their own tiles and on their profile, marked not in the album. No reason, no appeal, nobody else sees it.",
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
        "A public FAQ answer, what a guest's own feed and profile show, and whether a refusal ever sends anything.",
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
