"use client";

import { type ReactNode, useRef } from "react";

import { EverywhereSection } from "@/components/marketing/sections/features/album/everywhere-section";
import { QualitySection } from "@/components/marketing/sections/features/album/quality-section";
import { YourCallSection } from "@/components/marketing/sections/features/album/your-call-section";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionLight } from "@/components/marketing/system/section-light";

import { useFrameFilter } from "./frame-filter";

/**
 * THE PAGE UNDER THE HERO, WITH ITS SECOND LIGHT (the heroes lane,
 * 2026-09-18): the dark chapter's last two sections, then the cut to paper.
 *
 * ★ TODAY THE PAGE HAS NO `SectionLight` AT ALL, only the hero's lamp. The
 * Aurora is composed per place (Will, 2026-09-17: "custom and bespoke, not a
 * couple of identity components reused everywhere"), so the question is WHERE
 * this page's second light belongs, and each option is drawn on the shipped
 * sections in their shipped order, down to the hairline where the chapter turns
 * to paper, because that cut is where a floor light would be judged.
 *
 * ★ THE ROOM IS LIT FROM THE COPY'S SIDE. `EverywhereSection` is a media split
 * with its stage on the start side, so the empty quarter is the copy's end
 * side; the cast starts on that edge and falls away before it crosses the
 * stage, the home page's `NoApp` grammar.
 */
export type Second = "none" | "floor" | "room";

function Lit({
  when,
  children,
  light,
}: {
  when: boolean;
  children: ReactNode;
  light: (children: ReactNode) => ReactNode;
}) {
  return when ? light(children) : children;
}

export function AlbumTail({ second }: { second: Second }) {
  const root = useRef<HTMLDivElement | null>(null);
  useFrameFilter(root);
  return (
    <div
      ref={root}
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
    >
      <Lit
        when={second === "room"}
        light={(c) => (
          <SectionLight
            placement="room"
            from={{ x: "100%", y: "46%" }}
            reach="64%"
          >
            {c}
          </SectionLight>
        )}
      >
        <EverywhereSection />
      </Lit>
      <Lit
        when={second === "floor"}
        light={(c) => (
          <SectionLight placement="bottom" reach="58%">
            {c}
          </SectionLight>
        )}
      >
        <QualitySection />
      </Lit>
      <PaperChapter>
        <YourCallSection />
      </PaperChapter>
    </div>
  );
}
