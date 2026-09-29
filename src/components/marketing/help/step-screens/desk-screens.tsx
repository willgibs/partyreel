import {
  Check,
  Clapperboard,
  Download,
  ImagePlus,
  ListChecks,
  Maximize2,
  MonitorPlay,
  QrCode,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  reviewCardFace,
} from "@/components/app/event-feed/room-card";
import {
  CreatePicture,
  FillPicture,
  KeepPicture,
  ReelPicture,
  SharePicture,
  ShapePicture,
} from "@/components/marketing/sections/how-it-works/host-pictures";
import {
  EVENT_URL,
  MiniQr,
  Panel,
} from "@/components/marketing/sections/how-it-works/picture-parts";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { marketingImage } from "@/lib/constants/marketing-media";
import { EVENT_ROOMS, type EventRoomId } from "@/lib/event/sections";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { type DeskScreenId, DESK_SCREENS } from "./registry";

/**
 * THE HOST'S SCREENS AND THE THINGS ON A HOST'S DESK (help-center r1 `article=screen`): what a
 * host-side how-to's steps keep beside their sentences.
 *
 * ★ DRAWN FROM PRODUCTION'S OWN PIECES. The loop's six are the walkthrough's pictures themselves
 * (`how-it-works/host-pictures.tsx`, each quoting the surface it draws), so /how-it-works and the
 * help's "How Partyreel works" show one picture of each step; the rest quote their surface's classes
 * and words (the share sheet's download menu, the event page's cards row read off `EVENT_ROOMS`
 * and `room-card.ts`, the reel's glass chrome), and `step-screens.test.ts` holds every quoted
 * string to the file it quotes, so a renamed control fails the gate rather than lying in a picture.
 *
 * ★ LAID OUT AT 400PX, ZOOMED TO THE SLOT. None of this reads the viewport (it is markup, not the
 * responsive app), so `zoom` scales it layout and all into the 200px slot, rendered on the server
 * with nothing to hydrate. A phone's surfaces need a document of their own (`phone-document.tsx`);
 * a desk's do not.
 */

const STAGE_W = 400;
export const DESK_ZOOM = 0.5;

/** The part of a picture a step is about, picked out the way a finger would point at it. */
function Mark({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-xl ring-4 ring-warning/70 ring-offset-4 ring-offset-card",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Print or display your QR ───────────────────────────────────────────────────────────── */

/** The share sheet's code and its download menu open (`event-qr.tsx`'s `QrDownloadMenu`). */
function QrDownloadPicture() {
  return (
    <Panel className="p-6">
      <div className="mx-auto w-40 rounded-xl bg-white p-3 ring-1 ring-foreground/5">
        <MiniQr preset="rounded" />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground">
          <Download className="size-4" />
          Download the code
        </span>
        <div className={cn("mt-1.5 w-60 p-1", floatingPanel)}>
          <Mark className="block rounded-[calc(var(--radius-float)_-_4px)]">
            <span
              className={cn(
                "flex items-center px-2 py-1.5 text-sm",
                floatingRow,
                "bg-accent text-accent-foreground",
              )}
            >
              SVG (best for print)
            </span>
          </Mark>
          <span
            className={cn(
              "mt-1 flex items-center px-2 py-1.5 text-sm",
              floatingRow,
            )}
          >
            PNG (best for screens)
          </span>
        </div>
      </div>
    </Panel>
  );
}

/** A code a foot away wants a couple of inches; across a room, a dinner plate. */
function QrSizePicture() {
  return (
    <Panel className="flex flex-col gap-6 p-6">
      {[
        { distance: "1 ft", line: "w-14", card: "w-16 p-1.5", code: "w-10" },
        { distance: "10 ft", line: "w-32", card: "w-40 p-3", code: "w-32" },
      ].map((row) => (
        <div key={row.distance} className="flex items-center gap-3">
          <span className="flex h-16 w-9 shrink-0 flex-col items-center justify-center rounded-xl border-[3px] border-foreground/70">
            <span className="size-3 rounded-full border-2 border-foreground/60" />
          </span>
          <span className="flex flex-col items-center gap-1.5">
            <span className="text-lg font-semibold text-muted-foreground tabular-nums">
              {row.distance}
            </span>
            <span
              className={cn(
                "border-t-[3px] border-dashed border-foreground/35",
                row.line,
              )}
            />
          </span>
          <span
            className={cn(
              "flex shrink-0 justify-center rounded-md bg-white shadow-lift ring-1 ring-foreground/10",
              row.card,
            )}
          >
            <span className={cn("block", row.code)}>
              <MiniQr preset="rounded" />
            </span>
          </span>
        </div>
      ))}
    </Panel>
  );
}

/** Dark on white with its margin; never inverted, never over a photograph. */
function QrMarginPicture() {
  const photo = marketingImage("reception-hall");
  return (
    <Panel className="grid grid-cols-3 gap-3 p-5">
      <figure className="flex flex-col items-center gap-2">
        <span className="block w-full rounded-lg bg-white p-3 ring-1 ring-foreground/10">
          <MiniQr />
        </span>
        <Verdict ok />
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <span className="block w-full rounded-lg bg-black p-3 [&_.bg-black]:bg-white">
          <MiniQr />
        </span>
        <Verdict ok={false} />
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <span className="relative block w-full overflow-hidden rounded-lg">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="120px"
            className="object-cover"
          />
          <span className="relative block p-1 opacity-80">
            <MiniQr />
          </span>
        </span>
        <Verdict ok={false} />
      </figure>
    </Panel>
  );
}

function Verdict({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-white",
        ok ? "bg-success" : "bg-destructive",
      )}
    >
      {ok ? <Check className="size-4" /> : <X className="size-4" />}
    </span>
  );
}

/* ── Play the reel on a screen ──────────────────────────────────────────────────────────── */

const REEL_STILL = "wedding-golden";

/** The reel's own stage: one of the album's photographs, edge to edge. */
function ReelStill({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative block aspect-video overflow-hidden bg-gallery",
        className,
      )}
    >
      <Image
        src={marketingImage(REEL_STILL).src}
        alt=""
        fill
        sizes="400px"
        className="object-cover"
      />
      {children}
    </span>
  );
}

/** The host's laptop, signed in, wired to the room's screen. */
function ReelLaptopPicture() {
  return (
    <div className="flex items-end gap-3 px-2 pt-2">
      <span className="flex flex-1 flex-col items-center">
        <span className="block w-full rounded-lg border-4 border-foreground/80 bg-foreground/80">
          <ReelStill className="rounded-sm" />
        </span>
        <span className="mt-1 h-6 w-2 bg-foreground/70" />
        <span className="h-1.5 w-20 rounded-full bg-foreground/70" />
      </span>
      <span className="mb-4 h-0.5 w-6 shrink-0 self-end rounded-full bg-foreground/45" />
      <span className="flex w-36 shrink-0 flex-col items-center">
        <span className="relative block w-full rounded-t-md border-4 border-b-0 border-foreground/75 bg-card">
          <span className="flex items-center justify-between border-b px-1.5 py-1">
            <span className="h-1 w-8 rounded-full bg-foreground/20" />
            <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-[8px] font-semibold text-background">
              M
            </span>
          </span>
          <ReelStill />
        </span>
        <span className="block h-2 w-[112%] rounded-b-lg bg-foreground/75" />
      </span>
    </div>
  );
}

/** What a quiet door wears in this picture: the row's own icon, and a line like the hub's. */
const QUIET_DOORS: Record<
  Exclude<EventRoomId, "reel">,
  { icon: LucideIcon; value: string }
> = {
  review: { icon: ListChecks, value: reviewCardFace(true, 0).value },
  guests: { icon: Users, value: "24 guests" },
  settings: { icon: Settings, value: "Public" },
};

/**
 * The event page's cards row (`event-cards-row.tsx`), the Highlight reel card living.
 *
 * ★ ITS DOORS ARE `EVENT_ROOMS`' OWN, IN THE ROW'S ORDER: the first two drawn and the third running
 * off the picture's edge, so the marked card sits wherever the row puts it. Will's order
 * (2026-09-29: "the highlight reel card should be the first ... Then Guests") opens the row on it.
 */
function ReelCardPicture() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background p-4">
      <div className="flex gap-2">
        {EVENT_ROOMS.slice(0, 2).map((room) => {
          if (room.id === "reel") {
            return (
              <Mark key={room.id} className="rounded-xl">
                <span
                  className={cn(
                    ROOM_CARD_BASE,
                    "relative h-24 w-36 justify-between gap-1 overflow-hidden border-transparent p-3 text-white",
                  )}
                >
                  <Image
                    src={marketingImage(REEL_STILL).src}
                    alt=""
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30" />
                  <Clapperboard
                    className="relative size-4 text-white/85"
                    aria-hidden
                  />
                  <span className="relative font-heading text-card-title">
                    {room.label}
                  </span>
                  <span className="relative truncate text-xs text-white/85">
                    Live for guests
                  </span>
                </span>
              </Mark>
            );
          }
          const { icon: Icon, value } = QUIET_DOORS[room.id];
          return (
            <span
              key={room.id}
              className={cn(
                ROOM_CARD_BASE,
                ROOM_CARD_QUIET,
                "h-24 w-36 justify-between gap-1 p-3",
              )}
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-heading text-card-title">{room.label}</span>
              <span className="truncate text-xs text-muted-foreground">
                {value}
              </span>
            </span>
          );
        })}
        <span
          className={cn(
            ROOM_CARD_BASE,
            ROOM_CARD_QUIET,
            "h-24 w-36 shrink-0 opacity-60",
          )}
        />
      </div>
    </div>
  );
}

/** One of the reel's glass controls (`live-reel-view.tsx`'s `ChromeButton`). */
function Glass({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
        GLASS,
      )}
    >
      {children}
    </span>
  );
}

/** The reel at a desk, its controls up: the owner's Play on a screen, named. */
function ReelControlsPicture() {
  return (
    <span className="block overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      <ReelStill>
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent" />
        <span className="absolute right-3 bottom-3 flex items-end gap-2">
          <Glass>
            <QrCode className={cn("size-[18px]", GLASS_MARK_LIT)} aria-hidden />
          </Glass>
          <Glass>
            <ImagePlus
              className={cn("size-[18px]", GLASS_MARK_LIT)}
              aria-hidden
            />
          </Glass>
          <span className="relative flex flex-col items-center">
            {/* The control's own tooltip: its label, which is the word the article says. */}
            <span className="absolute -top-9 right-0 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background">
              Play on a screen
            </span>
            <Mark className="rounded-full ring-offset-transparent">
              <Glass>
                <MonitorPlay
                  className={cn("size-[18px]", GLASS_MARK_LIT)}
                  aria-hidden
                />
              </Glass>
            </Mark>
          </span>
        </span>
      </ReelStill>
    </span>
  );
}

/** The screen posture before a press: the reel playing, the glass pill at its top. */
function ReelScreenPicture() {
  return (
    <span className="block rounded-2xl border-4 border-foreground/80 bg-foreground/80">
      <ReelStill className="rounded-lg">
        <span
          className={cn(
            "absolute top-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium whitespace-nowrap text-white",
            GLASS,
          )}
        >
          <Maximize2 className={cn("size-3.5", GLASS_MARK_LIT)} aria-hidden />
          Press anywhere to fill the screen
        </span>
        <span className="absolute right-2.5 bottom-2.5 flex items-end gap-2">
          <span className="text-right [text-shadow:0_1px_2px_rgb(0_0_0/0.55)]">
            <span className="block text-[9px] font-semibold text-white">
              Scan to add yours
            </span>
            <span className="block text-[7px] text-white/90">{EVENT_URL}</span>
          </span>
          <span className="block w-9 rounded-sm bg-white p-1">
            <MiniQr modules={9} />
          </span>
        </span>
      </ReelStill>
    </span>
  );
}

/** Every desk screen, by id: `Record` over the registry's ids, so a missing one is a type error. */
const PICTURES: Record<DeskScreenId, () => ReactNode> = {
  "loop-create": () => <CreatePicture />,
  "loop-share": () => <SharePicture />,
  "loop-fill": () => <FillPicture />,
  "loop-shape": () => <ShapePicture />,
  "loop-keep": () => <KeepPicture />,
  "loop-reel": () => <ReelPicture />,
  "qr-download": () => <QrDownloadPicture />,
  "qr-size": () => <QrSizePicture />,
  "qr-margin": () => <QrMarginPicture />,
  "reel-laptop": () => <ReelLaptopPicture />,
  "reel-card": () => <ReelCardPicture />,
  "reel-controls": () => <ReelControlsPicture />,
  "reel-screen": () => <ReelScreenPicture />,
};

/** One desk screen at the slot's width: laid out at 400px, zoomed to 200. */
export function DeskScreen({ id }: { id: DeskScreenId }) {
  return (
    <div
      role="img"
      aria-label={DESK_SCREENS[id]}
      data-step-screen={id}
      className="w-[200px] shrink-0"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none"
        style={{ width: STAGE_W, zoom: DESK_ZOOM }}
      >
        {PICTURES[id]()}
      </div>
    </div>
  );
}
