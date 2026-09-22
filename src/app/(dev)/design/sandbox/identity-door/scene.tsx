"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { EVENT, HOST, TEASER } from "./fixtures";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN, AND THE DOOR UNDER IT.
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB (`guest-capture`, `guest-shape`'s own
 * framing carried here): Priya is standing at a party holding a phone; 1440
 * exists so the desk panel is checked for the guest who opens the link on a
 * laptop later, never the primary read.
 *
 * ★ NOTHING HERE MAY REACH A SESSION, A SERVER FUNCTION OR THE NETWORK ON
 * MOUNT, and nothing mounts a Radix portal (Dialog, Sheet, Popover,
 * DropdownMenu): a Portal opened inside a portalled lab frame renders on the
 * LAB PAGE's document, not the phone being judged (`guest-capture/scene.tsx`'s
 * own note; `host-curation` names the same landmine for its lightbox). So the
 * door's own sheet, and the guest menu's own dropdown, are QUOTED markup in
 * `parts.tsx` — the real classes and copy, none of the real primitives.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/* ── the frame, fit and measured (verbatim machinery, `guest-capture`'s own) ─ */

function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** A number read off the frame's own document, never computed: the same
 *  discipline `guest-capture` and `media-viewer` hold every caption to. */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement, win: Window) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      try {
        const said = probe(el, win);
        if (said) report.current(said);
      } catch {
        // Not settled yet; the next timer or resize catches it.
      }
    };
    read();
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/* ── the door's own ground: the event behind, then the held sheet on it ──── */

/**
 * The nine tiles behind the door, in the shipped column rule
 * (`gallery-width`'s law, worn here rather than re-judged): a column WIDTH,
 * not a count, so this is the same grid the real teaser draws.
 */
function TeaserGrid({ items }: { items: readonly GridMedia[] }) {
  return (
    <div className={GALLERY_COLUMNS}>
      {items.map((item) => (
        <div
          key={item.id}
          style={
            {
              aspectRatio: `${item.width} / ${item.height}`,
              borderRadius: "var(--radius-tile)",
            } as CSSProperties
          }
          className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/**
 * THE PAGE BEHIND THE DOOR: the event name, the host byline, the stats line,
 * then the teaser — exactly what a guest's eye finds around the sheet's own
 * edges the whole time it stands (guest-flow.md, "the nine-tile teaser sits
 * blurred behind it the whole way, which is the point").
 */
function EventGround() {
  return (
    <div className="mx-auto max-w-[640px] px-5 pt-8 pb-28">
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
      <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
        <Avatar seed={HOST.seed} size="sm">
          <AvatarFallback className="text-[10px]">
            {HOST.displayName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span>
          Hosted by{" "}
          <span className="font-medium text-foreground">
            {HOST.displayName}
          </span>
        </span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span>{EVENT.date}</span>
      </p>
      {/* One template literal, not an expression beside text split across a
          line break: see the WHY comment on GateBody in parts.tsx. */}
      <p className="mt-3 text-sm text-muted-foreground">
        {`${EVENT.approvedTotal} photos & videos from ${EVENT.contributorCount} guests`}
      </p>
      <div className="mt-5">
        <TeaserGrid items={TEASER} />
      </div>
    </div>
  );
}

/**
 * THE HELD SHEET'S CHROME, QUOTED: `entry-shell.tsx`'s own two postures, a
 * bottom sheet in a hand and a full-height panel from a desk's right edge
 * (`ui/sheet.tsx`'s `w-3/4 max-w-md`, `rounded-t-float` on the phone half),
 * both HELD (no X, no handle: the door has "No exit"). `fixed`, never
 * `absolute` (`guest-capture`'s own
 * landmine, verbatim: "the frame IS the viewport... an absolute box inside a
 * min-h-full column pins to the bottom of the CONTENT instead"), so this
 * pins to the frame's true foot and true right edge whatever `EventGround`
 * resolves to.
 */
export function DoorFrame({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  const phone = screen === "375";
  return (
    <div className="min-h-full bg-background text-foreground">
      <EventGround />
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-black/10" />
        <div
          data-door-sheet={phone ? "phone" : "desktop"}
          className={
            phone
              ? "fixed inset-x-0 bottom-0 flex max-h-[85%] flex-col gap-4 overflow-y-auto rounded-t-float bg-popover px-6 pt-5 pb-6 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
              : "fixed inset-y-0 right-0 flex h-full w-[380px] max-w-[85%] flex-col gap-6 overflow-y-auto border-l border-border bg-popover p-6 text-sm text-popover-foreground shadow-layer"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * THE ALBUM SIDE OF THE DOOR: for `menu` and `remove`, Priya is already
 * inside, so the ground is the event header and a strip of the album itself
 * (no held sheet), with her own menu drawn open over it (`parts.tsx`'s
 * quoted dropdown, anchored under the trigger, or its confirm dialog,
 * centred via `CenteredOverlay`). `menu` renders LAST and OUTSIDE the
 * header, on this wrapper's own `relative`, so either shape can position
 * itself against the whole frame rather than fighting the header's flex row.
 */
export function AlbumGround({ menu }: { menu: ReactNode }) {
  return (
    <div className="relative min-h-full bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <span className="font-heading text-card-title">{EVENT.name}</span>
        <MenuTriggerSlot />
      </header>
      <div className="mx-auto max-w-[640px] px-4 pt-5 pb-10">
        <TeaserGrid items={TEASER} />
      </div>
      {menu}
    </div>
  );
}

/** The header's own avatar, ungrouped from the dropdown it would open: the
 *  real trigger markup (`guest-name-menu.tsx`), never wired to anything,
 *  since the menu itself is drawn open a few pixels away by `menu` above. */
function MenuTriggerSlot() {
  return (
    <span className="flex items-center gap-2 rounded-full">
      <Avatar size="sm">
        <AvatarFallback className="text-[10px]">P</AvatarFallback>
      </Avatar>
    </span>
  );
}
