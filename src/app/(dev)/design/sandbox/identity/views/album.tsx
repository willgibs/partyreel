"use client";

import { useState } from "react";
import { Download, ImageUp, ListChecks } from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { Button } from "@/components/ui/button";
import { ViewMenu } from "@/components/shared/view-menu";
import { cn } from "@/lib/utils";
import type { RowStep } from "@/lib/shared/album-rows";

import { ALBUM } from "../fixtures";
import type { Width } from "../model";

import { MediaTile } from "./atoms";
import { useInUse } from "./in-use";
import type { ScreenProps } from "./screen-props";
import { EventHead, HostFrame } from "./host";

/**
 * THE ALBUM'S TOOLBAR, ON THE HUB: the album's own head as `event-gallery.tsx`
 * draws it (its label and count, Add photos, Download, Select and the one View
 * menu, four quiet keys in a row), over the album's first rows.
 *
 * ★ THE ROW IS QUOTED, THE MENU AND THE HEAD ARE MOUNTED. The album's tools
 * read the hub's stores (its selection, its add, its bin), so they are drawn
 * here with production's atoms in production's order and words (Download is
 * `download-all-button.tsx`'s own key), while the head (`FeedSectionHeader`)
 * and the View menu (`ViewMenu`, its tile size, sort and filter) are
 * production's components themselves. Every press goes nowhere.
 *
 * ★ IN USE, THE VIEW MENU STANDS OPEN: the row of keys under the hand, and
 * the display it opens (its rows, its tile size's stops) wearing the floating
 * edge, so a set is judged against a pop-out at the size a host meets one.
 */

/** The View menu's three groups, as the hub passes them (`event-gallery.tsx`). */
function useViewGroups() {
  const [step, setStep] = useState<RowStep>(1);
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("all");
  return [
    {
      kind: "density" as const,
      id: "tile-size",
      label: "Tile size",
      value: step,
      onChange: setStep,
      perRow: (s: RowStep) => [3, 5, 8][s] ?? 5,
    },
    {
      id: "sort",
      label: "Sort",
      value: sort,
      onChange: setSort,
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
      ],
    },
    {
      id: "filter",
      label: "Filter",
      value: filter,
      onChange: setFilter,
      options: [
        { value: "all", label: "All" },
        { value: "deleted", label: "Deleted" },
      ],
    },
  ];
}

/** The album's head: its label and count, and its four quiet keys. */
export function AlbumHead({ count = 214 }: { count?: number }) {
  const groups = useViewGroups();
  return (
    <FeedSectionHeader
      label="Album"
      count={count}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button variant="outline" size="sm">
            <ImageUp /> Add photos
          </Button>
          <Button variant="outline" size="sm">
            <Download /> Download
          </Button>
          <Button variant="outline" size="sm">
            <ListChecks /> Select
          </Button>
          <ViewMenu groups={groups} />
        </div>
      }
    />
  );
}

/** The album's first rows, as the justified rows lay them. */
export function AlbumRows({ w, rows = 3 }: { w: Width; rows?: number }) {
  const perRow = w === 1440 ? 4 : 2;
  const lines: (typeof ALBUM)[number][][] = [];
  for (let i = 0; i < ALBUM.length && lines.length < rows; i += perRow)
    lines.push(ALBUM.slice(i, i + perRow));
  return (
    <div className="flex flex-col" style={{ gap: "var(--gap-gallery)" }}>
      {lines.map((line, r) => (
        <div
          key={r}
          className="flex"
          style={{ gap: "var(--gap-gallery)", height: w === 1440 ? 220 : 132 }}
        >
          {line.map((p) => (
            <MediaTile
              key={p.src}
              src={p.src}
              pos={p.pos}
              style={{ flex: `${p.ratio} 1 0` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Opens the View menu the way a mouse does: Radix's trigger answers a pointer's press. */
function openView() {
  const trigger = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="dropdown-menu-trigger"]',
    ),
  ].find((el) => el.textContent?.trim() === "View");
  trigger?.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      pointerType: "mouse",
    }),
  );
}

export function AlbumScreen({ w }: ScreenProps) {
  useInUse([[900, openView]]);
  return (
    <HostFrame>
      <div className={cn("space-y-6")}>
        <EventHead />
        <section aria-label="Album" className="space-y-2.5">
          <AlbumHead />
          <AlbumRows w={w} rows={w === 1440 ? 3 : 4} />
        </section>
      </div>
    </HostFrame>
  );
}
