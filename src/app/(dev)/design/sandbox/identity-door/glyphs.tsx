"use client";

import type { CSSProperties } from "react";
import { Check, type LucideIcon, Lock, Mail } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { PRIYA, SENT_PHOTO } from "./fixtures";
import { Pool, useHueVars } from "./lit";
import type { Beat, Icons } from "./world";

/**
 * THE DOOR'S ICONS AND ITS BEATS' MARKS, one component per role, so every
 * screen asks for a role and the world decides how it is drawn.
 *
 * ★ THREE ROLES MOVE ON `icons`, AND ONE NEVER DOES. A PROMISE glyph leads a
 * line of the welcome (Camera, Images; the demo's ImageUp, QrCode); a STATE
 * glyph sits inside a line (the Lock beside "Almost in"); the email row's
 * envelope names what its tap opens. A CONTROL's glyph (the back chevron,
 * the close X, the password's eye, Google, the upload's two buttons, the
 * menu's rows) is the control itself, so it wears today's in every option:
 * the design system's own rule is that an action icon is monochrome at rest.
 */

/** A promise row's leading icon: today's grey glyph, a pool, or nothing. */
export function PromiseGlyph({
  icon: Icon,
  icons,
  hue,
}: {
  icon: LucideIcon;
  icons: Icons;
  /** Which sampled hue lights it under `lit` (each row takes the next). */
  hue: 1 | 2 | 3;
}) {
  if (icons === "bare") return null;
  if (icons === "lit")
    return (
      <Pool hue={hue}>
        <Icon data-door-icon="promise" strokeWidth={1.75} />
      </Pool>
    );
  return (
    <Icon
      data-door-icon="promise"
      aria-hidden
      className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
    />
  );
}

/** A glyph inside a line, taking the lamp's colour under `lit`. */
function InlineGlyph({
  icon: Icon,
  icons,
  hue,
  className,
}: {
  icon: LucideIcon;
  icons: Icons;
  hue: 1 | 2 | 3;
  className?: string;
}) {
  const vars = useHueVars();
  if (icons === "bare") return null;
  return (
    <Icon
      data-door-icon="inline"
      aria-hidden
      className={cn(
        "shrink-0",
        icons === "lit" ? "door-glyph-lit" : "text-muted-foreground",
        className,
      )}
      style={
        icons === "lit"
          ? ({ ...vars, "--glyph-h": `var(--lit-h${hue})` } as CSSProperties)
          : undefined
      }
    />
  );
}

/** The Lock beside "Almost in" (the gate's and the password's eyebrow). */
export function LockGlyph({ icons }: { icons: Icons }) {
  return <InlineGlyph icon={Lock} icons={icons} hue={1} className="size-3" />;
}

/** The email row's envelope: hidden under 360 px, as production hides it. */
export function GhostGlyph({ icons }: { icons: Icons }) {
  return (
    <InlineGlyph
      icon={Mail}
      icons={icons}
      hue={3}
      className="size-4 max-[359px]:hidden"
    />
  );
}

/* ── the beats' marks (`beat`) ─────────────────────────────────────────── */

/**
 * THE "YOU'RE IN" MARK. Today's is `SuccessStep`'s: a check on the success
 * green. `lit` puts the same check in the album's light, the lamp's three
 * hues in one bloom; `hers` shows who got in, the initial her photographs
 * will carry, now in the colour a confirmed person wears, a check on its
 * corner.
 */
export function InMark({ beat }: { beat: Beat }) {
  const vars = useHueVars();
  if (beat === "lit")
    return (
      <span
        data-door-mark="lit"
        aria-hidden
        className="door-bloom-mark relative flex size-14 items-center justify-center rounded-full"
        style={vars}
      >
        <Check className="relative size-7" strokeWidth={2.25} />
      </span>
    );
  if (beat === "hers")
    return (
      <span data-door-mark="hers" aria-hidden className="relative">
        {/* Confirmed now, so she wears her seeded colour: an identity, proven
            (the unconfirmed guest's avatar carries none). */}
        <Avatar seed="id-priya" className="size-14 shadow-lift">
          <AvatarFallback className="text-xl font-medium">
            {PRIYA.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-popover">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </span>
    );
  return (
    <span
      data-door-mark="today"
      aria-hidden
      className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground"
    >
      <Check className="size-7" />
    </span>
  );
}

/**
 * THE SENT MARK, at the head of the keep screen: nothing today (the word
 * "Sent" alone), a small lit check under `lit`, and under `hers` the photo she
 * just sent, a check on its corner, which is the one thing on the screen
 * that is only hers.
 */
export function SentMark({ beat }: { beat: Beat }) {
  const vars = useHueVars();
  if (beat === "lit")
    return (
      <span
        data-door-mark="lit"
        aria-hidden
        className="door-bloom-mark relative flex size-9 shrink-0 items-center justify-center rounded-full"
        style={vars}
      >
        <Check className="relative size-4.5" strokeWidth={2.5} />
      </span>
    );
  if (beat === "hers")
    return (
      <span data-door-mark="hers" aria-hidden className="relative shrink-0">
        <span className="block size-11 overflow-hidden rounded-[var(--radius-tile)] bg-black/10 shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still: the photograph she sent */}
          <img src={SENT_PHOTO} alt="" className="size-full object-cover" />
        </span>
        <span className="absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-popover">
          <Check className="size-3" strokeWidth={3} />
        </span>
      </span>
    );
  return null;
}
