"use client";

import type { ScreenId } from "../knobs";
import { Story } from "../scene";
import { SiteFoot } from "../surfaces";
import { gradePaste, GRADES, type PlateId } from "./grades";
import { AppWithMenu } from "./menu";
import { GradeSheet } from "./sheet";

/**
 * ONE PLATE'S FRAMES: production's own pieces of the room on a paper page
 * wearing it as its paste (the site's foot on its slab, under the end of a
 * paper chapter, and the host's app in the light with its menu open), then
 * the tokens it lands, the plate among production's grade.
 */
export function PlateStory({ id, screen }: { id: PlateId; screen: ScreenId }) {
  const grade = GRADES[id];
  const css = gradePaste(grade);
  const desk = screen === "1440";
  return (
    <Story
      screen={screen}
      frames={[
        {
          id: `bm-plate-${id}-foot-${screen}`,
          title: "The site's foot, on its slab",
          css,
          h: desk ? 900 : 1300,
          node: <SiteFoot />,
        },
        {
          id: `bm-plate-${id}-menu-${screen}`,
          title: "The host's app on paper, its menu open",
          css,
          node: <AppWithMenu screen={screen} />,
        },
        {
          id: `bm-plate-${id}-sheet-${screen}`,
          title: "The tokens, the plate among them",
          h: desk ? 620 : 1280,
          node: <GradeSheet grade={grade} screen={screen} />,
        },
      ]}
    />
  );
}
