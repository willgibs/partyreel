"use client";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { Album } from "@/components/marketing/sections/home/album";
import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import { CinemaHero } from "@/components/marketing/sections/home/cinema-hero";
import { FilmStrip } from "@/components/marketing/sections/home/film-strip";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { PricingTeaser } from "@/components/marketing/sections/home/pricing-teaser";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { TrustStrip } from "@/components/marketing/sections/home/trust-strip";

import type { Ground } from "@/components/lab";

import type { TreatmentId } from "./kit";

/**
 * THE REAL SECTIONS THE COMPOSER LIGHTS (round four, 2026-09-15).
 *
 * Round two replaced a hand-built specimen with the home arc's five real
 * media-less chapters, which was the right correction and half the surface.
 * Will's round-four note asks for the rest of it: "more UI examples for
 * comparison, especially if they can be live production components". So the
 * catalogue is now every SECTION TYPE the marketing site is made of, at the
 * ground the page actually gives it (section-ids.ts's chapter map is the
 * source for that, not a guess):
 *
 *   a hero · a thin chapter · a chapter · a media strip on cinema ·
 *   a media strip on paper · a chapter on paper · the pricing band ·
 *   the closer · the footer
 *
 * ★ EVERY ONE OF THESE IS THE SHIPPED COMPONENT, IMPORTED AND MOUNTED. Nothing
 * here is edited, approximated or rebuilt, which is the whole point: a
 * treatment that only works on a stage built to suit it is not a treatment.
 * Three of them ALREADY CARRY a production lamp (the strip's underlight, the
 * pricing card's beam, the footer's seam), and those are the interesting ones,
 * because the kit has to survive meeting light that is already there.
 *
 * ★ WHY THIS FILE EXISTS AT ALL: most of these are server components by
 * default, and importing one into a client board is what turns it into a
 * client component. Collecting the imports in one place keeps that boundary
 * visible and keeps the board's own files from growing nine import blocks that
 * look like production wiring.
 *
 * The heights are MEASURED off the rendered stage at both canvases, never
 * guessed: a stage that clips a section's bottom boundary hides the exact thing
 * the composer is about, and a clipped stage hid its own overflow for two
 * rounds (round three's finding: `zoom` makes scrollHeight and clientHeight
 * disagree, so the honest instrument is a text node's own rect). Each number is
 * the section's natural height plus a little air, which is what the real page
 * gives it: the trust strip is 86px of type in a 240px canvas because that is
 * what a thin chapter has between its neighbours, and an aurora needs the
 * section's real boundaries rather than a box drawn around its type.
 */
export type SectionId =
  | "hero"
  | "trust"
  | "guests"
  | "strip"
  | "album"
  | "privacy"
  | "pricing"
  | "closer"
  | "footer";

export type SectionKind =
  | "hero"
  | "chapter"
  | "media strip"
  | "pricing band"
  | "footer";

export type Section = {
  id: SectionId;
  label: string;
  kind: SectionKind;
  /** The surface the page's chapter map actually gives it. */
  ships: Ground;
  note: string;
  /** The production lamp it already carries, if any. */
  carries?: string;
  /** Canvas heights, measured off the rendered stage. */
  h: { desktop: number; phone: number };
  /** The treatments this section type can legally wear, and why not. */
  refuses?: Partial<Record<TreatmentId, string>>;
  render: () => React.ReactNode;
};

export const SECTIONS: Section[] = [
  {
    id: "hero",
    label: "The hero",
    kind: "hero",
    ships: "cinema",
    note: "Twenty four drifting photographs behind a wall of type. The loudest ground on the site.",
    h: { desktop: 880, phone: 1120 },
    refuses: {
      aurora:
        "The hero is the one section that refuses the aurora, and the reason is on the record rather than in taste: the reverted lamp round put a light here and it failed on three of the four things a lamp needs (the wall was the ground rather than the source, the ground was twenty four drifting photographs rather than open dark, and the edge was invented mid frame). A field at a boundary needs a quiet ground to fall on. The hero has none.",
      seam: "Same reason. The hero's bottom edge is a real boundary, but the light would fall INTO the next chapter, which is the trust strip: 44px of type. That is the strip's seam to carry, not the hero's.",
    },
    render: () => <CinemaHero />,
  },
  {
    id: "trust",
    label: "The trust strip",
    kind: "chapter",
    ships: "cinema",
    note: "44px of type between two hairlines. The thinnest chapter on the page, and the one an edge light can drown.",
    h: { desktop: 240, phone: 300 },
    render: () => <TrustStrip />,
  },
  {
    id: "guests",
    label: "The guest ledger",
    kind: "chapter",
    ships: "cinema",
    note: "Left aligned, rules edge to edge. The copy sits high, so the top boundary is the one that has to behave.",
    h: { desktop: 790, phone: 1100 },
    render: () => <NoApp />,
  },
  {
    id: "strip",
    label: "The film strip",
    kind: "media strip",
    ships: "cinema",
    note: "Forty eight frames on a conveyor, with three scene cards positioned below to catch the light.",
    carries: "the strip's underlight (film-strip-glow.tsx): a seam, 220px, sampled from the frames on the strip",
    h: { desktop: 810, phone: 1120 },
    refuses: {
      aurora:
        "A media strip already has a lamp, and it is the right one: the strip's own bottom edge, sampled from the photographs on it. A field at this section's boundaries would be a second light inside one scarcity distance, and the weaker of the two.",
    },
    render: () => <FilmStrip />,
  },
  {
    id: "album",
    label: "The album (paper)",
    kind: "media strip",
    ships: "paper",
    note: "The host's masthead and the album print laid on the desk. A media strip on a near-white ground.",
    h: { desktop: 950, phone: 840 },
    render: () => <Album />,
  },
  {
    id: "privacy",
    label: "Privacy (paper)",
    kind: "chapter",
    ships: "paper",
    note: "The paper chapter's document card. Where the house five are wearing a colour picked for a near black room.",
    h: { desktop: 840, phone: 1440 },
    render: () => <Privacy />,
  },
  {
    id: "pricing",
    label: "The pricing band",
    kind: "pricing band",
    ships: "cinema",
    note: "Three cards, and the Pro card already wears the doctrine's one standing exception.",
    carries:
      "the Pro card's beam (pro-card-beam.tsx): BorderBeam at the live register, the premium object at rest",
    h: { desktop: 750, phone: 960 },
    render: () => <PricingTeaser />,
  },
  {
    id: "closer",
    label: "The closer",
    kind: "chapter",
    ships: "cinema",
    note: "The CTA band on the cinema cut, one viewport above the footer seam. Two lamps, one scarcity distance apart.",
    h: { desktop: 510, phone: 600 },
    render: () => <CinemaClose />,
  },
  {
    id: "footer",
    label: "The footer",
    kind: "footer",
    ships: "ink",
    note: "The model. The one production lamp with nothing emitting, and the reason law 1 needs its correction.",
    carries:
      "the footer seam (footer-glow.tsx): 210px, 0.62 base and band, the house five, the site cadence",
    h: { desktop: 1690, phone: 1760 },
    refuses: {
      aurora:
        "The footer already IS the boundary treatment, at the one cut on the page that has two grounds meeting. Adding a field to it would be the same light twice.",
    },
    render: () => <MarketingFooter />,
  },
];

export function sectionById(id: SectionId): Section {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}
