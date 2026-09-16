"use client";

import Image from "next/image";
import { Bell, Check, QrCode } from "lucide-react";

import { GalleryFrame } from "@/components/marketing/frames";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { ScopedTokens } from "./catalog";
import {
  ACCENT_BY_ID,
  accentStyle,
  jobTakesAccent,
  type Accent,
  type AccentJob,
  type Pair,
  type ReachId,
} from "./registers";

/**
 * THE ACCENT, ON THE DASHBOARD (round eight, the stepped review, 2026-09-16).
 *
 * ★ WHY THE WALL IS GONE. Rounds two to seven drew the accent as a WALL: six
 * numbered job rows, each rendering "none" beside the palette's own hue, 1,740
 * pixels tall on a 1440 stage. That shape existed because the board could only
 * show one state at a time, so the comparison had to be built into the
 * specimen. The stepped review draws every option as a TILE on one specimen, so
 * the comparison is between the tiles now and the specimen only has to be one
 * honest screen. A wall inside a tile would be unreadable anyway.
 *
 * ★ WHAT ONE SCREEN HAS TO CARRY. The reach ask hands the hue any subset of
 * three jobs, so all three have to be visible in one frame or its tiles differ
 * by nothing:
 *   IDENTITY        the mark (shared/logo.tsx:35, the one splash rule 1 allows).
 *   ATTENTION       the primary action, the notification badge, the wizard's
 *                   step pips, the chosen preset, the live dot
 *                   (notification-bell.tsx, create-event-wizard.tsx,
 *                   qr-preset-picker.tsx, the event card's pip).
 *   MEDIA STAND-IN  the frames family, where a wireframe stands in for a
 *                   photograph nobody has taken (marketing/frames/*).
 *
 * The stand-in is a MARKETING surface and everything else here is the app,
 * which is the one dishonesty a single screen cannot avoid. It is not papered
 * over: the frame is captioned as a marketing frame, so nobody reads it as
 * something the dashboard draws.
 *
 * ★ AND BOTH SIDES ARE HERE, because an accent is declared once and worn in
 * both modes. The room carries the screen; a strip under it carries the same
 * lockup on the paper, which is enough to catch a hue that only works on black.
 *
 * ★ NO BREAKPOINT PREFIXES IN HERE. This specimen is NOT inside a Stage, so a
 * `sm:` would read the real browser viewport while the block itself sits in a
 * tile three hundred pixels wide. Everything is fluid instead.
 */

/**
 * ★ THE HUE ARRIVES AND LEAVES, IT DOES NOT CUT. The reach ask asks WHICH
 * PLACES keep the colour, and the answer is only legible if you can see what
 * moved: press the next tile and the mark fades to near-black while the badge
 * holds its teal, which is the ruling, drawn. 200ms on the emphasis curve, and
 * a colour fade only, so nothing shifts position.
 *
 * `:not(button)` is load-bearing. The production Button carries its own
 * `transition-all` for the press scale, and a descendant rule would replace it
 * with colours alone and cost a real component its press feedback. It needs no
 * help anyway: `transition-all` already covers the background it paints from
 * `var(--brand)`.
 */
const FADE =
  "[&_*:not(button)]:transition-colors [&_*:not(button)]:duration-200 [&_*:not(button)]:ease-emphasis motion-reduce:[&_*]:transition-none";

/**
 * One job's cluster, lit or not. A job outside the ruled reach renders on INK,
 * which is exactly what the ruling lands: those call sites keep
 * `var(--primary)`.
 */
function Job({
  job,
  accent,
  reach,
  on,
  dark,
  className,
  children,
}: {
  job: AccentJob;
  accent: Accent;
  reach: ReachId;
  /** Whether the accent switch is on at all. */
  on: boolean;
  dark: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const lit = on && jobTakesAccent(job, reach);
  return (
    <span
      style={accentStyle(lit ? accent : ACCENT_BY_ID.ink, dark)}
      className={cn(FADE, className)}
    >
      {children}
    </span>
  );
}

/** The lockup, the badge and the primary action: the three the paper strip
 *  repeats, so the hue is read on white as well as on the room. */
function Chrome({
  accent,
  reach,
  on,
  dark,
}: {
  accent: Accent;
  reach: ReachId;
  on: boolean;
  dark: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <Job job="identity" accent={accent} reach={reach} on={on} dark={dark}>
        <Logo />
      </Job>
      <span className="ml-auto flex items-center gap-3">
        <Job
          job="attention"
          accent={accent}
          reach={reach}
          on={on}
          dark={dark}
          className="relative inline-flex items-center"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
            3
          </span>
        </Job>
        <Job job="attention" accent={accent} reach={reach} on={on} dark={dark}>
          {/* The production Button paints --primary; handing it --brand is
              exactly what this ruling would land, so the specimen paints the
              ruling rather than what ships. */}
          <Button
            size="sm"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
            }}
          >
            Share the link
          </Button>
        </Job>
      </span>
    </div>
  );
}

/**
 * THE DASHBOARD WEARING THE PALETTE'S DECLARED HUE, or not wearing it. The
 * whole step in one block: press a tile and this is what the site looks like.
 */
export function AccentDash({
  pair,
  accent,
  reach = "all",
  on,
}: {
  pair: Pair;
  /** The hue this palette DECLARES; the switch decides whether it is worn. */
  accent: Accent;
  reach?: ReachId;
  on: boolean;
}) {
  const cover = marketingImage("wedding-golden").src;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <ScopedTokens pair={pair} ground="app-dark" className="space-y-4 p-4">
        <Chrome accent={accent} reach={reach} on={on} dark />

        <div className="grid grid-cols-2 gap-3">
          <figure className="min-w-0 space-y-1.5">
            <span className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-tile)]">
              <Image
                src={cover}
                alt=""
                fill
                sizes="320px"
                className="object-cover"
              />
              <span className="absolute top-1.5 left-1.5 flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1 text-black">
                <QrCode className="size-3.5" aria-hidden />
              </span>
            </span>
            <figcaption className="flex items-center gap-1.5 truncate text-xs">
              <Job
                job="attention"
                accent={accent}
                reach={reach}
                on={on}
                dark
                className="inline-flex"
              >
                <span className="size-2 rounded-full bg-brand" />
              </Job>
              Ollie turns 30, live
            </figcaption>
          </figure>

          <figure className="min-w-0 space-y-1.5">
            <Job
              job="stand-in"
              accent={accent}
              reach={reach}
              on={on}
              dark
              className="block"
            >
              <GalleryFrame />
            </Job>
            <figcaption className="truncate text-xs text-muted-foreground">
              A marketing frame: no photograph yet
            </figcaption>
          </figure>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Job
            job="attention"
            accent={accent}
            reach={reach}
            on={on}
            dark
            className="flex items-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                  i === 1
                    ? "bg-brand text-brand-foreground"
                    : i < 1
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
            ))}
          </Job>
          <span className="text-xs text-muted-foreground">
            Step 2 of 3, your code
          </span>
          <Job
            job="attention"
            accent={accent}
            reach={reach}
            on={on}
            dark
            className="relative ml-auto flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-brand"
          >
            <span className="size-4 rounded-sm bg-foreground/80" />
            <span className="absolute top-0.5 right-0.5 rounded-full bg-brand p-0.5 text-brand-foreground">
              <Check className="size-2.5" />
            </span>
          </Job>
        </div>
      </ScopedTokens>

      <ScopedTokens
        pair={pair}
        ground="app-light"
        className="space-y-2 border-t border-border p-4"
      >
        <p className="text-[11px] text-muted-foreground">
          The same declaration on the light side
        </p>
        <Chrome accent={accent} reach={reach} on={on} dark={false} />
      </ScopedTokens>
    </div>
  );
}
