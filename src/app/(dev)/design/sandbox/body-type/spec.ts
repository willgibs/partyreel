import { defineExploration } from "@/components/lab/exploration";

/**
 * BODY AND LABEL TYPE, ROUND TWO: THE BUTTON RUNG'S ICON AND HEIGHT
 * (2026-09-20).
 *
 * Round one's seven decisions are ruled (docs/reviews/body-type.json;
 * verbatim in docs/design/rulings.md, "the fifth batch") and `ladder-wiring`
 * wired six of them onto real `--text-*` steps (`59345bc8`): reading=16,
 * working=14, marketing=fluid (16 to 18), caption=10 with the caption step
 * itself staying 12, label=12 on 0.08em, leading=length (2 x size - 8). The
 * seventh, `buttons=ladder`, was not a direct pick: "I'd like the button text
 * sizes to be on the ladder so they aren't one-offs, but directly applying
 * what exists on the ladder ... did not feel perfectly matched. In
 * particular, the download and select buttons felt mismatched between their
 * icon sizes and new font size." His own steer for the redo: "A lab round
 * two on the button rung (Recommended)."
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the
 * `app-vocabulary` precedent, `album-controls`, 2026-09-20: a round replaces
 * its questions rather than accreting them). The ledger keeps every one of
 * round one's answers for ever; this board only ever carries what is still
 * open, which round two narrows to the one piece his note left unresolved:
 * not WHETHER a button's text sits on the ladder (ruled), but how its ICON
 * and HEIGHT follow that text once it does.
 *
 * ★ NOTHING HERE IS A NEW LOOK, and this round draws on the REAL `Button`
 * (`src/components/ui/button.tsx`, imported and never edited) at every size
 * it ships, in the real rows named in the manifest: the Gallery header's
 * Download and Select at `sm` (`gallery-actions.tsx`, `download-all-
 * button.tsx` — read for their exact label, icon and variant, reconstructed
 * here because both read a provider or the network this lab cannot mount),
 * the guest album's own hand-rolled Download at 14 (`live-gallery.tsx`, not a
 * Button component at all, drawn unchanged for comparison), a `default`
 * action, a `cta`, and the four icon-only sizes together. Every number under
 * a frame is read off the real box (`getComputedStyle`, `getBoundingClientRect`),
 * never computed and printed: text px, icon px, height px and the flex gap.
 */
const DRAFT = defineExploration({
  id: "body-type",
  title: "Body and label type",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one's seven decisions are ruled; ladder-wiring wired six. This round drops all seven and asks the one piece his note left open: how a button's icon and height follow the text step it now wears, on the real Button at every size, measured in the frame.",
  },
  context:
    'Will, on `buttons=ladder` (body-type r1): "the download and select buttons felt mismatched between their icon sizes and new font size." One decision on the real Button (xs, sm, default, lg, cta, the four icon-only sizes) at 1440 and 375, plus the guest album\'s hand-rolled Download for reference; round one\'s other six steps are ruled and wired (docs/reviews/body-type.json; ladder-wiring, 59345bc8). Nothing here reaches button.tsx.',
  bible: [5, 7, 21],
  asks: [
    {
      id: "pairs",
      label: "Icon and height pairing",
      question:
        "How should a button's icon size and height follow its new text step?",
      context:
        'body-type r1 sent buttons=ladder to round two: "the download and select buttons felt mismatched between their icon sizes and new font size." Drawn on the real Button at every size, plus the guest\'s raw Download, at 1440 and 375.',
      options: [
        {
          id: "text",
          label: "Icon equals the text step",
          means:
            '12/12, 14/14, 16/16. sm\'s icon shrinks from 14 to 12; default, lg and cta shrink too. The flattest reading of "on the ladder."',
        },
        {
          id: "step-up",
          label: "Icon one notch over the text",
          means:
            "12/14, 14/16, 16/18. Reaches sm's own pairing by a stated rule rather than an accident; grows xs and cta a step; every height already has the room.",
        },
        {
          id: "today",
          label: "Today's icons, new text step",
          means:
            "Every size keeps its shipped icon (12, 14, 16, 16); only the text moves. Literally what he saw: sm's new 12 text beside its old, untouched 14 icon.",
        },
      ],
      recommended: "step-up",
      because:
        'Turns his "mismatched" pairing into a stated rule rather than an accident: every icon sits one Tailwind step over its text. It also moves the least, since sm, default, lg and cta already sit at these numbers today.',
      overrule:
        "If icon and text should read as one weight, `text` is the flatter pairing; it costs default, lg and cta a visibly smaller icon than today.",
      lands:
        "Every Button size's icon, and the four icon-only sizes, at the wiring lane that reaches button.tsx's cva table.",
      configs: [
        {
          id: "width",
          label: "Width",
          // Two literal labels, not an import: spec.ts is read from a server
          // page and from a node test (board-spec.ts's own rule), and
          // surfaces.tsx is "use client" — pulling its WIDTHS in crossed that
          // boundary and handed the server a client reference proxy instead
          // of the real object (build error: "Cannot read properties of
          // undefined (reading 'name')"). Round one's own WIDTH control
          // (git show 59345bc8^:.../body-type/spec.ts) hardcoded these same
          // two strings for the same reason.
          options: [
            { id: "1440", label: "1440, a desktop" },
            { id: "375", label: "375, a phone" },
          ],
          default: "1440",
        },
      ],
    },
  ],
});

export const BODY_TYPE: typeof DRAFT = DRAFT;
