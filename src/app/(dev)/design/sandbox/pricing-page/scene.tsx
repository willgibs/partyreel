"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Frame } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * THE GROUND EVERY PREVIEW STANDS ON, AND THE NUMBER UNDER IT.
 *
 * ★ THE REAL PAGE IS TWO GROUNDS, NOT ONE. /pricing is a `(cinema)` route: the
 * route group's wrapper forces `dark` with `data-mkt data-mkt-skin="cinema"`,
 * and the money turns the page to paper inside a `PaperChapter`
 * (`surface-paper bg-background text-foreground data-mkt`). A preview of the
 * plan cards on the lab's own ambient theme is a preview of a page that does
 * not exist, so every scene here declares which ground it is on and wears the
 * production attributes verbatim. `data-mkt` is load-bearing beyond the
 * colours: marketing.css keys the accordion's collapse and several derived
 * tokens off it, and a chapter re-declares it so `color-mix` tokens resolve
 * against the LIGHT values.
 *
 * ★ EVERY REVEAL IS FORCED OPEN. `[data-mkt-reveal]` rests at opacity 0 and is
 * lifted by an ANCESTOR carrying `data-inview="true"`, which the real page gets
 * from an IntersectionObserver as you scroll. A still preview has no scroll, so
 * the root here carries that attribute itself: the descendant selector beats
 * the bare one on specificity, so every slot in the frame draws in its final
 * state rather than fading in while `lab:demo` is taking its picture.
 *
 * ★ NOTHING IN A PREVIEW CAN REACH STRIPE. The shipped cards mount
 * `CheckoutButton`, which POSTs /api/stripe/checkout on click and, for a signed
 * -in host, opens a real Billing Portal session. A board is for looking at, so
 * every buy control here is `BuyButton`: the same `Button`, the same label read
 * out of tiers.ts, and no handler at all. Links are swallowed for the same
 * reason (a press inside a preview is looking, not leaving).
 *
 * ★ AND THE CAPTION IS MEASURED IN THE FRAME, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards and the tile
 * Will judged showed the opposite of the words he picked). Two numbers, both
 * read off the laid-out page inside the frame: how tall the part runs, and how
 * far down the first PRICE sits, which on a 900 px screen is the only honest
 * answer to "does a visitor see what it costs". If the caption and the words
 * above the frame disagree, the caption is the truth.
 */

/* ── The buy control, with the wire cut ──────────────────────────────────── */

export function BuyButton({
  children,
  className,
  variant,
  size,
}: {
  children: ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button type="button" variant={variant} size={size} className={className}>
      {children}
    </Button>
  );
}

/* ── The measurement ─────────────────────────────────────────────────────── */

export type Measured = {
  /** How tall the part runs, in the frame's own layout. */
  height: number;
  /** The first price's top, from the top of the scene. -1 when there is none. */
  price: number;
};

/**
 * Reads the laid-out scene from inside the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is watched with that window's `ResizeObserver`: it
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * again whenever a new option reflows. A hidden option on the step's stage is
 * `visibility: hidden`, which keeps its layout, so it measures true as well.
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
      const box = el.getBoundingClientRect();
      const price = el.querySelector<HTMLElement>("[data-pp-price]");
      report.current({
        height: Math.round(el.scrollHeight),
        price: price
          ? Math.round(price.getBoundingClientRect().top - box.top)
          : -1,
      });
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    el.querySelectorAll("*").forEach((n) => ro.observe(n));
    // Photographs land after layout, and the stack above a card's head is what
    // pushes its price down: without a second read the price line is measured
    // against a page that has not loaded its images yet.
    const t = win.setTimeout(read, 600);
    return () => {
      ro.disconnect();
      win.clearTimeout(t);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/* ── One scene ───────────────────────────────────────────────────────────── */

export type Ground = "cinema" | "paper";

/** The real page's two grounds, as the route group and the chapter declare them. */
const GROUND: Record<Ground, string> = {
  cinema: "dark bg-background text-foreground",
  paper: "surface-paper bg-background text-foreground",
};

/**
 * One option, in a real viewport, on the right ground, with its measured line
 * underneath. `fold` draws the 900 px screen line, for the decisions where what
 * a visitor sees before scrolling IS the question.
 */
export function Scene({
  id,
  w,
  h,
  ground = "cinema",
  title,
  note,
  fold = false,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground?: Ground;
  title: string;
  /** The board's own words for this option, read beside the measured pair. */
  note?: string;
  fold?: boolean;
  children: ReactNode;
}) {
  const [m, setM] = useState<Measured | null>(null);
  const onMeasure = useCallback((next: Measured) => {
    setM((prev) =>
      prev && prev.height === next.height && prev.price === next.price
        ? prev
        : next,
    );
  }, []);

  const measured = m
    ? [
        `${m.height.toLocaleString()} px tall`,
        m.price >= 0
          ? `the first price ${m.price.toLocaleString()} px down${
              fold ? (m.price < 900 ? ", above the fold" : ", below the fold") : ""
            }`
          : null,
        // ★ A FRAME SHORTER THAN ITS PART SAYS SO. A `Frame` is a real viewport,
        // so content past its height scrolls INSIDE it and a still capture ends
        // where the box ends: the sheet decision draws 2,676 px of page in a
        // window, and a reviewer reading a cut band as the end of the page
        // would be judging a length that is not the one measured.
        m.height > h + 4
          ? `the frame shows the first ${h.toLocaleString()}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "measuring";

  return (
    <Frame
      id={`pp-${id}`}
      w={w}
      h={h}
      title={title}
      caption={
        <>
          {note ? <span className="block">{note}</span> : null}
          <span className="block tabular-nums">{measured}</span>
        </>
      }
    >
      <div
        className={cn("relative min-h-full", GROUND[ground])}
        data-mkt=""
        // The route group's own attribute, and the frame IS the page here, so
        // the `body:has([data-mkt-skin=...])` chrome rules resolve the way they
        // do on the site (the one place it is legal: never on a chapter).
        data-mkt-skin={ground}
        data-inview="true"
        onClickCapture={(e) => {
          const el = e.target as HTMLElement;
          // A press inside a preview is looking, not leaving.
          if (el.closest?.("a[href]")) e.preventDefault();
          // ★ AND THE INERT ZONES ARE WHERE THE SHIPPED COMPONENTS ARE DRAWN
          // VERBATIM. The real ComparisonTable and CtaBand mount
          // `CheckoutButton`, which POSTs /api/stripe/checkout on click and, for
          // a signed-in host, opens a live Billing Portal session. Stopping the
          // press in the CAPTURE phase is what disarms it: React dispatches
          // capture root-to-target before the target's own onClick, so this runs
          // first and the handler never does. Nothing inside an inert zone is
          // interactive by design (the table's tips are hover and focus), so
          // nothing is lost.
          if (el.closest?.("[data-pp-inert]")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* ★ THE PRICE POP IS PINNED AT ITS END STATE. `PricePop` flips
            `data-on` from its own IntersectionObserver, and marketing.css then
            runs `mkt-digit-pop` with `both` plus a per-digit delay, so during
            that delay every digit sits at the keyframe's opacity 0. In a
            portalled frame the observer's implicit root is the frame's box as
            the PARENT sees it, not the frame's own 2,600 px document, so a
            price low in a phone column fires the moment it scrolls into the
            pane: a capture taken then reads "$ /mo", a price with no number.
            Nothing on this board asks about the digit pop, so it is held at
            100 percent and every capture can be trusted. `.mkt-line` is the
            same story in the blur register. */}
        {/* ★ AND A TABLE IS RESCUED FROM QUIRKS MODE. A portalled `Frame`
            renders into `about:blank`, which has no doctype, so the frame's
            document is `BackCompat`: Chrome's quirks UA sheet stops a <table>
            inheriting `color` from its ancestors, and Tailwind's preflight
            resets the font there but not the colour. The comparison table on
            the paper chapter therefore drew its plan names, its row labels and
            its outline button labels in the DARK room's near-white, invisible
            on white, while every heading beside them was correct. One line
            fixes it, and any future board that portals a table needs the same
            one. Found by reading the sheet capture against its caption. */}
        <style>{`table{color:inherit}
[data-mkt] [data-mkt-digits] [data-mkt-digit]{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}
[data-mkt] .mkt-line{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        <Measure onMeasure={onMeasure}>{children}</Measure>
        {fold ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-destructive/60"
            style={{ top: 900 }}
          />
        ) : null}
      </div>
    </Frame>
  );
}

/**
 * The 1440 scene and the 375 scene, one above the other: the convention every
 * decision on this board reuses, so a reviewer meets one shape rather than
 * eight. The phone decision draws its own column and does not call this.
 */
export function Widths({
  id,
  ground,
  desktopH,
  phoneH,
  note,
  fold,
  render,
}: {
  id: string;
  ground?: Ground;
  desktopH: number;
  phoneH: number;
  note?: string;
  fold?: boolean;
  render: (width: 1440 | 375) => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Scene
        id={`${id}-1440`}
        w={1440}
        h={desktopH}
        ground={ground}
        title="1440"
        note={note}
        fold={fold}
      >
        {render(1440)}
      </Scene>
      <Scene
        id={`${id}-375`}
        w={375}
        h={phoneH}
        ground={ground}
        title="375"
        note={note}
      >
        {render(375)}
      </Scene>
    </div>
  );
}
