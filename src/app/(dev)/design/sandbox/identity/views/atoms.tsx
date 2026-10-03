"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { Check as CheckGlyph } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * THE STAND-INS: atoms production does not have yet, drawn wearing exactly
 * the hooks they will have, so the sheet styles the hook and the wiring builds
 * the component under it.
 *
 * ★ THE HEAD'S ATOMS ARE PRODUCTION'S NOW (`event-header`'s wiring built them:
 * `ui/shutter.tsx`, `ui/code-chip.tsx`, `ui/code-mat.tsx`, `ui/glyph-count.tsx`,
 * a Button's `on-photo` and `glass`, a Badge's `live`), so the sheets mount
 * those. ★ THE REST ARE SHADCN'S OWN NAMES for primitives this product has not
 * added (`checkbox`, `radio-group-item`, `slider`), and one of its own,
 * `radio-card` (the door's gates).
 *
 * A pinned state rides `data-demo` (`sheet/states.ts`), so a stand-in in the
 * specimen draws the very rule a cursor draws on a screen.
 */

type Demo = { demo?: string };

/** A container standing on a photograph, its photograph under a scrim. */
export function PhotoSurface({
  src,
  pos = "50% 45%",
  className,
  style,
  children,
}: {
  src: string;
  pos?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      data-surface="photo"
      className={cn("dark relative isolate overflow-hidden", className)}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover"
        style={{ objectPosition: pos }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/10 to-black/25" />
      {children}
    </div>
  );
}

/** A photograph as production's album tile draws one: its box owns the corner and the bright edge. */
export function MediaTile({
  src,
  pos = "50% 50%",
  className,
  style,
}: {
  src: string;
  pos?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      data-media-tile=""
      data-lit=""
      className={cn("relative overflow-hidden bg-black/10", className)}
      style={{ borderRadius: "var(--radius-tile)", ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
      <img
        src={src}
        alt=""
        className="size-full object-cover"
        style={{ objectPosition: pos }}
      />
    </div>
  );
}

/** A check: shadcn's `checkbox`, the box and its indicator. */
export function Check({
  checked: initial = false,
  label,
  demo,
  disabled,
  invalid,
}: Demo & {
  checked?: boolean;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-invalid={invalid || undefined}
      data-slot="checkbox"
      data-state={checked ? "checked" : "unchecked"}
      data-demo={demo}
      disabled={disabled}
      tabIndex={demo ? -1 : undefined}
      onClick={() => setChecked((c) => !c)}
    >
      <span data-slot="checkbox-indicator">
        <CheckGlyph aria-hidden />
      </span>
    </button>
  );
}

/** A radio: shadcn's `radio-group-item`, one of a group the caller holds. */
export function Radio({
  checked,
  label,
  onPick,
  demo,
  disabled,
}: Demo & {
  checked: boolean;
  label: string;
  onPick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      data-slot="radio-group-item"
      data-state={checked ? "checked" : "unchecked"}
      data-demo={demo}
      disabled={disabled}
      tabIndex={demo ? -1 : undefined}
      onClick={onPick}
    >
      <span data-slot="radio-group-indicator" />
    </button>
  );
}

/** A slider: shadcn's `slider`, its track, range and thumb; a press or a drag moves it. */
export function Slider({
  value: initial,
  label,
  demo,
  disabled,
}: Demo & { value: number; label: string; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  const box = useRef<HTMLSpanElement | null>(null);
  const move = useCallback((x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setValue(
      Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * 100),
    );
  }, []);
  return (
    <span
      ref={box}
      data-slot="slider"
      data-disabled={disabled ? "" : undefined}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX);
      }}
    >
      <span data-slot="slider-track">
        <span data-slot="slider-range" style={{ width: `${value}%` }} />
      </span>
      <span
        role="slider"
        tabIndex={demo || disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        data-slot="slider-thumb"
        data-demo={demo}
        style={{ left: `${value}%` }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setValue((v) => Math.min(100, v + 5));
          if (e.key === "ArrowLeft") setValue((v) => Math.max(0, v - 5));
        }}
      />
    </span>
  );
}

/** A radio card: a choice with its words, the door's gates as an atom. */
export function RadioCard({
  checked,
  title,
  line,
  onPick,
  demo,
}: Demo & {
  checked: boolean;
  title: string;
  line: string;
  onPick?: () => void;
}) {
  return (
    <div
      data-slot="radio-card"
      data-state={checked ? "checked" : "unchecked"}
      data-demo={demo}
      className="flex items-start gap-2.5 px-3 py-2.5"
      onClick={onPick}
    >
      <Radio checked={checked} label={title} />
      <span className="min-w-0 flex-1">
        <span
          data-slot="radio-card-title"
          className="block text-sm font-medium"
        >
          {title}
        </span>
        <span className="block text-caption text-pretty text-muted-foreground">
          {line}
        </span>
      </span>
    </div>
  );
}
