"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Bell } from "lucide-react";
import qrcode from "qrcode-generator";

import { Frame, useLabPrefs } from "@/components/lab";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StyledQr } from "@/components/app/styled-qr";
import {
  type QrStyleKey,
  QR_PRESETS,
  resolveQrPreset,
} from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { HOST } from "./fixtures";

/**
 * THE WINDOW, THE SHELL, AND THE ONE NUMBER THIS BOARD LIVES OR DIES ON.
 *
 * Every picture is drawn inside a `Frame`, which is a real viewport: every
 * `sm:` in a shipped component resolves at the window being judged, a sticky
 * header sticks to the window it is in, and a phone option is a phone rather
 * than a narrow div. The chrome around every screen is the shipped `AppShell`
 * itself, imported and wrapped, because none of these decisions is about the
 * shell and all of them happen inside it.
 *
 * ★ THE CODE IS MEASURED, NEVER CLAIMED. This whole round is about a square
 * getting from a browser to a table, and the only thing that decides whether it
 * survives that trip is how many pixels a module gets. So every caption reports
 * the LARGEST code rendered in that frame, in px, read off the laid-out
 * document: 200 on today's wizard and today's dialog, and whatever an option
 * actually buys. If a caption and the words above a frame disagree, the caption
 * is the truth. (The lesson is the program's: a board once drew an option with
 * its formula's sign backwards and Will judged the opposite of what he picked.)
 *
 * ★ AND NOTHING HERE CAN CREATE AN EVENT. The shipped `CreateEventWizard`,
 * `EventSlugControl` and `QrDesignerDialog` all call server actions that WRITE,
 * and a reviewer pressing a button inside a preview would insert a row on the
 * real database. So their surfaces are redrawn here from the same primitives
 * with the same copy, and the components this board imports whole are the pure
 * ones: `QrPresetPicker` (controlled, no persistence), `StyledQr`, `MediaTile`,
 * `AppShell`, `PageHeading`, `Button`, `Card`, `Input`.
 */

/* ── The two windows ─────────────────────────────────────────────────────── */

export const SIZES = {
  laptop: { w: 1440, h: 900, name: "1440 x 900, a laptop" },
  phone: { w: 375, h: 812, name: "375 x 812, a phone" },
} as const;
export type Size = keyof typeof SIZES;

export const sizeOf = (v: string | undefined): Size =>
  v === "phone" ? "phone" : "laptop";

/* ── The measurement ─────────────────────────────────────────────────────── */

type Measured = {
  /** The working column, as the page lays it out. */
  room: number;
  /** The widest rendered code in the frame, in px. 0 when there is none. */
  code: number;
  /** That code's module edge in px, which is what decides whether it scans. */
  module: number;
  /** The winning code is a scaled mock of PRINTED stock, not a code to scan. */
  print: boolean;
};

/**
 * ★ THE NUMBER THAT DECIDES WHETHER A CODE SCANS IS THE MODULE, NOT THE CODE.
 *
 * `StyledQr` reserves a quiet zone of `round(size * 0.1)` per side INSIDE the
 * box it is given, so a code drawn at `size` spends `size - 2 * margin` on the
 * data and divides that by its module count, which is set by the length of the
 * URL and by the preset's error-correction level (M for classic and bold, Q for
 * rounded and dots: qr-presets.ts). The river's plate enforces a floor of 3 px
 * per module for a phone camera reading a code off a screen
 * (`QR_MODULE_FLOOR_PX`, shared/river/qr-plate.tsx) and computes its own size
 * to meet it; every plate in the product is a fixed pixel number instead and
 * meets it by luck. This is the arithmetic, run per drawn code, so every
 * caption on this board reports the real one.
 */
export function modulePx(size: number, value: string, style: QrStyleKey) {
  const code = qrcode(
    0,
    QR_PRESETS[style].options.qrOptions.errorCorrectionLevel,
  );
  code.addData(value);
  code.make();
  const margin = Math.round(size * 0.1);
  return (size - margin * 2) / code.getModuleCount();
}

/** What the river's plate holds a code to, so a caption can say "under". */
export const MODULE_FLOOR_PX = 3;

/**
 * Reads the laid-out page from inside the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S (gallery-width's finding,
 * kept by app-shape). The subtree lives in the iframe's document, so it is
 * observed with that window's `ResizeObserver`: it fires when the copied
 * stylesheets land (the first layout is unstyled) and again on every re-flow. A
 * hidden option on the step's stage is `visibility: hidden`, which keeps its
 * layout, so it measures true as well.
 *
 * ★ AND IT POLLS ONCE AFTER A BEAT, because `StyledQr` appends its svg from an
 * effect after a dynamic `import()`. The observer sees the container resize
 * when that lands, but a code whose container was already the right box (every
 * one here, since the box is sized in CSS) resizes nothing at all. One late
 * read catches it; the observer catches everything after.
 */
function Measure({
  onMeasure,
  children,
}: {
  onMeasure: (m: Measured) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const read = () => {
      const room = el.querySelector<HTMLElement>("[data-fe-room]");
      let code = 0;
      // `module` is a reserved identifier for Next's lint (no-assign-module-variable).
      let mod = 0;
      let print = false;
      el.querySelectorAll<HTMLElement>("[data-fe-code]").forEach((c) => {
        const w = Math.round(c.getBoundingClientRect().width);
        if (w <= code) return;
        code = w;
        mod = Number(c.dataset.feModule ?? 0);
        print = c.dataset.fePrint !== undefined;
      });
      // ★ THE PICKER'S SWATCHES COUNT AS CODES, and forgetting that was this
      // board's first real defect: the style step drew four codes and its
      // caption read "no code on the screen", because `QrPresetPicker` renders
      // `StyledQr` itself and no wrapper of ours is inside it. A caption that
      // contradicts the picture above it is exactly what the capture pass is
      // for. The swatch's own svg is the measurement; its module edge rides on
      // the wrapper the board puts around the picker.
      el.querySelectorAll<HTMLElement>("[data-fe-swatch]").forEach((g) => {
        const svg = g.querySelector("svg");
        const w = Math.round(svg?.getBoundingClientRect().width ?? 0);
        if (w <= code) return;
        code = w;
        mod = Number(g.dataset.feModule ?? 0);
        print = false;
      });
      report.current({
        room: Math.round(room?.getBoundingClientRect().width ?? 0),
        code,
        module: mod,
        print,
      });
    };
    read();
    const late = win.setTimeout(read, 900);
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      win.clearTimeout(late);
      ro.disconnect();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/**
 * THE LAB'S FIT, KEPT BY A FRAME (gallery-width's `WindowFit`, copied rather
 * than imported because that board retired with its wiring). The step draws an
 * option at 1:1 and scrolls a wide one sideways, or fits it to the column under
 * the lab's Fit preference. CSS `zoom` on an iframe's ancestor scales the
 * picture and leaves the frame's own viewport alone, so the page inside still
 * lays out at 1440.
 */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
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
      data-stage-fit={zoomed ? "zoom" : "true"}
      ref={box}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** One option's picture: a real window, the page inside it, the numbers under. */
export function Screen({
  id,
  size,
  title,
  caption,
  children,
}: {
  id: string;
  size: Size;
  /** The option's own words, above the frame. */
  title: string;
  /** What to look at; the measured half is appended. */
  caption: string;
  children: ReactNode;
}) {
  const { w, h, name } = SIZES[size];
  const [m, setM] = useState<Measured | null>(null);
  // ★ THE SCAN FLOOR IS A SCREEN'S RULE, NOT PAPER'S, and reading the first
  // captures caught the board breaking it: the print sheet's stock is a SCALED
  // MOCK at a few dozen px, so the frame flagged three artifacts that print at
  // 38 and 90 mm as failing a floor written for a phone camera reading a
  // screen. A print mock reports its px and says what it is, and nothing else.
  const measured = !m
    ? "measuring"
    : m.code === 0
      ? `${m.room} px of working room, no code on the screen`
      : m.print
        ? `${m.room} px of working room, the stock's code at ${m.code} px, a scaled mock of printed paper rather than a code to scan off a screen`
        : `${m.room} px of working room, the biggest code at ${m.code} px, ${m.module.toFixed(1)} px a module${m.module < MODULE_FLOOR_PX ? ", UNDER the 3 px scan floor" : ""}`;
  return (
    <Fit w={w}>
      <Frame
        id={`first-event-${id}`}
        w={w}
        h={h}
        title={`${title} · ${name}`}
        caption={`${caption} Measured in the frame: ${measured}.`}
      >
        <Measure
          onMeasure={(next) =>
            setM((prev) =>
              prev && prev.room === next.room && prev.code === next.code
                ? prev
                : next,
            )
          }
        >
          {children}
        </Measure>
      </Frame>
    </Fit>
  );
}

/* ── The shell every screen sits in ──────────────────────────────────────── */

/**
 * The shipped host chrome: a sticky 56 px bar with the wordmark and a menu,
 * the page in the app's 1280 column, or running to the window when the page
 * asks (`data-app-wide`, the shell's own `:has()` mechanism, gallery-wiring).
 */
export function Shell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** The page runs to the window rather than sitting in the app's column. */
  wide?: boolean;
}) {
  return (
    <AppShell
      headerActions={
        <>
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          <Avatar className="size-8">
            <AvatarFallback>{HOST.initial}</AvatarFallback>
          </Avatar>
        </>
      }
    >
      <div
        data-fe-room
        data-app-wide={wide ? "" : undefined}
        className="w-full min-w-0"
      >
        {children}
      </div>
    </AppShell>
  );
}

/* ── The code, on its plate, at a size the caption can read ──────────────── */

/**
 * THE ONE OBJECT THIS ROUND IS ABOUT.
 *
 * `StyledQr` renders a bare div, so the plate is drawn here and carries
 * `data-fe-code` for the measurement. White stock is not a theme token and
 * never becomes one: a scanner needs dark modules on white in both casts
 * (qr-presets.ts), which is why every plate in the product is literally
 * `bg-white` and why no option on this board changes that.
 */
export function Code({
  size,
  style = "classic",
  value,
  pad = "p-4",
  radius = "rounded-lg",
  print = false,
  className,
}: {
  /** The code's own edge in px. This is the number the caption reports. */
  size: number;
  style?: QrStyleKey;
  value: string;
  /** The white stock around it. */
  pad?: string;
  radius?: string;
  /** This code is set in a SCALED MOCK of printed paper, not on a screen. */
  print?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-block bg-white", pad, radius, className)}>
      {/* data-fe-code is on the CODE, never on the plate: the plate's padding
          is not scannable and a caption that counted it would flatter every
          option by the same 24 to 32 px. */}
      <span
        data-fe-code
        data-fe-print={print ? "" : undefined}
        data-fe-module={modulePx(size, value, style).toFixed(2)}
        className="block"
        style={{ width: size, height: size }}
      >
        <StyledQr
          value={value}
          size={size}
          style={resolveQrPreset(style)}
          className="[&>svg]:h-auto [&>svg]:w-full"
        />
      </span>
    </span>
  );
}

export const STYLE_LABEL = (k: QrStyleKey) => QR_PRESETS[k].label;
