"use client";

import { Badge } from "@/components/ui/badge";

import type { ScreenId } from "../knobs";
import type { StatusSet } from "./sets";

/**
 * THE STATUS SET ITSELF, on paper and in the room: each state as production's
 * own Badge draws it under the set's paste (its point and its word), with
 * what the state means and the token it reads, beside the tally (given) and
 * the live mark. The words are a real night's: what a host reads on her hub.
 */

function Cap({ children }: { children: string }) {
  return (
    <span className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
      {children}
    </span>
  );
}

/** The tally as event-header r6 drew it: a solid count on the glyph's shoulder, given. */
export function Tally({ n, read }: { n: string; read?: string }) {
  return (
    <span
      data-bm-read={read}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-micro font-semibold tabular-nums"
      style={{ background: "var(--needs)", color: "oklch(1 0 0)" }}
    >
      {n}
    </span>
  );
}

const ROWS = [
  {
    state: "Standby",
    means: "Waiting on us: sending, developing, in review",
    token: "--status-standby",
    badge: <Badge variant="secondary">Sending 3 of 12</Badge>,
  },
  {
    state: "Ready",
    means: "Done: approved, sent, saved",
    token: "--status-ready",
    badge: <Badge variant="success">12 approved</Badge>,
  },
  {
    state: "Fault",
    means: "Failed: refused, full, stopped",
    token: "--status-fault",
    badge: <Badge variant="destructive">1 upload failed</Badge>,
  },
] as const;

function Half({
  ground,
  screen,
}: {
  ground: "paper" | "room";
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  return (
    <div
      className={`${ground === "paper" ? "surface-paper" : "dark"} flex flex-col bg-background text-foreground`}
      style={{ flex: 1, padding: desk ? "44px 52px" : "26px 18px", gap: 18 }}
    >
      <Cap>{ground === "paper" ? "On paper" : "In the room"}</Cap>
      {ROWS.map((r) => (
        <div
          key={r.state}
          className="grid items-center border-t border-border"
          style={{
            gridTemplateColumns: desk ? "220px 90px 1fr" : "1fr",
            gap: desk ? 12 : 6,
            paddingTop: 14,
          }}
          data-bm-read={`${r.state} ${ground === "paper" ? "on paper" : "in the room"}`}
          data-bm-says={r.state}
        >
          {r.badge}
          <span className="text-sm font-semibold">{r.state}</span>
          <span className="text-sm text-muted-foreground">
            {r.means} · <span className="text-faint">{r.token}</span>
          </span>
        </div>
      ))}
      <div
        className="grid items-center border-t border-border"
        style={{
          gridTemplateColumns: desk ? "220px 90px 1fr" : "1fr",
          gap: desk ? 12 : 6,
          paddingTop: 14,
        }}
      >
        <span className="flex items-center gap-2 text-label font-semibold uppercase tabular-nums">
          Review{" "}
          <Tally
            n="8"
            read={`the tally ${ground === "paper" ? "on paper" : "in the room"}`}
          />
        </span>
        <span className="text-sm font-semibold">Needs you</span>
        <span className="text-sm text-muted-foreground">
          The tally, given (event-header r6) ·{" "}
          <span className="text-faint">--needs</span>
        </span>
      </div>
      <div
        className="grid items-center border-t border-border"
        style={{
          gridTemplateColumns: desk ? "220px 90px 1fr" : "1fr",
          gap: desk ? 12 : 6,
          paddingTop: 14,
        }}
      >
        <Badge variant="live">Live</Badge>
        <span className="text-sm font-semibold">Live</span>
        <span className="text-sm text-muted-foreground">
          {"The tally's red, the one point that breathes"}
        </span>
      </div>
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
      <Half ground="paper" screen={screen} />
      <Half ground="room" screen={screen} />
    </div>
  );
}
