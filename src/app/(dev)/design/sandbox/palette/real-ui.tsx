"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { FullQuality } from "@/components/marketing/sections/home/full-quality";
import { NoApp } from "@/components/marketing/sections/home/no-app";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { TrustStrip } from "@/components/marketing/sections/home/trust-strip";
import { PlanPair } from "@/components/marketing/sections/pricing/plan-cards";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/dev/board";

import type { Pair, TokenMap } from "./registers";

/**
 * THE LIVE PRODUCTION SURFACES (round four).
 *
 * Will's note: "I'd love to see more UI examples for comparison, especially if
 * they can be live production components using the demo palettes", and "more UI
 * to preview the variations on". Rounds one to three built replicas of the app
 * out of real primitives; these are the real SECTIONS, imported from the same
 * files the site renders, so the pair is judged on the page rather than on a
 * drawing of it. Every one of them takes no props, which is why they can sit in
 * a stage at all.
 *
 * ★ TWO THINGS TO KNOW BEFORE ADDING ANOTHER ONE.
 *
 * 1. A CLASS RULE BEATS AN INHERITED CUSTOM PROPERTY. The board paints a pair
 *    by putting its tokens inline on a wrapper inside the stage, and inherited
 *    values lose to any rule that declares them again. The real footer carries
 *    `.surface-ink` on its own root, so inside a stage it would serve the
 *    SHIPPED slab and the caption under it would be a lie. `ScopedTokens`
 *    answers that with the same selector the ruling lands, scoped to one stage
 *    id: real CSS, real selector, one stage. Never "fix" it by stripping the
 *    class off the production component.
 * 2. A BREAKPOINT INSIDE A STAGE READS THE WINDOW, NOT THE CANVAS. A hand-built
 *    specimen branches on `mode` and is honest either way, but a production
 *    section carries its own `sm:` and `lg:` prefixes, and inside a 375 stage on
 *    a 1456 window those fire as if the phone were a desktop: the real pricing
 *    pair laid its two cards out side by side and ran 52px past the canvas.
 *    `TrueViewport` is the fix and it is the one Will's own note points at (an
 *    iframe is only wrong when it is SCALED; at 1:1 its contents are true
 *    pixels). Every real section renders inside one, sized to the canvas, with
 *    the page's own stylesheets mirrored in, so `sm:` fires at 640 of the
 *    CANVAS. These frames also pin fit="true": a section whose size is being
 *    judged is never scaled.
 * 3. A PORTAL LEAVES THE STAGE. Dialog, DropdownMenu and Popover all portal to
 *    the body, which is outside every wrapper the board paints, so a real
 *    floating surface cannot be shown inside a stage at all. Rounds two and
 *    three answered that with hand-placed replicas; round four also shows the
 *    real ones, opened over the page, and the page wears the pair because the
 *    button applies it first. That is not a workaround, it is the honest
 *    reading: a menu in production is painted by whatever the page declares.
 */

/* ── A real viewport, at true pixels ────────────────────────────────────── */

/**
 * An iframe the width of the canvas, carrying the page's own stylesheets, with
 * the children portaled into its body. Inside it a media query measures the
 * CANVAS, which is the only way a production section can be judged at 375.
 *
 * The stylesheets are mirrored rather than linked: the lab's CSS arrives as
 * <style> tags in dev and as <link> in a production build, and next/font puts a
 * class on <html> that the faces key off, so both the nodes and that class are
 * copied, and a MutationObserver on the parent's head keeps them copied when a
 * route adds one later.
 */
/**
 * ★ THE ENTRANCE GRAMMAR NEVER TRIPS INSIDE A STAGE, so the stage shows the
 * SETTLED composition.
 *
 * Marketing sections enter through `Reveal`, which flips `data-inview` from an
 * IntersectionObserver and lets marketing.css animate `[data-mkt-reveal]` and
 * `[data-mkt-cut]` in from opacity 0. Inside an iframe that observer's implicit
 * root is the iframe's own viewport CLIPPED BY THE PARENT, so a section below
 * the visible strip never trips: measured on the production build, 20 of row
 * 07's marked elements sat at opacity 0 and two whole chapters rendered blank.
 *
 * The fix is the fallback marketing.css already ships for a reduced-motion
 * reader: the settled state, unconditionally, inside the stage only. It is also
 * the honest one for THIS board, which judges a ground and not an entrance, and
 * it means the reduced-motion reader and everyone else see the same page.
 */
const SETTLED = `[data-mkt-reveal],[data-mkt-cut]{opacity:1!important;transform:none!important;filter:none!important;animation:none!important;}`;

export function TrueViewport({
  width,
  height,
  rootClass,
  rootStyle,
  mkt,
  scope,
  children,
}: {
  width: number;
  height: number;
  /** The ground class the stage would carry; the iframe needs its own copy. */
  rootClass: string;
  rootStyle?: React.CSSProperties;
  mkt?: boolean;
  scope?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const sync = () => {
      const settled = doc.createElement("style");
      settled.textContent = SETTLED;
      doc.head.replaceChildren(
        ...[...document.querySelectorAll('style, link[rel="stylesheet"]')].map(
          (n) => n.cloneNode(true),
        ),
        settled,
      );
      doc.documentElement.className = document.documentElement.className;
    };
    sync();
    doc.body.style.margin = "0";
    doc.body.style.overflow = "hidden";
    // Only the parent's head is observed; the writes land in the iframe's, so
    // this cannot feed itself.
    const obs = new MutationObserver(sync);
    obs.observe(document.head, { childList: true });
    setBody(doc.body);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <iframe
        ref={ref}
        title="A real viewport"
        width={width}
        height={height}
        className="block border-0"
        style={{ width, height, border: 0 }}
      />
      {body
        ? createPortal(
            <div
              id={scope}
              className={`${rootClass} h-full w-full overflow-hidden bg-background text-foreground`}
              style={rootStyle}
              {...(mkt ? { "data-mkt": "" } : {})}
            >
              {children}
            </div>,
            body,
          )
        : null}
    </>
  );
}

/* ── Painting a class-rule register inside one stage ─────────────────────── */

const decl = (m: TokenMap) =>
  Object.entries(m)
    .map(([k, v]) => `${k}:${v};`)
    .join("");

/**
 * The pair's own block for a selector that a production component carries as a
 * CLASS, scoped to one stage so it cannot leak to the board's own chrome. The
 * selector is the real one (`.surface-ink`), which is the point: this is the
 * paste, applied to one canvas.
 */
export function ScopedTokens({
  scope,
  rules,
}: {
  scope: string;
  rules: { selector: string; block: TokenMap }[];
}) {
  return (
    <style>
      {rules
        .map(({ selector, block }) => `#${scope} ${selector}{${decl(block)}}`)
        .join("\n")}
    </style>
  );
}

/* ── The footer slab, for real ──────────────────────────────────────────── */

/**
 * The production footer, on a paper page, which is the case the slab register
 * exists for. Today `.surface-ink` declares no --card and no --popover, so the
 * gap shows here without a caption having to claim it.
 */
export function RealFooter({
  pair,
  brand,
  scope,
}: {
  pair: Pair;
  /** The accent, as the two tokens the slab has to declare for the mark at the
   *  bottom of the page to carry it. `.surface-ink` declares --brand itself, so
   *  an accent set on an ancestor is outranked and never arrives. */
  brand: TokenMap;
  scope: string;
}) {
  return (
    <>
      <ScopedTokens
        scope={scope}
        rules={[
          {
            selector: ".surface-ink",
            block: { ...pair.dark.well, ...pair.dark.slab, ...brand },
          },
        ]}
      />
      {/* ★ THE PAGE IS PAPER AND ONLY THE FOOTER IS THE SLAB. The stage used to
          paint the slab on the whole canvas and call it "a paper page", which
          made the seam, the thing this row exists for, invisible: a dark leaf on
          a dark page is not a leaf. The root wears the paper block, the footer
          wears .surface-ink, and the join between them is the reading. */}
      {/* Plain stacking order with both parts shrink-0: `justify-end` pushed a
          1414px footer 513px off the top of a 900px stage, so the row showed the
          bottom two thirds of a footer and no seam at all. The stage is sized to
          the measured whole instead. */}
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-[240px] shrink-0 flex-col justify-end px-10 pb-10">
          <p className="max-w-md text-2xl">
            The album everyone was already making.
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The last paper section before the seam, so the slab is judged
            against the page it actually sits on rather than against itself.
          </p>
        </div>
        <div className="shrink-0">
          <MarketingFooter />
        </div>
      </div>
    </>
  );
}

/* ── The pricing cards, for real ────────────────────────────────────────── */

/** The production plan cards. Two cards, a featured one with a beam, a price
 *  pop, a real checkout button and a comparison list: the densest card in the
 *  product and the one a card-versus-page step is most visible on. */
export function RealPricing({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    // A BLOCK, never a flex column: flex-shrink would quietly compress a real
    // section when the stage is a few pixels short, and a compressed production
    // section read as a design decision. Clipping is at least a reading.
    <div
      className={cn(
        "h-full overflow-hidden",
        desktop ? "px-14 py-10" : "px-5 py-8",
      )}
    >
      <PlanPair />
    </div>
  );
}

/* ── The home arc's chapters, for real ──────────────────────────────────── */

/**
 * Four real home-arc sections in one canvas. They are the quiet ones on
 * purpose: a chapter with a photograph in it is carried by the photograph, and
 * the question this board asks is what a section looks like when there is no
 * media to carry it, which is the case rule 1 was rewritten for.
 */
export function RealChapters() {
  return (
    // No mode branch: these are production sections and they carry their own
    // breakpoint prefixes, which read the REAL viewport rather than the stage.
    // That is the honest reading at 1440 and the known limit at 375 (the shell
    // note on Stage), and it is why the phone canvas here is a layout check
    // rather than a breakpoint one.
    <div className="h-full overflow-hidden">
      <TrustStrip />
      <NoApp />
      <FullQuality />
      <Privacy />
    </div>
  );
}

/* ── The floating layer, for real ───────────────────────────────────────── */

/**
 * A real Dialog, a real DropdownMenu and a real Popover, each opened over the
 * page. They portal to the body, so they cannot be painted by a stage; the
 * buttons apply the pair to the whole page first, which is the only honest way
 * to see a production floating surface wearing a candidate. Clear is in the
 * dock and on the paste row.
 */
export function RealFloating({
  onApply,
  applied,
}: {
  onApply: () => void;
  applied: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" onClick={onApply}>
              Open the real dialog
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this event?</DialogTitle>
              <DialogDescription>
                Every photo and video guests uploaded goes with it. This cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground">
              91 uploads, 2.4 GB. The QR code stops working the moment this is
              gone.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Keep it
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" size="sm">
                  Delete the event
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" onClick={onApply}>
              Open the real menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sarah&apos;s birthday</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Share the link</DropdownMenuItem>
            <DropdownMenuItem>Download everything</DropdownMenuItem>
            <DropdownMenuItem>Event settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Delete the event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onClick={onApply}>
              Open the real popover
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72">
            <p className="text-sm font-medium">Who can see this album?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Anyone with the link. Guests never need an account, and you can
              turn the link off at any time.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {applied
          ? `These are the production components, portaled to the page, and the page is wearing ${applied}. The menu, the dialog and the popover all read --popover, the ring and --shadow-float, which is why the floating layer is the one place a set with no card step still has to work.`
          : "These are the production components. A portal leaves every stage, so each button applies the pair to this page first and then opens: that is what a menu in production is painted by. Clear is in the dock."}
      </p>
    </div>
  );
}
