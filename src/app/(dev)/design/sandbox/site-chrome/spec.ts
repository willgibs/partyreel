import { defineExploration } from "@/components/lab/exploration";

/**
 * THE MARKETING SITE'S CHROME, ROUND TWO (2026-09-19): the footer alone.
 *
 * Round one's verdict on `foot-job` kept the sign-off register (today's
 * shape), and his note went further (docs/design/rulings.md, the fourth
 * batch, verbatim): "The reason I like this one over 3 (the closing
 * invitation) is because most of our pages close with a CTA section in the
 * same rough shape as your '3' design. Having those back to back would feel
 * very repetitive, would rather them work together. Knowing this now, would
 * love to see a couple additional explorations of footers that work well
 * with that closing CTA pattern above." This round is that ask, by name.
 *
 * Seven of round one's eight decisions are ruled and landing on the real
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
 * above it. Round one's own `foot-job` and `foot-door` are decided, not
 * reopened: every option here draws the CTA unconditionally, the coupling to
 * `DEMO_EVENT_URL` already gone.
 *
 * ★ WHY `foot-alone` STAGES AND `foot-phone` DOES NOT. `foot-alone`'s own
 * options ("the full sign-off regardless" against "whatever `foot-after`
 * picked") are only a real choice once `foot-after` has an answer to be
 * "whatever" about; `foot-phone` asks a third, independent thing (how the
 * frame travels to a screen nobody can scan) that carries no such dependency.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21). `demo-event` round two
 * (docs/design/rulings.md, "the closing sitting's second batch") retired the
 * photo pile this round was written against: every demo door, the footer
 * included, now shares ONE object, a photograph in a plain mat with the live
 * code tucked into its corner (`FooterDemo` → `DemoFrame`,
 * `components/marketing/system/demo-ticket.tsx`). `foot-after` is redrawn on
 * that shipped object rather than the pile it was drawn against. `foot-alone`
 * gains a fifth real route: `pricing-page` round two now closes on its own
 * folded questions rather than an invitation, so it reaches the footer the
 * same way `/about`, `/press`, `/careers` and the 404 already do.
 * `foot-phone` leans harder toward the two options that commit either way,
 * now that `first-event` round one has ruled a code's real home is printed
 * stock: a phone's copy of it was always decoration, and that is no longer
 * this ask's own guess.
 */
export const SITE_CHROME = defineExploration({
  id: "site-chrome",
  title: "The site's chrome",
  round: {
    n: 2,
    date: "2026-09-21",
    changed:
      "foot-after redrawn for the shipped framed photograph, not the pile it was written against; foot-alone names pricing-page's folded close as a fifth bare route; foot-phone leans hidden vs none, small weakened now a code's home is ruled printed stock. The other seven stay out of scope (chrome-wiring).",
  },
  context:
    'Will, round one (docs/design/rulings.md, the fourth batch): he kept the sign-off over a bigger close because most pages now end on a CtaBand "in the same rough shape", and back to back "would feel very repetitive, would rather them work together"; his ask was "a couple additional explorations of footers that work well with that closing CTA pattern above". Three decisions, drawn under a real close and under a real page with none.',
  bible: [2, 8, 11, 16, 21, 22],
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
        "If those five routes are rare enough to matter less than one predictable footer everywhere, the same answer belongs on every page.",
      lands:
        "Whether the footer special-cases a page with no CtaBand above it, or draws one register everywhere.",
      after: { ask: "foot-after" },
    },
    {
      id: "foot-phone",
      label: "The phone's foot",
      question: "How should the footer's demo invitation travel to a phone?",
      context:
        "A QR is not part of the mobile answer: nobody scans their own screen. first-event r1 now rules a code's real home is printed stock, so a phone copy was always decoration; today the frame hides below its breakpoint, a link instead.",
      options: [
        {
          id: "hidden",
          label: "The frame hidden, a link",
          means:
            "As today: no code at all here, a single tap-through line in its place.",
        },
        {
          id: "small",
          label: "A small code",
          means:
            "The code stays, small, beside the heading: decoration by his own ruling now (first-event r1), not just this board's guess, and the weakest of the three.",
        },
        {
          id: "none",
          label: "Nothing but the index",
          means:
            "No demo mention at all on a phone: the footer opens straight to the index.",
        },
      ],
      recommended: "hidden",
      because:
        "A code nobody can scan is dead weight on the one surface that cannot use it, more so now a code's real home is ruled to be printed stock rather than a phone screen; the tap-through link already gets a visitor to the demo in one motion.",
      overrule:
        "If even a tap-through link is too much for a quiet close, none drops it outright; small is the weaker hold, its code now ruled to have no real home here.",
      lands:
        "Whether a phone ever shows a QR code in the footer, or only ever a link.",
      tile: "phone",
    },
  ],
});
