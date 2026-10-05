"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Keyboard, RotateCcw } from "lucide-react";

import { Frame, Measured } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * THE LIBRARY'S REAL VIEWPORTS: what a specimen that answers to the screen draws in, so it is judged at a desk and in a
 * hand whatever window the reader sits at.
 *
 * A layer, a full-width section or a whole screen reads the window (a media query, a breakpoint, `fixed`, a `vw`
 * clamp), so a div in the Library's column draws the reader's own width and a Tailwind prefix inside it follows the
 * window, never the box. A `Frame` (the lab's same-origin iframe, `FrameWindow`'s own world) is the one surface that
 * is a viewport: the popup stands where its kind's row puts it at the frame's width, a layer opens inside the page it
 * belongs to, and the frame swallows every link. Create's room was the first (`create-room-demo.tsx`); this is its
 * frame, lifted, so the popups, the plans' sheet, the stepper and the receipt draw the same two screens the same way
 * (`DEVICES`: a laptop and a phone, the create-wizard board's own pair).
 *
 * ★ A SCENE IS DRAWN OPEN, AND NEVER TAKES THE LIBRARY'S FOCUS WHEN IT ARRIVES (`QuietArrival`). A popup auto-focuses
 * what it opens on, and a frame's document is a window of its own: the first popup to mount as the reader scrolls
 * toward it would take the keyboard into the frame, so the arrow keys and the space bar stopped scrolling the page.
 * The frame's body stands inert for the layer's arrival (a focus call on inert content does nothing), then lets go.
 * A press of Replay is the reader's own, and plays the arrival again.
 *
 * ★ A PHONE'S KEYBOARD IS A STAND-IN, WRITTEN THE WAY THE REAL ONE IS (`KeyboardStandIn`). `useKeyboardInset` reads the
 * LAB's window (a laptop: no keyboard), so a field focused in a frame lifts nothing. The stand-in draws a keyboard's
 * worth of the screen and writes the same four things the hook writes on a layer (`--kb-inset`, `--vv-h`, `--vv-top`,
 * `data-keyboard`), so what moves is the real contract's CSS (`floating-layer.ts`), not a drawing of it.
 */

/** The two screens: the create-wizard board's own pair. */
export const DEVICES = {
  desk: { w: 1440, h: 900 },
  hand: { w: 375, h: 812 },
} as const;

export type Device = keyof typeof DEVICES;

/**
 * The frame, scaled to the well it stands in: a laptop's 1440 does not fit the Library's column, so it is zoomed down to
 * it (a zoom scales the picture and leaves the frame's own viewport alone, so its breakpoints and its `vw` stay the
 * laptop's), and a phone stands in the middle at its own size.
 */
export function FitToWell({
  w,
  children,
}: {
  w: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // A well that is not laid out (a hidden tab) has no width to fit to: it stays whole until it has one.
    const sync = () => {
      const room = el.getBoundingClientRect().width;
      setK(room > 0 ? Math.min(1, room / w) : 1);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);
  return (
    <div ref={box} className="min-w-0 overflow-hidden">
      <div style={{ width: w, zoom: k }} className="mx-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * The frame's body stands inert while a layer arrives in it, so nothing it opens can take focus out of the Library (the
 * header says why), then lets go once the arrival has had its commits. Placed in the scene, once.
 *
 * It is `ms` long, never keyed to an event: the popup's own focus move runs in an effect a commit after the portal
 * mounts, and a hold that waited on "the popup is open" would wait on the thing it must outrun.
 */
export function QuietArrival({ ms = 700 }: { ms?: number }) {
  const mark = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const body = mark.current?.ownerDocument.body;
    if (!body) return;
    body.inert = true;
    const timer = window.setTimeout(() => {
      body.inert = false;
    }, ms);
    return () => {
      window.clearTimeout(timer);
      body.inert = false;
    };
  }, [ms]);
  return <span ref={mark} hidden />;
}

/** A portrait phone's text keyboard on a screen this tall (`use-keyboard-inset.ts` measured 0.42 to 0.44 of it). */
export const KEYBOARD_PX = 340;

const LAYER = '[data-slot="popup-content"]';

/**
 * A KEYBOARD, UP: a drawn one at the foot of the frame and, on every popup standing in it, the four things
 * `useKeyboardInset` writes while a field holds focus on a touch screen. The hook clears them whenever no field of the
 * LAB's window holds focus (its laptop has no keyboard), so they are held by an observer that puts them back; each
 * write checks the value first, since an attribute set to what it already is still queues a record.
 */
export function KeyboardStandIn({ up }: { up: boolean }) {
  const mark = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const doc = mark.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win || !up) return;
    const written = {
      "--kb-inset": `${KEYBOARD_PX}px`,
      "--vv-h": `${win.innerHeight - KEYBOARD_PX}px`,
      "--vv-top": "0px",
    };
    const hold = () => {
      for (const layer of doc.querySelectorAll<HTMLElement>(LAYER)) {
        for (const [name, value] of Object.entries(written))
          if (layer.style.getPropertyValue(name) !== value)
            layer.style.setProperty(name, value);
        if (layer.getAttribute("data-keyboard") !== "open")
          layer.setAttribute("data-keyboard", "open");
      }
    };
    hold();
    const watch = new win.MutationObserver(hold);
    watch.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-keyboard"],
    });
    return () => {
      watch.disconnect();
      for (const layer of doc.querySelectorAll<HTMLElement>(LAYER)) {
        for (const name of Object.keys(written))
          layer.style.removeProperty(name);
        layer.removeAttribute("data-keyboard");
      }
    };
  }, [up]);
  return (
    <>
      <span ref={mark} hidden />
      {up ? <KeyboardBody /> : null}
    </>
  );
}

const KEY_ROWS = [10, 9, 7] as const;

/** The drawn keyboard: neutral keys on a grey tray, over everything the frame holds. */
function KeyboardBody() {
  return (
    <div
      aria-hidden
      data-keyboard-stand-in=""
      style={{ height: KEYBOARD_PX }}
      className="fixed inset-x-0 bottom-0 z-[60] flex flex-col justify-between gap-2 bg-neutral-300 px-1.5 pt-2 pb-6 dark:bg-neutral-800"
    >
      {KEY_ROWS.map((n) => (
        <div key={n} className="flex justify-center gap-1.5">
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className="h-11 flex-1 rounded-md bg-neutral-50 shadow-[0_1px_0_rgb(0_0_0/0.3)] dark:bg-neutral-600"
            />
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1.5">
        <span className="h-11 w-12 rounded-md bg-neutral-400/80 dark:bg-neutral-700" />
        <span className="h-11 flex-1 rounded-md bg-neutral-50 shadow-[0_1px_0_rgb(0_0_0/0.3)] dark:bg-neutral-600" />
        <span className="h-11 w-20 rounded-md bg-neutral-400/80 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

/**
 * What a popup stands in, so its scrim and corner have something to dim: a stand-in album page, the app's own
 * tokens and no data. Drawn at the frame's own width, so a hand's page is two columns and a desk's four.
 */
export function BehindThePopup({ children }: { children?: ReactNode }) {
  return (
    <div
      data-library-behind=""
      className="min-h-screen bg-background p-4 text-foreground sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-heading text-lg">Maya &amp; Jay&rsquo;s wedding</p>
        <span className="h-8 w-24 rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-lg bg-muted",
              i % 3 === 0 && "bg-muted/60",
            )}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

/** A caption read off the frame's own document: what the scene is doing, or null while it has not settled. */
export type Probe = (root: HTMLElement, win: Window) => string | null;

/** The popup standing in a frame, read off its own document: its kind, its shape, and the room it takes. */
export const readLayer: Probe = (root) => {
  const layer = root.ownerDocument.querySelector<HTMLElement>(LAYER);
  if (!layer) return null;
  const box = layer.getBoundingClientRect();
  const shape = layer.getAttribute("data-shape");
  const kind = layer.getAttribute("data-kind");
  if (!shape || box.width === 0) return null;
  return `${kind ? `${kind} → ` : ""}${shape}, ${Math.round(box.width)} × ${Math.round(box.height)}`;
};

/**
 * A screen's scene and what it reports: the frame's caption reads what is on screen (the popup's shape and room, the
 * stepper's step and where its picture sits), off the frame's own elements, never off the table or the class that
 * chose it.
 */
export function Reads({
  probe,
  onRead,
  children,
}: {
  probe: Probe;
  onRead: (line: string) => void;
  children: ReactNode;
}) {
  return (
    <Measured
      probe={probe}
      deps={[probe]}
      onMeasure={onRead}
      timers={[300, 900, 2200]}
    >
      {children}
    </Measured>
  );
}

export type PairContext = { device: Device; keyboard: boolean };

/**
 * A SCENE AT BOTH SCREENS: the laptop zoomed down into the column and the phone at its own size beside it (stacked when
 * the column is too narrow for both), each in a frame of its own, with Replay (the arrival again) and, for a scene with
 * a field, a Keyboard switch on the phone.
 *
 * `scene` is called once per frame and must draw one subtree. `read` is the probe that captions each frame from what
 * stands in it (a popup's shape by default); a caption is the frame's own words until it answers.
 */
export function DevicePair({
  id,
  scene,
  read = readLayer,
  keyboard = false,
  replay = true,
  captions,
  note,
}: {
  /** Names the frames (`<id>-desk`, `<id>-hand`): unique on its page. */
  id: string;
  scene: (context: PairContext) => ReactNode;
  /** What each frame's caption is read from. */
  read?: Probe;
  /** The scene takes a field: offer the keyboard switch on the phone. */
  keyboard?: boolean;
  /** Offer Replay: the scene remounts, and its arrival plays again. */
  replay?: boolean;
  /** A caption per screen, shown until the scene says what it measured. */
  captions?: Partial<Record<Device, ReactNode>>;
  /** A line under the controls. */
  note?: ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [wide, setWide] = useState(false);
  const [run, setRun] = useState(0);
  const [keys, setKeys] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Both screens side by side only where the laptop keeps room to be read (a third of its width and up).
    const sync = () =>
      setWide(el.getBoundingClientRect().width >= DEVICES.hand.w + 24 + 520);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frame = (device: Device) => (
    <DeviceFrameCaptioned
      key={`${device}-${run}`}
      id={`${id}-${device}`}
      device={device}
      caption={captions?.[device]}
    >
      {(onRead) => (
        <Reads probe={read} onRead={onRead}>
          {scene({ device, keyboard: keyboard && keys && device === "hand" })}
        </Reads>
      )}
    </DeviceFrameCaptioned>
  );

  return (
    <div data-library-demo={id} ref={box} className="space-y-3">
      <div
        className="grid items-start gap-x-6 gap-y-5"
        // One column that may shrink below its content (a bare `auto` track grows to the phone's 375 and runs past a
        // narrower well), or the laptop beside the phone.
        style={{
          gridTemplateColumns: wide
            ? `minmax(0, 1fr) ${DEVICES.hand.w}px`
            : "minmax(0, 1fr)",
        }}
      >
        {frame("desk")}
        <div className="mx-auto w-fit max-w-full">{frame("hand")}</div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {replay ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRun((n) => n + 1)}
          >
            <RotateCcw /> Replay
          </Button>
        ) : null}
        {keyboard ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={keys} onCheckedChange={setKeys} />
            <Keyboard className="size-4" aria-hidden />
            Keyboard up, in the hand
          </label>
        ) : null}
        {note ? (
          <p className="text-caption text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

/** One frame, its caption following what the scene in it reports. */
function DeviceFrameCaptioned({
  id,
  device,
  caption,
  children,
}: {
  id: string;
  device: Device;
  caption?: ReactNode;
  children: (read: (line: string) => void) => ReactNode;
}) {
  const { w, h } = DEVICES[device];
  const [read, setRead] = useState<string | null>(null);
  return (
    <FitToWell w={w}>
      <Frame
        id={id}
        w={w}
        h={h}
        title={`${w} by ${h}`}
        caption={read ?? caption}
        onApproach
      >
        <QuietArrival />
        {children(setRead)}
      </Frame>
    </FitToWell>
  );
}
