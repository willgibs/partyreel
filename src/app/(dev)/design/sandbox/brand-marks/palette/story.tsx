"use client";

import type { ScreenId } from "../knobs";
import { type Probe, Story } from "../scene";
import { AppHome, SiteFoot } from "../surfaces";
import { gradePaste, GRADES, type GradeId } from "./grades";
import { GradeSheet } from "./sheet";

/** The pricing page, read: paper's ground and the Pro card's, as the frame paints them. */
const readPricing: Probe = (root, win) => {
  const doc = root.ownerDocument;
  const paper = doc.querySelector(".surface-paper");
  const pro = doc.querySelector(".bg-foreground");
  if (!paper) return null;
  const bg = (el: Element | null) =>
    el ? win.getComputedStyle(el).backgroundColor : "not drawn";
  return `paper's ground: ${bg(paper)}; the Pro card's: ${bg(pro)}`;
};

/**
 * ONE GRADE'S FRAMES: the grade as its tokens, then production wearing it as
 * its paste: the real pricing page (paper, the Pro card, the cinema bar),
 * the host's app in the room (its photographs on the room's black) and the
 * site's foot on its slab (the plate, the lamps relit as the ember).
 */
export function GradeStory({
  id,
  screen,
  lede,
}: {
  id: GradeId;
  screen: ScreenId;
  lede: string;
}) {
  const grade = GRADES[id];
  const css = gradePaste(grade);
  const desk = screen === "1440";
  return (
    <Story
      screen={screen}
      lede={lede}
      sheet={{
        id: `bm-grade-${id}-sheet-${screen}`,
        title: "The grade, as its tokens",
        h: desk ? 620 : 1280,
        node: <GradeSheet grade={grade} screen={screen} />,
      }}
      frames={[
        {
          id: `bm-grade-${id}-pricing-${screen}`,
          title: "The pricing page, on paper",
          src: "/pricing",
          css,
          measure: readPricing,
        },
        {
          id: `bm-grade-${id}-app-${screen}`,
          title: "The host's app, in the room",
          css,
          node: <AppHome ground="room" screen={screen} />,
        },
        {
          id: `bm-grade-${id}-foot-${screen}`,
          title: "The site's foot, on its slab",
          css,
          h: desk ? 900 : 1300,
          node: <SiteFoot />,
        },
      ]}
    />
  );
}
