"use client";

import { type ReactNode, useState } from "react";
import { Bell, ChevronLeft } from "lucide-react";

import { Frame } from "@/components/lab";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { HOST } from "./fixtures";
import {
  PendingFit as Fit,
  PendingMeasured as Measured,
} from "./pending-kit";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN, AND THE GROUNDS UNDER IT.
 *
 * ★ 375 FIRST, 1440 ON EVERY KNOB. A bad actor turns up in the middle of a
 * party, and the host who stops him is standing in it holding a phone; the
 * door he meets is a phone too. 1440 is drawn for every option because the
 * settings, the Guests room and the morning-after tidy-up happen at a desk as
 * well, and an answer that only works at one width is a finding (the board's
 * `phone-first` call, his to overrule).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING MOUNTS A RADIX PORTAL. A Dialog, Sheet, Popover or DropdownMenu
 * opened inside a portalled lab frame renders on the LAB PAGE's document, not
 * the screen being judged (`identity-door/scene.tsx`'s own note), so every
 * floating surface on this board is QUOTED in `event-safety.css` and the parts
 * files: the shipped classes and postures, never the primitive. `fixed`, never
 * `absolute`, for anything pinned to the screen: the frame IS the viewport.
 *
 * ★ PRODUCTION'S RESPONSIVE CLASSES WORK IN HERE, THE LAB'S OWN DO NOT.
 * `Container`'s `sm:px-6 lg:px-8` is in production's sheet and the frame is a
 * real viewport, so it resolves honestly; a breakpoint class only this board
 * wrote would lose to production's unprefixed one (`design.css` explains the
 * layer order). So every screen difference this board draws itself is keyed
 * off the `screen` prop, never a `sm:` it typed.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** A number read off the frame's own document for its caption. */
export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  short = false,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: Reader;
  /**
   * A laptop frame that stands in a stack with others (`Several`), cut to
   * 600 px so three of them sit within reach. Everything a composite frame
   * shows is at its top or pinned to its foot, so nothing is lost; a phone is
   * never cut, since phones stand side by side.
   */
  short?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = SCREENS[screen];
  const h = short && screen === "1440" ? 600 : full;
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

/**
 * SEVERAL SCREENS, ONE OPTION: an option that is more than one surface (the
 * three doors into one block; a newcomer and the host). Phones stand side by
 * side on a grid of equal columns, each one fitted to its own column rather
 * than to its content (`stage-in-a-flex-row`'s trap); laptops stack, because
 * three 1440 frames side by side would each be a thumbnail.
 */
export function Several({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  if (screen === "1440") return <div className="flex flex-col gap-6">{children}</div>;
  return (
    <div data-lab-bleed className="es-several">
      {children}
    </div>
  );
}

/* ── what the frames measure ──────────────────────────────────────────────── */

/**
 * WHERE THE ACT SITS, for a thumb: the element marked `data-es-reach`, its
 * height and how far down the screen its middle is. A block a host has to
 * stretch for, or a Let in at the top of a phone, is read here rather than
 * asserted in a sentence.
 */
export const reach =
  (what: string): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>("[data-es-reach]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return null;
    const down = Math.round(((r.top + r.height / 2) / win.innerHeight) * 100);
    return `${what}: ${Math.round(r.height)} px tall, ${down}% of the way down`;
  };

/**
 * How many lines a block of text runs, read off its own line boxes (the rects
 * a Range draws over each text node, clustered by top), never a height divided
 * by a line height (`voice-guest`'s measure, carried).
 */
function lineCount(el: Element): number {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const tops: number[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue;
      tops.push(r.top);
    }
  }
  tops.sort((a, b) => a - b);
  let count = 0;
  let last = -Infinity;
  for (const t of tops) {
    if (t - last > 6) count++;
    last = t;
  }
  return count;
}

/** The plain line a door says, in lines: the size its placeholder words take. */
export const doorLines: Reader = (root) => {
  const el = root.querySelector("[data-es-line]");
  if (!el) return null;
  const n = lineCount(el);
  if (n === 0) return null;
  return `The door says it in ${n} line${n === 1 ? "" : "s"}`;
};

/* ── the host's chrome, quoted ────────────────────────────────────────────── */

/**
 * THE HOST APP'S BAR (`AppShell`), quoted: the wordmark, the crumb trail, and
 * the account's own face. At 375 the trail cuts to its parent behind a back
 * chevron (`crumbs.tsx`); at 1440 it is the whole path.
 */
export function HostBar({
  screen,
  trail,
}: {
  screen: ScreenId;
  /** The steps after "Partyreel", the last one being where the host stands. */
  trail: readonly string[];
}) {
  const phone = screen === "375";
  const parent = trail.length > 1 ? trail[trail.length - 2] : "Partyreel";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center gap-4">
        <span className="shrink-0">
          <Logo />
        </span>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
        >
          {phone ? (
            <span className="flex min-w-0 items-center gap-1">
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{parent}</span>
            </span>
          ) : (
            ["Partyreel", ...trail].map((step, i, all) => (
              <span key={step} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate",
                    i === all.length - 1 && "font-medium text-foreground",
                  )}
                >
                  {step}
                </span>
                {i < all.length - 1 && (
                  <span aria-hidden className="text-faint">
                    /
                  </span>
                )}
              </span>
            ))
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label="Notifications">
            <Bell />
          </Button>
          <Avatar size="sm" seed={HOST.seed}>
            <AvatarFallback className="text-[10px]">
              {HOST.first.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>
      </Container>
    </header>
  );
}

/** A host page: the bar, then `main`'s own padding and the page's column. */
export function HostPage({
  screen,
  trail,
  children,
  overlay,
}: {
  screen: ScreenId;
  trail: readonly string[];
  children: ReactNode;
  /** A sheet, a dialog or a toast over the page, quoted. */
  overlay?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <HostBar screen={screen} trail={trail} />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
      {overlay}
    </div>
  );
}

/* ── the marks, quoted ────────────────────────────────────────────────────── */

/**
 * THE UNVERIFIED MARK, QUOTED (`shared/unverified-mark.tsx`'s trigger): the dot
 * in a small disc, `paper` on a row, `lit` over a photograph. The real one is a
 * Popover that would portal out of the frame, and nothing on this board is
 * about what the mark says when tapped.
 */
export function Mark({ tone = "paper" }: { tone?: "paper" | "lit" }) {
  return (
    <span
      aria-label="Unverified"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle",
        tone === "lit" ? GLASS_MARK : "border border-border bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1 rounded-full",
          tone === "lit" ? cn("bg-white", GLASS_MARK_LIT) : "bg-muted-foreground",
        )}
      />
    </span>
  );
}
