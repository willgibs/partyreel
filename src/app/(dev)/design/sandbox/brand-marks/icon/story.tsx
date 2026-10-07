"use client";

import type { ScreenId } from "../knobs";
import { Story } from "../scene";
import { Favourites, SearchResults, TabStrip } from "./browser";
import { DAY, HomeScreen, Launcher, NIGHT } from "./home";
import type { IconId } from "./ring";
import { IconSheet } from "./sheet";

/**
 * ONE ICON'S FRAMES: the icon itself, then where an icon lives: a phone's
 * home screen at night and by day and a launcher's circles (always a phone,
 * whatever the Screen knob says, since that is the only place a home screen
 * is), and at a desk a browser's tabs on a dark window and a light one with a
 * search result; at a phone, a browser's favourites on its light start page.
 * The tab is shown, not asked: its small ring is one cut for all three.
 */
export function IconStory({ id, screen }: { id: IconId; screen: ScreenId }) {
  const desk = screen === "1440";
  const phones = [
    {
      id: `bm-icon-${id}-night`,
      title: "A home screen at night",
      w: 375,
      h: 812,
      node: <HomeScreen icon={id} wall={NIGHT} />,
    },
    {
      id: `bm-icon-${id}-day`,
      title: "A home screen by day",
      w: 375,
      h: 812,
      node: <HomeScreen icon={id} wall={DAY} />,
    },
    {
      id: `bm-icon-${id}-launcher`,
      title: "A launcher, every icon a circle",
      w: 375,
      h: 812,
      node: <Launcher icon={id} />,
    },
  ];
  return (
    <Story
      screen={screen}
      sheet={{
        id: `bm-icon-${id}-sheet-${screen}`,
        title: "The icon, in the room and on paper",
        h: desk ? 760 : 1400,
        node: <IconSheet id={id} screen={screen} />,
      }}
      frames={[
        ...phones,
        desk
          ? {
              id: `bm-icon-${id}-tabs`,
              title:
                "Tabs on a dark window and a light one, and a search result",
              w: 1440,
              h: 520,
              node: (
                <div className="flex min-h-screen flex-col bg-white">
                  <TabStrip icon={id} tone="dark" />
                  <div style={{ height: 18, background: "#ffffff" }} />
                  <TabStrip icon={id} tone="light" />
                  <SearchResults icon={id} />
                </div>
              ),
            }
          : {
              id: `bm-icon-${id}-favourites`,
              title: "A browser's favourites, on its light start page",
              w: 375,
              h: 812,
              node: <Favourites icon={id} />,
            },
      ]}
    />
  );
}
