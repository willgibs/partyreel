import { defineExploration } from "@/components/lab/exploration";

/**
 * THE TOAST, AS A SYSTEM (2026-09-20).
 *
 * Will (docs/design/rulings.md, 2026-09-19, `moment=today`): "This provides
 * the same context as your recommended option 3 without getting too long for
 * a temporary toast. If no exploration has handled this already, I'd like to
 * redesign our toasts." None has: six boards elsewhere have each already
 * decided a toast's WORDS (guest-upload's send, host-curation's bulk verdict,
 * export-flow's mint, app-pricing's refusal), and this board keeps every one
 * of them rather than rewriting a line that is not its question. What IS its
 * question is the system underneath: where a toast sits, what it is made of,
 * how long it lives, how a pile of them behaves, and whether one may ever
 * carry a button - five decisions, asked once, answered for every call site.
 *
 * ★ THE FIRST LINE HALVES THE COUNT BEFORE ASKING ANYTHING. IF THE CONTROL
 * CAN SHOW IT, NO TOAST: `copy-share-link.tsx` already flips Copy to a check
 * mark AND fires "Link copied to clipboard." today, saying the same thing
 * twice; a switch that visibly moved needs no second announcement; a tile
 * that dims and re-keys in place needs none either. A toast is for the
 * moment nothing already on screen is going to say it: a send that draws no
 * tile, a bulk act on things now out of view, a mint with no surface left
 * open, a refusal with nowhere else to land.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. Whether a given moment should be a toast
 * AT ALL is the owning board's call (export-flow's own `wait` question is
 * already trending toward a dialog panel instead); this board only asks how
 * a toast behaves on the moments that stay toasts. Nor is glass an option
 * for `material`: it was ruled over photographs (`glass` r1/r2), and a toast
 * sits over UI, never over media - the two are different problems with
 * different rulings.
 */

const DRAFT = defineExploration({
  id: "toasts",
  title: "Toasts, as a system",
  round: {
    n: 1,
    date: "2026-09-20",
    changed:
      "Round one: five decisions on the real toasts (183 sonner calls today, six kinds), drawn on guest-upload's send, host-curation's bulk verdict, an export mint, a pricing refusal and a plain info, at 375 and 1440.",
  },
  context:
    "Will: \"If no exploration has handled this already, I'd like to redesign our toasts\" (`moment=today`). None has. Six boards elsewhere already decided a toast's WORDS (guest-upload, host-curation, export-flow, app-pricing); this board keeps every one and asks the system around them instead. Its first line halves the count before asking anything: IF THE CONTROL CAN SHOW IT, NO TOAST (`CopyShareLink` flips its own icon and fires one anyway, today - the worked example, below). Glass sits out: ruled over photographs, and a toast sits over UI.",
  bible: [8, 12, 15, 21],
  asks: [
    {
      id: "where",
      label: "Where",
      question: "Where should a toast appear on the screen?",
      context:
        "Sonner mounts with no `position`: bottom-right on a desk, a full-width band at a phone's foot below 600px - the same strip as the guest's floating Add pill, the lightbox's credit line, and the host's own fixed action bar.",
      options: [
        {
          id: "today",
          label: "The foot, as today",
          means:
            "Sonner's own default: clear on an idle desk (bottom-right); on a phone, a full-width band at the very bottom, sharing the strip with whatever lives there.",
        },
        {
          id: "top",
          label: "The top, under the bar",
          means:
            "Both sizes move to a band under the header, clear of every fixed-bottom control on the page today, guest or host.",
        },
        {
          id: "foot",
          label: "The foot, on both",
          means:
            "The desk gives up bottom-right for the same bottom-center band the phone already uses: one rule regardless of size.",
        },
      ],
      recommended: "top",
      because:
        "The foot is claimed twice already: the guest's floating Add pill and the lightbox's credit line on a phone, the host's own fixed action bar (bottom-CENTER, not bottom-right) on both sizes. A toast there is a third or fourth thing fighting the same strip.",
      overrule:
        "If a toast should read as answering the control that fired it, the foot keeps it beside that control: time it around the bar's motion instead of moving it away.",
      lands:
        "Sonner's `position` prop on the one Toaster in `layout.tsx`, and whether the host and guest share a rule or keep two.",
    },
    {
      id: "material",
      label: "Material",
      question: "What material should a toast's surface be?",
      context:
        "Today's toast is bg-popover, a hairline border and shadow-layer: the same step every menu and dialog wears. Two other techniques exist in the product; this asks which one a toast keeps.",
      options: [
        {
          id: "card",
          label: "The popover card, as today",
          means:
            "bg-popover, the border, shadow-layer beneath: the ring and the layer together, exactly like every other floating surface.",
        },
        {
          id: "ink",
          label: "Ink, regardless of theme",
          means:
            "The same card, forced dark (the real dark tokens, scoped) whatever the page's own theme is: one fixed voice rather than a panel that matches the room.",
        },
        {
          id: "shadow",
          label: "The card with the house shadow only",
          means:
            "Loses the hairline border, keeps shadow-layer alone to separate it from the page: one fewer edge, the same lift.",
        },
      ],
      recommended: "card",
      because:
        "Every floating surface in the product wears the ring and the layer together on purpose (Will: \"I now see how step, ring, lift, and float work together\"). A toast that drops one becomes the one exception in a family built to have none.",
      overrule:
        "If a toast's own colour fill already separates it from the page, the ring is one line the layer alone can carry, and dropping it is one exception worth making.",
      lands:
        "The toast's own classes in `ui/sonner.tsx` and the state rule in `globals.css`, and whether it keeps reading as one of the floating family.",
    },
    {
      id: "life",
      label: "Life",
      question: "How long should a toast stay before it leaves on its own?",
      context:
        "Every toast clears in a flat four seconds today, whatever it says. Two call sites already override it to 8000ms for a longer sentence; an error can vanish before the fix it names is read.",
      options: [
        {
          id: "fixed",
          label: "Four seconds, as today",
          means:
            "One clock for every kind and every message, from a two-word confirmation to a sentence with a description under it.",
        },
        {
          id: "length",
          label: "By length",
          means:
            "The clock reads the message: a short confirmation clears in about three seconds, a toast carrying a description holds nearer eight.",
        },
        {
          id: "persist",
          label: "Errors stay until dismissed",
          means:
            "Success and warning keep the fixed clock; an error waits for a press, since a failure that disappears before it is read repeats itself.",
        },
      ],
      recommended: "persist",
      because:
        "A flat four seconds does not know it is holding two words or the two-sentence notice already living at an 8-second override in two places; an error whose fix disappears before it is read is a failure repeating itself, for a slow reader or a screen reader alike.",
      overrule:
        "If one clock is the whole promise, four seconds flat stays simplest as call sites grow; a length formula is one more thing to get right.",
      lands:
        "Sonner's per-call `duration`, and whether a new call site inherits a rule or has to choose one.",
    },
    {
      id: "stack",
      label: "Stack",
      question: "When more than one toast is on screen, how should they stack?",
      context:
        "Sonner collapses a pile to slivers of each edge until a hover expands it. A batch that drops three toasts in two seconds has no hover to reach for on the phone this product is built on.",
      options: [
        {
          id: "collapsed",
          label: "Collapsed, as today",
          means:
            "Sonner's own default: later toasts fan out a few pixels behind the front one until a hover (or a tap, on a phone) opens the pile.",
        },
        {
          id: "expanded",
          label: "Always expanded",
          means:
            "Every toast keeps its full height in its own row, so a run of three bulk outcomes reads as three full sentences, newest on top.",
        },
        {
          id: "one",
          label: "One at a time",
          means:
            "A new toast replaces whatever is showing instead of joining it, so the screen never holds more than one.",
        },
      ],
      recommended: "expanded",
      because:
        "Sonner's collapse-then-expand has no hover on the phone this product is built for: a batch that drops three toasts in two seconds shows slivers nothing on a touch screen can open.",
      overrule:
        "If five queued toasts stacked full height ever crowd a small screen, collapsed is the shape that scales, and the fix is expanding on tap, not only hover.",
      lands:
        "Sonner's `expand` prop, and how tall the corner gets during a busy batch.",
    },
    {
      id: "action",
      label: "Action",
      question: "Should a toast ever carry a button of its own?",
      context:
        "Eleven doors in the app today answer with a toast, and one of them already carries Upgrade. Host-curation's own bulk toast wants an Undo; nothing in the product carries one yet.",
      options: [
        {
          id: "always",
          label: "Always room for one",
          means:
            "Every toast reserves the same trailing slot: filled with Undo, Retry or a named door when there is one, empty when there is not.",
        },
        {
          id: "never",
          label: "Never",
          means:
            "A toast only ever states what happened. Undo moves into the album beside what it undoes, and a refusal's Upgrade moves to wherever the lock is.",
        },
        {
          id: "errors",
          label: "Only on errors",
          means:
            "A success or a warning stays a plain sentence with nothing to press. Only an error, the one kind already asked to persist, may carry the button that fixes it.",
        },
      ],
      recommended: "always",
      because:
        "Host-curation's own bulk toast already wants an Undo on a SUCCESS (\"the toast is the last moment anything knows which five you meant\"), and the pricing refusal already ships with Upgrade. The shared rule is the SLOT, not which kind may fill it.",
      overrule:
        "If a filled slot on good news reads as asking to be pressed when nothing is wrong, only errors keep the button; Undo moves into the album beside what it undoes.",
      lands:
        "Sonner's `action` / `cancel` prop, and whether a new success toast is written expecting one.",
    },
  ],
});

export const TOASTS: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
