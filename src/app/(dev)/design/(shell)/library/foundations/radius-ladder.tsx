"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

/**
 * THE CORNER LADDER, MEASURED OFF ITSELF (family C, the derived steps in
 * quarters; the rounding board retired into this).
 *
 * ★ NOT ONE NUMBER IS TYPED HERE, the type ladder's rule beside it. Every
 * specimen wears the real token or class, and every caption is
 * getComputedStyle on the specimen you are looking at, so a retune in
 * globals.css and the tuner (which writes these tokens inline on <html>) both
 * show up here the moment they land. That is also why this section is the
 * tuner's specimen for its radius knobs (motion-tuner-config.ts): a knob with
 * no specimen is retired from the panel.
 */

/** Captions keyed by specimen id, re-read on resize and on a tuner write. */
function useCorners() {
  const nodes = useRef(new Map<string, HTMLElement>());
  const [read, setRead] = useState<Record<string, string>>({});
  useEffect(() => {
    const measure = () => {
      const next: Record<string, string> = {};
      for (const [id, el] of nodes.current) {
        const cs = getComputedStyle(el);
        // A gap specimen reports its gap, everything else its corner.
        next[id] = id.endsWith(":gap") ? cs.rowGap : cs.borderTopLeftRadius;
      }
      setRead(next);
    };
    measure();
    window.addEventListener("resize", measure);
    // The tuner writes the tokens as an inline style on <html>.
    const tuner = new MutationObserver(measure);
    tuner.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      window.removeEventListener("resize", measure);
      tuner.disconnect();
    };
  }, []);
  const ref = (id: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  };
  const px = (id: string) => {
    const v = read[id];
    return v ? `${Math.round(parseFloat(v) * 10) / 10}px` : "";
  };
  return { ref, px };
}

/** The derived steps, in the order the quarters climb. */
const STEPS = ["sm", "md", "lg", "xl", "2xl"] as const;
const STEP_CLASS: Record<(typeof STEPS)[number], string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

function Cell({
  name,
  token,
  value,
  children,
}: {
  name: string;
  token: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex min-h-24 flex-1 items-center justify-center">
        {children}
      </div>
      <p className="mt-3 text-center text-[13px] font-medium">{name}</p>
      <p className="text-center text-[10px] text-muted-foreground tabular-nums">
        {token}
        {value ? ` · ${value}` : ""}
      </p>
    </div>
  );
}

export function RadiusLadder() {
  const { ref, px } = useCorners();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cell name="Surface" token="--radius" value={px("surface")}>
          <div
            ref={ref("surface")}
            className="size-16 rounded-lg border-2 border-foreground"
          />
        </Cell>
        <Cell
          name="Photograph"
          token="--radius-tile, the gap pinned to it"
          value={[px("tile"), px("tile:gap")].filter(Boolean).join(" / ")}
        >
          {/* Four photographs meeting: the gap follows the corner, so the
              junction closes to a hairline instead of opening a diamond. */}
          <div
            ref={ref("tile:gap")}
            className="grid grid-cols-2 gap-[var(--gap-gallery)]"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                ref={i === 0 ? ref("tile") : undefined}
                className="size-9 rounded-tile bg-foreground/80"
              />
            ))}
          </div>
        </Cell>
        <Cell
          name="Floating layer"
          token="--radius-float, its row derived"
          value={[px("float"), px("row")].filter(Boolean).join(" / ")}
        >
          <div ref={ref("float")} className={cn(floatingPanel, "w-32 p-1")}>
            <div
              ref={ref("row")}
              className={cn(floatingRow, "bg-muted px-2 py-1.5 text-[11px]")}
            >
              A row
            </div>
            <div className={cn(floatingRow, "px-2 py-1.5 text-[11px]")}>
              Another
            </div>
          </div>
        </Cell>
        <Cell
          name="Actions"
          token="--radius-action, 0.4 of the height"
          value={[px("sm"), px("lg"), px("cta")].filter(Boolean).join(" / ")}
        >
          <div className="flex flex-col items-center gap-2">
            <Button ref={ref("sm")} size="default">
              32px
            </Button>
            <Button ref={ref("lg")} size="lg" variant="outline">
              36px
            </Button>
            <Button ref={ref("cta")} size="cta">
              44px cta
            </Button>
          </div>
        </Cell>
      </div>
      {/* The derived steps, each a quarter of --radius (three to a row on a
          phone, where five columns wrap the class names). */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {STEPS.map((step) => (
          <div
            key={step}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3"
          >
            <div
              ref={ref(`step-${step}`)}
              className={cn(
                "size-10 border-2 border-foreground",
                STEP_CLASS[step],
              )}
            />
            <p className="text-[11px] font-medium whitespace-nowrap">
              rounded-{step}
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {px(`step-${step}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
