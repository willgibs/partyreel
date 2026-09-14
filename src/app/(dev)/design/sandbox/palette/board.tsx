"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  BoardMeta,
  Stage,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { cn } from "@/lib/utils";

import { AccentWall } from "./call-sites";
import {
  ACCENTS,
  ACCENT_BY_ID,
  DARK_LADDER,
  LIGHT_LADDER,
  PANEL_ALPHAS,
  RAMPS,
  RAMP_BY_ID,
  accentStyle,
  lOf,
  rampStyle,
  rooms,
  tokenBlock,
  type AccentId,
  type Ramp,
  type RampId,
} from "./ramps";
import {
  AppDashboard,
  InkLeaf,
  MarketingChapter,
  PanelBand,
  SurfaceStack,
} from "./sections";

/**
 * THE PALETTE BOARD (the review wave, 2026-09-14). Bible 1 under exploration.
 *
 * The question is three questions that share one answer: what the achromatic
 * ramp should be in both modes, what the accent is FOR now that rule 1 gives it
 * a job, and whether the set-apart panel is a token or an alpha trick.
 *
 * Rising tides (bible 22): the ramp was judged from the ground up rather than
 * nudged. The finding underneath all three candidates is that today's twenty-one
 * values are hand-picked rather than stepped, which is why the light middle is
 * empty (37 sites dim text with an alpha to reach a step that is not there),
 * why five light surfaces sit inside 0.037 of each other, and why the panel has
 * to be an alpha to be visible at all. A tunes that system, B replaces it with a
 * derivation, C questions its zero-chroma premise. Every candidate is a complete
 * token block, so a ruling is a paste.
 *
 * Board mechanics worth knowing before editing:
 *  - a ramp is applied as INLINE custom properties on a wrapper inside the
 *    Stage, never by swapping a class, so the Stage keeps the real `.dark` /
 *    `.surface-paper` class that the `dark:` variants in production components
 *    need. See rampStyle() in ramps.ts.
 *  - breakpoints do not work inside a Stage (a 375 wide stage in a 1440
 *    viewport still matches `sm:`), so sections branch on `mode`.
 *  - the menu specimens are hand-placed: a real DropdownMenu portals to the
 *    body and would escape both the zoom and the token overrides.
 */

const QUESTION =
  "The achromatic ramp between black and white in both modes, the accent's role where there is no media, and the muted panel as a real register: what would the perfect version be if none of today's greys existed?";

const ASKS = [
  "The ramp: A, B or C, or today's, in both modes.",
  "The accent: which hue (ink today, blue 252, violet 300, flare 330), and which of its three jobs it takes (identity, attention, the stand-in for media).",
  "The panel: one token at full strength, retiring the six alphas it ships at, and hover fills moving to --secondary.",
  "The dark grounds: three steps of one ladder (A and C) or one room for cinema, the app, ink and the canvas (B).",
  "The missing step: --faint enters the token set (all three candidates add it) or the 37 alpha-dimmed text sites stay as they are.",
];

const DEPARTURES = [
  "C re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined. C is that decision re-argued at 0.003 to 0.008 chroma, on the board rather than in a comment.",
  "A and C make the dark card opaque, retiring the system's one translucent surface. Only B keeps a veil, and only in B does a card over a photograph read as glass.",
  "B deletes the cinema override in marketing.css, the skin block's only surface value. The cinema-to-footer seam then belongs entirely to light, which is the light board's lane.",
  "A and C move --gallery out of the ink family and take it deeper than any room (0.09), because one token is currently both the lightbox canvas and the footer's ground. Those are two jobs.",
  "All three candidates complete .surface-ink (no --card, --popover, --secondary, --accent or --input ships today), so an ink leaf can finally host a card and a menu.",
  "Each candidate adds one custom property, --faint, which needs one line in theme.css's @theme inline block before a text-faint utility exists. The board reaches it with an arbitrary value.",
];

const ASSETS = [
  "Four hard-case event photographs for palette work · one high key (white dress on a white wall), one low key (a night dance floor), one candle-warm, one stage-cool · 1600x1000, landscape, JPG · replaces the four standing marketing images on this board (wedding-golden, party-balloons, concert-confetti, reception-table)",
];

/* ── Board furniture ────────────────────────────────────────────────────── */

function Row({
  n,
  name,
  reading,
  children,
}: {
  n: string;
  name: string;
  reading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground text-[11px] text-background tabular-nums">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          {reading}
        </p>
      </div>
      {children}
    </section>
  );
}

/** A stage under one candidate's tokens. */
function Frame({
  ramp,
  ground,
  mode,
  height,
  label,
  children,
}: {
  ramp: Ramp;
  ground: Ground;
  mode: Mode;
  height: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Stage mode={mode} ground={ground} height={height}>
        <div
          data-pal-swap
          className="h-full w-full overflow-hidden bg-background text-foreground"
          style={rampStyle(ramp, ground)}
        >
          {children}
        </div>
      </Stage>
    </div>
  );
}

/* ── The ladder ─────────────────────────────────────────────────────────── */

function Ladder({ ramp, tone }: { ramp: Ramp; tone: "light" | "dark" }) {
  const block = tone === "light" ? ramp.light : ramp.dark;
  const spec = tone === "light" ? LIGHT_LADDER : DARK_LADDER;
  // Deltas are derived up front rather than tracked through the map: the React
  // compiler rejects a variable reassigned during render, and a step's distance
  // from the one above it is the whole reason this table exists.
  const rows = spec.map((row, i) => {
    const value = block[row.token];
    const l = value ? lOf(value, block) : null;
    const above = spec
      .slice(0, i)
      .map((r) => (block[r.token] ? lOf(block[r.token], block) : null))
      .filter((x): x is number => x !== null)
      .pop();
    return {
      ...row,
      value,
      l,
      delta: l !== null && above !== undefined ? l - above : null,
    };
  });
  return (
    <div
      data-pal-swap
      className="rounded-lg border border-border bg-background p-3 text-foreground"
      style={block as React.CSSProperties}
    >
      <p className="mb-2 text-[11px] font-medium">
        {ramp.label}
        <span className="ml-1.5 text-muted-foreground">
          {tone === "light" ? "light" : "dark"}
        </span>
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.token} className="flex items-center gap-2">
            <span
              className="size-5 shrink-0 rounded-sm border border-border"
              style={{
                background: row.value ? `var(${row.token})` : "transparent",
                backgroundImage: row.value
                  ? undefined
                  : "repeating-linear-gradient(45deg, var(--muted-foreground) 0 1px, transparent 1px 4px)",
              }}
            />
            <span className="w-24 shrink-0 truncate text-[10px] text-muted-foreground">
              {row.role}
            </span>
            <span className="w-10 shrink-0 text-[10px] tabular-nums">
              {row.l !== null ? row.l.toFixed(3) : "none"}
            </span>
            <span className="w-12 shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {row.delta !== null
                ? `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(3)}`
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Every value of one ramp plotted on the black-to-white line: the hole and the
 *  crush are geometry, not opinion, so they belong on a ruler. */
function Spectrum({ ramp }: { ramp: Ramp }) {
  const plot = (block: Record<string, string>) =>
    Object.entries(block)
      .map(([token, value]) => ({ token, l: lOf(value, block) }))
      .filter((t): t is { token: string; l: number } => t.l !== null);
  const light = plot(ramp.light);
  const dark = plot(ramp.dark);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium">{ramp.name}</p>
      <div className="relative h-7 rounded-sm bg-[linear-gradient(to_right,oklch(0_0_0),oklch(1_0_0))]">
        {light.map((t) => (
          <span
            key={`l-${t.token}`}
            title={`${t.token} ${t.l.toFixed(3)}`}
            className="absolute top-0 h-3.5 w-px bg-[oklch(0.62_0.22_330)]"
            style={{ left: `${t.l * 100}%` }}
          />
        ))}
        {dark.map((t) => (
          <span
            key={`d-${t.token}`}
            title={`${t.token} ${t.l.toFixed(3)}`}
            className="absolute bottom-0 h-3.5 w-px bg-[oklch(0.72_0.15_252)]"
            style={{ left: `${t.l * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── The board ──────────────────────────────────────────────────────────── */

export function PaletteBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [rampId, setRampId] = useState<RampId>("a");
  const [accentId, setAccentId] = useState<AccentId>("flare");
  const [accentGround, setAccentGround] = useState<"cinema" | "paper">(
    "cinema",
  );
  const [panelSingle, setPanelSingle] = useState(true);

  const ramp = RAMP_BY_ID[rampId];
  const accent = ACCENT_BY_ID[accentId];
  const desktop = mode === "desktop";
  const h = (d: number, p: number) => (desktop ? d : p);

  return (
    <div className="flex flex-col gap-10 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {QUESTION}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Ramp"
          options={RAMPS.map((r) => ({ id: r.id, label: r.label }))}
          value={rampId}
          onChange={setRampId}
        />
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop 1440" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm font-semibold">{ramp.name}</p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          {ramp.thesis}
        </p>
        <ul className="mt-2.5 space-y-1">
          {ramp.moves.map((m) => (
            <li key={m} className="text-xs text-muted-foreground">
              {m}
            </li>
          ))}
          <li className="text-xs text-muted-foreground italic">
            The trade: {ramp.trade}
          </li>
        </ul>
      </div>

      <Row
        n="01"
        name="The ladder, and where it is empty"
        reading="Every value of each set on the black-to-white line: light above, dark below. Today's shows the whole system at a glance, a crowd at each end and a 0.455 hole in the middle where 37 call sites reach for a step by dimming the one above it."
      >
        <div className="space-y-2.5">
          {RAMPS.map((r) => (
            <Spectrum key={r.id} ramp={r} />
          ))}
        </div>
        <div
          className={cn(
            "mt-2 grid gap-3",
            desktop ? "grid-cols-4" : "grid-cols-2",
          )}
        >
          {RAMPS.map((r) => (
            <Ladder key={`${r.id}-light`} ramp={r} tone="light" />
          ))}
          {RAMPS.map((r) => (
            <Ladder key={`${r.id}-dark`} ramp={r} tone="dark" />
          ))}
        </div>
      </Row>

      <Row
        n="02"
        name="Three darks, or one"
        reading="Cinema, the app, the footer's ink and the media canvas, side by side for each set. Today they are four numbers nobody wrote a reason for. A and C make them steps of one ladder and send the canvas deeper than any room; B makes them one room and deletes the cinema override."
      >
        <div
          className={cn("grid gap-4", desktop ? "grid-cols-4" : "grid-cols-2")}
        >
          {RAMPS.map((r) => (
            <div key={r.id} className="space-y-1.5">
              <p className="text-[11px] font-medium">{r.label}</p>
              <div className="flex h-24 overflow-hidden rounded-lg border border-border">
                {rooms(r).map((room) => (
                  <div
                    key={room.name}
                    className="flex flex-1 items-end justify-center pb-1.5"
                    style={{ background: room.value }}
                  >
                    <span className="text-[9px] text-white/70">
                      {room.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Row>

      <Row
        n="03"
        name="A marketing chapter, on cinema"
        reading="Three cards on the dark room: one with a photograph, one with none (the case rule 1 was rewritten for), one all type. Watch the card edge, the panel in the card foot, and whether the secondary button is a surface or a rumour."
      >
        <Frame
          ramp={ramp}
          ground="cinema"
          mode={mode}
          height={h(800, 980)}
          label={`cinema · ${ramp.label}`}
        >
          <MarketingChapter mode={mode} />
        </Frame>
      </Row>

      <Row
        n="04"
        name="The same chapter, on paper"
        reading="The light ramp's whole argument: today the card is 0.007 above the page, so it is its hairline and nothing else. A and C give it a real lift by dropping the page; B keeps the page and makes the ring do the work."
      >
        <Frame
          ramp={ramp}
          ground="paper"
          mode={mode}
          height={h(800, 980)}
          label={`paper · ${ramp.label}`}
        >
          <MarketingChapter mode={mode} />
        </Frame>
      </Row>

      <Row
        n="05"
        name="The app, in both modes"
        reading="Real event cards with real covers, the storage track, the chips and a card with a foot. The media is the colour here, so the ramp's job is to disappear behind it and still hold the chrome together."
      >
        <div className="flex flex-col gap-4">
          <Frame
            ramp={ramp}
            ground="app-dark"
            mode={mode}
            height={h(760, 900)}
            label={`the app, dark · ${ramp.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
          <Frame
            ramp={ramp}
            ground="app-light"
            mode={mode}
            height={h(760, 900)}
            label={`the app, light · ${ramp.label}`}
          >
            <AppDashboard mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="06"
        name="A menu over a card"
        reading="The specimen today's dark ramp fails: ground 0.14, card 0.21 at 62 percent, panel 0.245, menu 0.23, hover 0.25. Five surfaces inside 0.11, two of them the wrong way round. Flip to A and the same frame has a ladder."
      >
        <Frame
          ramp={ramp}
          ground="app-dark"
          mode={mode}
          height={h(560, 700)}
          label={`the stack, dark · ${ramp.label}`}
        >
          <SurfaceStack mode={mode} />
        </Frame>
      </Row>

      <Row
        n="07"
        name="The ink leaf"
        reading="The footer's set, rendered the way it ships: on a paper page, so the gap shows. Today .surface-ink declares no --card and no --popover, which is why the card and the menu at the foot of this frame are near white on a dark slab. Every candidate completes the set."
      >
        <Frame
          ramp={ramp}
          ground="ink"
          mode={mode}
          height={h(640, 820)}
          label={`ink on a paper page · ${ramp.label}`}
        >
          <InkLeaf mode={mode} />
        </Frame>
      </Row>

      <Row
        n="08"
        name="The panel"
        reading="The set-apart block of bible 16, on its real sites. It ships at six alphas of --muted (20, 30, 40, 50, 60 and 70 across 45 uses), a token that also does hover, and on paper 40 percent over 0.99 is a one percent step. The toggle swaps every one of them for the ruled ramp's --muted at full strength."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="The panel"
            options={[
              { id: "single", label: "One token" },
              { id: "alphas", label: "Today's alphas" },
            ]}
            value={panelSingle ? "single" : "alphas"}
            onChange={(v) => setPanelSingle(v === "single")}
          />
          <p className="text-[11px] text-muted-foreground">
            {PANEL_ALPHAS.map((a) => `${a.alpha} percent x${a.uses}`).join(
              ", ",
            )}
          </p>
        </div>
        <Frame
          ramp={ramp}
          ground="paper"
          mode={mode}
          height={h(760, 940)}
          label={`paper · ${ramp.label} · ${panelSingle ? "one token" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={panelSingle} />
        </Frame>
        <Frame
          ramp={ramp}
          ground="app-dark"
          mode={mode}
          height={h(760, 940)}
          label={`the app, dark · ${ramp.label} · ${panelSingle ? "one token" : "today's alphas"}`}
        >
          <PanelBand mode={mode} single={panelSingle} />
        </Frame>
      </Row>

      <Row
        n="09"
        name="The accent, by the job it does"
        reading="Rule 1 gives the accent a mandate where there is no media, so the first question is not which hue but which job. Today one token does three: identity, attention, and standing in for a photograph. The state hues sit under the wall so a collision is visible rather than argued."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Accent"
            options={ACCENTS.map((a) => ({ id: a.id, label: a.label }))}
            value={accentId}
            onChange={setAccentId}
          />
          <Toggle
            ariaLabel="Ground"
            options={[
              { id: "cinema" as const, label: "Cinema" },
              { id: "paper" as const, label: "Paper" },
            ]}
            value={accentGround}
            onChange={setAccentGround}
          />
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold">{accent.name}</p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            {accent.why}
          </p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            The risk: {accent.risk}
          </p>
        </div>
        <div style={accentStyle(accent, accentGround === "cinema")}>
          <Frame
            ramp={ramp}
            ground={accentGround}
            mode={mode}
            height={h(900, 1180)}
            label={`${accentGround} · ${ramp.label} · ${accent.label}`}
          >
            <AccentWall mode={mode} />
          </Frame>
        </div>
      </Row>

      <Row
        n="10"
        name="The ruling, as a paste"
        reading="The selected candidate as the block that lands in globals.css and marketing.css. The Record in docs/tracks/palette.md carries all three, so a ruling is a few words and the Orchestrator pastes rather than rewrites."
      >
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-[11px] leading-relaxed whitespace-pre tabular-nums">
          {tokenBlock(ramp)}
        </pre>
      </Row>

      <BoardMeta
        question={QUESTION}
        candidates={RAMPS.filter((r) => r.id !== "today").map((r) => ({
          name: r.name,
          rationale: r.thesis,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}
