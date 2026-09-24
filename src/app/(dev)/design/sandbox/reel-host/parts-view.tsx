"use client";

import type { ReactNode } from "react";
import {
  ChevronRight,
  ImagePlus,
  MonitorPlay,
  Palette,
  Pause,
  Play,
  QrCode,
  Timer,
  Video,
  Wand2,
  X,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Switch } from "@/components/ui/switch";
import { floatingPanel } from "@/components/ui/floating-layer";
import { GLASS, GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  DEFAULT_HOLD,
  DEFAULT_MOOD_ID,
  JOIN_LABEL,
  JOIN_URL,
  LATEST,
  MOODS,
  QR_STYLE,
  WAITING,
} from "./fixtures";
import { EngineStill, useStills } from "./stills";

/**
 * THE VIEW AS `reel-guest-wiring` BUILDS IT, WITH ONE HOST-SIDE THING MOVING
 * AT A TIME.
 *
 * This is not a second opinion about the view: it is the view that will ship,
 * drawn as furniture, so a host-side question is judged on the view that will
 * exist rather than on one that will not.
 *   - A slim glass bar at the foot at rest, morphing into the dock; Close shows
 *     and hides with the dock; every control has a tooltip.
 *   - ONE top row of icons (play/pause, Include videos, Style, Hold, Show the
 *     code, Add yours) and "Make your own" as the single primary beneath.
 *   - A top-left arrival chip that stacks into a short feed ("+2").
 *   - Full bleed, landscape at a laptop, portrait in a hand.
 *   - The Hold control at its 3 s default.
 *   - No event name anywhere on the picture: the photographs are the show.
 *
 * ★ A DEVICE PROP, NEVER A BREAKPOINT. The same view is drawn in a real 375
 * frame and inside a 375 box of the review question's 1440 composite, where a
 * `sm:` prefix would read the composite's width and draw a laptop dock in a
 * phone (the kit's `breakpoints-in-a-stage` trap, one level in). Every size
 * here is keyed off `device`.
 *
 * ★ `dark` ON THE ROOT, WHATEVER THE LAB'S THEME. The view is a cinema in
 * both of the product's themes, so its tooltip, popover and switch read the
 * dark tokens: a light-mode tooltip over a photograph is the wrong object.
 */

export type Device = "laptop" | "phone";
export type ViewExtra = "none" | "screen" | "switch";
export type ViewFeed = "none" | "arrival" | "waiting";
export type ViewPopover = "none" | "style-view" | "style-both";

const M = {
  laptop: {
    edge: "top-5 left-5",
    close: "top-5 right-5 size-10",
    dock: "bottom-7 gap-3",
    btn: "size-10 [&_svg]:size-[18px]",
    hold: "h-10 px-3 text-[13px]",
    primary: "h-11 px-5 text-[14px]",
    bar: "bottom-7 h-8 w-48",
    chip: "h-9 px-3.5 text-[13px]",
  },
  phone: {
    edge: "top-4 left-4",
    close: "top-4 right-4 size-9",
    dock: "bottom-6 gap-2.5",
    btn: "size-9 [&_svg]:size-4",
    hold: "h-9 px-2.5 text-[12px]",
    primary: "h-11 w-[264px] justify-center text-[14px]",
    bar: "bottom-6 h-8 w-40",
    chip: "h-8 px-3 text-[12px]",
  },
} as const;

/** The product's tooltip, quoted: `ui/tooltip.tsx`'s own face, drawn open. */
export function TipBubble({ children }: { children: ReactNode }) {
  return (
    <span
      data-rh-tip=""
      className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2.5 flex -translate-x-1/2 flex-col items-center"
    >
      <span className="rounded-float bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background shadow-layer">
        {children}
      </span>
      <span className="-mt-1.5 size-2.5 rotate-45 rounded-[2px] bg-foreground" />
    </span>
  );
}

function Icon({
  label,
  device,
  on,
  tip,
  children,
}: {
  label: string;
  device: Device;
  /** Pressed: its popover is the one open. */
  on?: boolean;
  /** Draw its tooltip open: the one the question is about. */
  tip?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="relative flex shrink-0">
      {tip ? <TipBubble>{label}</TipBubble> : null}
      <span
        role="img"
        aria-label={label}
        data-rh-control={label}
        className={cn(
          "flex items-center justify-center rounded-full text-white/90",
          M[device].btn,
          on && "bg-white/20 text-white",
        )}
      >
        {children}
      </span>
    </span>
  );
}

/** The dock's top row: its six icons, and whatever one host-side extra adds. */
function IconRow({
  device,
  extra,
  popover,
}: {
  device: Device;
  extra: ViewExtra;
  popover: ViewPopover;
}) {
  return (
    <div
      data-rh-icon-row=""
      className={cn(
        "flex items-center gap-1 rounded-full p-1.5 text-white",
        GLASS,
      )}
    >
      <Icon label="Pause" device={device}>
        <Pause aria-hidden />
      </Icon>
      <Icon label="Include videos" device={device}>
        <Video aria-hidden />
      </Icon>
      <Icon label="Style" device={device} on={popover !== "none"}>
        <Palette aria-hidden />
      </Icon>
      <span
        role="img"
        aria-label={`Hold, ${DEFAULT_HOLD} seconds`}
        data-rh-control="Hold"
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap text-white/90 tabular-nums",
          M[device].hold,
        )}
      >
        <Timer className="size-4" aria-hidden />
        {DEFAULT_HOLD} s
      </span>
      <Icon label="Show the code" device={device}>
        <QrCode aria-hidden />
      </Icon>
      <Icon label="Add yours" device={device}>
        <ImagePlus aria-hidden />
      </Icon>
      {extra === "screen" ? (
        <Icon label="Play on a screen" device={device} tip>
          <MonitorPlay aria-hidden />
        </Icon>
      ) : null}
      {extra === "switch" ? (
        <>
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-white/20" />
          <HostSwitch />
        </>
      ) : null}
    </div>
  );
}

/**
 * `switch=inview`: the host-only switch. It closes the top row at a laptop; in
 * a hand the row has no room for a labelled switch, so it rides its own glass
 * capsule just above the row, the same control in the same dock.
 */
function HostSwitch({ pill = false }: { pill?: boolean }) {
  return (
    <span
      data-rh-host-switch=""
      className={cn(
        "relative flex shrink-0 items-center gap-2 text-[12px] font-medium whitespace-nowrap text-white/90",
        pill ? cn("h-9 rounded-full px-3.5", GLASS) : "pr-2.5 pl-1.5",
      )}
    >
      <TipBubble>Guests see the reel. Off hides it everywhere.</TipBubble>
      <Switch
        size="sm"
        defaultChecked
        aria-label="Show the reel"
        tabIndex={-1}
      />
      Show the reel
    </span>
  );
}

/**
 * THE STYLE POPOVER, the host's own, for the defaults question. Opaque, on the
 * floating-layer contract (glass is media chrome, never a panel), the
 * eight moods as the ENGINE'S frames over one photograph, never gradients
 * standing in for a grade. The footer is the one thing `view` and `both` move.
 */
function StylePopover({
  device,
  variant,
}: {
  device: Device;
  variant: "style-view" | "style-both";
}) {
  const stills = useStills();
  const cols = "grid-cols-4";
  return (
    <div
      data-rh-style-popover={variant}
      className={cn(
        "absolute bottom-full left-1/2 mb-3 -translate-x-1/2 p-3",
        floatingPanel,
        device === "laptop" ? "w-[400px]" : "w-[331px]",
      )}
    >
      <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">
        Style
      </p>
      <div className={cn("grid gap-2", cols)}>
        {MOODS.map((mood) => {
          const src = stills[`mood-${mood.id}`];
          const on = mood.id === DEFAULT_MOOD_ID;
          return (
            <span
              key={mood.id}
              data-rh-mood={mood.id}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "relative block aspect-video w-full overflow-hidden rounded-[var(--radius-tile)] bg-[#07080a]",
                  on &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew
                  <img src={src} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  on ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {mood.label}
              </span>
            </span>
          );
        })}
      </div>
      {variant === "style-view" ? (
        <p
          data-rh-default-line=""
          className="mt-3 border-t border-border/60 px-1 pt-2.5 text-xs text-muted-foreground"
        >
          You&apos;re the host: every guest starts on your mood and hold.
        </p>
      ) : (
        <div
          data-rh-default-line=""
          className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 px-1 pt-2.5"
        >
          <span className="text-xs text-muted-foreground">
            Only on this device, for now.
          </span>
          <span className="flex h-7 shrink-0 items-center rounded-full border border-border px-2.5 text-xs font-medium text-foreground">
            Set for everyone
          </span>
        </div>
      )}
    </div>
  );
}

/** "Make your own": the single primary beneath the row. Ink on white. */
function Primary({ device }: { device: Device }) {
  return (
    <span
      role="img"
      aria-label="Make your own"
      className={cn(
        "flex items-center gap-2 rounded-full bg-white font-medium text-black",
        M[device].primary,
      )}
    >
      <Wand2 className="size-4" aria-hidden />
      Make your own
    </span>
  );
}

/**
 * THE ARRIVAL FEED: the newest name in front, the one before it peeking
 * behind, and a burst collapsed into a count ("Theo +2"), so a flurry of
 * uploads reads as one live beat rather than a queue of names. `waiting` adds
 * the host's own line under it, which only the host's device ever draws.
 */
function Feed({ device, feed }: { device: Device; feed: ViewFeed }) {
  if (feed === "none") return null;
  return (
    <div
      data-rh-feed={feed}
      className={cn(
        "absolute z-30 flex flex-col items-start gap-2",
        M[device].edge,
      )}
    >
      <span className="relative">
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-2 top-1.5 h-full scale-95 rounded-full opacity-60",
            GLASS_MARK,
          )}
        />
        <span
          className={cn(
            "relative flex items-center gap-2 rounded-full font-medium text-white",
            M[device].chip,
            GLASS_MARK,
          )}
        >
          <span className="size-2 rounded-full bg-white" aria-hidden />
          {LATEST}
          <span className="rounded-full bg-white/15 px-1.5 text-[11px] tabular-nums">
            +2
          </span>
        </span>
      </span>
      {feed === "waiting" ? (
        <span
          data-rh-said=""
          className={cn(
            "flex items-center gap-2 rounded-full font-medium text-white",
            M[device].chip,
            GLASS_MARK,
          )}
        >
          <span className="size-2 rounded-full bg-warning" aria-hidden />
          {WAITING} waiting to review
          <ChevronRight className="-mr-1 size-3.5 text-white/70" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

/** The event's code on its white plate, bottom right: "Scan to add yours" and the address. */
export function CodePlate({ device }: { device: Device }) {
  const big = device === "laptop";
  return (
    <div
      data-rh-code-plate=""
      className={cn(
        "absolute z-20 flex items-center",
        big ? "right-6 bottom-7 gap-3" : "right-4 bottom-28 gap-2",
      )}
    >
      <div className="text-right [text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_18px_rgb(0_0_0/0.45)]">
        <p
          className={cn(
            "font-heading leading-none font-medium text-white",
            big ? "text-[17px]" : "text-[13px]",
          )}
        >
          Scan to add yours
        </p>
        <p
          className={cn(
            "mt-1 text-white/75 tabular-nums",
            big ? "text-[12px]" : "text-[10px]",
          )}
        >
          {JOIN_LABEL}
        </p>
      </div>
      <div
        data-rh-code=""
        className="rounded-[var(--radius)] bg-white p-1.5"
        style={{ lineHeight: 0, width: big ? 104 : 72 }}
      >
        <StyledQr
          value={JOIN_URL}
          size={big ? 92 : 60}
          style={QR_STYLE}
          className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        />
      </div>
    </div>
  );
}

export function HostView({
  device,
  dock = "up",
  extra = "none",
  feed = "arrival",
  popover = "none",
  code = false,
  mode = "fixed",
}: {
  device: Device;
  dock?: "rest" | "up";
  extra?: ViewExtra;
  feed?: ViewFeed;
  popover?: ViewPopover;
  code?: boolean;
  /** `fixed` covers a real frame's viewport; `contain` fills the box it is given. */
  mode?: "fixed" | "contain";
}) {
  // A laptop's screen control only: a phone cannot take a television, and the
  // option says so rather than drawing a control that does nothing in a hand.
  const shownExtra = extra === "screen" && device === "phone" ? "none" : extra;
  // The host's switch leaves the row in a hand (see `HostSwitch`).
  const switchPill = shownExtra === "switch" && device === "phone";
  const rowExtra = switchPill ? "none" : shownExtra;
  return (
    <div
      data-rh-view=""
      data-rh-extra={shownExtra}
      data-rh-dock={dock}
      className={cn(
        "dark overflow-hidden bg-black text-white",
        mode === "fixed" ? "fixed inset-0" : "absolute inset-0",
      )}
    >
      <EngineStill
        id={device === "laptop" ? "landscape" : "portrait"}
        label="The reel, playing"
      />
      {/* The scrims sit on the edges that carry furniture and nowhere else:
          the middle of the picture stays the photograph at full strength. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/45 to-transparent"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent",
          dock === "up" ? "h-72 from-black/60" : "h-40 from-black/35",
        )}
      />

      <Feed device={device} feed={feed} />

      {dock === "up" ? (
        <span
          role="img"
          aria-label="Close"
          className={cn(
            "absolute z-30 flex items-center justify-center rounded-full text-white/90",
            M[device].close,
            GLASS,
          )}
        >
          <X className="size-4" aria-hidden />
        </span>
      ) : null}

      {code ? <CodePlate device={device} /> : null}

      {dock === "up" ? (
        <div
          data-rh-dock-up=""
          className={cn(
            "absolute left-1/2 z-30 flex -translate-x-1/2 flex-col items-center",
            M[device].dock,
          )}
        >
          {switchPill ? <HostSwitch pill /> : null}
          <div className="relative">
            {popover !== "none" ? (
              <StylePopover device={device} variant={popover} />
            ) : null}
            <IconRow device={device} extra={rowExtra} popover={popover} />
          </div>
          <Primary device={device} />
        </div>
      ) : (
        <div
          data-rh-bar=""
          className={cn(
            "absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full px-3 text-white/85",
            M[device].bar,
            GLASS,
          )}
        >
          <Play className="size-3.5 fill-white/85" aria-hidden />
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <span className="block h-full w-2/5 rounded-full bg-white/80" />
          </span>
        </div>
      )}
    </div>
  );
}

/** What the view's chrome actually carries, read off the drawing, never asserted. */
export const measureView = (root: HTMLElement): string | null => {
  const view = root.querySelector<HTMLElement>("[data-rh-view]");
  if (!view) return null;
  const controls = [...view.querySelectorAll<HTMLElement>("[data-rh-control]")]
    .map((c) => c.dataset.rhControl)
    .filter(Boolean);
  const said: string[] = [];
  const popover = view.querySelector<HTMLElement>("[data-rh-default-line]");
  if (popover)
    said.push(
      `the Style popover says "${popover.innerText.trim().replace(/\s+/g, " ")}"`,
    );
  if (view.querySelector("[data-rh-host-switch]"))
    said.push("a host-only Show the reel switch closes the row");
  if (view.querySelector('[data-rh-control="Play on a screen"]'))
    said.push("Play on a screen is the row's seventh icon");
  else if (
    view.dataset.rhExtra === "none" &&
    view.closest("[data-rh-open-view]")
  )
    said.push("a phone's dock carries no screen control");
  const row = controls.length
    ? `${controls.length} icons in the top row`
    : "the dock at rest";
  return `Measured: ${row}${said.length ? `; ${said.join("; ")}` : ""}.`;
};
