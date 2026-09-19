"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { WEDDINGS } from "./fixtures";

/**
 * DECISION 6: THE LADDER.
 *
 * Will (2026-09-19, verbatim): "the type scale system established in our
 * library should be carried across all marketing."
 *
 * ★ THE GAP IS NOT THE HEADINGS, IT IS WHAT IS BETWEEN THEM. Every heading on a
 * type page already sits on a step: the h1 at `title`, the section headings at
 * `section`, the cell titles at `subsection`. Each of those is a CLAMP that
 * grows from a phone to 1440. The reading copy between them is not on the
 * ladder at all: the hero subhead and the page's opening paragraph are both
 * `text-lg`, the card teaser is `text-sm`, the theme chips are `text-xs`, and
 * every one of those is the same number of pixels at 375 and at 1440. So the
 * page's own proportions come apart as the window grows, which is the visible
 * half of "the type scale system should be carried across all marketing".
 *
 * ★ AND THE NUMBERS ARE READ, NEVER WRITTEN. Every size beside a line here is
 * `getComputedStyle` inside the frame at that frame's real width. A board that
 * printed its intended sizes would be printing its intentions.
 *
 * ★ THIS DELIBERATELY DOES NOT PRE-EMPT `body-type`. That board owns the body
 * and label ladder and is still on the desk with two of its own questions open.
 * The middle option moves only the two READING slots onto a step the ladder
 * already has; the third is the maximal reading of his sentence, drawn so the
 * cost of it is visible rather than argued.
 */
export type LadderShape = "today" | "reading" | "every";

/** One specimen: the line, and the size it actually computed to, read live. */
function Sized({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [px, setPx] = useState<string>("");
  useEffect(() => {
    // ★ THE PROBE, NOT THE WRAPPER. The chips row's first child is the flex
    // container, which inherits the root's 16 px and has nothing to do with
    // the chip inside it: the first cut of this board printed "chips 16px"
    // beside 12 px chips, which is precisely the caption-disagrees-with-the-
    // picture failure PROGRAM.md warns about. A row that is not itself the
    // type marks the element to read.
    const el =
      ref.current?.querySelector("[data-px]") ?? ref.current?.firstElementChild;
    const win = ref.current?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      const cs = win.getComputedStyle(el);
      setPx(`${Math.round(parseFloat(cs.fontSize))}`);
    };
    read();
    const ro = new (win as Window & typeof globalThis).ResizeObserver(read);
    ro.observe(el);
    const t = win.setTimeout(read, 400);
    return () => {
      ro.disconnect();
      win.clearTimeout(t);
    };
  }, []);
  return (
    <div className={cn("flex items-baseline gap-5", className)}>
      <span className="w-[86px] shrink-0 text-right text-[11px] text-faint tabular-nums">
        {label} {px ? `${px}px` : ""}
      </span>
      <div ref={ref} className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

/** What each option puts on each of the page's four reading slots. */
const SIZES: Record<
  LadderShape,
  { subhead: string; intro: string; teaser: string; chip: string }
> = {
  // The page as built: the headings on the ladder, everything else on
  // Tailwind's fixed sizes.
  today: {
    subhead: "text-lg",
    intro: "text-lg",
    teaser: "text-sm",
    chip: "text-xs",
  },
  // The two slots a reader actually READS join the ladder, so they grow with
  // the h1 above them. Labels and card copy stay where `body-type` will find
  // them.
  reading: {
    subhead: "text-subhead",
    intro: "text-subhead",
    teaser: "text-sm",
    chip: "text-xs",
  },
  // Every size on a step. The card teaser takes `subsection` and the chip takes
  // `card-title`, which is where the maximal reading of the sentence lands and
  // also where it starts to cost: a chip at 16 px is no longer a quiet label.
  every: {
    subhead: "text-subhead",
    intro: "text-subhead",
    teaser: "text-subsection",
    chip: "text-card-title",
  },
};

export function LadderPreview({ shape }: { shape: LadderShape }): ReactNode {
  const s = SIZES[shape];
  const type = WEDDINGS;
  return (
    <Container className="py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-9">
        <Sized label="eyebrow">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Events
          </p>
        </Sized>
        <Sized label="h1 · title">
          <h1 className="font-heading text-title text-balance">
            {type.headline}
          </h1>
        </Sized>
        <Sized label="hero sub">
          <p className={cn("text-muted-foreground", s.subhead)}>
            {type.subhead}
          </p>
        </Sized>
        <span className="h-px bg-border" />
        <Sized label="h2 · section">
          <h2 className="font-heading text-section">{type.statement.big}</h2>
        </Sized>
        <Sized label="opening">
          <p className={cn("text-pretty text-muted-foreground", s.intro)}>
            {type.intro}
          </p>
        </Sized>
        <span className="h-px bg-border" />
        <Sized label="card · subsec">
          <h3 className="font-heading text-subsection">{type.navLabel}</h3>
        </Sized>
        <Sized label="teaser">
          <p className={cn("text-muted-foreground", s.teaser)}>
            Every guest&apos;s angle of the day, not just the
            photographer&apos;s.
          </p>
        </Sized>
        <Sized label="chips">
          <div className="flex flex-wrap gap-2">
            {type.themes.slice(0, 4).map((t) => (
              <span
                key={t}
                data-px
                className={cn(
                  "rounded-full border px-3 py-1 font-medium text-muted-foreground",
                  s.chip,
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </Sized>
      </div>
    </Container>
  );
}
