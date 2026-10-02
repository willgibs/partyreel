"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Check as CheckGlyph,
  ImageUp,
  type LucideIcon,
  QrCode,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { buttonVariants } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { formatCount } from "@/lib/format/count";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { JOIN_URL } from "../fixtures";

/**
 * THE STAND-INS: atoms production does not have yet, drawn wearing exactly
 * the hooks they will have, so the sheet styles the hook and the wiring builds
 * the component under it.
 *
 * ★ THE HEAD'S ATOMS ARE THE ATOM CONTRACT'S (`header-wiring` builds them in
 * `src/components/ui/` at the same time): `data-slot="shutter"` with
 * `data-state` and `--progress`, `data-surface="photo"`, a Button's
 * `on-photo` and `glass` variants, `code-mat`, `code-chip`, `glyph-count` and
 * a Badge's `live`. ★ THE REST ARE SHADCN'S OWN NAMES for primitives this
 * product has not added (`checkbox`, `radio-group-item`, `slider`), and one
 * of its own, `radio-card` (the door's gates) and `empty` (the one way
 * "nothing here yet" is drawn).
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
      className={cn("relative isolate overflow-hidden", className)}
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

/** The white primary on a photograph: a Button's `on-photo` variant. */
export function OnPhotoButton({
  size = "default",
  children,
  demo,
  busy,
  disabled,
}: Demo & {
  size?: "sm" | "default" | "lg" | "cta";
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-slot="button"
      data-variant="on-photo"
      data-size={size}
      data-demo={demo}
      aria-busy={busy || undefined}
      disabled={disabled}
      tabIndex={demo ? -1 : undefined}
      className={buttonVariants({ size })}
    >
      {children}
    </button>
  );
}

/** The glass round on a photograph: a Button's `glass` variant at an icon size. */
export function GlassButton({
  icon: Icon,
  label,
  size = "icon-lg",
  demo,
}: Demo & { icon: LucideIcon; label: string; size?: "icon" | "icon-lg" }) {
  return (
    <button
      type="button"
      data-slot="button"
      data-variant="glass"
      data-size={size}
      data-demo={demo}
      aria-label={label}
      tabIndex={demo ? -1 : undefined}
      className={cn(buttonVariants({ size }), GLASS)}
    >
      <Icon />
    </button>
  );
}

/** The round Add: idle, sending (its ring the progress) or done. */
export function Shutter({
  state = "idle",
  progress = 0,
  demo,
}: Demo & { state?: "idle" | "sending" | "done"; progress?: number }) {
  return (
    <button
      type="button"
      data-slot="shutter"
      data-state={state}
      data-demo={demo}
      tabIndex={demo ? -1 : undefined}
      aria-label={
        state === "sending"
          ? `Add photos, sending, ${Math.round(progress * 100)} percent`
          : state === "done"
            ? "Add photos, all sent"
            : "Add photos"
      }
      style={{ "--progress": progress } as CSSProperties}
    >
      {state === "done" ? <CheckGlyph strokeWidth={2.5} /> : <ImageUp />}
    </button>
  );
}

/** The code on its white mat: a real, scannable code. */
export function CodeMat({ px = 112 }: { px?: number }) {
  return (
    <span data-slot="code-mat" aria-label="The event's code">
      <StyledQr value={JOIN_URL} size={px} style={resolveQrPreset("classic")} />
    </span>
  );
}

/** The code as a chip, where a head has no room for a scannable one. */
export function CodeChip({ demo }: Demo) {
  return (
    <button
      type="button"
      data-slot="code-chip"
      data-demo={demo}
      aria-label="Show the code"
      tabIndex={demo ? -1 : undefined}
    >
      <QrCode aria-hidden />
    </button>
  );
}

/** An icon and a number, its words on hover and a tap. */
export function GlyphCount({
  icon: Icon,
  n,
  words,
  demo,
  open,
}: Demo & { icon: LucideIcon; n: number; words: string; open?: boolean }) {
  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-slot="glyph-count"
          data-demo={demo}
          tabIndex={demo ? -1 : undefined}
        >
          <Icon aria-hidden />
          <span data-n="">{formatCount(n)}</span>
          <span className="sr-only">{` ${words}`}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{`${formatCount(n)} ${words}`}</TooltipContent>
    </Tooltip>
  );
}

/** The live mark: a Badge's `live` variant. */
export function Live({ children = "Live" }: { children?: ReactNode }) {
  return (
    <span
      data-slot="badge"
      data-variant="live"
      className={badgeVariants({ variant: "secondary" })}
    >
      {children}
    </span>
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

/** The one empty place: a glyph, a title, a line and an action. */
export function Empty({
  icon: Icon,
  title,
  line,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  line: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="empty" className={className}>
      <span data-slot="empty-glyph" aria-hidden>
        <Icon />
      </span>
      <span data-slot="empty-copy">
        <span data-slot="empty-title">{title}</span>
        <span data-slot="empty-line">{line}</span>
      </span>
      {action ? <span data-slot="empty-action">{action}</span> : null}
    </div>
  );
}
