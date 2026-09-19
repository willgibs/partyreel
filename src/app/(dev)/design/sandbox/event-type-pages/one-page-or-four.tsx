"use client";

import { HelpPane } from "@/components/marketing/built-for";
import { GalleryFrame } from "@/components/marketing/frames";
import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { EVENT_TYPES } from "@/lib/constants/events";
import { cn } from "@/lib/utils";

import { GENERIC_BENEFITS } from "./fixtures";

/**
 * DECISION 1: ONE PAGE OR FOUR. Drawn on ONE representative type (weddings,
 * the manifest's own "1-2-3" chapter shape: the event, the plan, the close),
 * because rendering all four at every option is the same claim repeated four
 * times. The chip ribbon carries the STRUCTURAL claim in words real enough to
 * check (which beat is shared, which is bespoke); `HelpPane` beneath it carries
 * the COPY claim, on the real component. The real `PaperChapter` turns beat 2
 * light, exactly as the shipped page does (beat 1 and 3 stay cinema) — a flat
 * one-ground composition would misrepresent the page it claims to be.
 */
export type PageShape = "template" | "bespoke" | "shell";

const WEDDING = EVENT_TYPES[0];

function Chip({ label, tag }: { label: string; tag: "shared" | "bespoke" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        tag === "bespoke"
          ? "border-foreground/40 text-foreground"
          : "border-border text-muted-foreground",
      )}
    >
      {label}
      <span className="text-[10px] font-normal opacity-70">
        {tag === "bespoke" ? "bespoke" : "shared"}
      </span>
    </span>
  );
}

function Ribbon({ shape }: { shape: PageShape }) {
  const beat2 = shape === "shell" ? "shared" : "bespoke";
  const beat3 = shape === "shell" ? "shared" : "bespoke";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip label="1 · The event" tag="bespoke" />
      <Chip label="2 · The plan" tag={beat2} />
      <Chip label="3 · The close" tag={beat3} />
      {shape === "bespoke" && <Chip label="+ Photo wall" tag="bespoke" />}
    </div>
  );
}

export function OnePageOrFourPreview({ shape }: { shape: PageShape }) {
  const help = shape === "shell" ? GENERIC_BENEFITS : WEDDING.howItHelps;
  return (
    <div>
      <div className="mx-auto max-w-2xl px-6 pt-10">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Events / Weddings
        </p>
        <Ribbon shape={shape} />
        <div className="mt-8">
          <EventHeroMedia slug="weddings" />
        </div>
      </div>
      <PaperChapter className="mt-10 py-10">
        <div className="mx-auto max-w-2xl px-6">
          <h3 className="text-center font-heading text-subsection">
            {shape === "shell" ? "Built for any event" : `Built for ${WEDDING.navLabel.toLowerCase()}`}
          </h3>
          <HelpPane help={help} startIndex={0} />
          {shape === "bespoke" && (
            <div className="mt-10">
              <h3 className="text-center font-heading text-subsection">
                The wedding album, mid-fill
              </h3>
              <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
                A beat none of its three siblings carry: this page is free to
                add its own section, not only its own words.
              </p>
              <GalleryFrame
                className="mx-auto mt-5 max-w-sm"
                label="partyreel.com/a/maya-and-jay"
              />
            </div>
          )}
        </div>
      </PaperChapter>
    </div>
  );
}
