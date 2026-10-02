"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { ArrowLeft, ChevronLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Keyboard } from "./pictures";

/**
 * THE ROOM: CREATE AS A SCREEN OF ITS OWN (his `shape=screen`), DRAWN IN HIS
 * LAYOUT, settled for every option of every decision here: the steppers quiet
 * at the top, the question just under them and always in the same place, the
 * answer's space in the centre, one button at the foot. Dark in both themes
 * (round one's carried call `room`): the pictures and the light carry it.
 *
 * ★ THE FLOW IS THE ONE THING THAT VARIES THE ROOM ITSELF (the `flow` ask):
 *  - `still`: the room holds; only the question and its answer change, in
 *    place, and Back waits beside the button at the thumb;
 *  - `slide`: each step slides in the way a phone's own setup does, Back at
 *    the head's left and the close at its right;
 *  - `carry`: each answer rises into the head as she goes, the name staying
 *    there as the room's title, and the head is the way back.
 *
 * ★ ONE DRAWING, PARAMETERISED BY PROGRESS (`Between`). A step change is
 * styles of `p` from 0 to 1, written straight onto the two pages, the
 * keyboard, the foot and (for `carry`) the answer in flight, so the frozen
 * frame a reviewer reads and the played one are the same picture at
 * different `p`. It plays only where motion is welcome (the frame's own
 * `prefers-reduced-motion`): reduced motion sees the frozen frame, which is a
 * drawing of the motion, and the live room cuts, as production would.
 *
 * ★ NOTHING HERE REACHES A SESSION OR THE NETWORK. The live rooms run on
 * local state; a pressed control changes the drawing and nothing else.
 */

export type Flow = "still" | "slide" | "carry";
export type StepN = 1 | 2 | 3 | 4;

/** The phone's keyboard, as `Keyboard` draws it: what the name's foot rides on. */
export const KEYBOARD_H = 315;

/* ── the steppers ───────────────────────────────────────────────────────── */

/**
 * FOUR HAIRLINES (his "subtle steppers up top"): the steps done and the one
 * she is on filled. `fill` is the next segment's own progress while a step
 * changes, so the line fills as the step arrives. In `carry` a filled segment
 * is a press back to its step.
 */
export function Hairlines({
  at,
  wide,
  fill,
  onStep,
  className,
}: {
  at: StepN;
  wide: boolean;
  /** 0 to 1: how far the segment after `at` has filled (a step changing). */
  fill?: number;
  /** A live room's way back: the step a filled segment returns to. */
  onStep?: (n: StepN) => void;
  className?: string;
}) {
  return (
    <span
      data-cw-steppers={at}
      className={cn(
        "flex items-center",
        wide ? "w-56 gap-2" : "w-36 gap-1.5",
        className,
      )}
    >
      {([1, 2, 3, 4] as const).map((n) => {
        const on = n <= at;
        const filling = n === at + 1 && fill !== undefined;
        const seg = (
          <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-foreground/15">
            <span
              data-cw-seg={n}
              className="absolute inset-y-0 left-0 rounded-full bg-foreground"
              style={{ width: on ? "100%" : filling ? `${fill * 100}%` : 0 }}
            />
          </span>
        );
        // A done step is a way back in `carry`: its segment is a press, with
        // a hit area a thumb can find under a three-pixel line.
        return onStep && n < at ? (
          <button
            key={n}
            type="button"
            aria-label={`Back to step ${n}`}
            onClick={() => onStep(n)}
            className="-my-3 flex-1 cursor-pointer py-3"
          >
            {seg}
          </button>
        ) : (
          <span key={n} className="flex-1">
            {seg}
          </span>
        );
      })}
    </span>
  );
}

/* ── the head ───────────────────────────────────────────────────────────── */

export type HeadProps = {
  flow: Flow;
  wide: boolean;
  at: StepN;
  /** The event's name once it has one (`carry` titles the room with it). */
  name?: string;
  /** A live room's handlers; a still frame draws them inert. */
  onBack?: () => void;
  onStep?: (n: StepN) => void;
  /** 0 to 1, the next segment filling while a step changes. */
  fill?: number;
  /** Draw Back whatever the step (a change into or out of a step that has one). */
  back?: boolean;
  /** `carry`: the name's line is held for the name in flight to it. */
  nameLanding?: boolean;
  nameRef?: RefObject<HTMLSpanElement | null>;
};

/** Back exists from the second step on, never on the beat: by then the event exists. */
export const hasBack = (at: StepN) => at > 1 && at < 4;

/** The room's close: leaves Create (on the beat, for the event's own page). */
function Close({ wide }: { wide: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      tabIndex={-1}
      aria-label="Close"
      data-cw-close
      className={wide ? "" : "-ml-1"}
    >
      <X />
    </Button>
  );
}

/** Back, at the head's left (`slide`, `carry`). */
function HeadBack({ onBack }: { onBack?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      tabIndex={onBack ? 0 : -1}
      aria-label="Back"
      data-cw-back="head"
      onClick={onBack}
      className="-ml-1"
    >
      <ChevronLeft className="size-5" />
    </Button>
  );
}

export function Head({
  flow,
  wide,
  at,
  name,
  onBack,
  onStep,
  fill,
  back,
  nameLanding,
  nameRef,
}: HeadProps) {
  const pad = wide ? "px-8" : "px-3";
  const canBack = back ?? hasBack(at);

  if (flow === "still")
    return (
      <header
        data-cw-head={flow}
        className={cn("relative flex h-14 shrink-0 items-center", pad)}
      >
        <Close wide={wide} />
        <Hairlines
          at={at}
          wide={wide}
          fill={fill}
          className="absolute left-1/2 -translate-x-1/2"
        />
      </header>
    );

  if (flow === "slide")
    return (
      <header
        data-cw-head={flow}
        className={cn("relative flex h-14 shrink-0 items-center", pad)}
      >
        {canBack ? <HeadBack onBack={onBack} /> : <span className="size-9" />}
        <Hairlines
          at={at}
          wide={wide}
          fill={fill}
          className="absolute left-1/2 -translate-x-1/2"
        />
        <span className="ml-auto">
          <Close wide={wide} />
        </span>
      </header>
    );

  // carry: the event's name titles the room once it has one, over the steppers.
  const showName = Boolean(name) && hasBack(at);
  return (
    <header
      data-cw-head={flow}
      className={cn("relative flex h-16 shrink-0 items-center", pad)}
    >
      {canBack ? <HeadBack onBack={onBack} /> : <span className="size-9" />}
      <span className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span
          ref={nameRef}
          data-cw-name-dst
          // The heading face, so the name that rises from the field lands as
          // itself, smaller, rather than turning into another font.
          className={cn(
            "block h-5 max-w-[220px] truncate font-heading text-working",
            wide && "max-w-[420px]",
          )}
          style={{ visibility: nameLanding ? "hidden" : undefined }}
        >
          {showName || nameLanding ? (
            onBack ? (
              <button
                type="button"
                onClick={() => onStep?.(1)}
                className="cursor-pointer"
                aria-label="Back to the name"
              >
                {name}
              </button>
            ) : (
              name
            )
          ) : null}
        </span>
        <Hairlines at={at} wide={wide} fill={fill} onStep={onStep} />
      </span>
      <span className="ml-auto">
        <Close wide={wide} />
      </span>
    </header>
  );
}

/* ── the page: the question and its answer's space ──────────────────────── */

export type PageContent = {
  /** The question, or on the beat its line. */
  question: ReactNode;
  /** One quiet line under it, where the step needs one. */
  sub?: string;
  /** The answer's space. */
  centre: ReactNode;
  /** The foot's one button. */
  go: string;
  /** The phone's keyboard is up (the name's step). */
  keyboard?: boolean;
};

/**
 * THE QUESTION, ALWAYS IN ONE PLACE (his note: "always keep the question up
 * top so users aren't searching for the spot of the new one in a centered
 * group each time"): the same distance under the head on every step, and the
 * centre takes whatever is left above the foot.
 */
export function Page({
  content,
  wide,
  innerRef,
  className,
  reserve = 0,
}: {
  content: PageContent;
  wide: boolean;
  innerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  /** Room kept free at the page's foot (the keyboard's, while it drops). */
  reserve?: number;
}) {
  return (
    <div
      ref={innerRef}
      data-cw-page
      className={cn("flex min-h-0 flex-col", className)}
      style={reserve ? { paddingBottom: reserve } : undefined}
    >
      <div
        data-cw-question
        className={cn(
          "shrink-0 text-center",
          wide ? "mx-auto mt-9 max-w-[760px] px-8" : "mt-6 px-6",
        )}
      >
        {/* The page step: 24 px at a phone, 28 at a desk, where the answer
            under it (the name at the title step, the phones, the code) is
            the screen's subject and the question its quiet label. */}
        <h1 className="font-heading text-page text-balance">
          {content.question}
        </h1>
        {content.sub && (
          <p className="mt-2 text-working text-muted-foreground">
            {content.sub}
          </p>
        )}
      </div>
      <div
        data-cw-centre
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center",
          wide ? "px-12 py-6" : "px-5 py-4",
        )}
      >
        {content.centre}
      </div>
    </div>
  );
}

/* ── the foot ───────────────────────────────────────────────────────────── */

export function Foot({
  flow,
  wide,
  at,
  go,
  onGo,
  onBack,
  backAnyway,
}: {
  flow: Flow;
  wide: boolean;
  at: StepN;
  go: string;
  onGo?: () => void;
  onBack?: () => void;
  /** Draw Back whatever the step (a change into or out of a step that has one). */
  backAnyway?: boolean;
}) {
  // `still` keeps Back at the thumb, beside the one button.
  const back = flow === "still" && (backAnyway ?? hasBack(at));
  return (
    <footer
      data-cw-foot
      className={cn(
        "relative flex shrink-0 items-center gap-3",
        wide ? "justify-center px-8 pt-4 pb-9" : "px-4 pt-3 pb-5",
      )}
    >
      {back && (
        <Button
          variant="ghost"
          size={wide ? "cta" : "icon-lg"}
          tabIndex={onBack ? 0 : -1}
          aria-label="Back"
          data-cw-back="foot"
          onClick={onBack}
          className={cn(
            wide ? "absolute left-8" : "size-11 shrink-0 rounded-full",
            "bg-foreground/[0.06]",
          )}
        >
          <ArrowLeft />
          {wide && "Back"}
        </Button>
      )}
      <Button
        data-cw-go
        size="cta"
        tabIndex={onGo ? 0 : -1}
        onClick={onGo}
        className={wide ? "min-w-64" : "flex-1"}
      >
        {go}
      </Button>
    </footer>
  );
}

/* ── the room at rest ───────────────────────────────────────────────────── */

export type RoomProps = {
  flow: Flow;
  wide: boolean;
  at: StepN;
  name?: string;
  content: PageContent;
  onGo?: () => void;
  onBack?: () => void;
  onStep?: (n: StepN) => void;
  /** A light under the room's foot, its seam the lamp set's (create-wizard.css). */
  light?: "seam" | "low";
  children?: ReactNode;
};

/** The room's ground and its light: dark, whatever the session's theme. */
export function Ground({
  light = "seam",
  children,
}: {
  light?: "seam" | "low";
  children: ReactNode;
}) {
  return (
    <div
      data-cw-screen
      className="dark relative flex h-screen flex-col overflow-hidden bg-background text-foreground"
    >
      {children}
      {/* Last, and screened over the room: light falls on whatever stands in
          it, so a page that slides over another is lit the same. */}
      <span className={cn("cw-room-light", light === "low" && "cw-low")} />
    </div>
  );
}

/** One step of Create, standing still. */
export function Room({
  flow,
  wide,
  at,
  name,
  content,
  onGo,
  onBack,
  onStep,
  light,
  children,
}: RoomProps) {
  const kb = !wide && content.keyboard;
  return (
    <Ground light={light}>
      <Head
        flow={flow}
        wide={wide}
        at={at}
        name={name}
        onBack={onBack}
        onStep={onStep}
      />
      <Page content={content} wide={wide} className="relative flex-1" />
      {content.go && (
        <Foot
          flow={flow}
          wide={wide}
          at={at}
          go={content.go}
          onGo={onGo}
          onBack={onBack}
        />
      )}
      {kb && <Keyboard />}
      {children}
    </Ground>
  );
}

/* ── between two steps ──────────────────────────────────────────────────── */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** How far `p` is through the window from `a` to `b`, 0 to 1. */
export const span = (p: number, a: number, b: number) =>
  clamp01((p - a) / (b - a));
export const easeIn = (t: number) => t * t * t;
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
/** The house drawer curve, `cubic-bezier(0.32, 0.72, 0, 1)`, as a quart out. */
const drawer = (t: number) => 1 - (1 - t) ** 4;

/** How long each flow's step change takes, ms. */
export const FLOW_MS: Record<Flow, number> = {
  still: 460,
  slide: 440,
  carry: 680,
};

/**
 * Where a still frame holds each change: the point that reads as the motion
 * (the new page arriving; two pages side by side; the name in flight as the
 * next page comes up), never the empty instant between.
 */
export const FLOW_MID: Record<Flow, number> = {
  still: 0.42,
  slide: 0.26,
  carry: 0.6,
};

type Parts = {
  from: HTMLDivElement | null;
  to: HTMLDivElement | null;
  keyboard: HTMLDivElement | null;
  foot: HTMLDivElement | null;
  /** The Back that one end of the change has and the other has not. */
  back: HTMLElement | null;
  backTo: boolean;
  flyer: HTMLSpanElement | null;
  /** Where the answer in flight starts and lands, read off the page and the head. */
  flight: { dx: number; dy: number; k: number; fade: boolean } | null;
  /** The name's own line in the head, shown once the name has landed in it. */
  landing: HTMLElement | null;
  seg: HTMLElement | null;
};

/**
 * Every moving part's style at `p`, for one flow and one direction. `kb` says
 * the keyboard is leaving (forward off the name) or arriving (back onto it).
 */
function choreograph(
  flow: Flow,
  p: number,
  dir: 1 | -1,
  kb: "leaves" | "arrives" | null,
  parts: Parts,
) {
  const { from, to, keyboard, foot, back, flyer, flight, landing, seg } =
    parts;
  // The keyboard drops as the field lets go, and the foot comes down with it.
  if (kb) {
    const k = easeInOut(span(p, 0, 0.62));
    const down = kb === "leaves" ? k : 1 - k;
    if (keyboard)
      keyboard.style.transform = `translateY(${down * KEYBOARD_H}px)`;
    if (foot)
      foot.style.transform = `translateY(${(down - 1) * KEYBOARD_H}px)`;
  }
  // The line fills as the next step arrives, and empties going back.
  if (seg) {
    const f = dir === 1 ? easeOut(span(p, 0.25, 0.95)) : 1 - span(p, 0, 0.6);
    seg.style.width = `${f * 100}%`;
  }
  // A Back that only one end has comes and goes with the pages; beside the
  // button at a phone it also takes its room as it comes, so the button
  // narrows with it rather than jumping when the change starts.
  if (back) {
    const t = easeOut(span(p, 0.2, 0.8));
    const shown = parts.backTo ? t : 1 - t;
    back.style.opacity = `${shown}`;
    if (back.dataset.cwBack === "foot" && !back.classList.contains("absolute")) {
      back.style.width = `${shown * 44}px`;
      back.style.minWidth = "0";
      back.style.overflow = "hidden";
      back.style.marginRight = `${(shown - 1) * 12}px`;
    }
  }

  if (flow === "still") {
    const out = easeIn(span(p, 0, 0.32));
    const inn = easeOut(span(p, 0.28, 1));
    if (from) {
      from.style.opacity = `${1 - out}`;
      from.style.transform = `translateY(${-6 * out * dir}px)`;
    }
    if (to) {
      to.style.opacity = `${inn}`;
      to.style.transform = `translateY(${(1 - inn) * 12 * dir}px)`;
    }
    return;
  }

  if (flow === "slide") {
    const s = drawer(p);
    if (dir === 1) {
      if (from) {
        from.style.transform = `translateX(${-28 * s}%)`;
        from.style.opacity = `${1 - 0.65 * s}`;
      }
      if (to) {
        to.style.transform = `translateX(${100 * (1 - s)}%)`;
        to.style.opacity = "1";
      }
    } else {
      if (from) {
        from.style.transform = `translateX(${100 * s}%)`;
        from.style.opacity = "1";
      }
      if (to) {
        to.style.transform = `translateX(${-28 * (1 - s)}%)`;
        to.style.opacity = `${0.35 + 0.65 * s}`;
      }
    }
    return;
  }

  // carry: the answer rises into the head, the rest of its page leaving
  // around it; going back, the same drawing runs the other way.
  const q = dir === 1 ? p : 1 - p;
  const out = easeIn(span(q, 0, 0.26));
  const inn = easeOut(span(q, 0.5, 1));
  const answered = dir === 1 ? from : to;
  const next = dir === 1 ? to : from;
  if (answered) {
    answered.style.opacity = `${1 - out}`;
    answered.style.transform = "none";
  }
  if (next) {
    next.style.opacity = `${inn}`;
    next.style.transform = `translateY(${(1 - inn) * 14}px)`;
  }
  if (flyer && flight) {
    const f = easeInOut(span(q, 0.04, 0.72));
    const k = 1 + (flight.k - 1) * f;
    const landed = q >= 0.72;
    flyer.style.transform = `translate(${flight.dx * f}px, ${flight.dy * f}px) scale(${k})`;
    flyer.style.opacity = flight.fade
      ? `${1 - easeIn(span(q, 0.48, 0.72))}`
      : "1";
    flyer.style.visibility = landed && !flight.fade ? "hidden" : "visible";
    if (landing) landing.style.visibility = landed ? "visible" : "hidden";
  }
}

/** Whether the frame's own window asks for less motion. */
export function reducedIn(el: Element | null): boolean {
  const win = el?.ownerDocument.defaultView;
  return Boolean(win?.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/**
 * BETWEEN TWO STEPS: both pages drawn at once in the room's body, each
 * written by the flow's choreography at `p`.
 *
 *  - `at` (a number): a still frame at that point of the change;
 *  - `play`: the change plays once from 0 to 1 and calls `onDone` (a live
 *    room), cutting straight to the end under reduced motion;
 *  - `loop`: Continue, a hold, Back, a hold, for ever, where motion is
 *    welcome; reduced motion sees the still at `at`.
 *
 * ★ THE ANSWER IN FLIGHT IS MEASURED, NEVER GUESSED (`carry`): it is a copy
 * of the answer's own box on the page it leaves (`[data-cw-carry]`), flown to
 * the name's line in the head or to its step's segment, both read off the
 * frame after layout, so a name that wraps flies from where it stands.
 *
 * ★ THE NAME'S PAGE KEEPS ITS KEYBOARD'S ROOM while the keyboard drops, so the
 * name does not jump when the change starts: its page reserves the keyboard's
 * height, as the keyboard took it at rest.
 */
export function Between({
  flow,
  wide,
  from,
  to,
  fromContent,
  toContent,
  name,
  at = 0.5,
  play,
  loop,
  onDone,
}: {
  flow: Flow;
  wide: boolean;
  from: StepN;
  to: StepN;
  fromContent: PageContent;
  toContent: PageContent;
  name?: string;
  at?: number;
  play?: boolean;
  loop?: boolean;
  onDone?: () => void;
}) {
  const dir: 1 | -1 = to > from ? 1 : -1;
  const lo = Math.min(from, to) as StepN;
  const root = useRef<HTMLDivElement | null>(null);
  const fromRef = useRef<HTMLDivElement | null>(null);
  const toRef = useRef<HTMLDivElement | null>(null);
  const kbRef = useRef<HTMLDivElement | null>(null);
  const footRef = useRef<HTMLDivElement | null>(null);
  const flyerRef = useRef<HTMLSpanElement | null>(null);
  const nameDst = useRef<HTMLSpanElement | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const kbFrom = !wide && Boolean(fromContent.keyboard);
  const kbTo = !wide && Boolean(toContent.keyboard);
  const kb: "leaves" | "arrives" | null =
    kbFrom && !kbTo ? "leaves" : !kbFrom && kbTo ? "arrives" : null;
  const carrying = flow === "carry";
  // Off the first step the name rises to the head; off the others the pick
  // drops into its own segment.
  const carriesName = carrying && lo === 1;
  const backFrom = hasBack(from);
  const backTo = hasBack(to);
  const backFades = backFrom !== backTo;

  useLayoutEffect(() => {
    const el = root.current?.parentElement;
    if (!el) return;
    const win = el.ownerDocument.defaultView;
    if (!win) return;
    const parts: Parts = {
      from: fromRef.current,
      to: toRef.current,
      keyboard: kbRef.current,
      foot: footRef.current,
      back: backFades
        ? el.querySelector<HTMLElement>(
            flow === "still" ? '[data-cw-back="foot"]' : '[data-cw-back="head"]',
          )
        : null,
      backTo,
      flyer: flyerRef.current,
      flight: null,
      landing: carriesName ? nameDst.current : null,
      seg: el.querySelector<HTMLElement>(`[data-cw-seg="${lo + 1}"]`),
    };
    let now = play ? 0 : at;
    const apply = (p: number) => {
      now = p;
      choreograph(flow, p, dir, kb, parts);
    };

    // ★ RE-READ ONCE THE FRAME HAS ITS STYLES. A portalled frame's sheets are
    // copied in after its first render, so the first layout is unstyled: the
    // flight is measured again whenever the room's box or its fonts settle.
    const measure = () => {
      const answered = (dir === 1 ? fromRef : toRef).current;
      const src =
        answered?.querySelector<HTMLElement>("[data-cw-carry]") ?? null;
      const dst = carriesName
        ? nameDst.current
        : (el.querySelector<HTMLElement>(`[data-cw-seg="${lo}"]`)
            ?.parentElement ?? null);
      const flyer = parts.flyer;
      if (!carrying || !src || !dst || !flyer) return;
      // Measured in place: the answered page is never moved by `carry`.
      const s = src.getBoundingClientRect();
      const d = dst.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      if (s.width < 2 || d.width < 2) return;
      const copy = src.cloneNode(true) as HTMLElement;
      copy.style.visibility = "visible";
      // The caret stays with the field: only the name itself rises.
      copy.querySelectorAll(".cw-caret").forEach((c) => c.remove());
      flyer.replaceChildren(copy);
      flyer.style.left = `${s.left - box.left}px`;
      flyer.style.top = `${s.top - box.top}px`;
      flyer.style.width = `${s.width}px`;
      flyer.style.height = `${s.height}px`;
      parts.flight = {
        dx: d.left + d.width / 2 - (s.left + s.width / 2),
        dy: d.top + d.height / 2 - (s.top + s.height / 2),
        // The name lands at the head's line height; a pick shrinks to its segment.
        k: carriesName
          ? d.height / s.height
          : Math.max(0.04, d.width / s.width),
        fade: !carriesName,
      };
      src.style.visibility = "hidden";
    };
    measure();
    const again = () => {
      measure();
      apply(now);
    };
    const ro = new win.ResizeObserver(again);
    ro.observe(el);
    win.document.fonts?.ready.then(again).catch(() => {});
    const reduced = reducedIn(el);
    const stop = () => ro.disconnect();

    if (play) {
      if (reduced) {
        apply(1);
        done.current?.();
        return stop;
      }
      let raf = 0;
      const t0 = win.performance.now();
      const tick = (t: number) => {
        const p = clamp01((t - t0) / FLOW_MS[flow]);
        apply(p);
        if (p < 1) raf = win.requestAnimationFrame(tick);
        else done.current?.();
      };
      apply(0);
      raf = win.requestAnimationFrame(tick);
      return () => {
        stop();
        win.cancelAnimationFrame(raf);
      };
    }

    if (loop && !reduced) {
      // Continue, a hold on the step it reaches, Back, a hold on the start:
      // the one drawing run forwards and then backwards.
      const ms = FLOW_MS[flow];
      const hold = 1500;
      const cycle = 2 * (ms + hold);
      let raf = 0;
      const t0 = win.performance.now();
      const tick = (t: number) => {
        const c = (t - t0) % cycle;
        const p =
          c < hold
            ? 0
            : c < hold + ms
              ? (c - hold) / ms
              : c < 2 * hold + ms
                ? 1
                : 1 - (c - 2 * hold - ms) / ms;
        apply(clamp01(p));
        raf = win.requestAnimationFrame(tick);
      };
      raf = win.requestAnimationFrame(tick);
      return () => {
        stop();
        win.cancelAnimationFrame(raf);
      };
    }

    apply(at);
    return stop;
    // One run per change drawn: the content is the change's own, read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, from, to, at, play, loop, wide]);

  return (
    <Ground>
      <div ref={root} className="pointer-events-none absolute inset-0 z-30">
        {carrying && (
          <span
            ref={flyerRef}
            aria-hidden
            data-cw-flyer
            className="absolute block origin-center"
            style={{ visibility: "hidden" }}
          />
        )}
      </div>
      <Head
        flow={flow}
        wide={wide}
        at={lo}
        name={name}
        fill={0}
        back={backFrom || backTo}
        nameLanding={carriesName}
        nameRef={nameDst}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {[
          { ref: fromRef, content: fromContent, kb: kbFrom },
          { ref: toRef, content: toContent, kb: kbTo },
        ].map(({ ref, content, kb: up }, i) => (
          <Page
            key={i}
            content={content}
            wide={wide}
            innerRef={ref}
            // A page that slides is a sheet of the room: it covers the one it
            // passes, its edge shadowed, as a phone's own pages do.
            className={cn(
              "absolute inset-0",
              flow === "slide" && "bg-background",
              flow === "slide" && i === (dir === 1 ? 1 : 0) && "cw-edge",
            )}
            reserve={up ? KEYBOARD_H : 0}
          />
        ))}
      </div>
      <div ref={footRef} className="relative z-10">
        <Foot
          flow={flow}
          wide={wide}
          at={to}
          go={toContent.go}
          backAnyway={backFrom || backTo}
        />
      </div>
      {(kbFrom || kbTo) && (
        <div
          ref={kbRef}
          className="absolute inset-x-0 bottom-0 z-20"
          style={{
            transform: kbFrom ? undefined : `translateY(${KEYBOARD_H}px)`,
          }}
        >
          <Keyboard />
        </div>
      )}
    </Ground>
  );
}
