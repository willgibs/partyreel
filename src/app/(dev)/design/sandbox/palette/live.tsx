"use client";

import { CANVAS, Frame, FrameRow, type Mode } from "@/components/lab";

import { DEMO_QR_TOKEN } from "@/lib/demo";

/**
 * THE LIVE SURFACES (round four's live sections, moved onto the kit's Frame at
 * the migration wave, 2026-09-15).
 *
 * ★ WHAT RETIRED HERE, AND WHY IT IS AN UPGRADE RATHER THAN A MOVE. Round four
 * answered "more real UI" by importing four production SECTIONS and portalling
 * them into an iframe it built itself (`TrueViewport`), with a sheet that forced
 * the marketing entrance grammar to its settled state because an
 * IntersectionObserver inside a clipped iframe never trips. All of that is gone,
 * because the kit's `Frame` loads a same-origin ROUTE and writes a candidate
 * into its document: the pages themselves, at 1440 or 375, with their own
 * scroll, their own observers and their own breakpoints.
 *
 * Three things follow that a portalled section could not give:
 *
 *  1. A ground is judged against the REST of the page. The seam where the paper
 *     ends and the footer slab begins is a real seam on `/`, not a hand-written
 *     preamble above an imported footer.
 *  2. The frame wears EXACTLY the paste. `applyCss` is what the Apply button
 *     hands the site, so the left frame is the site as built and the right one
 *     is the site after the ruling, to the byte. A stage painting inline custom
 *     properties could never claim that, which is why round four needed a
 *     scoped stylesheet to reach `.surface-ink` at all.
 *  3. The entrance is the real one. No settling sheet, so nobody has to
 *     remember to add a line to it when marketing grows a second reveal shape.
 *
 * ★ THE APP IS THE ONE THING A FRAME CANNOT REACH, and it stays on a Stage.
 * `/dashboard` and an event page want a signed-in host, so those are still
 * compositions; every one of them branches on the canvas control rather than on
 * a breakpoint prefix, which is what makes a div an honest surface for them and
 * was never true of an imported production section.
 */

export type PageId = "home" | "pricing" | "help" | "contact" | "guest";

export type SitePage = {
  id: PageId;
  label: string;
  path: string;
  /** What this page puts at stake that the others do not. */
  note: string;
};

/** The routes a ground is settled on, in the order a reader should take them.
 *  The guest album is on the list only when a demo event is configured; its
 *  token lives in the env rather than in this file. */
export const SITE_PAGES: SitePage[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    note: "The whole arc in one scroll, and the seam where the paper ends and the footer slab begins.",
  },
  {
    id: "pricing",
    label: "Pricing",
    path: "/pricing",
    note: "The densest cards in the product. A page with no real card step shows it here first.",
  },
  {
    id: "help",
    label: "Help",
    path: "/help",
    note: "A wall of one card, plus the facts band: the same surface repeated twenty times.",
  },
  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    note: "The fifth ground: the panel nobody had named, which is what the mat is named for.",
  },
  ...(DEMO_QR_TOKEN
    ? [
        {
          id: "guest" as const,
          label: "The guest album",
          path: `/e/${DEMO_QR_TOKEN}`,
          note: "The demo album, logged out, as a guest gets it: the masonry on the well.",
        },
      ]
    : []),
];

/**
 * ONE PAGE, LOADED TWICE AND SCROLLED TOGETHER: the site as built on the left,
 * the ruling on the right.
 *
 * ★ THE LEFT FRAME CARRIES NO SHEET AT ALL. "Today" is the page as it ships,
 * and an empty `css` is the only honest way to say that; writing today's values
 * back in would make the comparison a comparison of two pastes.
 *
 * ★ AND NEITHER FRAME TAKES THE GATE KEY. These are SITE routes, so no design
 * island mounts inside them, which is what keeps a block applied globally from
 * reaching the frames and doubling up on the one written into them.
 *
 * ★ THEY LOAD ON APPROACH, AND THAT IS NOT A NICETY. Two frames are two whole
 * marketing pages, and the home arc alone decodes two dozen photographs; loaded
 * eagerly they are paid for on every visit to a thirty thousand pixel board
 * whose reader may never reach this section, and the renderer said so (a
 * screenshot of the page timed out while both were decoding). `onApproach` is
 * the kit's answer and it costs one prop.
 */
export function SiteFrames({
  page,
  mode,
  split,
  candidateCss,
  candidateLabel,
  reloadKey,
}: {
  page: SitePage;
  mode: Mode;
  split: boolean;
  candidateCss: string;
  candidateLabel: string;
  reloadKey: number;
}) {
  const { w, h } = CANVAS[mode];
  return (
    <FrameRow lock={split}>
      {split ? (
        <Frame
          id="pal-today"
          src={page.path}
          w={w}
          h={h}
          title="Today"
          caption="The page as it ships, with no sheet written into it, for the eye to come back to."
          reloadKey={reloadKey}
          onApproach
        />
      ) : null}
      <Frame
        id="pal-pair"
        src={page.path}
        w={w}
        h={h}
        css={candidateCss}
        title={candidateLabel}
        caption={
          split
            ? "The ruling's own paste, written into this document and scrolled with the frame beside it."
            : "The ruling's own paste, written into this document. Flip a switch in the dock and the page re-skins in place, with no reload and no scroll lost."
        }
        reloadKey={reloadKey}
        onApproach
      />
    </FrameRow>
  );
}
