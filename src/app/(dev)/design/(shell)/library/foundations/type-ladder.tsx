"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * THE TYPE LADDER, DRAWN BY THE PRODUCTION TOKENS AND MEASURED OFF ITSELF
 * (the type-scale board retired into this).
 *
 * ★ NOT ONE NUMBER IS TYPED HERE, AND THAT IS THE WHOLE DESIGN. Every rung
 * wears the real utility class (`text-display`, `text-hero`, …), so its size,
 * its leading and its tracking arrive the way they arrive on /about. The two
 * ENDS are read out of the token itself at runtime — `--text-display` is
 * literally `clamp(4rem, 1.887rem + 9.01vw, 10rem)`, and a clamp built through
 * (375, phone) and (1440, desktop) carries those two ends as its own floor and
 * ceiling — and the NOW column is `getComputedStyle` on the line you are
 * looking at. Retune a step in theme.css and this page retunes with it; there
 * is no table here to go stale. (The tokens are reachable because theme.css
 * declares the ladder `@theme static`: Tailwind otherwise emits only the
 * variables some utility happens to use, and a token you cannot read is not a
 * token.)
 *
 * ★ A SPECIMEN WHOSE SIZE IS BEING JUDGED IS NEVER SCALED. Will, on the board's
 * fourth round: "the previews throw off anything related to size, and the whole
 * point is reviewing accurate sizing." So a rung that does not fit CLIPS at the
 * column edge instead of shrinking, exactly the way a 160px masthead meets the
 * edge of a page. The thing you compare is the cap height, and it is true to
 * the pixel. That idea is all this kept from `sandbox/type-scale`.
 *
 * ★ AND THE WORDS ARE THE SITE'S OWN. A specimen set in "Aa Bb Cc" is a font
 * sample; a ladder is judged on the copy that actually stands at each step.
 *
 * ★ THE BODY HALF IS DRAWN IN INTER (the body wiring, 2026-09-20). The six
 * steps under `card-title` are read in the body face, so the specimen sets
 * them in `font-sans`: a body ladder drawn in Urbanist would be showing you a
 * font nobody sets them in, and the whole point of drawing a step at true size
 * is that it is the thing itself. The `label` row wears `uppercase` for the
 * same reason — 0.08em of tracking on lowercase is not what that step is.
 */

type Register = "marketing" | "app" | "body";

/** A step: its name, its class, its register and the line that stands there.
 *  `face` is "body" for the six body steps: those are read in INTER, and a
 *  ladder that drew them in Urbanist would be showing you a font nobody sets
 *  them in. */
const STEPS: {
  id: string;
  label: string;
  cls: string;
  register: Register;
  face?: "body";
  where: string;
  word: string;
}[] = [
  {
    id: "display",
    label: "Display",
    cls: "text-display",
    register: "marketing",
    where: "the masthead, one or two words (PageHero scale=display)",
    word: "Partyreel",
  },
  {
    id: "hero",
    label: "Hero",
    cls: "text-hero",
    register: "marketing",
    where: "the cinema hero, the home (PageHero scale=xl)",
    word: "The whole event, in one album.",
  },
  {
    id: "title",
    label: "Title",
    cls: "text-title",
    register: "marketing",
    where: "/help and the six feature pages (PageHero scale=lg)",
    word: "Help centre",
  },
  {
    id: "chapter",
    label: "Chapter",
    cls: "text-chapter",
    register: "marketing",
    where: "a chapter opener, a closing anchor, an article title",
    word: "How it works",
  },
  {
    id: "section",
    label: "Section",
    cls: "text-section",
    register: "marketing",
    where: "the body section h2 (SectionShell default), and a stat numeral",
    word: "Every guest is a camera",
  },
  {
    id: "prose",
    label: "Prose",
    cls: "text-prose",
    register: "marketing",
    where:
      "the paper prose head, an article's h2, and a dead link on marketing",
    word: "Why we built it",
  },
  {
    id: "subhead",
    label: "Sub-head",
    cls: "text-subhead",
    register: "marketing",
    where:
      "the sub-head under a prose or section h2, an article's h3, a legal section",
    word: "Originals in, originals out.",
  },
  {
    id: "page",
    label: "Page",
    cls: "text-page",
    register: "app",
    where: "every app and admin h1 (PageHeading), the guest event title",
    word: "Dashboard",
  },
  {
    id: "subsection",
    label: "Subsection",
    cls: "text-subsection",
    register: "app",
    where:
      "the app's quiet middle (an event tile, a gate card, an empty state), and a marketing tile's title",
    word: "Your events",
  },
  {
    id: "card-title",
    label: "Card title",
    cls: "text-card-title",
    register: "app",
    where: "CardTitle, and every sheet, drawer and dialog title",
    word: "Mara and Tom",
  },
  {
    id: "copy",
    label: "Copy",
    cls: "text-copy",
    register: "body",
    face: "body",
    where:
      "marketing's ledes and paragraphs, the one body step that travels (16 at a phone, 18 at a desk)",
    word: "Your guests took the best photos at your event.",
  },
  {
    id: "reading",
    label: "Reading",
    cls: "text-reading",
    register: "body",
    face: "body",
    where:
      "every guest-facing sentence, and a single-line label or field on it",
    word: "The album is open. Add anything you took tonight.",
  },
  {
    id: "working",
    label: "Working",
    cls: "text-working",
    register: "body",
    face: "body",
    where:
      "the app, the admin and marketing's own UI chrome: a row, a cell, a control",
    word: "14 photos waiting for review",
  },
  {
    id: "caption",
    label: "Caption",
    cls: "text-caption",
    register: "body",
    face: "body",
    where:
      "a caption, a hint, a descriptor, a control's label (the Caption atom)",
    word: "Originals in, originals out",
  },
  {
    id: "label",
    label: "Label",
    cls: "text-label",
    register: "body",
    face: "body",
    where:
      "every uppercase label, marketing and app (the Eyebrow atom): the caption step's twin, tracked 0.08em",
    word: "On this page",
  },
  {
    id: "micro",
    label: "Micro",
    cls: "text-micro",
    register: "body",
    face: "body",
    where:
      "the floor: metadata over a photograph, a count, a pip, a keycap. Nothing on Partyreel is under 10.",
    word: "128 items · 2.1 GB",
  },
];

/** The tiered weight the system documents: page titles 700, card titles 600. */
const SEMIBOLD = new Set(["subsection", "card-title"]);

const round = (n: number) => Math.round(n * 100) / 100;

/** Split a function's arguments on TOP-LEVEL commas only. */
function args(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  out.push(inner.slice(start));
  return out.map((s) => s.trim());
}

/** A rem/px literal as px, or null for anything with a unit we cannot resolve. */
function px(value: string, rootPx: number): number | null {
  const m = /^(-?[\d.]+)(rem|px)$/.exec(value.trim());
  if (!m) return null;
  return m[2] === "rem" ? Number(m[1]) * rootPx : Number(m[1]);
}

/**
 * The two ends of a token. A clamp through both canvases pins to its floor at
 * 375 and its ceiling at 1440, so the floor and the ceiling ARE the two ends; a
 * flat token (the card step travels no rungs) has one value at both.
 */
function ends(token: string, rootPx: number): [number, number] | null {
  const t = token.trim();
  if (!t) return null;
  if (!t.startsWith("clamp(")) {
    const flat = px(t, rootPx);
    return flat === null ? null : [flat, flat];
  }
  const parts = args(t.slice("clamp(".length, -1));
  const lo = px(parts[0], rootPx);
  const hi = px(parts[parts.length - 1], rootPx);
  return lo === null || hi === null ? null : [lo, hi];
}

type Reading = {
  size: [number, number] | null;
  leading: [number, number] | null;
  tracking: string;
  now: { size: string; leading: string; tracking: string } | null;
};

export function TypeLadder() {
  const lines = useRef(new Map<string, HTMLSpanElement>());
  const [read, setRead] = useState<Record<string, Reading>>({});

  useEffect(() => {
    const measure = () => {
      const root = getComputedStyle(document.documentElement);
      const rootPx = parseFloat(root.fontSize) || 16;
      const next: Record<string, Reading> = {};
      for (const step of STEPS) {
        const line = lines.current.get(step.id);
        const live = line ? getComputedStyle(line) : null;
        next[step.id] = {
          size: ends(root.getPropertyValue(`--text-${step.id}`), rootPx),
          leading: ends(
            root.getPropertyValue(`--text-${step.id}--line-height`),
            rootPx,
          ),
          tracking: root
            .getPropertyValue(`--text-${step.id}--letter-spacing`)
            .trim(),
          now: live
            ? {
                size: live.fontSize,
                leading: live.lineHeight,
                tracking: live.letterSpacing,
              }
            : null,
        };
      }
      setRead(next);
    };
    measure();
    // The NOW column is a function of the viewport, so it follows the window.
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border">
      {STEPS.map((step, i) => {
        const r = read[step.id];
        const opens = i > 0 && STEPS[i - 1]?.register !== step.register;
        return (
          <div
            key={step.id}
            className={cn(
              "px-4 py-4",
              i > 0 && "border-t",
              // ★ A HAIRLINE SAYS "THIS IS ANOTHER HALF OF THE SITE", AND
              // THERE ARE TWO. Marketing descends to its sub-head and the app
              // starts again a rung ABOVE it (the page title), which reads as
              // a broken ladder until you know why; then the BODY steps start
              // again at 16, level with the card title they sit under, and the
              // one that travels (`copy`) tops out above it on a desk. Both
              // rules are drawn from the data, never typed in.
              opens && "border-t-2 border-t-foreground/20",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold">
                {step.label}{" "}
                <span className="font-normal text-muted-foreground">
                  {step.cls}
                </span>
              </p>
              <p className="text-xs text-faint tabular-nums">
                {r?.size ? `${round(r.size[0])} → ${round(r.size[1])}px` : ""}
                {r?.leading
                  ? ` · leading ${round(r.leading[0])} → ${round(r.leading[1])}`
                  : ""}
                {r?.tracking ? ` · tracking ${r.tracking}` : ""}
              </p>
            </div>
            {/* True size, and it CLIPS rather than shrinks. */}
            <div className="mt-2 overflow-hidden">
              <span
                ref={(el) => {
                  if (el) lines.current.set(step.id, el);
                  else lines.current.delete(step.id);
                }}
                className={cn(
                  "block whitespace-nowrap",
                  step.face === "body" ? "font-sans" : "font-heading",
                  step.cls,
                  step.id === "label" && "uppercase",
                  SEMIBOLD.has(step.id) && "font-semibold",
                )}
              >
                {step.word}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="text-xs text-muted-foreground">{step.where}</p>
              <p className="text-xs text-faint tabular-nums">
                {r?.now
                  ? `now ${r.now.size} / ${r.now.leading} / ${r.now.tracking}`
                  : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
