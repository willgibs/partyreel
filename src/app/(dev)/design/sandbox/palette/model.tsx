"use client";

import { cn } from "@/lib/utils";

import {
  CHOOSES,
  CINEMA_VERSUS_INK,
  REGISTERS,
  lOf,
  papersOf,
  roomsOf,
  type Pair,
} from "./registers";

/**
 * THE MODEL, AS THE FIRST BLOCK ON THE BOARD (round four).
 *
 * Will's note asked two questions that turn out to be one: "what's the
 * difference between cinema and ink?" and "didn't know if we were incorrectly
 * elevating a bad color system we were stuck in". Three rounds of this board
 * answered neither, because all three inherited the shape of the thing they
 * were judging: a list of grounds with no statement of what a ground IS.
 *
 * So this block is written before any candidate, in plain words, and every
 * candidate below is an answer INSIDE it rather than a rival to it. It is the
 * board's first ask, and it is the only ask whose answer changes what the other
 * seven mean.
 */
export function ModelBlock({ pair }: { pair: Pair }) {
  const dark = roomsOf(pair.dark);
  const light = papersOf(pair.light);
  const l = (v: string, block: Record<string, string>) => {
    const n = lOf(v, block);
    return n === null ? "" : n.toFixed(3);
  };
  return (
    <section id="pal-model" className="flex scroll-mt-32 flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">
          The model: two modes, two grounds each, and one well that belongs to
          neither
        </p>
        <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
          Judged from the ground up, as if none of today&apos;s greys existed.
          Everything below this block is a candidate INSIDE this model; the
          first ask is whether the model itself is right.
        </p>
      </div>

      {/* The answer to the question that opened the round, in one sentence,
          because it should not need a paragraph. */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-xs font-medium">
          Cinema versus ink, in one sentence
        </p>
        <p className="mt-1.5 max-w-4xl text-xs text-muted-foreground">
          {CINEMA_VERSUS_INK}
        </p>
        <p className="mt-2 max-w-4xl text-xs text-muted-foreground">
          <span className="text-foreground">So: not five palettes.</span> Two
          modes, two grounds inside each, and one media well. That is four
          registers and one bed, where today there are five unnamed grounds
          (cinema 0.110, the app 0.140, the leaf 0.155, paper 0.990 and the
          contact card&apos;s panel) plus a literal black nobody wrote down. The
          rework is not a sixth value: it is naming the two jobs on each side
          and letting one ladder serve both.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {REGISTERS.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-lg border px-4 py-3",
              r.mode === "neither"
                ? "border-border bg-muted/40 lg:col-span-2"
                : "border-border",
            )}
          >
            <p className="text-xs font-medium">
              <span
                className={cn(
                  "mr-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px]",
                  r.mode === "dark"
                    ? "bg-foreground text-background"
                    : r.mode === "light"
                      ? "border border-border text-muted-foreground"
                      : "bg-secondary text-secondary-foreground",
                )}
              >
                {r.mode === "neither" ? "both modes" : r.mode}
              </span>
              {r.name}
              <span className="ml-2 font-normal text-muted-foreground">
                {r.selector}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{r.is}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="text-foreground">Taken by:</span> {r.takes}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="text-foreground">Today:</span> {r.today}
            </p>
          </div>
        ))}
      </div>

      {/* The grounds of the SELECTED pair, printed with their lightnesses, so
          the model is a reading of the thing the dock is showing rather than a
          diagram beside it. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium">
            The dark side, as {pair.dark.label} answers it
          </p>
          <div className="flex h-20 overflow-hidden rounded-lg border border-border">
            {dark.map((room) => (
              <div
                key={room.name}
                className="flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5"
                style={{ background: room.value }}
              >
                <span className="text-[10px] text-white tabular-nums">
                  {l(room.value, pair.dark.room)}
                </span>
                <span className="text-[9px] text-white/60">{room.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium">
            The light side, as {pair.light.label} answers it
          </p>
          <div className="flex h-20 overflow-hidden rounded-lg border border-border">
            {light.map((sheet) => (
              <div
                key={sheet.name}
                className="flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5"
                style={{ background: sheet.value }}
              >
                <span className="text-[10px] text-black tabular-nums">
                  {l(sheet.value, pair.light.paper)}
                </span>
                <span className="text-[9px] text-black/50">{sheet.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border px-4 py-3">
        <p className="text-xs font-medium">What a page and a section choose</p>
        <ul className="mt-2 space-y-1.5">
          {CHOOSES.map((line) => (
            <li key={line} className="text-xs text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
