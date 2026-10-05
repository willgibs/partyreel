"use client";

import type { CSSProperties } from "react";
import {
  Check,
  Download,
  EyeOff,
  Heart,
  ImageUp,
  ListChecks,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import {
  BulkBar,
  type BulkBarAction,
} from "@/components/app/event-feed/bulk-bar";
import {
  EventCardsRow,
  type RoomCard,
} from "@/components/app/event-feed/event-cards-row";
import { HubCover } from "@/components/app/event-feed/event-hub-head";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import type { ReelCardData } from "@/components/app/event-feed/reel-card";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { SetCrumbs } from "@/components/shared/crumbs";
import { Button } from "@/components/ui/button";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { doorLabel } from "@/lib/events/visibility-labels";
import { GLASS_MARK } from "@/lib/glass";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { cn } from "@/lib/utils";

import {
  ALBUM,
  COUNTS,
  DATE,
  END_DATE,
  EVENT,
  JOIN_URL,
  NAME,
  PHOTO,
} from "../../fixtures";
import type { Width } from "../../model";
import { STILLS } from "../add";
import { MediaTile } from "../atoms";
import { HostFrame } from "../settings";

/**
 * MAYA'S HUB, AS THE EDGE'S THREE HUB PLACES STAND ON IT: the delete confirm,
 * the toasts and the tooltip are each a layer over this one page.
 *
 * ★ PRODUCTION'S OWN PARTS, IN THE HUB PAGE'S ORDER, WHERE THEY MOUNT OFF THE
 * SERVER: the app's chrome (`HostFrame`), the crumbs, the hub's cover
 * (`HubCover`: the album's photographs edge to edge under the name, its
 * facts, its link and the code on its white mat; off the hub's album store it
 * reads the page's stills), the rooms' doors (`EventCardsRow`, the page's own
 * words for each), the album's head (`FeedSectionHeader`) and, selecting, the
 * bulk bar (`BulkBar`, its confirm and its sliding tooltips its own). The
 * album's rows are the justified rows' look over the bootstrap stills, each
 * lit as the album's tile is (`MediaTile`), and a selected one wears the
 * selection's own veil and check (quoted from `selectable-media-grid.tsx`).
 * The checklist is left out: Maya's event is ready.
 *
 * ★ NOTHING WRITES: every verb here is inert, as the scene's contract says.
 */

const PRETTY_URL = "https://partyreel.com/e/maya-and-jay";

/**
 * THE ROOMS' DOORS, as the hub's page words them: six arrivals wait in Review,
 * two newcomers wait at the door (the Guests card says who waits before how
 * many), and Settings names the door.
 */
const ROOMS: RoomCard[] = [
  { id: "review", ...reviewCardFace(true, 6) },
  {
    id: "guests",
    value: `${COUNTS.waiting} waiting`,
    amber: true,
    count: COUNTS.waiting,
  },
  { id: "settings", value: doorLabel(EVENT.door) },
];

/** The Highlight reel's card, live, on the reel's opening stills. */
const REEL: ReelCardData = {
  state: "live",
  have: REEL_MINIMUM,
  of: REEL_MINIMUM,
  stills: [PHOTO.toast, PHOTO.golden, PHOTO.hall],
  viewHref: `/e/${EVENT.qr_token}?reel`,
  moderated: true,
  pending: 6,
};

/**
 * THE ALBUM'S BULK VERBS, quoted line for line from `GalleryBulkBar`
 * (`gallery-actions.tsx`): like, hide, download, then the removal apart with
 * its confirm. `GalleryBulkBar` reads the hub's selection store, so its list
 * is drawn here over production's own `BulkBar`.
 */
export function bulkActions(count: number): BulkBarAction[] {
  const removeTitle = count === 1 ? "Remove 1 item?" : `Remove ${count} items?`;
  const inert = () => {};
  return [
    { id: "like", label: "Like", icon: Heart, color: "like", onRun: inert },
    {
      id: "hide",
      label: "Hide",
      icon: EyeOff,
      color: "warning",
      onRun: inert,
    },
    {
      id: "download",
      label: "Download",
      icon: Download,
      color: "save",
      onRun: inert,
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      color: "destructive",
      onRun: inert,
      confirm: {
        title: removeTitle,
        // A host's removal waits in Deleted for the window (read off the constant), restorable.
        description: `They disappear from the album right away and move to Deleted, where you can restore them for ${RECENTLY_DELETED_WINDOW_DAYS} days. Guests won’t see them.`,
        confirmLabel: "Remove",
      },
    },
  ];
}

/** The album's resting tools, as `EventGallery` draws them beside its name. */
function RestingTools() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button variant="outline" size="sm">
        <ImageUp /> Add photos
      </Button>
      <Button type="button" variant="outline" size="sm">
        <Download /> Download
      </Button>
      <Button type="button" variant="outline" size="sm">
        <ListChecks /> Select
      </Button>
      <Button type="button" variant="outline" size="sm">
        <SlidersHorizontal /> View
      </Button>
    </div>
  );
}

/** One tile of the album, and in select mode the selection's own veil and check over it. */
function Tile({
  src,
  pos,
  ratio,
  selecting,
  selected,
}: {
  src: string;
  pos?: string;
  ratio: number;
  selecting: boolean;
  selected: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ flex: `${ratio} 1 0`, borderRadius: "var(--radius-tile)" }}
    >
      <MediaTile src={src} pos={pos} className="size-full" />
      {selecting && (
        <>
          <span
            className={`pointer-events-none absolute inset-0 transition-colors ${selected ? "bg-black/40" : "bg-black/0"}`}
          />
          <span
            className={cn(
              "pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full",
              selected
                ? "bg-success text-success-foreground ring-2 ring-white"
                : GLASS_MARK,
            )}
          >
            {selected && <Check data-check-pop className="size-3.5" />}
          </span>
        </>
      )}
    </div>
  );
}

/** The album's first rows, justified (four a row at a desk, two in a hand). */
function AlbumRows({
  w,
  selected,
}: {
  w: Width;
  /** In select mode, the tiles chosen (by their place in the album). */
  selected?: ReadonlySet<number>;
}) {
  const per = w === 1440 ? 4 : 2;
  const rows: { src: string; ratio: number; pos?: string; at: number }[][] = [];
  ALBUM.forEach((p, at) => {
    if (at % per === 0) rows.push([]);
    rows[rows.length - 1].push({ ...p, at });
  });
  return (
    <div className="flex flex-col" style={{ gap: "var(--gap-gallery)" }}>
      {rows.map((row, r) => (
        <div
          key={r}
          className="flex"
          style={{ gap: "var(--gap-gallery)", height: w === 1440 ? 236 : 132 }}
        >
          {row.map((p) => (
            <Tile
              key={p.src}
              src={p.src}
              pos={p.pos}
              ratio={p.ratio}
              selecting={Boolean(selected)}
              selected={selected?.has(p.at) ?? false}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The three tiles a frame holds chosen: one in each of the first rows a phone and a desk show. */
export const CHOSEN: ReadonlySet<number> = new Set([0, 3, 5]);

/**
 * THE HUB: the cover, the doors, then the album, its head at rest or
 * selecting. Whatever a place opens over it portals to the body.
 */
export function HubPage({
  w,
  selecting,
}: {
  w: Width;
  /** Select mode, with the chosen tiles' count on the bar. */
  selecting?: boolean;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <HostFrame>
          <div data-app-wide="" className="space-y-6">
            <SetCrumbs
              trail={[
                { label: "Partyreel", href: "/dashboard" },
                { label: NAME },
              ]}
            />
            <HubCover
              name={NAME}
              date={DATE}
              endDate={END_DATE}
              counts={{ album: 214, guests: 38, views: 412 }}
              prettyUrl={PRETTY_URL}
              eventLink={JOIN_URL}
              code={{
                qrStyle: EVENT.qr_style,
                door: EVENT.door,
                acceptingUploads: true,
                waiting: COUNTS.waiting,
              }}
              stills={STILLS}
              develop={null}
            />
            <EventCardsRow
              eventId={EVENT.id}
              cards={ROOMS}
              reel={REEL}
              moderationOn
              head={{ name: NAME, stills: STILLS }}
            />
            <section
              aria-label="Album"
              className="space-y-2.5"
              style={{ "--arrival-glow-ms": "0ms" } as CSSProperties}
            >
              <FeedSectionHeader
                label="Album"
                count={214}
                actionFills={Boolean(selecting)}
                action={
                  selecting ? (
                    <BulkBar
                      count={CHOSEN.size}
                      allSelected={false}
                      onSelectAll={() => {}}
                      onCancel={() => {}}
                      actions={bulkActions(CHOSEN.size)}
                    />
                  ) : (
                    <RestingTools />
                  )
                }
              />
              <AlbumRows w={w} selected={selecting ? CHOSEN : undefined} />
            </section>
          </div>
        </HostFrame>
      </HostAddProvider>
    </EventShareProvider>
  );
}
