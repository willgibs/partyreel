"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./page.css";

import { useCallback, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { FieldPause } from "../privacy-hero/field-layer";
import { AlbumHero } from "./hero";
import { heightOf, type Motion, margins, ROOM } from "./margins";
import { ALBUM_PAGE } from "./spec";
import { AlbumTail, type Second } from "./tail";
import type { AlbumLight, Visual } from "./visual";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the album page itself at 1440
 * and again at 375, in real viewports (a `Frame`, because the headline's step is
 * a `vw` clamp and a narrow div would draw the desktop's).
 *
 * ★ A STAGED DECISION WEARS WHAT IT WAITS ON. The motion and the light are
 * drawn on the album he picks; the album itself is drawn wearing the board's
 * recommendation for the rest until he answers them (`Preview`,
 * exploration.ts).
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT: the step hides the options it is not
 * showing with `data-paused` in THIS document, and the field runs in the frame's.
 */

type Look = { visual: Visual; motion: Motion; light: AlbumLight };

const look = (s: BoardState): Look => ({
  visual: (s.visual ?? "live") as Visual,
  motion: (s.motion ?? "stream") as Motion,
  light: (s.light ?? "pool") as AlbumLight,
});

/** The host's own pause reader: this document's ancestors, and the tab. */
function useHostPause() {
  const host = useRef<HTMLDivElement | null>(null);
  const isPaused = useCallback(
    () =>
      document.hidden || Boolean(host.current?.closest('[data-paused="true"]')),
    [],
  );
  return { host, isPaused };
}

/** The numbers under each screen, measured off the engine it draws. */
function captionFor(mode: "desktop" | "phone", l: Look) {
  const m = margins(mode, l.motion);
  return m.caption;
}

function HeroScreens({ l }: { l: Look }) {
  const { host, isPaused } = useHostPause();
  const id = `${l.visual}-${l.motion}-${l.light}`;
  return (
    <FieldPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {(["desktop", "phone"] as const).map((mode) => (
          <Frame
            key={mode}
            id={`apg-${mode}-${id}`}
            w={mode === "desktop" ? 1440 : 375}
            h={heightOf(mode, l.motion)}
            title={mode === "desktop" ? "1440" : "375"}
            caption={captionFor(mode, l)}
          >
            <AlbumHero
              mode={mode}
              visual={l.visual}
              light={l.light}
              motion={margins(mode, l.motion).field}
              room={ROOM[mode][l.motion]}
              height={heightOf(mode, l.motion)}
            />
          </Frame>
        ))}
      </div>
    </FieldPause.Provider>
  );
}

/** The dark chapter's last two sections and the cut, at both widths. */
const TAIL_H = { desktop: 1580, phone: 2380 } as const;

function TailScreens({ second }: { second: Second }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {(["desktop", "phone"] as const).map((mode) => (
        <Frame
          key={mode}
          id={`apg-tail-${mode}-${second}`}
          w={mode === "desktop" ? 1440 : 375}
          h={TAIL_H[mode]}
          title={mode === "desktop" ? "1440" : "375"}
          caption="Everywhere, then the quality numbers, then the cut to paper: the shipped sections in their shipped order."
        >
          <AlbumTail second={second} />
        </Frame>
      ))}
    </div>
  );
}

const PREVIEWS: PreviewsFor<typeof ALBUM_PAGE> = {
  "visual.live": (s) => <HeroScreens l={{ ...look(s), visual: "live" }} />,
  "visual.filling": (s) => (
    <HeroScreens l={{ ...look(s), visual: "filling" }} />
  ),
  "motion.stream": (s) => <HeroScreens l={{ ...look(s), motion: "stream" }} />,
  "motion.arrivals": (s) => (
    <HeroScreens l={{ ...look(s), motion: "arrivals" }} />
  ),
  "motion.arch": (s) => <HeroScreens l={{ ...look(s), motion: "arch" }} />,
  "light.pool": (s) => <HeroScreens l={{ ...look(s), light: "pool" }} />,
  "light.none": (s) => <HeroScreens l={{ ...look(s), light: "none" }} />,
  "light.halo": (s) => <HeroScreens l={{ ...look(s), light: "halo" }} />,
  "second.none": () => <TailScreens second="none" />,
  "second.floor": () => <TailScreens second="floor" />,
  "second.room": () => <TailScreens second="room" />,
};

export function AlbumPageBoard() {
  return <ExplorationBoard spec={ALBUM_PAGE} previews={PREVIEWS} />;
}
