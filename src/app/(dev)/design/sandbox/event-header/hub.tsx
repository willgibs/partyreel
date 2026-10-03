"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ExternalLink, X } from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { cn } from "@/lib/utils";

import { Frame } from "@/components/lab";

import { HubAlbum } from "./album";
import {
  DoorsRow,
  type DoorsId,
  GlassDoors,
  ROOM_LABEL,
  type RoomId,
} from "./doors";
import type { FactsId } from "./facts";
import { type Case, HOST } from "./fixtures";
import { HubHead } from "./head";
import {
  GuestAlbum,
  GuestsBody,
  ReelView,
  ReviewBody,
  SettingsBody,
} from "./rooms";
import type { ScreenId } from "./scene";

/**
 * HER HUB, AS ROOMS-WIRING WIRED IT: production's own order
 * (`dashboard/[eventId]/page.tsx`): the app's chrome (`AppShell`, the crumbs,
 * the bell, her menu), the cover, the doors going sticky, the checklist while
 * the event is not ready (production's `EventChecklist`), and the album. A
 * frame is drawn in both decisions at once: the cover's `facts` and the row's
 * `doors`.
 *
 * ★ EVERY ROOM OPENS OVER THE HUB (his `rooms=over`, wired): Review, Guests
 * and Settings in one panel at a desk and the whole screen in a hand, the
 * reel full screen, See it as a guest a phone over the dimmed hub. Only Try
 * it opens one, on a press.
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

export type Ground = "paper" | "room";

export type HubDraw = {
  facts: FactsId;
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
}: {
  name: string;
  ground: Ground;
  children: ReactNode;
  /** What stands over the page, outside the shell's stacking. */
  layer?: ReactNode;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <div
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
              trail={[{ label: "Partyreel", href: "/dashboard" }, { label: name }]}
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

function RoomBody({ room, c }: { room: RoomId; c: Case }) {
  if (room === "review") return <ReviewBody f={c} />;
  if (room === "guests") return <GuestsBody f={c} />;
  return <SettingsBody f={c} />;
}

/**
 * THE ONE PANEL (`share/room-panel.tsx`): a panel at a desk, the whole screen
 * in a hand, its scrim a close.
 */
function PanelLayer({
  room,
  d,
  onClose,
}: {
  room: RoomId;
  d: HubDraw;
  onClose?: () => void;
}) {
  const desk = d.screen === "1440";
  return (
    <div className="eh-layer fixed inset-0 z-50">
      <div
        aria-hidden
        className="eh-scrim absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <aside
        data-eh-room={ROOM_LABEL[room]}
        className={cn(
          "eh-panel absolute flex flex-col bg-popover text-popover-foreground shadow-layer",
          desk ? "inset-y-0 right-0 w-3/4 max-w-lg border-l" : "inset-0",
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>
        <div
          className={cn(
            "flex-1 overflow-y-auto pb-8",
            desk ? "px-6 pt-6" : "px-3 pt-5",
          )}
        >
          <RoomBody room={room} c={d.c} />
        </div>
      </aside>
    </div>
  );
}

/** See it as a guest: a phone over the dimmed hub at a desk, the whole screen in a hand. */
function GuestLayer({ d, onClose }: { d: HubDraw; onClose?: () => void }) {
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
          className="eh-phone relative flex flex-col items-center gap-4"
        >
          <p className="text-sm text-white/75">What your guests see</p>
          <div className="eh-phone-body overflow-hidden rounded-[46px] bg-black p-2.5 shadow-2xl ring-1 ring-white/15">
            <div className="overflow-hidden rounded-[36px]">
              <Frame id="eh-guest-phone" w={390} h={844} title="">
                <GuestAlbum f={d.c} screen="375" />
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
      className="eh-cover fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <GuestAlbum
        f={d.c}
        screen="375"
        back={
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 shrink-0 items-center gap-1 rounded-full glass pr-3.5 pl-2.5 text-sm font-medium text-white"
          >
            <X className="size-4" aria-hidden />
            Back to your hub
          </button>
        }
      />
    </div>
  );
}

function LayerFor({
  open,
  d,
  onClose,
}: {
  open: RoomId;
  d: HubDraw;
  onClose?: () => void;
}) {
  if (open === "reel")
    return (
      <div data-eh-room="Highlight reel" className="eh-cover fixed inset-0 z-50">
        <ReelView
          f={d.c}
          desk={d.screen === "1440"}
          closeTo="Back to your hub"
          onClose={onClose}
        />
      </div>
    );
  if (open === "guest") return <GuestLayer d={d} onClose={onClose} />;
  return <PanelLayer room={open} d={d} onClose={onClose} />;
}

/* ── the hub ──────────────────────────────────────────────────────────────── */

/**
 * ONE FRAME OF THE HUB, in both decisions, with `open` the room standing open
 * over it (null: the hub at rest).
 */
export function Hub({
  d,
  open = null,
  stuck = false,
  onOpen,
  onClose,
  footRef,
  capsuleRef,
}: {
  d: HubDraw;
  open?: RoomId | null;
  stuck?: boolean;
  onOpen?: (room: RoomId) => void;
  onClose?: () => void;
  footRef?: RefObject<HTMLDivElement | null>;
  capsuleRef?: RefObject<HTMLDivElement | null>;
}) {
  const c = d.c;
  const layer = open ? <LayerFor open={open} d={d} onClose={onClose} /> : null;
  return (
    <HostApp name={c.name} ground={d.ground} layer={layer}>
      <div
        data-app-wide
        data-eh-behind={layer ? "" : undefined}
        className="space-y-6"
      >
        <HubHead
          facts={d.facts}
          doors={d.doors}
          c={c}
          screen={d.screen}
          doorsOnCover={
            d.doors === "glass" ? (
              <GlassDoors
                c={c}
                screen={d.screen}
                selected={open}
                onOpen={onOpen}
                capsuleRef={capsuleRef}
              />
            ) : undefined
          }
        />
        <DoorsRow
          doors={d.doors}
          c={c}
          name={c.name}
          screen={d.screen}
          stuck={stuck}
          selected={open}
          onOpen={onOpen}
          footRef={footRef}
        />
        {c.photos === 0 ? (
          <EventChecklist
            eventId="eh-maya-and-jay"
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
 * top against the bar on every scroll instead: the row's footprint, or where
 * the doors are glass, the capsule itself (it docks the moment it reaches the
 * bar).
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
  const [open, setOpen] = useState<RoomId | null>(null);
  const footRef = useRef<HTMLDivElement | null>(null);
  const capsuleRef = useRef<HTMLDivElement | null>(null);
  const glass = d.doors === "glass";
  const stuck = useStuckIn(
    glass ? capsuleRef : footRef,
    glass ? 64 : 57,
    `${d.doors}-${open}`,
  );
  const root = useRef<HTMLSpanElement | null>(null);
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

  return (
    <>
      <span ref={root} hidden />
      <Hub
        d={d}
        open={open}
        stuck={stuck}
        onOpen={setOpen}
        onClose={close}
        footRef={footRef}
        capsuleRef={capsuleRef}
      />
    </>
  );
}
