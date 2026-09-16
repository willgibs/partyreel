"use client";

import { SelectTable } from "@/components/lab";

import {
  alphaOf,
  DARK_LADDER,
  DARKS,
  keepsCinemaOverride,
  keepsSlabRegister,
  LIGHT_LADDER,
  LIGHTS,
  lOf,
  RECOMMENDATION,
  type DarkId,
  type LightId,
  type Pair,
  type TokenMap,
} from "./registers";
import { StateRow } from "./specimens";

/**
 * THE LADDERS, THE RULER AND THE TWO TABLES OF SETS (rounds one to four, moved
 * out of board.tsx at the migration wave, 2026-09-15).
 *
 * Nothing in the argument changed: the same six darks, the same five lights, the
 * same oklab ruler, the same measured deltas. What changed is the decision
 * surface. Round four printed two `SetCard`s, one per side, showing only the set
 * the dock was already on, which meant comparing two darks was a press, a
 * scroll and a memory test. The kit's `SelectTable` puts all six in one table
 * with their moves, their trade and what each word already decides, and a row
 * IS the dock control: clicking one sets the board's state.
 */

const TICK_LIGHT = "oklch(0.62 0.22 330)";
const TICK_DARK = "oklch(0.72 0.15 252)";

/** Every value of a block plotted on the black-to-white line: the hole and the
 *  crush are geometry, not opinion, so they belong on a ruler. */
export function Spectrum({
  name,
  blocks,
}: {
  name: string;
  blocks: { block: TokenMap; color: string }[];
}) {
  // A white veil (a dark border at 12 percent) has a lightness of 1 and no place
  // on a ruler of surfaces, so it is dropped rather than plotted at the far
  // right where it would read as a surface nobody can see.
  const plot = (block: TokenMap) =>
    Object.entries(block)
      .map(([token, value]) => ({
        token,
        l: lOf(value, block),
        veil: alphaOf(value) !== null && (lOf(value, block) ?? 0) >= 0.99,
      }))
      .filter(
        (t): t is { token: string; l: number; veil: boolean } =>
          t.l !== null && !t.veil,
      );
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium">{name}</p>
      {/* The ruler interpolates IN OKLAB, so a tick's position is its lightness.
          In sRGB the same gradient puts L 0.6 at the halfway mark and the whole
          reading would be a lie. */}
      <div
        className="relative h-7 rounded-sm"
        style={{
          background:
            "linear-gradient(to right in oklab, oklch(0 0 0), oklch(1 0 0))",
        }}
      >
        {blocks.map(({ block, color }, bi) =>
          plot(block).map((t) => (
            <span
              key={`${bi}-${t.token}`}
              title={`${t.token} ${t.l.toFixed(3)}`}
              className={
                bi === 0
                  ? "absolute top-0 h-3.5 w-px"
                  : "absolute bottom-0 h-3.5 w-px"
              }
              style={{ left: `${t.l * 100}%`, background: color }}
            />
          )),
        )}
      </div>
    </div>
  );
}

/** One set's surface ladder with every step's lightness and its distance from
 *  the step above it, and the six state hues under it, on that set in that
 *  mode. */
export function Ladder({
  block,
  label,
  sub,
  tone,
}: {
  block: TokenMap;
  label: string;
  sub: string;
  tone: "light" | "dark";
}) {
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
      alpha: value ? alphaOf(value) : null,
      delta: l !== null && above !== undefined ? l - above : null,
    };
  });
  return (
    // The real theme CLASS as well as the candidate's inline block, so the state
    // hues under the table are the ones that ship in this mode: they are not
    // part of any candidate, and a dark chip judged against a light
    // `--destructive` would be a lie.
    <div
      data-pal-swap
      className={`${tone === "dark" ? "dark" : "surface-paper"} rounded-lg border border-border bg-background p-3 text-foreground`}
      style={block as React.CSSProperties}
    >
      <p className="mb-2 truncate text-[11px] font-medium">
        {label}
        <span className="ml-1.5 font-normal text-muted-foreground">{sub}</span>
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.token} className="flex items-center gap-1.5">
            <span
              className="size-5 shrink-0 rounded-sm border border-border"
              style={{
                background: row.value ? `var(${row.token})` : "transparent",
                backgroundImage: row.value
                  ? undefined
                  : "repeating-linear-gradient(45deg, var(--muted-foreground) 0 1px, transparent 1px 4px)",
              }}
            />
            <span className="w-[86px] shrink-0 truncate text-[10px] text-muted-foreground">
              {row.role}
              {row.alpha !== null ? ` at ${Math.round(row.alpha * 100)}%` : ""}
            </span>
            <span className="w-10 shrink-0 text-[10px] tabular-nums">
              {row.l !== null ? row.l.toFixed(3) : "none"}
            </span>
            <span className="w-11 shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {row.delta !== null
                ? `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(3)}`
                : ""}
            </span>
          </div>
        ))}
      </div>
      {/* A set is not finished until the six colours it must never be confused
          with still read on it. */}
      <div className="mt-2.5 border-t border-border pt-2.5">
        <StateRow compact />
      </div>
    </div>
  );
}

/** A set's moves and its trade, as one cell of the table. */
function Moves({ moves, trade }: { moves: string[]; trade: string }) {
  return (
    <span className="block max-w-[34ch] leading-snug">
      {moves.map((m) => (
        <span key={m} className="block">
          {m}
        </span>
      ))}
      <span className="block text-muted-foreground italic">
        The trade: {trade}
      </span>
    </span>
  );
}

/**
 * THE SIX DARKS, AS A TABLE THE ROW IS THE CONTROL OF.
 *
 * ★ WHAT A WORD ALREADY DECIDES IS A COLUMN, not a footnote. Picking a dark
 * also settles whether marketing keeps its own room and whether the slab stays
 * a register at all, and a reviewer who has to derive that from the blocks will
 * derive it wrong. Both are read off the set rather than written down twice.
 */
export function DarkTable({
  value,
  onChange,
}: {
  value: DarkId;
  onChange: (id: DarkId) => void;
}) {
  return (
    <SelectTable
      caption="Click a row to put the board on that dark set. The dock carries the same six."
      columns={["The dark set", "What it moves", "What the word already decides"]}
      value={value}
      onChange={onChange}
      rows={DARKS.map((d) => ({
        id: d.id,
        recommended: d.id === RECOMMENDATION.dark,
        note: d.thesis,
        cells: [
          d.name,
          <Moves key="moves" moves={d.moves} trade={d.trade} />,
          <span key="decides" className="block max-w-[38ch] leading-snug">
            <span className="block">
              <span className="text-foreground">The rooms: </span>
              {d.decides.rooms}
            </span>
            <span className="block">
              <span className="text-foreground">The well: </span>
              {d.decides.well}
            </span>
            <span className="block text-muted-foreground">
              {keepsCinemaOverride(d)
                ? "Keeps the cinema override in marketing.css, so marketing and the app stay two values."
                : "Deletes the cinema override in marketing.css: the room is cinema."}
            </span>
            <span className="block text-muted-foreground">
              {keepsSlabRegister(d)
                ? "Keeps the slab as a register of its own, lifted above the room."
                : "Collapses the slab into the room: one dark ground, no second register."}
            </span>
          </span>,
        ],
      }))}
    />
  );
}

/** The five lights, the same way, with the mat's own step printed: the light
 *  half of the ruling is mostly a question about how deep the set-apart ground
 *  sits under the page. */
export function LightTable({
  value,
  onChange,
}: {
  value: LightId;
  onChange: (id: LightId) => void;
}) {
  return (
    <SelectTable
      caption="Click a row to put the board on that light set. The two halves are ruled independently."
      columns={["The light set", "What it moves", "What the word already decides"]}
      value={value}
      onChange={onChange}
      rows={LIGHTS.map((li) => {
        const matL = lOf(li.mat["--background"] ?? "", li.paper);
        const paperL = lOf(li.paper["--background"] ?? "", li.paper);
        const step =
          matL === null || paperL === null ? null : paperL - matL;
        return {
          id: li.id,
          recommended: li.id === RECOMMENDATION.light,
          note: li.thesis,
          cells: [
            li.name,
            <Moves key="moves" moves={li.moves} trade={li.trade} />,
            <span key="decides" className="block max-w-[38ch] leading-snug">
              <span className="block">
                <span className="text-foreground">The mat: </span>
                {li.decides.mat}
              </span>
              <span className="block text-muted-foreground tabular-nums">
                {matL === null || paperL === null
                  ? "No mat value declared."
                  : `The mat sits at ${matL.toFixed(3)} under a page at ${paperL.toFixed(3)}, a step of ${step!.toFixed(3)}.`}
              </span>
            </span>,
          ],
        };
      })}
    />
  );
}

/** Both rulers and both tables of ladders, which is the reading the two asks
 *  are made from. `resolve` is the board's one resolver, so a ladder here can
 *  never show a step the dock is not claiming. */
export function LadderRulers({
  resolve,
  pair,
}: {
  resolve: (p: Pair) => Pair;
  pair: Pair;
}) {
  return (
    <>
      <div className="space-y-2.5">
        {DARKS.map((d) => {
          const p = resolve({ dark: d, light: pair.light });
          return (
            <Spectrum
              key={d.id}
              name={`${d.name} · the room above, the slab below`}
              blocks={[
                { block: p.dark.room, color: TICK_DARK },
                { block: p.dark.slab, color: TICK_LIGHT },
              ]}
            />
          );
        })}
        {LIGHTS.map((li) => {
          const p = resolve({ dark: pair.dark, light: li });
          return (
            <Spectrum
              key={li.id}
              name={`${li.name} · the paper above, the mat below`}
              blocks={[
                { block: p.light.paper, color: TICK_LIGHT },
                { block: { ...p.light.paper, ...p.light.mat }, color: TICK_DARK },
              ]}
            />
          );
        })}
      </div>
      {/* The board's OWN chrome keys off the real viewport, not the canvas
          control: these tables are not inside a Stage, so a breakpoint is
          honest here, and six 77px columns at 375 is unreadable. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DARKS.map((d) => {
          const p = resolve({ dark: d, light: pair.light });
          return (
            <Ladder
              key={d.id}
              block={p.dark.room}
              label={d.label}
              sub="the room"
              tone="dark"
            />
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIGHTS.map((li) => {
          const p = resolve({ dark: pair.dark, light: li });
          return (
            <Ladder
              key={li.id}
              block={p.light.paper}
              label={li.label}
              sub="the paper"
              tone="light"
            />
          );
        })}
      </div>
    </>
  );
}
