"use client";

import "./cursor-backdrop.css";

import { type ComponentType, useEffect, useRef } from "react";

import { FullQuality } from "@/components/marketing/sections/home/full-quality";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { PricingTeaser } from "@/components/marketing/sections/home/pricing-teaser";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { cn } from "@/lib/utils";

import { Backdrop, type DriveId, type LegibilityId } from "./backdrop";
import type { Config, PathId } from "./backdrop-engine";

/**
 * THE REAL SECTIONS, IN PLACE, WEARING THE BACKDROP.
 *
 * Every picture on this board is a shipped home-page section imported and
 * rendered, never a mock of one: the three-up of icon cards Will named ("icon
 * feature cards with no media visual"), the guest ledger that holds the page's
 * one Aurora room-cast today, and the pricing teaser that closes chapter 3.
 * Nothing under `src/components/marketing/` changes this round; the section is
 * WRAPPED, and the two things a wrapper cannot do from outside are done from
 * outside anyway (below).
 *
 * ★ WHY THESE THREE. Read against the home's order (`section-ids.ts`), the
 * sections with no media visual of their own are the trust strip, the guest
 * ledger, the icon three-up, the pricing teaser and the FAQ. The strip is eight
 * words tall and the FAQ is an accordion you read rather than move through, so
 * the three that have a whole section's height and nothing in it are the ones
 * asked about. `full-quality` is the one his note describes exactly.
 */

export type SectionId = "full-quality" | "no-app" | "pricing-teaser";
export type GroundId = "cinema" | "paper";

type Entry = {
  readonly Component: ComponentType;
  /** What Will reads on the tile. */
  readonly name: string;
  /** Where it sits on the page, in his words rather than the file's. */
  readonly where: string;
  /** The ground it ships on today. */
  readonly ships: GroundId;
  /** The axis its cards run along, for the `cells` trigger and the path. */
  readonly axis: "x" | "y";
  /**
   * ★ A LAB-ONLY SHIM. The `cells` trigger needs to know which card the pointer
   * is over, and a shipped section carries no such attribute. Rather than edit
   * production, the room tags the cards after mount with this selector, read
   * off each section's own markup. A wiring round adds the attribute properly.
   */
  readonly cellSelector: string;
};

export const SECTIONS: Record<SectionId, Entry> = {
  "full-quality": {
    Component: FullQuality,
    name: "Full quality",
    where:
      "chapter 1, under the guest ledger: three icon cards and nothing else",
    ships: "cinema",
    axis: "x",
    cellSelector: ".flex.flex-wrap > [data-mkt-reveal]",
  },
  "no-app": {
    Component: NoApp,
    name: "No app, no account",
    where: "chapter 1, the page's one left header and its hairline ledger",
    ships: "cinema",
    axis: "y",
    cellSelector: "ul > li[data-mkt-reveal]",
  },
  "pricing-teaser": {
    Component: PricingTeaser,
    name: "Pricing",
    where: "chapter 3, three plan cards before the FAQ",
    ships: "cinema",
    axis: "x",
    cellSelector: ".grid > [data-mkt-reveal]",
  },
};

export const sectionOf = (v: string | undefined): SectionId =>
  v && v in SECTIONS ? (v as SectionId) : "full-quality";

/** How many cards a section has. Three, in all three; read, not assumed. */
export const CELLS = 3;

/**
 * THE LAMPS' TURBULENCE FIELD, CARRIED INTO THE FRAME. Every Aurora filter is
 * `url(#glw-warp)` and the one `<svg>` that defines it is mounted in the root
 * layout, which a lab `Frame` does not have. Cloned once per document, the
 * album-page lane's fix, which this board needs for the `none` option (the
 * guest ledger's room cast is the thing a backdrop would replace).
 */
function useRoomShims(
  ref: React.RefObject<HTMLDivElement | null>,
  selector: string,
) {
  useEffect(() => {
    const host = ref.current;
    const doc = host?.ownerDocument;
    if (!host || !doc) return;
    if (doc !== document && !doc.getElementById("glw-warp")) {
      const field = document.getElementById("glw-warp")?.closest("svg");
      if (field) doc.body.appendChild(field.cloneNode(true));
    }
    host.querySelectorAll(selector).forEach((el, i) => {
      el.setAttribute("data-cb-cell", String(i));
    });
  }, [ref, selector]);
}

export type RoomProps = {
  section: SectionId;
  /** False draws the section exactly as it ships: the honest "none". */
  backdrop: boolean;
  cfg: Omit<Config, "box">;
  drive: DriveId;
  entranceAt?: number;
  /** Which scripted path drives it when no real pointer is in the room. */
  path?: PathId;
  legibility: LegibilityId;
  ground: GroundId;
  rail?: boolean;
  ghost?: boolean;
};

export function Room({
  section,
  backdrop,
  cfg,
  drive,
  entranceAt,
  path,
  legibility,
  ground,
  rail,
  ghost,
}: RoomProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const entry = SECTIONS[section];
  useRoomShims(host, entry.cellSelector);
  const Section = entry.Component;

  const body = backdrop ? (
    <Backdrop
      cfg={cfg}
      drive={drive}
      entranceAt={entranceAt}
      path={path}
      axis={entry.axis}
      legibility={legibility}
      rail={rail}
      ghost={ghost}
    >
      {legibility === "plate" ? (
        <div className="cb-plate">
          <Section />
        </div>
      ) : (
        <Section />
      )}
    </Backdrop>
  ) : (
    <Section />
  );

  return (
    <div
      ref={host}
      // The cinema page's own wrapper, copied from the marketing layout: a
      // forced-dark token subtree with the marketing token block on it. A paper
      // chapter is the shipped component, so the ground is never faked.
      className={cn(
        "flex flex-col bg-background text-foreground",
        ground === "cinema" && "dark",
      )}
      data-mkt=""
      data-mkt-skin="cinema"
      // A board is not a site: a link inside a preview would take the frame off
      // the board and the reader would watch a real page load in a tile.
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
    >
      {ground === "paper" ? <PaperChapter>{body}</PaperChapter> : body}
    </div>
  );
}
