"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SpecimenSkin } from "./entry";
import { CopyLine } from "./specimen";

/**
 * THE CONFIG PANEL (the gallery round, 2026-09-12): ONE reusable knob kit, so
 * a component's live configuration costs a declaration rather than a board.
 *
 * The precedent is two board-local panels, the register slider in
 * sandbox/glow-doctrine-variants.tsx and the style picker in
 * reel-parity/parity.tsx: both good, both trapped in their board. This is the
 * same idiom promoted: declare knobs, get a panel, a live specimen, and the
 * JSX line the knobs describe, which is the part an agent actually wants. The
 * panel's own chrome is hand-rolled rather than built from production
 * primitives on purpose, so nothing in the panel can be mistaken for a
 * specimen of ours.
 */

export type Knob =
  | {
      kind: "select";
      prop: string;
      label?: string;
      options: string[];
      value: string;
    }
  | { kind: "toggle"; prop: string; label?: string; value: boolean }
  | { kind: "text"; prop: string; label?: string; value: string }
  | {
      kind: "range";
      prop: string;
      label?: string;
      value: number;
      min: number;
      max: number;
      step: number;
      unit?: string;
    };

export type KnobValues = Record<string, string | number | boolean>;

export type PlaygroundDef = {
  /** The component name in the generated line. */
  name: string;
  knobs: Knob[];
  render: (v: KnobValues) => React.ReactNode;
  /**
   * The value each prop takes when it is left off. A knob sitting on its
   * default drops out of the generated line, so the line shows the shortest
   * call that produces what is on screen.
   */
  defaults?: KnobValues;
  /** Say the line yourself when the component is not called as one tag. */
  code?: (v: KnobValues) => string;
  skin?: SpecimenSkin;
  /** Classes for the specimen well (a ground for a lamp, a height for a band). */
  wellClassName?: string;
};

/* ─────────────────────────── the generated line ─────────────────────────── */

function literal(v: string | number | boolean): string {
  if (typeof v === "string") return `"${v}"`;
  return `{${String(v)}}`;
}

export function codeFor(def: PlaygroundDef, values: KnobValues): string {
  if (def.code) return def.code(values);
  const defaults = def.defaults ?? {};
  const props: string[] = [];
  let children: string | null = null;
  for (const knob of def.knobs) {
    const v = values[knob.prop];
    if (knob.prop === "children") {
      children = String(v);
      continue;
    }
    if (v === defaults[knob.prop]) continue;
    if (typeof v === "boolean")
      props.push(v ? knob.prop : `${knob.prop}={false}`);
    else props.push(`${knob.prop}=${literal(v)}`);
  }
  const head = [def.name, ...props].join(" ");
  return children === null || children === ""
    ? `<${head} />`
    : `<${head}>${children}</${def.name}>`;
}

/* ────────────────────────────── the panel ──────────────────────────────── */

const initial = (knobs: Knob[]): KnobValues =>
  Object.fromEntries(knobs.map((k) => [k.prop, k.value]));

/**
 * The panel itself: the live specimen on the left, the knobs on the right, the
 * line the knobs describe under them. Given a def, this is the whole surface.
 */
export function ConfigPanel({ def }: { def: PlaygroundDef }) {
  const start = useMemo(() => initial(def.knobs), [def.knobs]);
  const [values, setValues] = useState<KnobValues>(start);
  const dirty = def.knobs.some((k) => values[k.prop] !== start[k.prop]);
  const set = (prop: string, v: string | number | boolean) =>
    setValues((prev) => ({ ...prev, [prop]: v }));

  const stage =
    def.skin === "marketing" ? (
      <div data-mkt="">{def.render(values)}</div>
    ) : (
      def.render(values)
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-medium">Configure</p>
        <button
          type="button"
          onClick={() => setValues(start)}
          disabled={!dirty}
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-[color,opacity] duration-150",
            dirty
              ? "text-muted-foreground hover:text-foreground"
              : "pointer-events-none opacity-0",
          )}
        >
          <RotateCcw className="size-3" />
          Reset
        </button>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div
          className={cn(
            "flex min-h-36 items-center justify-center p-6",
            def.wellClassName,
          )}
        >
          {stage}
        </div>
        <div className="flex flex-col gap-3.5 border-t border-border p-4 lg:border-t-0 lg:border-l">
          {def.knobs.map((knob) => (
            <KnobRow
              key={knob.prop}
              knob={knob}
              value={values[knob.prop]}
              onChange={(v) => set(knob.prop, v)}
            />
          ))}
          <CopyLine code={codeFor(def, values)} />
        </div>
      </div>
    </div>
  );
}

function KnobRow({
  knob,
  value,
  onChange,
}: {
  knob: Knob;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const label = knob.label ?? knob.prop;

  if (knob.kind === "select") {
    const pills = knob.options.length <= 6;
    return (
      <div className="flex flex-col gap-1.5">
        <Caption>{label}</Caption>
        {pills ? (
          <div className="flex flex-wrap gap-1">
            {knob.options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onChange(o)}
                aria-pressed={o === value}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
                  o === value
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {knob.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  if (knob.kind === "toggle") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={Boolean(value)}
        className="flex items-center justify-between gap-3 text-left"
      >
        <Caption>{label}</Caption>
        <span
          className={cn(
            "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
            value ? "bg-foreground" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-3 rounded-full bg-background transition-[translate] duration-150 ease-emphasis",
              value ? "translate-x-3.5" : "translate-x-0.5",
            )}
          />
        </span>
      </button>
    );
  }

  if (knob.kind === "text") {
    return (
      <label className="flex flex-col gap-1.5">
        <Caption>{label}</Caption>
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <Caption>{label}</Caption>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {String(value)}
          {knob.unit ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={knob.min}
        max={knob.max}
        step={knob.step}
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
      />
    </label>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium">{children}</span>;
}
