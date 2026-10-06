"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ExternalLink, X } from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import {
  resolveSettingsPage,
  SETTINGS_PAGE_PARAM,
  type SettingsPage,
} from "@/components/app/event-settings/settings-pages";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { roomOfHref } from "@/lib/event/sections";
import { doorLabel } from "@/lib/events/visibility-labels";
import { cn } from "@/lib/utils";

import { Frame } from "@/components/lab";

import { HubAlbum } from "./album";
import { type DoorDraw, ROOM_LABEL, type RoomId } from "./door-kit";
import { DOORS, type DoorsId } from "./doors";
import { type Case, HOST } from "./fixtures";
import { HubHead } from "./head";
import {
  EVENT_ID,
  GuestAlbum,
  GuestsBody,
  ReelView,
  ReviewBody,
  SettingsRoom,
} from "./rooms";
import { type Ground, isPhone, type ScreenId } from "./scene";

/**
 * HER HUB, AS ROOMS-WIRING WIRED IT: production's own order
 * (`dashboard/[eventId]/page.tsx`): the app's chrome (`AppShell`, the crumbs,
 * the bell, her menu), the cover, the doors going sticky, the checklist while
 * the event is not ready (production's `EventChecklist`), and the album. A
 * frame is drawn in the door option the board asks for (`doors.tsx`), on the
 * cover's settled strip.
 *
 * ★ EVERY ROOM OPENS OVER THE HUB (his `rooms=over`, wired; the calls G1
 * and G2, drawn in every door option): Review and Guests in Settings' own
 * panel (production's `Popup` of the `settings` kind, its head titling the
 * room), a link in one room naming another opening it in that same panel
 * (production's `roomOfHref`: Settings' door page, "Let them in from
 * Guests"), the reel full screen, and See it as a guest an inert phone over
 * the dimmed hub. Only Try it opens one, on a press.
 *
 * ★ ON THE GROUND THE BOARD ASKS FOR (paper, or the room), whatever the lab
 * itself wears: the frame's page takes the ground's class, and `--eh-page`
 * carries the page's own colour into the cover (which is the room in both),
 * so a seam that fades into the page fades into the right one.
 *
 * ★ A LAYER STANDS IN THE FRAME'S OWN VIEWPORT: `fixed` inside the frame's
 * document is fixed to the frame, so a panel, the reel and the phone are drawn
 * where production would draw them, over the hub, which stays mounted and
 * scrolled behind (`data-eh-behind`).
 */

export type HubDraw = {
  doors: DoorsId;
  c: Case;
  screen: ScreenId;
  ground: Ground;
};

/* ── the host app around every drawing ────────────────────────────────────── */

function HostApp({
  name,
  ground,
  children,
  layer,
  onLink,
}: {
  name: string;
  ground: Ground;
  children: ReactNode;
  /** What stands over the page, outside the shell's stacking. */
  layer?: ReactNode;
  /** A press on a link that names a room (Try it alone). */
  onLink?: (e: MouseEvent) => void;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <div
          onClickCapture={onLink}
          data-eh-ground={ground}
          className={cn(
            ground === "room" ? "dark" : "surface-paper",
            "relative min-h-screen bg-background text-foreground",
          )}
          style={{ "--eh-page": "var(--background)" } as CSSProperties}
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
            <SetCrumbs
              trail={[
                { label: "Partyreel", href: "/dashboard" },
                { label: name },
              ]}
            />
            {children}
          </AppShell>
          {layer}
        </div>
      </HostAddProvider>
    </EventShareProvider>
  );
}

/* ── the rooms, over the hub ──────────────────────────────────────────────── */

/** Where Try it stands: the room open over the hub, and a Settings page a level in. Null: the hub at rest. */
export type RoomNav = { room: RoomId; page: SettingsPage | null } | null;

/** The rooms that open in the one panel. */
const PANEL: readonly RoomId[] = ["review", "guests", "settings"];

/**
 * A LINK'S ROOM, AS PRODUCTION READS IT (`roomOfHref`, the hub's own capture
 * of every room link, `event-share-provider.tsx`): the hub's address with
 * `?room=` (and Settings' `&setting=` page), or a room's own route. The share
 * kit is no room here; anything else is no room at all.
 */
export function navOfHref(href: string, origin: string): RoomNav {
  const sheet = roomOfHref(href, EVENT_ID, origin);
  if (!sheet || sheet === "share") return null;
  const room: RoomId = sheet === "as-guest" ? "guest" : sheet;
  let page: SettingsPage | null = null;
  if (room === "settings") {
    try {
      page = resolveSettingsPage(
        new URL(href, origin).searchParams.get(SETTINGS_PAGE_PARAM),
      );
    } catch {
      page = null;
    }
  }
  return { room, page };
}

/**
 * THE ONE PANEL, PRODUCTION'S OWN (`share/room-panel.tsx`, the call G2): the
 * `settings` kind of `Popup`, a panel from the right over the dimmed hub at a
 * desk and the whole screen under a bar whose arrow names the event in a
 * hand, its head the room's name over the event's, the album mounted and
 * scrolled behind it. Review, Guests and Settings are one panel to the pixel,
 * so a room opening another (a link in it naming the other) swaps what the
 * panel holds and never jumps. `routed`, as production's is: it stays out of
 * history, which here is the lab page's.
 *
 * ★ THE ROOM ON SHOW OUTLIVES ITS PRESS (adjusted during render), so the panel
 * slides out with its room still in it rather than emptying first.
 */
function PanelLayer({
  nav,
  c,
  onNavigate,
  onClose,
}: {
  nav: RoomNav;
  c: Case;
  onNavigate: (nav: RoomNav) => void;
  onClose: () => void;
}) {
  const want = nav && PANEL.includes(nav.room) ? nav : null;
  const [shown, setShown] = useState<RoomNav>(want);
  if (want && want !== shown) setShown(want);
  const room = shown?.room ?? "review";
  return (
    <Popup
      open={want !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <PopupContent kind="settings" routed data-room-panel={room}>
        {room === "settings" ? (
          <SettingsRoom
            f={c}
            page={shown?.page ?? null}
            onPage={(page) => onNavigate({ room: "settings", page })}
          />
        ) : (
          <>
            <PopupHeader
              title={ROOM_LABEL[room]}
              description={c.name}
              back={c.name}
            />
            {/* ★ BLOCK FLOW, as Settings' body: the body is the scroller, and nothing in it may shrink to fit. */}
            <PopupBody className="space-y-6 pb-6">
              {room === "review" ? <ReviewBody f={c} /> : <GuestsBody f={c} />}
            </PopupBody>
          </>
        )}
      </PopupContent>
    </Popup>
  );
}

/** Who meets the album as it stands, in the door's own words (production's `doorLine`). */
const doorLineOf = (c: Case) =>
  c.ready.acceptingUploads
    ? doorLabel(c.door)
    : `${doorLabel(c.door)} · Uploads paused`;

/**
 * SEE IT AS A GUEST, AN INERT PHONE OVER THE DIMMED HUB (the call G1,
 * production's `as-guest-stage.tsx` drawn: its own phone page cannot load in
 * a frame): at a desk her album in a phone's viewport, inert to her presses,
 * with the door's own line under its caption and the way back over the hub;
 * in a hand the whole screen, under a bar whose arrow names the event, as
 * every room is in a hand.
 */
function GuestLayer({ d, onClose }: { d: HubDraw; onClose?: () => void }) {
  if (!isPhone(d.screen))
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
          data-room-panel="as-guest"
          className="eh-phone relative flex flex-col items-center gap-4"
        >
          <div className="space-y-0.5 text-center">
            <p className="text-sm font-medium text-white">
              What your guests see
            </p>
            <p className="text-xs text-white/60">{doorLineOf(d.c)}</p>
          </div>
          <div className="eh-phone-body overflow-hidden rounded-[46px] bg-black p-2.5 shadow-2xl ring-1 ring-white/15">
            <div className="overflow-hidden rounded-[36px]">
              <Frame id="eh-guest-phone" w={390} h={844} title="">
                <div inert>
                  <GuestAlbum f={d.c} screen="375" />
                </div>
              </Frame>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <ExternalLink className="size-3.5" aria-hidden />
            Open it in a new tab
          </span>
        </div>
      </div>
    );
  return (
    <div
      data-room-panel="as-guest"
      className="eh-cover fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* A hand's bar: the arrow names where it returns, as every room's screen does. */}
      <div className="grid h-13 shrink-0 grid-cols-[minmax(auto,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="max-w-[40vw] gap-0.5 justify-self-start px-1.5 text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
          <span className="truncate">{d.c.name}</span>
        </Button>
        <span className="max-w-[55vw] truncate text-center font-heading text-base">
          As a guest
        </span>
        <span aria-hidden />
      </div>
      <div inert className="min-h-0 flex-1 overflow-hidden">
        <GuestAlbum f={d.c} screen="375" />
      </div>
    </div>
  );
}

/** The reel, full screen from its first frame (the call G2): the view the guests watch, its close saying where it goes. */
function ReelLayer({ d, onClose }: { d: HubDraw; onClose?: () => void }) {
  return (
    <div data-room-panel="reel" className="eh-cover fixed inset-0 z-50">
      <ReelView
        f={d.c}
        desk={!isPhone(d.screen)}
        closeTo="Back to your hub"
        onClose={onClose}
      />
    </div>
  );
}

/* ── the hub ──────────────────────────────────────────────────────────────── */

/**
 * ONE FRAME OF THE HUB, in its door option, with `nav` the room standing open
 * over it (null: the hub at rest). A still frame draws its room as it stands;
 * Try it keeps the one panel mounted so it slides out as well as in.
 */
export function Hub({
  d,
  nav = null,
  stuck = false,
  onNavigate,
  mark,
}: {
  d: HubDraw;
  nav?: RoomNav;
  stuck?: boolean;
  /** Try it: a press on a door, a room's link, a close (null). */
  onNavigate?: (nav: RoomNav) => void;
  /** What a live frame reads its stuck state off (the door option attaches it). */
  mark?: RefObject<HTMLDivElement | null>;
}) {
  const c = d.c;
  const door = DOORS[d.doors];
  const Page = door.Page;
  const own = useRef<HTMLDivElement | null>(null);
  const ref = mark ?? own;
  const open = nav?.room ?? null;
  const go = onNavigate;
  const close = go ? () => go(null) : undefined;
  const draw: DoorDraw = {
    c,
    name: c.name,
    screen: d.screen,
    ground: d.ground,
    selected: open,
    onOpen: go ? (room) => go({ room, page: null }) : undefined,
  };
  // A press on any link that names a room opens it over the hub, wherever it stands (a room's own link included).
  const onLink = go
    ? (e: MouseEvent) => {
        const link = (e.target as HTMLElement | null)?.closest?.("a[href]");
        const href = link?.getAttribute("href");
        if (!href) return;
        const to = navOfHref(href, window.location.origin);
        if (!to) return;
        e.preventDefault();
        go(to);
      }
    : undefined;
  const layer =
    open === "reel" ? (
      <ReelLayer d={d} onClose={close} />
    ) : open === "guest" ? (
      <GuestLayer d={d} onClose={close} />
    ) : null;
  return (
    <HostApp
      name={c.name}
      ground={d.ground}
      onLink={onLink}
      layer={
        <>
          {layer}
          {go || (open && PANEL.includes(open)) ? (
            <PanelLayer
              nav={nav}
              c={c}
              onNavigate={go ?? (() => {})}
              onClose={close ?? (() => {})}
            />
          ) : null}
        </>
      }
    >
      <div
        data-app-wide
        data-eh-behind={open ? "" : undefined}
        className="space-y-6"
      >
        <HubHead id={d.doors} door={door} d={draw} mark={ref} />
        <Page {...draw} stuck={stuck} mark={ref} />
        {c.photos === 0 ? (
          <EventChecklist
            eventId={EVENT_ID}
            facts={c.ready}
            over={false}
            plan={{ tier: "pro", hasBilling: true }}
          />
        ) : null}
        <HubAlbum f={c} screen={d.screen} album={c.album} />
      </div>
    </HostApp>
  );
}

/* ── Try it ───────────────────────────────────────────────────────────────── */

/**
 * A FRAME'S OWN STUCK STATE, off its own scroll. Production asks an
 * IntersectionObserver with the bar's height as its margin; a root margin
 * does not reach into a frame's document, so a live frame reads its mark's
 * top against the bar on every scroll instead: whatever the door option marks
 * (a row's footprint, or doors on the cover themselves) at its `stickAt`.
 */
function useStuckIn(
  mark: RefObject<HTMLDivElement | null>,
  at: number,
  key: unknown,
) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = mark.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => setStuck(el.getBoundingClientRect().top <= at);
    read();
    win.addEventListener("scroll", read, { passive: true });
    return () => win.removeEventListener("scroll", read);
  }, [mark, at, key]);
  return stuck;
}

/**
 * TRY IT: the hub running. Scroll it and the doors fold into their band (or
 * the capsule docks under the bar); press a door and its room opens over the
 * hub as wired; Esc and the room's own close bring her back.
 */
export function TryHub({ d }: { d: HubDraw }) {
  const [nav, setNav] = useState<RoomNav>(null);
  const mark = useRef<HTMLDivElement | null>(null);
  const stuck = useStuckIn(
    mark,
    DOORS[d.doors].stickAt,
    `${d.doors}-${nav?.room ?? ""}`,
  );
  const root = useRef<HTMLSpanElement | null>(null);
  const go = useCallback((to: RoomNav) => setNav(to), []);

  useEffect(() => {
    const win = root.current?.ownerDocument.defaultView;
    if (!win) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNav(null);
    };
    win.addEventListener("keydown", onKey);
    return () => win.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <span ref={root} hidden />
      <Hub d={d} nav={nav} stuck={stuck} onNavigate={go} mark={mark} />
    </>
  );
}
