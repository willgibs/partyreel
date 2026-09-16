"use client";

import { Bell, Check, PartyPopper } from "lucide-react";

import {
  AlbumFrame,
  GalleryFrame,
  PhoneFrame,
  PhoneShell,
  QrFrame,
} from "@/components/marketing/frames";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/lab";

import { StateRow } from "./specimens";
import {
  ACCENT_BY_ID,
  DECLARABLE_ACCENTS,
  accentStyle,
  jobTakesAccent,
  type Accent,
  type AccentJob,
  type ReachId,
} from "./registers";

/**
 * THE ACCENT WALL, rebuilt for round two as a COMPARISON.
 *
 * Round one put one hue on the wall at a time behind a toggle, which asks the
 * eye to remember a colour it can no longer see. Four hues cannot be ruled on
 * from memory, so every job now renders all four at once, in a row, at the size
 * the call site ships at, with the state hues at the foot of the wall rather
 * than a scroll away: the question at a 6px dot is always "can this be mistaken
 * for a state colour", and that question has to be answerable in one look.
 *
 * The grouping carries the finding: `--brand` is asked to do three unrelated
 * jobs today and one hue may not be right for all three.
 *   IDENTITY       the mark and the 404 eyebrow (is this Partyreel).
 *   ATTENTION      the badge, the wizard pip, the carousel dot, the chosen
 *                  preset (look here, you are here).
 *   MEDIA STAND-IN the frames family, where the accent stands in for a
 *                  photograph that has not been taken yet.
 *
 * Every specimen reads `--brand` / `--brand-foreground` and nothing else, which
 * is what makes the accent a two-line change rather than a sweep (theme.css:35).
 * The frames are the real production components; the small marks are copied
 * verbatim from their call sites so the sizes are honest.
 *
 * ROUND FOUR ADDS THE REACH, which is the board's own finding against itself:
 * "the accent's reach" had been an ASK for two rounds with no control anywhere
 * on the page, and round three's own rule is that a control naming an ask has
 * to move a pixel in the evidence for it. It moves pixels here. A job outside
 * the ruled reach renders on INK, which is exactly what the ruling lands (those
 * call sites keep `var(--primary)`), so the wall shows the whole answer rather
 * than the hue alone.
 *
 * ★ ROUND SEVEN CUT THE WALL IN HALF, AND THE REASON IS THE CONFIG. The hue
 * stopped being a choice on this board: every palette DECLARES one, and the
 * only question left is whether any of them is worn ("a single optional accent
 * color config per theme where I can decide if an accent color would pair
 * well", Will, 2026-09-16). So a job no longer renders four hues to be chosen
 * between; it renders TWO columns, none beside the palette's own, which is the
 * comparison the switch itself makes. Four columns of hues became two, the wall
 * lost half its height, and the four declarable hues are still read together
 * once, at the foot, against the state colours they must never be mistaken for.
 */

function HueColumn({
  accent,
  dark,
  on = true,
  children,
}: {
  accent: Accent;
  dark: boolean;
  /** False when the ruled reach leaves this job on ink. */
  on?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={accentStyle(on ? accent : ACCENT_BY_ID.ink, dark)}
      className="flex min-w-0 flex-col gap-2"
    >
      {/* min-w-0 on the specimen row as well as the column: a grid item's
          min-width is auto, so without it a specimen that ends in a truncating
          label (job 03's toast) pushes past its column and, in the 2-column
          phone wall, 8px past the stage's own edge. Measured at 375. */}
      <div className="flex min-h-14 min-w-0 items-center">{children}</div>
      <p className="truncate text-[11px] font-medium">
        {accent.id === "ink" ? "None" : accent.label}
        {on ? null : (
          <span className="ml-1 font-normal text-muted-foreground">
            outside the reach
          </span>
        )}
      </p>
    </div>
  );
}

function JobRow({
  n,
  name,
  job,
  accent,
  reach,
  question,
  where,
  dark,
  mode,
  render,
}: {
  n: string;
  name: string;
  job: AccentJob;
  /** The palette's declared hue. The row draws it beside none, always. */
  accent: Accent;
  reach: ReachId;
  question: string;
  where: string;
  dark: boolean;
  mode: Mode;
  render: (accent: Accent) => React.ReactNode;
}) {
  const desktop = mode === "desktop";
  const on = jobTakesAccent(job, reach);
  const pair = [ACCENT_BY_ID.ink, accent];
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {n}
        </span>
        <h3 className="text-sm font-semibold">{name}</h3>
        <p className="text-[11px] text-muted-foreground">{question}</p>
        {on ? null : (
          <p className="text-[11px] font-medium text-foreground">
            outside the ruled reach, so this job keeps ink
          </p>
        )}
      </div>
      <div
        className={cn("grid gap-5", desktop ? "grid-cols-4" : "grid-cols-2")}
      >
        {pair.map((a) => (
          <HueColumn
            key={a.id}
            accent={a}
            dark={dark}
            on={a.id === "ink" ? true : on}
          >
            {render(a)}
          </HueColumn>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{where}</p>
    </section>
  );
}

export function AccentWall({
  mode,
  dark,
  accent,
  reach = "all",
  on,
}: {
  mode: Mode;
  dark: boolean;
  /** The palette's DECLARED hue, drawn beside none in every row. */
  accent: Accent;
  reach?: ReachId;
  /** Whether the switch is on, which is what the rest of the board is wearing. */
  on: boolean;
}) {
  const desktop = mode === "desktop";
  const framesOn = jobTakesAccent("stand-in", reach);
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        desktop ? "gap-7 px-14 py-10" : "gap-6 px-5 py-8",
      )}
    >
      <JobRow
        n="01"
        accent={accent}
        name="The three jobs an accent is for"
        job="attention"
        reach={reach}
        question="The primary action, the focus ring, the live dot. This row is the switch."
        where="ui/button.tsx (default variant), ui/input.tsx focus-visible, event-card.tsx's live pip"
        dark={dark}
        mode={mode}
        render={() => (
          <div className="flex w-full min-w-0 flex-col items-start gap-2.5">
            <Button
              size="sm"
              style={{
                background: "var(--brand)",
                color: "var(--brand-foreground)",
              }}
            >
              Share the link
            </Button>
            {/* Drawn focused. A real :focus-visible can only be on one field at
                a time, and this row exists to show two at once, so the ring is
                painted at the production 2px and 2px offset. */}
            <Input
              readOnly
              value="partyreel.com/e/9fq2"
              aria-label="The event link"
              className="h-8 w-full text-xs md:text-xs"
              style={{
                outline: "2px solid var(--brand)",
                outlineOffset: "2px",
              }}
            />
            <span className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-brand" />
              Live, 91 uploads
            </span>
          </div>
        )}
      />

      <JobRow
        n="02"
        accent={accent}
        name="Identity"
        job="identity"
        reach={reach}
        question="Is a coloured mark more us than an ink one?"
        where="shared/logo.tsx:35, the single splash of --brand allowed"
        dark={dark}
        mode={mode}
        render={() => <Logo />}
      />

      <JobRow
        n="03"
        accent={accent}
        name="Attention"
        job="attention"
        reach={reach}
        question="Look here, you are here. The job rule 1 now gives the accent."
        where="notification-bell.tsx:60 and :85, create-event-wizard.tsx:141, welcome-flow.tsx:98"
        dark={dark}
        mode={mode}
        render={() => (
          <div className="flex items-center gap-3">
            <span className="relative inline-flex">
              <Bell className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
                3
              </span>
            </span>
            <span className="flex items-center gap-1">
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
            </span>
            <span className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === 1 ? "bg-brand" : i < 1 ? "bg-foreground" : "bg-muted",
                  )}
                />
              ))}
            </span>
          </div>
        )}
      />

      <JobRow
        n="04"
        accent={accent}
        name="Attention, at size"
        job="attention"
        reach={reach}
        question="The chosen preset and the success row: the accent as a border and as an icon."
        where="qr-preset-picker.tsx:53 and :64, create-event-wizard.tsx:282"
        dark={dark}
        mode={mode}
        render={() => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-brand p-2">
              <span className="size-5 rounded-sm bg-foreground/80" />
              <span className="absolute top-1 right-1 rounded-full bg-brand p-0.5 text-brand-foreground">
                <Check className="size-2.5" />
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs">
              <PartyPopper className="size-3.5 shrink-0 text-brand" />
              <span className="truncate">Your code is live</span>
            </span>
          </div>
        )}
      />

      <JobRow
        n="05"
        accent={accent}
        name="A stand-in for media"
        job="stand-in"
        reach={reach}
        question="Roughly half the brand call sites are drawings of photographs that do not exist yet."
        where="marketing/frames/qr-frame.tsx:34, phone-frame.tsx:56 to 79, gallery-frame.tsx:29, album-frame.tsx:36"
        dark={dark}
        mode={mode}
        render={() => (
          <div className="w-full">
            <QrFrame />
          </div>
        )}
      />

      {desktop ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              06
            </span>
            <h3 className="text-sm font-semibold">The frames at full size</h3>
            {framesOn ? null : (
              <span className="text-[11px] font-medium">
                outside the ruled reach, so these keep ink
              </span>
            )}
            <p className="text-[11px] text-muted-foreground">
              The wireframes carry the accent across whole sections, so a hue
              that reads as punctuation at 6px can read as a wash here.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {[ACCENT_BY_ID.ink, accent].map((a) => (
              <div
                key={a.id}
                style={accentStyle(
                  a.id === "ink" || framesOn ? a : ACCENT_BY_ID.ink,
                  dark,
                )}
                className="flex min-w-0 flex-col gap-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-[88px] shrink-0">
                    <PhoneShell>
                      <PhoneFrame />
                    </PhoneShell>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <GalleryFrame />
                    <AlbumFrame />
                  </div>
                </div>
                <p className="text-[11px] font-medium">
                  {a.id === "ink" ? "None" : a.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-semibold">
            The four declared hues, beside the state colours
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Every hue any card declares, read together once. An accent must
            never be mistaken for one of these at a 6px dot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-border px-2 py-1">
            {DECLARABLE_ACCENTS.map((a) => (
              <span
                key={a.id}
                style={accentStyle(a, dark)}
                className="flex items-center gap-1"
              >
                <span className="size-3 rounded-full bg-brand" />
                <span
                  className={cn(
                    "text-[10px]",
                    a.id === accent.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {a.label}
                </span>
              </span>
            ))}
          </div>
          <StateRow />
        </div>
      </section>
    </div>
  );
}
