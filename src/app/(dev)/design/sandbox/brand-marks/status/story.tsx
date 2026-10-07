"use client";

import type { ScreenId } from "../knobs";
import { Story } from "../scene";
import { HostStates } from "./host";
import { statusPaste, STATUS_SETS, type StatusSetId } from "./sets";
import { StatusSheet } from "./sheet";

/**
 * ONE STATUS SET'S FRAMES: the set itself on both grounds beside the tally,
 * then a host's night of states on production's own pieces, in the room and
 * on paper, every point production's Badge wearing the set's paste.
 */
export function StatusStory({
  id,
  screen,
}: {
  id: StatusSetId;
  screen: ScreenId;
}) {
  const set = STATUS_SETS[id];
  const css = statusPaste(set);
  const desk = screen === "1440";
  return (
    <Story
      screen={screen}
      sheet={{
        id: `bm-status-${id}-sheet-${screen}`,
        title: "The status set, on paper and in the room",
        h: desk ? 700 : 1320,
        css,
        node: <StatusSheet set={set} screen={screen} />,
      }}
      frames={[
        {
          id: `bm-status-${id}-room-${screen}`,
          title: "A host's night, in the room",
          css,
          node: <HostStates ground="room" screen={screen} />,
        },
        {
          id: `bm-status-${id}-paper-${screen}`,
          title: "A host's night, on paper",
          css,
          node: <HostStates ground="paper" screen={screen} />,
        },
      ]}
    />
  );
}
