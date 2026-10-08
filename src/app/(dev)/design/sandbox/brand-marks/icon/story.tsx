"use client";

import type { ScreenId } from "../knobs";
import { Story } from "../scene";
import { DAY, HomeScreen, Launcher, NIGHT } from "./home";
import { PressKit } from "./press";
import type { IconId } from "./ring";
import { IconSheet } from "./sheet";

/**
 * ONE TAKE'S FRAMES, the brief's reads in its order: the icon at 1024, 180,
 * 32 and 16 in the room and on paper; a phone's home screen at night and by
 * day and a launcher's round mask (always a phone, whatever the Screen knob
 * says, since that is the only place a home screen is); then beside the
 * wordmark, as the press kit sets them.
 */
export function IconStory({ id, screen }: { id: IconId; screen: ScreenId }) {
  const phone = screen === "375";
  return (
    <Story
      screen={screen}
      sheet={{
        id: `bm-icon-${id}-sizes-${screen}`,
        title: "At 1024, 180, 32 and 16, in the room and on paper",
        w: phone ? 375 : 1600,
        h: phone ? 1500 : 1024,
        node: <IconSheet id={id} screen={screen} />,
      }}
      frames={[
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
          title: "A launcher's round mask",
          w: 375,
          h: 812,
          node: <Launcher icon={id} />,
        },
        {
          id: `bm-icon-${id}-press-${screen}`,
          title: "Beside the wordmark, as the press kit sets them",
          w: phone ? 375 : 1440,
          h: phone ? 1500 : 780,
          node: <PressKit id={id} screen={screen} />,
        },
      ]}
    />
  );
}
