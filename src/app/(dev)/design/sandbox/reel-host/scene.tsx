"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { EVENT } from "./fixtures";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN (host-curation's own machinery,
 * copied rather than imported: a board's directory is deleted at its ruling,
 * so a shared import would outlive it).
 *
 * ★ 1440 FIRST, 375 ON THE KNOB. Every one of these six questions sits on a
 * host app surface that ships laptop-first (the hub, the settings sheet, the
 * dashboard): a host shaping an event's reel is at a desk, the way
 * host-curation's own reviewer is.
 */
export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

// ★ "viewport", NEVER "screen" (spec.ts carries the reason: this board's own
// third ask is named `screen`, and a second control sharing that id would
// collide in defineExploration's dedup). This export is not currently
// imported (spec.ts declares its own copy, a spec being pure data a server
// page reads); kept in step with it so a future board.tsx reaching for it
// finds the same id spec.ts actually put in state.
export const VIEWPORT: Control = {
  id: "viewport",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Zoom-fits a portalled frame to the lab's own Fit preference. */
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

/** A number read off the frame's own document, never computed (the house
 *  rule: if the words above a frame and the caption under it disagree, the
 *  caption is the truth). */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
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

/** The host page's own ground under every scene: the app background and the
 *  page padding the hub and the dashboard really use. */
export function HostGround({
  screen,
  wide,
  children,
}: {
  screen: ScreenId;
  /** The hub's own `data-app-wide` (host=same): the album runs edge to edge. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        screen === "375"
          ? "min-h-full space-y-5 bg-background px-4 py-5 text-foreground"
          : `min-h-full space-y-6 bg-background py-7 text-foreground ${wide ? "px-6" : "px-8"}`
      }
    >
      {children}
    </div>
  );
}

/**
 * THE APP'S OWN TOP BAR, QUOTED (identity-profile's `AppHeader`, copied for
 * the same reason it was copied there: `AppShell` reads a real session on
 * mount, which inside a lab frame means whoever is signed in on THIS
 * machine, never Mia). The thin fact every host-side board on the desk draws
 * at this weight: signed in, nothing more.
 */
export function AppHeader({ label }: { label: string }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </span>
      <Avatar size="sm" seed="reel-host-mia">
        <AvatarFallback className="text-[10px]">
          {EVENT.host.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

/**
 * THE ONE RESPONSIVE SHEET, QUOTED (`ui/sheet.tsx`'s own classes at each
 * posture, `settings=sheet`): a right panel at a desk, a bottom sheet in a
 * hand, already open, over a dimmed ground. Never the real `Sheet` /
 * `SheetPrimitive.Root`: radix PORTALS its content to the document the
 * frame's `<iframe>` lives in, not the one inside it, so an actually-opened
 * real sheet would escape the picture a reviewer is looking at (the same
 * reason identity-profile's `SetupSheet` is plain markup).
 *
 * ★ `fixed`, NEVER `absolute` (found live, 2026-09-22: `lab:demo` read two
 * genuinely different sheet options as "the same picture"). This board has
 * no normal-flow content of its own above the sheet, so an `absolute` panel
 * anchors to a `min-h-full` ancestor that has nothing to inherit ITS height
 * from inside the frame's document and collapses to zero (measured: 0px),
 * squashing the panel to little more than its header row. `fixed` anchors to
 * the iframe's own viewport instead, which is always the Frame's real w x h
 * regardless of any ancestor's height, exactly why identity-profile's own
 * `SetupSheet` reaches for it.
 */
export function SheetGround({
  screen,
  title,
  description,
  children,
}: {
  screen: ScreenId;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const bottom = screen === "375";
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="fixed inset-0 bg-black/10" />
      <div
        data-rh-sheet
        className={
          bottom
            ? "fixed inset-x-0 bottom-0 flex max-h-[88%] flex-col gap-4 overflow-y-auto rounded-t-xl border-t border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer"
            : "fixed inset-y-0 right-0 flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer"
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-card-title font-medium text-foreground">
              {title}
            </p>
            {description && (
              <p className="truncate text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
            <X className="size-4" aria-hidden />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A grey placeholder card standing in for a real settings card this board
 *  has no question about (Details, Visibility, Uploads): present so the
 *  sheet reads as a real sheet with other things in it, never drawn in
 *  full, which would spend the reading budget on cards nobody is judging. */
export function UnrelatedCard({ title }: { title: string }) {
  return (
    <div
      data-rh-unrelated
      className="rounded-lg border border-dashed border-border/70 p-3 text-xs text-muted-foreground"
    >
      {title}
    </div>
  );
}
