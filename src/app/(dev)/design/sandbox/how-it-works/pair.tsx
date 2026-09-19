"use client";

import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { Widths } from "./scene";

/**
 * THE PAIR: an information-architecture question, not a visual one, so its
 * evidence is the three real link instances themselves (docs/tracks/how-it-
 * works.md, "the label collision") rather than a forced full-page mockup.
 * Every row below is a REAL surface and a REAL destination quoted verbatim:
 * spine.tsx's GoDeeper link, mega-panel.tsx's Resources card, and the help
 * hub's own link back to this page.
 */
export type PairShape = "split" | "merged" | "renamed";

type LinkRow = {
  surface: string;
  label: string;
  destination: string;
  changed?: boolean;
};

const ROWS: Record<PairShape, LinkRow[]> = {
  split: [
    { surface: "This page's spine (GoDeeper)", label: "How Partyreel works", destination: "/help/how-partyreel-works" },
    { surface: "Marketing nav, Resources card", label: "How Partyreel works", destination: "/help/how-partyreel-works" },
    { surface: "The help hub's own link", label: "How Partyreel works", destination: "/how-it-works (this page)" },
  ],
  merged: [
    { surface: "This page's spine", label: "The full loop, step by step", destination: "scrolls further down this page", changed: true },
    { surface: "Marketing nav, Resources card", label: "How Partyreel works", destination: "/how-it-works (the article folds in)", changed: true },
    { surface: "The help hub's own link", label: "How Partyreel works", destination: "/how-it-works", changed: true },
  ],
  renamed: [
    { surface: "This page's spine (GoDeeper)", label: "Read the full how-to", destination: "/help/how-partyreel-works", changed: true },
    { surface: "Marketing nav, Resources card", label: "Read the full how-to", destination: "/help/how-partyreel-works", changed: true },
    { surface: "The help hub's own link", label: "See the loop, start to finish", destination: "/how-it-works (this page)", changed: true },
  ],
};

const CAPTION: Record<PairShape, string> = {
  split: "Three instances, one label, two different destinations: a reader cannot tell which \"How Partyreel works\" they are about to open.",
  merged: "The article's steps move onto this page as its own deeper text; the separate article page, and one of the three links, retire.",
  renamed: "Same two pages, same three links; each now says where it actually goes.",
};

function LinkRowCard({ row }: { row: LinkRow }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {row.surface}
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            row.changed ? "text-brand" : "text-foreground",
          )}
        >
          &ldquo;{row.label}&rdquo;
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5 shrink-0" />
        {row.destination}
      </div>
    </div>
  );
}

function PairPage({ shape }: { shape: PairShape }) {
  return (
    <div className="bg-background py-10">
      <Container className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Every place the loop is linked
        </p>
        <div data-hiw-picture className="mt-4 flex flex-col gap-2.5">
          {ROWS[shape].map((row) => (
            <LinkRowCard key={row.surface} row={row} />
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">
          {CAPTION[shape]}
        </p>
      </Container>
    </div>
  );
}

const PAIR_H = { d: 460, p: 620 };

const NOTE: Record<PairShape, string> = {
  split: "Today: the same three words lead to two different pages.",
  merged: "One page; the article's steps become this page's own text.",
  renamed: "Both kept; each link now names its own destination.",
};

export function pairPreview(shape: PairShape) {
  return (
    <Widths
      id={`pair-${shape}`}
      ground="paper"
      desktopH={PAIR_H.d}
      phoneH={PAIR_H.p}
      note={NOTE[shape]}
      render={() => <PairPage shape={shape} />}
    />
  );
}
