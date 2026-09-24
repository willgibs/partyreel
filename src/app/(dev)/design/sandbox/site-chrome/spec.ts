import { defineExploration } from "@/components/lab/exploration";

/**
 * THE MARKETING SITE'S CHROME, ROUND TWO (2026-09-19): the footer alone.
 *
 * Round one's verdict on `foot-job` kept the sign-off register (today's
 * shape), and his note went further (the fourth batch, verbatim): "The
 * reason I like this one over 3 (the closing
 * invitation) is because most of our pages close with a CTA section in the
 * same rough shape as your '3' design. Having those back to back would feel
 * very repetitive, would rather them work together. Knowing this now, would
 * love to see a couple additional explorations of footers that work well
 * with that closing CTA pattern above." This round is that ask, by name.
 *
 * Seven of round one's eight decisions already answered and land on the real
 * chrome via `chrome-wiring` at the same time as this round (the header, the
 * panel, the phone's menu, the material); none of that is reopened here. The
 * eighth, `foot-job`, is this board's one surviving subject, recut into three
 * narrower questions now that its premise has changed: not "what is the
 * footer for" in the abstract, but "what is it for, right after a page's own
 * closing CTA, and does a page with no CTA above it deserve the same answer".
 *
 * ★ EVERY OPTION IS DRAWN UNDER A REAL PAGE, NOT THE FOOTER ALONE. `foot-after`
 * stands under the rebuilt `/how-it-works` close (a real `CtaBand`, imported,
 * never redrawn) and `foot-alone` under `/about`'s real final section, the one
 * route that runs straight from ordinary content into the footer with nothing
 * above it. Round one's own `foot-job` and `foot-door` already answered, not
 * reopened: every option here draws the CTA unconditionally, the coupling to
 * `DEMO_EVENT_URL` already gone.
 *
 * ★ WHY `foot-alone` STAGES AND `foot-phone` DOES NOT. `foot-alone`'s own
 * options are only a real choice once `foot-after` has an answer to measure
 * against; `foot-phone` asks a third, independent thing (how the invitation
 * travels to a screen nobody can scan with itself) that carries no such
 * dependency.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21). `demo-event` round two
 * ("the closing sitting's second batch") retired the
 * photo pile this round was written against: every demo door, the footer
 * included, now shares ONE object, a photograph in a plain mat with the live
 * code tucked into its corner (`FooterDemo` → `DemoFrame`,
 * `components/marketing/system/demo-ticket.tsx`). `foot-after` is redrawn on
 * that shipped object rather than the pile it was drawn against. `foot-alone`
 * gains a fifth real route: `pricing-page` round two now closes on its own
 * folded questions rather than an invitation, so it reaches the footer the
 * same way `/about`, `/press`, `/careers` and the 404 already do.
 *
 * ★ THE REFRESH'S OWN PASS (2026-09-24). Two of the three were fenced by
 * something outside themselves rather than judged on their own case, so both
 * are reopened here rather than only reworded. `foot-alone` was a straight
 * binary (give a standalone page the full register, or make it match whatever
 * a closed page gets); a third path, a closing line built for the page that
 * asked nothing else, is drawn beside them. `foot-phone` had settled on
 * "hidden" partly because a different board's ruling made "small" read as the
 * weakest of the three, which fences an option by an argument that was never
 * about this ask; judged fresh, the real tension is what a QR is FOR on a
 * screen that cannot scan itself, and a fourth path, a code revealed on a tap
 * for someone standing next to the reader, answers that directly instead of
 * only picking between showing one and hiding one.
 */
export const SITE_CHROME = defineExploration({
  id: "site-chrome",
  title: "The site's chrome",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "foot-alone gains a third path: a closing line built for a page that asked nothing else. foot-phone judged fresh, not pre-weighted by an unrelated ruling: a fourth path, a code revealed on a tap for someone nearby, joins hidden, small and none. The other seven stay out of scope (chrome-wiring).",
  },
  context:
    'Will, round one (the fourth batch): he kept the sign-off over a bigger close because most pages now end on a CtaBand "in the same rough shape", and back to back "would feel very repetitive, would rather them work together"; his ask was "a couple additional explorations of footers that work well with that closing CTA pattern above". Three decisions, drawn under a real close and under a real page with none.',
  asks: [
    {
      id: "foot-after",
      label: "The foot after a close",
      question:
        "What should the footer show directly under a page that already closes with its own invitation?",
      context:
        "Most marketing pages end on a CtaBand. The register right after used to be a photo pile; it is one framed photograph now (demo-event r2). Does a second closing object belong right under a page that already asked once?",
      options: [
        {
          id: "today",
          label: "The framed photograph, unchanged",
          means:
            "The same framed photograph and its corner code, the same heading and copy, directly under the page's own close. The shipped shape, held up next to a real one.",
        },
        {
          id: "quiet",
          label: "A quiet strip",
          means:
            "One slim row: a small code and one line, sitting right above the index rather than a section of its own.",
        },
        {
          id: "merged",
          label: "One dark composition",
          means:
            "The close and the footer share one ink background with no seam; the close's own demo line is the only invitation.",
        },
        {
          id: "tucked",
          label: "The index first",
          means:
            "No top register at all: the index opens the footer cold, and a small demo line rides the legal bar instead.",
        },
      ],
      recommended: "quiet",
      because:
        "A single framed photograph is a smaller repeat than the old pile, but it is still a second closing object under a page that already asked once, which is the exact repetition he flagged; a slim strip keeps the mention alive without competing with the close for the last word.",
      overrule:
        "If the frame's restraint reads different enough from the close above, today is the cheaper hold; if the close feels complete, merged or tucked is cleaner.",
      lands:
        "Whether the shipped framed register survives next to a real closing CTA, and in what shape.",
    },
    {
      id: "foot-alone",
      label: "The foot where nothing closes the page",
      question:
        "Should a page with no closing invitation of its own get a bigger footer than one that already closed?",
      context:
        "Not every route closes on a CtaBand: /about, /press, /careers and the 404 reach the footer with nothing above it. pricing-page now joins them a different way (r1, r2): folded questions, neither silence nor invitation.",
      options: [
        {
          id: "full",
          label: "The full sign-off, only there",
          means:
            "A page with nothing else asking keeps today's whole invitation, whatever a closed page above picks instead.",
        },
        {
          id: "line",
          label: "A closing line, built for this page",
          means:
            "Its own short heading and one sentence, plus the code: lighter than the full register, more deliberate than a footnote to a close that, here, was never asked.",
        },
        {
          id: "same",
          label: "One footer everywhere",
          means:
            "No special case: if a standalone page wants a bigger close, that is the page's job to add, never the footer's.",
        },
      ],
      recommended: "full",
      because:
        "Five real routes now reach the footer having asked nothing more of the reader, whether that is silence or a closed FAQ; the footer is the only closing gesture any of them have, so it should not go quiet for the sake of consistency with pages that already had one.",
      overrule:
        "If full feels like too much for a page as short as the 404, line is the built-for-it middle path; if routes like that are rare, same is the plain answer.",
      lands:
        "Whether the footer special-cases a page with no CtaBand above it, and if so, with the shipped register or one built for the case.",
      after: { ask: "foot-after" },
    },
    {
      id: "foot-phone",
      label: "The phone's foot",
      question: "How should the footer's demo invitation travel to a phone?",
      context:
        "A phone showing its own QR code cannot scan it: a footer code on that screen is dead weight to the person reading it, not to a friend standing beside them. Today the frame hides below its breakpoint, a link stands in its place.",
      options: [
        {
          id: "hidden",
          label: "The frame hidden, a link",
          means:
            "As today: no code at all here, a single tap-through line in its place.",
        },
        {
          id: "reveal",
          label: "A code revealed on a tap",
          means:
            "The footer stays a plain link until asked; a tap grows a real code sized for someone else's camera, not this screen's own.",
        },
        {
          id: "small",
          label: "A small code",
          means:
            "The code stays, small and always visible, beside the heading: familiar, even though this exact screen can never be the one that scans it.",
        },
        {
          id: "none",
          label: "Nothing but the index",
          means:
            "No demo mention at all on a phone: the footer opens straight to the index.",
        },
      ],
      recommended: "reveal",
      because:
        "A QR's whole job is to be read by a camera that is not the screen showing it, so hiding it outright throws away the one real use a phone code has: showing someone standing next to the reader. A tap keeps the footer quiet by default and only pays the space when that moment happens.",
      overrule:
        "If even a tap is more than a footer should ask, hidden's plain link is simpler; small keeps a code visible that this screen can't use; none drops it outright.",
      lands:
        "Whether a phone ever shows a QR code in the footer, and whether showing one costs a tap or nothing at all.",
      tile: "phone",
    },
  ],
});
