"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ExternalLink, X } from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Frame } from "@/components/lab";

import { HubAlbum } from "./album";
import {
  DoorsRow,
  type DoorsId,
  GlassDoors,
  ROOM_LABEL,
  ROOM_ORDER,
  type RoomId,
  UNDER_ORDER,
} from "./doors";
import { EVENT, HOST, MOMENTS, type Moment } from "./fixtures";
import { type FactsId, HubHead } from "./head";
import {
  BackToHub,
  GuestAlbum,
  GuestsBody,
  ReelView,
  ReviewBody,
  SettingsBody,
} from "./rooms";
import type { ScreenId } from "./scene";

/**
 * MAYA'S HUB, AND THE THREE WAYS A DOOR OPENS ITS ROOM.
 *
 * The page is production's in its own order (`dashboard/[eventId]/page.tsx`):
 * the app's chrome (`AppShell`, the crumbs, the bell, her menu), the cover,
 * the row of doors going sticky, the checklist while the event is not ready
 * (production's `EventChecklist`), and the album. A frame is drawn in all
 * three decisions at once: the cover's `facts`, the row's `doors`, and what a
 * press does, `rooms`.
 *
 *  - `today`: Review and Guests are pages under their crumb, Settings is the
 *    settings kind (a panel at a desk, the whole screen in a hand), and the
 *    reel and a guest's view leave the hub for the guests' album;
 *  - `over`: every room is a place over the hub in that one kind, the reel
 *    and the guests' album over the whole screen, and each closes back to
 *    the hub as she left it (`ui/popup-kinds.ts` is the table it would join);
 *  - `under`: the doors are tabs, the album is one of them, and a room takes
 *    the album's place under the band; the reel plays in the cover grown to
 *    the screen, and See it as a guest turns the whole page into hers.
 *
 * ★ A LAYER STANDS IN THE FRAME'S OWN VIEWPORT: `fixed` inside the frame's
 * document is fixed to the frame, so a panel, a screen, the reel and the
 * phone are drawn where production would draw them, over the hub, which stays
 * mounted and scrolled behind (`data-eh-behind`).
 */

export type RoomsId = "today" | "over" | "under";

export type HubDraw = {
  facts: FactsId;
  doors: DoorsId;
  rooms: RoomsId;
  moment: Moment;
  screen: ScreenId;
};

/** The crumb a room page wears, and the one its links answer to in a live frame. */
const HUB_HREF = "/dashboard/eh-maya-and-jay";

/* ── the host app around every drawing ────────────────────────────────────── */

function HostApp({
  trail,
  onCrumb,
  children,
  layer,
}: {
  trail: { label: string; href?: string }[];
  /** A live frame's crumbs go back to the hub (a still frame's go nowhere). */
  onCrumb?: () => void;
  children: ReactNode;
  /** What stands over the page, outside the shell's stacking. */
  layer?: ReactNode;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <div
          className="relative min-h-screen bg-background text-foreground"
          onClickCapture={
            onCrumb
              ? (e) => {
                  const a = (e.target as Element).closest("header a[href]");
                  if (a) onCrumb();
                }
              : undefined
          }
        >
          <AppShell
            headerActions={
              <>
                <NotificationBell items={[]} badgeCount={0} />
                <UserMenu
                  email={HOST.email}
                  displayName={HOST.fullName}
                  avatarUrl={null}
                  seed={HOST.seed}
                  planName="Pro"
                />
              </>
            }
          >
            <SetCrumbs trail={trail} />
            {children}
          </AppShell>
          {layer}
        </div>
      </HostAddProvider>
    </EventShareProvider>
  );
}

const HUB_TRAIL = [
  { label: "Partyreel", href: "/dashboard" },
  { label: EVENT.name },
];

/* ── the containers ───────────────────────────────────────────────────────── */

/** A working room's body: Review, Guests or Settings, production's own. */
function RoomBody({ room, d }: { room: RoomId; d: HubDraw }) {
  const f = MOMENTS[d.moment];
  if (room === "review") return <ReviewBody f={f} />;
  if (room === "guests") return <GuestsBody f={f} />;
  return <SettingsBody f={f} />;
}

/**
 * THE SETTINGS KIND (`popup-kinds.ts`: a panel at a desk, the whole screen in
 * a hand): the room's own heading leads it, and a hand's bar names where its
 * arrow returns. Its scrim takes a press as the close.
 *
 * ★ ONE PANEL FOR EVERY ROOM, A STEP WIDER THAN SETTINGS' TODAY (512 where
 * the kind's panel is 448), because Review's grid and the Guests room's rows
 * are working rooms; Settings opening in it is 64px wider than it ships.
 */
function PlaceLayer({
  room,
  d,
  onClose,
}: {
  room: RoomId;
  d: HubDraw;
  onClose?: () => void;
}) {
  const desk = d.screen === "1440";
  if (desk)
    return (
      <div className="eh-layer fixed inset-0 z-50">
        <div
          aria-hidden
          className="eh-scrim absolute inset-0 bg-black/40"
          onClick={onClose}
        />
        <aside
          data-eh-room={ROOM_LABEL[room]}
          data-eh-shape="a panel"
          className="eh-panel absolute inset-y-0 right-0 flex w-3/4 max-w-lg flex-col border-l bg-popover text-popover-foreground shadow-layer"
        >
          {/* The close stands just outside the panel's edge, over the dimmed hub it returns to,
              so the room's own heading row keeps the panel's whole width. */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 -left-14 flex size-10 items-center justify-center rounded-full bg-popover text-popover-foreground shadow-layer ring-1 ring-border hover:bg-muted"
          >
            <X className="size-4" />
          </button>
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
            <RoomBody room={room} d={d} />
          </div>
        </aside>
      </div>
    );
  return (
    <div
      data-eh-room={ROOM_LABEL[room]}
      data-eh-shape="the whole screen"
      className="eh-screen fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="flex h-13 shrink-0 items-center border-b px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-0.5 px-1.5 text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
          {EVENT.name}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-8">
        <RoomBody room={room} d={d} />
      </div>
    </div>
  );
}

/** The reel over the whole screen, risen from the foot (the `cover` shape). */
function ReelLayer({
  d,
  closeTo,
  onClose,
}: {
  d: HubDraw;
  closeTo: string;
  onClose?: () => void;
}) {
  return (
    <div
      data-eh-room="Highlight reel"
      data-eh-shape="the whole screen"
      className="eh-cover fixed inset-0 z-50"
    >
      <ReelView
        f={MOMENTS[d.moment]}
        desk={d.screen === "1440"}
        closeTo={closeTo}
        onClose={onClose}
      />
    </div>
  );
}

/**
 * SEE IT AS A GUEST, OVER THE HUB. At a desk her album stands in a phone over
 * the dimmed hub, a real 390 by 844 viewport (a frame inside the frame, so the
 * cover lays out as a phone does), scrollable, the payoff of the row; in a
 * hand it is the whole screen, the way back to her hub floating over it.
 */
function GuestLayer({ d, onClose }: { d: HubDraw; onClose?: () => void }) {
  const f = MOMENTS[d.moment];
  if (d.screen === "1440")
    return (
      <div className="eh-layer fixed inset-0 z-50 flex items-center justify-center">
        <div
          aria-hidden
          className="eh-scrim absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-10 items-center gap-1.5 rounded-full bg-white/10 pr-4 pl-3 text-sm font-medium text-white hover:bg-white/20"
        >
          <X className="size-4" aria-hidden />
          Back to your hub
        </button>
        <div
          data-eh-room="See it as a guest"
          data-eh-shape="a phone over the hub"
          className="eh-phone relative flex flex-col items-center gap-4"
        >
          <p className="text-sm text-white/75">What your guests see</p>
          <div className="eh-phone-body overflow-hidden rounded-[46px] bg-black p-2.5 shadow-2xl ring-1 ring-white/15">
            <div className="overflow-hidden rounded-[36px]">
              <Frame id="eh-guest-phone" w={390} h={844} title="">
                <GuestAlbum f={f} screen="375" />
              </Frame>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-white/60">
            <ExternalLink className="size-3.5" aria-hidden />
            Open it in a new tab
          </span>
        </div>
      </div>
    );
  return (
    <div
      data-eh-room="See it as a guest"
      data-eh-shape="the whole screen"
      className="eh-cover fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <GuestAlbum f={f} screen="375" back={<BackToHub onClose={onClose} />} />
    </div>
  );
}

/* ── the hub ──────────────────────────────────────────────────────────────── */

/**
 * THE HUB'S OWN PAGE: the cover, the doors, then what stands under them,
 * which is the checklist and the album, or (every room under the band) the
 * room whose tab is pressed.
 */
function HubPage({
  d,
  open,
  stuck,
  onOpen,
  footRef,
  behind,
}: {
  d: HubDraw;
  open: RoomId | null;
  stuck: boolean;
  onOpen?: (room: RoomId) => void;
  footRef?: RefObject<HTMLDivElement | null>;
  /** A layer stands over the page. */
  behind: boolean;
}) {
  const f = MOMENTS[d.moment];
  const under = d.rooms === "under";
  const order = under ? UNDER_ORDER : ROOM_ORDER;
  const selected = under ? (open ?? "album") : null;
  const glass =
    d.doors === "glass" ? (
      <GlassDoors
        f={f}
        screen={d.screen}
        order={order}
        selected={selected}
        onOpen={onOpen}
      />
    ) : undefined;
  const inPlace = under && open && open !== "album" && open !== "reel";
  const head =
    under && open === "reel" ? (
      <section
        data-eh-head=""
        data-eh-room="Highlight reel"
        data-eh-shape="the cover, grown to the screen"
        className="eh-grown relative -mx-3 overflow-hidden sm:-mx-5"
        style={{
          marginTop: -32,
          height:
            d.screen === "1440"
              ? "calc(100vh - 56px - 136px)"
              : "calc(100vh - 56px - 108px)",
        }}
      >
        <ReelView
          f={f}
          desk={d.screen === "1440"}
          closeTo="Back to the album"
          onClose={() => onOpen?.("album")}
        />
      </section>
    ) : (
      <HubHead facts={d.facts} f={f} screen={d.screen} doorsOnCover={glass} />
    );
  return (
    <div
      data-app-wide
      data-eh-behind={behind || undefined}
      className="space-y-6"
    >
      {head}
      <DoorsRow
        doors={d.doors}
        f={f}
        screen={d.screen}
        stuck={stuck}
        order={order}
        selected={selected}
        onOpen={onOpen}
        footRef={footRef}
      />
      {inPlace ? (
        <div
          data-eh-room={ROOM_LABEL[open]}
          data-eh-shape="in place, under the band"
          className={cn("eh-swap", open === "settings" && "max-w-2xl")}
        >
          <RoomBody room={open} d={d} />
        </div>
      ) : (
        <>
          {d.moment === "before" ? (
            <EventChecklist
              eventId="eh-maya-and-jay"
              facts={f.ready}
              over={false}
              plan={{ tier: "pro", hasBilling: true }}
            />
          ) : null}
          <HubAlbum f={f} screen={d.screen} />
        </>
      )}
    </div>
  );
}

/**
 * ONE FRAME OF THE HUB, in all three decisions, with `open` the room standing
 * open (null: the hub at rest). Every option's still frames are this; Try it
 * is this with its state its own.
 */
export function Hub({
  d,
  open = null,
  stuck = false,
  onOpen,
  onClose,
  footRef,
}: {
  d: HubDraw;
  open?: RoomId | null;
  stuck?: boolean;
  onOpen?: (room: RoomId) => void;
  onClose?: () => void;
  footRef?: RefObject<HTMLDivElement | null>;
}) {
  const desk = d.screen === "1440";
  const f = MOMENTS[d.moment];

  /* TODAY: two pages, a panel, and a trip to the guests' album. */
  if (d.rooms === "today") {
    if (open === "review" || open === "guests")
      return (
        <HostApp
          trail={[
            { label: "Partyreel", href: "/dashboard" },
            { label: EVENT.name, href: HUB_HREF },
            { label: ROOM_LABEL[open] },
          ]}
          onCrumb={onClose}
        >
          <div
            data-eh-room={ROOM_LABEL[open]}
            data-eh-shape="a page of its own"
            className="eh-page mx-auto max-w-5xl"
          >
            <RoomBody room={open} d={d} />
          </div>
        </HostApp>
      );
    if (open === "reel" || open === "guest")
      return (
        <TripToTheGuests
          d={d}
          reel={open === "reel"}
          onClose={onClose}
          desk={desk}
        />
      );
  }

  /* UNDER: See it as a guest turns the whole page into hers. */
  if (d.rooms === "under" && open === "guest")
    return (
      <div
        data-eh-room="See it as a guest"
        data-eh-shape="the whole page, turned"
        className="eh-turn"
      >
        <GuestAlbum
          f={f}
          screen={d.screen}
          back={<BackToHub onClose={onClose} />}
        />
      </div>
    );

  const layer =
    open && open !== "album" ? (
      d.rooms === "over" ? (
        open === "reel" ? (
          <ReelLayer d={d} closeTo="Back to your hub" onClose={onClose} />
        ) : open === "guest" ? (
          <GuestLayer d={d} onClose={onClose} />
        ) : (
          <PlaceLayer room={open} d={d} onClose={onClose} />
        )
      ) : d.rooms === "today" && open === "settings" ? (
        <PlaceLayer room="settings" d={d} onClose={onClose} />
      ) : null
    ) : null;

  return (
    <HostApp trail={HUB_TRAIL} layer={layer}>
      <HubPage
        d={d}
        open={d.rooms === "under" ? open : null}
        stuck={stuck}
        onOpen={onOpen}
        footRef={footRef}
        behind={Boolean(layer)}
      />
    </HostApp>
  );
}

/**
 * TODAY'S TRIP TO THE GUESTS' ALBUM. The reel's card opens the guests' album
 * with its view over it (`/e/<token>?reel`), whose close lands on that album,
 * not on her hub; the link opens the album in a new tab. Either way her hub
 * is a Back (or a tab) away, and the line at the foot is that trip, said.
 */
function TripToTheGuests({
  d,
  reel,
  onClose,
  desk,
}: {
  d: HubDraw;
  reel: boolean;
  onClose?: () => void;
  desk: boolean;
}) {
  const f = MOMENTS[d.moment];
  const [watching, setWatching] = useState(reel);
  return (
    <div
      data-eh-room={reel ? "Highlight reel" : "See it as a guest"}
      data-eh-shape={
        reel
          ? "the guests' album, its reel open"
          : "the guests' album, in a new tab"
      }
      className="relative"
    >
      <GuestAlbum f={f} screen={d.screen} />
      {watching ? (
        <div className="fixed inset-0 z-50">
          <ReelView
            f={f}
            desk={desk}
            closeTo="Back to the album"
            onClose={() => setWatching(false)}
          />
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full bg-popover py-1.5 pr-1.5 pl-4 text-sm text-popover-foreground shadow-layer ring-1 ring-border">
            <span>
              {reel
                ? "The guests' album. Your hub is a Back away."
                : "A new tab. Your hub is in the other one."}
            </span>
            <Button size="sm" variant="outline" onClick={onClose}>
              {reel ? "Back" : "Close the tab"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Try it ───────────────────────────────────────────────────────────────── */

/**
 * A FRAME'S OWN STUCK STATE, off its own scroll. Production asks an
 * IntersectionObserver with the bar's height as its margin; a root margin
 * does not reach into a frame's document, so a live frame reads the
 * footprint's top against the bar on every scroll instead.
 */
function useStuckIn(footRef: RefObject<HTMLDivElement | null>, key: unknown) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const foot = footRef.current;
    const win = foot?.ownerDocument.defaultView;
    if (!foot || !win) return;
    const read = () => setStuck(foot.getBoundingClientRect().top <= 57);
    read();
    win.addEventListener("scroll", read, { passive: true });
    return () => win.removeEventListener("scroll", read);
  }, [footRef, key]);
  return stuck;
}

/**
 * TRY IT: the hub running in one rooms option. Every door opens its room the
 * way that option opens it, Esc and the room's own close bring her back, and
 * the frame's scroll folds the doors into the band as production's does.
 */
export function TryHub({ d }: { d: HubDraw }) {
  const [open, setOpen] = useState<RoomId | null>(null);
  const footRef = useRef<HTMLDivElement | null>(null);
  const stuck = useStuckIn(footRef, `${d.rooms}-${open}`);
  const root = useRef<HTMLSpanElement | null>(null);

  const press = useCallback(
    (room: RoomId) => setOpen(room === "album" ? null : room),
    [],
  );
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const win = root.current?.ownerDocument.defaultView;
    if (!win) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    win.addEventListener("keydown", onKey);
    return () => win.removeEventListener("keydown", onKey);
  }, []);

  // A room that is a page of its own, or a trip, starts at its top.
  useEffect(() => {
    const win = root.current?.ownerDocument.defaultView;
    if (!win) return;
    if (d.rooms === "today" && open && open !== "settings")
      win.scrollTo({ top: 0, behavior: "instant" });
  }, [d.rooms, open]);

  return (
    <>
      <span ref={root} hidden />
      <Hub
        d={d}
        open={open}
        stuck={stuck}
        onOpen={press}
        onClose={close}
        footRef={footRef}
      />
    </>
  );
}
