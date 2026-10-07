"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";

import type { ScreenId } from "../knobs";
import type { StatusSet, StatusSetId } from "./sets";

/**
 * THE STATUS SET ITSELF, on paper and in the room: first the five marks
 * side by side as a host's screen holds them (Standby, Ready, Fault, the
 * tally, live), drawn twice their size (★ the step first shows an option
 * fitted to its window, where an 8px point is three pixels and its colour,
 * the one thing asked, is lost), then each on a row of its own with what it says
 * in this set, the token it lands as and its contrast on the ground. Every
 * point is production's own Badge under the set's paste (Standby is its
 * `info`, production's "in progress"); the tally is drawn as the
 * event-header wiring draws it.
 *
 * ★ EVERY CONTRAST IS MEASURED, NEVER TYPED: a row reads its point's colour
 * (the Badge's `--dot`, or the tally's fill under its figure) and its
 * ground's as the frame's document computes them once the paste has landed,
 * so a number here is the paste's own, and the frame's caption prints the
 * same readings. A point is a graphic and needs 3:1 on its ground (WCAG
 * 1.4.11); the tally's white figure is a word and needs 4.5:1 on its fill.
 */

/** What Ready and Fault say in each set; Standby, the tally and live are given. */
const SAYS: Record<StatusSetId, { ready: string; fault: string }> = {
  pilot: {
    ready: "Done: approved, sent, saved. Green, as a camera says ready.",
    fault:
      "Failed: refused, full, stopped. The camera's red; its word tells it from a count.",
  },
  ink: {
    ready: "Done: approved, sent, saved. The ink lit full, with no hue.",
    fault:
      "Failed: refused, full, stopped. The one red, shared with the tally: act on this.",
  },
  amber: {
    ready: "Done: approved, sent, saved. Green, as a camera says ready.",
    fault:
      "Failed: refused, full, stopped. Amber, so red stays the tally's and live's.",
  },
};

function Cap({ children }: { children: string }) {
  return (
    <span className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
      {children}
    </span>
  );
}

/** The tally as the event-header wiring draws it: a solid count, white on `--needs-you`, given. */
export function Tally({ n }: { n: string }) {
  return (
    <span
      data-bm-tally=""
      className="inline-flex items-center justify-center rounded-full tabular-nums"
      style={{
        height: 20,
        minWidth: 20,
        padding: "0 5px",
        boxSizing: "border-box",
        fontSize: 11.5,
        fontWeight: 650,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        background: "var(--needs-you)",
        color: "var(--needs-you-foreground)",
      }}
    >
      {n}
    </span>
  );
}

/** "Review" and its tally, in the readout's voice. */
function Waiting() {
  return (
    <span className="inline-flex items-center gap-2 text-label font-semibold uppercase tabular-nums">
      Review <Tally n="8" />
    </span>
  );
}

/* ── the measuring: sRGB off a one-pixel canvas, WCAG's luminance ───────── */

type Rgb = readonly [number, number, number];

/** A colour the frame computed (oklch, rgb, anything CSS parses) as sRGB 0 to 1; null if it would not parse. */
function srgb(doc: Document, css: string): Rgb | null {
  const g = doc
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!g || !css) return null;
  const sentinel = "#010203";
  g.fillStyle = sentinel;
  g.fillStyle = css;
  if (g.fillStyle === sentinel) return null;
  g.fillRect(0, 0, 1, 1);
  const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
  return [r / 255, gr / 255, b / 255];
}

const linear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contrast = (a: Rgb, b: Rgb) => {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

type Probe = "point" | "figure";

/**
 * A row's reading, once the paste has landed (the frame adopts it a frame or
 * two after mount, so the row reads on three beats, as `Measured` does).
 */
function useReading(probe: Probe, key: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const row = ref.current;
      const win = row?.ownerDocument.defaultView;
      if (!row || !win) return;
      const style = (el: Element) => win.getComputedStyle(el);
      let fg = "";
      let bg = "";
      if (probe === "point") {
        const badge = row.querySelector('[data-slot="badge"]');
        const ground = row.closest("[data-bm-ground]");
        if (!badge || !ground) return;
        const dot = style(badge).getPropertyValue("--dot").trim();
        // Standby is lit in its word's own ink (`currentColor`), so read the word.
        fg = !dot || /^currentcolor$/i.test(dot) ? style(badge).color : dot;
        bg = style(ground).backgroundColor;
      } else {
        const tally = row.querySelector("[data-bm-tally]");
        if (!tally) return;
        fg = style(tally).color;
        bg = style(tally).backgroundColor;
      }
      const a = srgb(row.ownerDocument, fg);
      const b = srgb(row.ownerDocument, bg);
      if (a && b) setRatio(`${contrast(a, b).toFixed(2)}:1`);
    };
    const timers = [150, 700, 1700].map((ms) => window.setTimeout(read, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [probe, key]);
  return [ref, ratio] as const;
}

/* ── the rows ───────────────────────────────────────────────────────────── */

function Row({
  mark,
  state,
  says,
  token,
  probe,
  read,
  setId,
  desk,
}: {
  mark: ReactNode;
  state: string;
  says: string;
  token: string;
  probe: Probe;
  /** The frame caption's name for this reading; none keeps the caption to the eight that decide. */
  read?: string;
  setId: StatusSetId;
  desk: boolean;
}) {
  const [ref, ratio] = useReading(probe, setId);
  return (
    <div
      ref={ref}
      data-bm-read={read}
      data-bm-says={read && ratio ? ratio : undefined}
      className="grid items-start border-t border-border"
      style={{
        gridTemplateColumns: desk ? "188px 80px 1fr" : "1fr auto",
        columnGap: desk ? 16 : 12,
        rowGap: 2,
        paddingTop: 12,
      }}
    >
      <span className="flex h-5 items-center">{mark}</span>
      <span
        className="text-sm font-semibold"
        style={{ textAlign: desk ? undefined : "right" }}
      >
        {state}
      </span>
      <span
        className="text-sm text-pretty text-muted-foreground"
        style={{ gridColumn: desk ? undefined : "1 / -1" }}
      >
        {says}{" "}
        <span className="text-xs whitespace-nowrap text-faint tabular-nums">
          {token}
          {ratio ? ` · ${ratio}` : ""}
        </span>
      </span>
    </div>
  );
}

function Half({
  set,
  ground,
  screen,
}: {
  set: StatusSet;
  ground: "paper" | "room";
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  const on = ground === "paper" ? "on paper" : "in the room";
  const says = SAYS[set.id];
  return (
    <div
      data-bm-ground={ground}
      className={`${ground === "paper" ? "surface-paper" : "dark"} flex flex-col bg-background text-foreground`}
      style={{ flex: 1, padding: desk ? "36px 48px" : "24px 18px", gap: 14 }}
    >
      <Cap>{ground === "paper" ? "On paper" : "In the room"}</Cap>
      {/* The five side by side, as a host's screen holds them, Fault beside
          the tally, at twice their size so the colours read at the step's
          first, fitted look. */}
      <div
        className="flex flex-wrap items-center"
        style={{
          zoom: desk ? 2 : 1.5,
          columnGap: 18,
          rowGap: 8,
          paddingBottom: 4,
        }}
      >
        <Badge variant="info">Sending 3 of 12</Badge>
        <Badge variant="success">12 approved</Badge>
        <Badge variant="destructive">1 upload failed</Badge>
        <Waiting />
        <Badge variant="live">Live</Badge>
      </div>
      <Row
        mark={<Badge variant="info">Sending 3 of 12</Badge>}
        state="Standby"
        says="Waiting on us: sending, developing, in review. Half-lit, no hue."
        token="--foreground, half-lit"
        probe="point"
        read={`Standby ${on}`}
        setId={set.id}
        desk={desk}
      />
      <Row
        mark={<Badge variant="success">12 approved</Badge>}
        state="Ready"
        says={says.ready}
        token={set.id === "ink" ? "--success, the ink" : "--success"}
        probe="point"
        read={`Ready ${on}`}
        setId={set.id}
        desk={desk}
      />
      <Row
        mark={<Badge variant="destructive">1 upload failed</Badge>}
        state="Fault"
        says={says.fault}
        token={set.fault.token === "--fault" ? "--fault, new" : "--destructive"}
        probe="point"
        read={`Fault ${on}`}
        setId={set.id}
        desk={desk}
      />
      <Row
        mark={<Waiting />}
        state="Needs you"
        says="A count that waits on her: the tally, given (event-header r6)."
        token="--needs-you, its white figure"
        probe="figure"
        read={`the tally ${on}`}
        setId={set.id}
        desk={desk}
      />
      <Row
        mark={<Badge variant="live">Live</Badge>}
        state="Live"
        says="Happening now: the tally's red, the one point that breathes."
        token="--signal"
        probe="point"
        setId={set.id}
        desk={desk}
      />
    </div>
  );
}

export function StatusSheet({
  set,
  screen,
}: {
  set: StatusSet;
  screen: ScreenId;
}) {
  return (
    <div
      data-bm-set={set.id}
      className="flex min-h-screen"
      style={{ flexDirection: screen === "1440" ? "row" : "column" }}
    >
      <Half set={set} ground="paper" screen={screen} />
      <Half set={set} ground="room" screen={screen} />
    </div>
  );
}
