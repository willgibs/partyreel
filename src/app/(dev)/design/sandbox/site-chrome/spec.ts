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
 * pile travels to a screen nobody can scan) that carries no such dependency.
 */
export const SITE_CHROME = defineExploration({
  id: "site-chrome",
  title: "The site's chrome",
  round: {
    n: 2,
    date: "2026-09-19",
    changed:
      "The footer alone, his ask by name: what register one should be right after a page's own closing CTA, whether a page with none deserves the same, and how the demo travels to a phone. The other seven decisions ship on the real chrome elsewhere (chrome-wiring); out of scope here.",
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
        "Most marketing pages now end on a CtaBand: a heading, a button, the demo link beneath it. Today the footer repeats a full sign-off of its own right after, pile and heading and all, on every one of them.",
      options: [
        {
          id: "today",
          label: "The sign-off, unchanged",
          means:
            "The same photo pile, the same heading and copy, directly under the page's own close. Today's shape, held up next to a real one.",
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
        "A full repeat is the exact repetition he flagged, and dropping the mention entirely undersells the single best action on the site; a slim strip keeps it alive without competing with the close for the last word.",
      overrule:
        "If the close above already feels complete, dropping the mention (merged or tucked) is the cleaner cut, and the legal-bar line is enough of a safety net.",
      lands:
        "Whether the shipped sign-off register survives next to a real closing CTA, and in what shape.",
    },
    {
      id: "foot-alone",
      label: "The foot where nothing closes the page",
      question:
        "Should a page with no closing section of its own get a bigger footer than one that already closed?",
      context:
        "Not every route closes on a CtaBand: /about, /press, /careers and the 404 run straight from ordinary content into the footer, with nothing above it asking for anything.",
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
        "Four real routes currently end on nothing at all; the footer is the only closing gesture they have, so it should not go quiet there for the sake of consistency with pages that already have one.",
      overrule:
        "If those four routes are rare enough to matter less than one predictable footer everywhere, the same answer belongs on every page.",
      lands:
        "Whether the footer special-cases a page with no CtaBand above it, or draws one register everywhere.",
      after: { ask: "foot-after" },
    },
    {
      id: "foot-phone",
      label: "The phone's foot",
      question: "How should the footer's demo invitation travel to a phone?",
      context:
        "A QR is not really part of the mobile answer: nobody can scan their own screen. Today the pile hides below the code's own breakpoint and a plain link takes its place.",
      options: [
        {
          id: "hidden",
          label: "The pile hidden, a link",
          means:
            "As today: no code at all here, a single tap-through line in its place.",
        },
        {
          id: "small",
          label: "A small code",
          means:
            "The code stays, small, beside the heading, even though it is only decoration on this device.",
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
        "A code nobody can scan is dead weight on the one surface that cannot use it, and the tap-through link already gets a visitor to the demo in a single motion.",
      overrule:
        "If the code reads as a trust mark rather than a scan target, keeping it small costs little and never asks to be tapped.",
      lands:
        "Whether a phone ever shows a QR code in the footer, or only ever a link.",
      tile: "phone",
    },
  ],
});
