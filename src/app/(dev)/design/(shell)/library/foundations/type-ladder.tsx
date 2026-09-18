"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * THE TYPE LADDER, DRAWN BY THE PRODUCTION TOKENS AND MEASURED OFF ITSELF
 * (Will's ruling, 2026-09-17; the type-scale board retired into this).
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
 */

type Register = "marketing" | "app";

/** A step: its name, its class, its register and the line that stands there. */
const STEPS: {
  id: string;
  label: string;
  cls: string;
  register: Register;
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
        const opens =
          step.register === "app" && STEPS[i - 1]?.register !== "app";
        return (
          <div
            key={step.id}
            className={cn(
              "px-4 py-4",
              i > 0 && "border-t",
              // ★ ONE HAIRLINE SAYS "THIS IS THE OTHER HALF OF THE SITE".
              // Marketing descends to its sub-head and the app starts again a
              // rung ABOVE it (the page title), which reads as a broken ladder
              // until you know why. The rule is the why, and it is drawn from
              // the data, never typed in (the sizes are on the rows above).
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
                  "block font-heading whitespace-nowrap",
                  step.cls,
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
