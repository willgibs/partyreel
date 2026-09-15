"use client";

import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { PricingTeaser } from "@/components/marketing/sections/home/pricing-teaser";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { TrustStrip } from "@/components/marketing/sections/home/trust-strip";

import type { Ground } from "@/components/dev/board";

/**
 * THE HOME ARC'S MEDIA-LESS CHAPTERS, AS THEY SHIP (round two, 2026-09-14).
 *
 * Round one lit a hand-built "how it works" section, and it flattered the
 * proposal: the specimen was one heading, three short steps and a button,
 * centred, with generous air at both boundaries. That is the easiest possible
 * case for a light at the edges. The real chapters are not that. The trust
 * strip is 44px of hairline-bordered type. The guest ledger is left aligned
 * with rules running edge to edge. The pricing pointer already carries a beam
 * of its own, which is the scarcity law's hardest case. The closer is a CTA
 * band on the cinema cut.
 *
 * So these are the real components, imported and mounted, and the aurora is
 * judged on what it has to survive rather than on a stage built to suit it.
 *
 * ★ WHY THIS FILE EXISTS AT ALL: every one of these is a server component by
 * default, and importing one into a client board is what turns it into a
 * client component. Collecting the imports in one place keeps that boundary
 * visible, and keeps the board's own files from growing five import blocks
 * that look like production wiring. Nothing here is edited; nothing here is
 * new. The heights are measured from the rendered stage, not guessed: a stage
 * that clips a chapter's bottom boundary hides the exact thing part B is
 * about.
 */
export type ChapterId =
  | "trust"
  | "guests"
  | "pricing"
  | "closer"
  | "privacy";

export type Chapter = {
  id: ChapterId;
  label: string;
  /** The surface the home page's chapter map actually gives it. */
  ships: Ground;
  note: string;
  /** Canvas heights, measured. */
  h: { desktop: number; phone: number };
  render: () => React.ReactNode;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "trust",
    label: "The trust strip",
    ships: "cinema",
    note: "44px of type between two hairlines. The thinnest chapter on the page, and the one an edge light can drown.",
    h: { desktop: 260, phone: 340 },
    render: () => <TrustStrip />,
  },
  {
    id: "guests",
    label: "The guest ledger",
    ships: "cinema",
    note: "Left aligned, rules edge to edge. The copy sits high, so the top boundary is the one that has to behave.",
    h: { desktop: 760, phone: 1080 },
    render: () => <NoApp />,
  },
  {
    id: "pricing",
    label: "The pricing pointer",
    ships: "cinema",
    note: "Three cards and a beam of its own. The scarcity law's hardest case: a field behind a MARK that is already lit.",
    h: { desktop: 900, phone: 1620 },
    render: () => <PricingTeaser />,
  },
  {
    id: "closer",
    label: "The closer",
    ships: "cinema",
    note: "The CTA band on the cinema cut, one viewport above the footer seam. Two lamps, one scarcity distance apart.",
    h: { desktop: 620, phone: 760 },
    render: () => <CinemaClose />,
  },
  {
    id: "privacy",
    label: "Privacy",
    ships: "paper",
    note: "The paper chapter's document card. Where the house five are wearing a colour picked for a near black room.",
    h: { desktop: 900, phone: 1500 },
    render: () => <Privacy />,
  },
];

export function chapterById(id: ChapterId): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}
