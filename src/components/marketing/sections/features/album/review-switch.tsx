"use client";

import { Check, ListChecks, Radio, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useEnteredFrame } from "@/lib/shared/use-entered-frame";
import { cn } from "@/lib/utils";

import { YOUR_CALL } from "./album-copy";

/**
 * LIVE OR REVIEW: the one question the old page never resolved ("do uploads
 * go public before I see them?"), answered as a switch you flip, and since
 * the finish pass THE UPLOAD MOVES. Two segments on the app's own lifted-pill
 * control drive one photograph's path along a real rule: in Live it flies
 * from the phone straight into the album; in Review it lands in the amber
 * queue and the guest's phone shows the real toast, until [Approve all], a
 * real button here, sends it on. Reduced motion jumps every state.
 */

type Mode = "live" | "review";

const SEGMENTS: { mode: Mode; label: string; Icon: typeof Radio }[] = [
  { mode: "live", label: "Live", Icon: Radio },
  { mode: "review", label: "Review", Icon: ShieldCheck },
];

const UPLOAD = "wedding-toast";
const ALBUM = ["wedding-golden", "party-balloons", "reception-table"];

/** The travelling photograph: keyed by its destination so a mode change
 *  remounts it and it flies in from the phone's side, settling small. */
function Traveller({
  check,
  dim,
  className,
}: {
  check?: boolean;
  dim?: boolean;
  className?: string;
}) {
  const on = useEnteredFrame();
  return (
    <span
      data-mkt-fly
      data-on={on ? "true" : undefined}
      className={cn(
        "relative block overflow-hidden rounded-tile bg-muted",
        dim && "opacity-40",
        className,
      )}
      style={
        {
          "--i": 0,
          "--fly-x": "-140px",
          "--fly-y": "0px",
          "--fly-scale": "0.96",
        } as CSSProperties
      }
    >
      <Image
        src={marketingImage(UPLOAD).src}
        alt=""
        fill
        sizes="120px"
        className="object-cover"
      />
      {check && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </span>
  );
}

export function ReviewSwitch() {
  const [mode, setMode] = useState<Mode>("live");
  const [approved, setApproved] = useState(false);
  const index = SEGMENTS.findIndex((s) => s.mode === mode);
  const inAlbum = mode === "live" || approved;

  const pick = (next: Mode) => {
    setMode(next);
    setApproved(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div
        role="group"
        aria-label="How uploads reach the album"
        className="relative mx-auto grid w-full max-w-xs grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
          style={{ transform: `translateX(calc(${index} * (100% + 0.25rem)))` }}
        />
        {SEGMENTS.map(({ mode: value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => pick(value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              "active:scale-[0.98] motion-reduce:active:scale-100",
              mode === value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* The path: three plates on one rule. The rule is real (a hairline
          behind the plates), the plates sit on it, and only the photograph
          moves. The desk's one card lies flat, so it is its border and its
          ring: no shadow (the light ruling, 2026-09-17). */}
      <div className="relative rounded-2xl border bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
        {/* The rule and the three-across path exist from sm up; on a phone the
            path stacks top to bottom with its objects centred. */}
        <span
          aria-hidden
          className="absolute inset-x-[10%] top-1/2 hidden h-px bg-border sm:block"
        />
        <div className="relative grid grid-cols-1 items-start gap-6 sm:grid-cols-3">
          <Plate label="The phone">
            <span className="relative mx-auto block aspect-square w-full max-w-[9rem] overflow-hidden rounded-tile bg-muted">
              <Image
                src={marketingImage(UPLOAD).src}
                alt=""
                fill
                sizes="120px"
                className="object-cover opacity-80"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/35 p-1">
                <span className="block h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <span className="block h-full w-full rounded-full bg-white" />
                </span>
              </span>
            </span>
            {/* The guest's own toast, exactly as the app fires it, only in Review. */}
            <span
              data-mkt-toast
              data-on={mode === "review" ? "true" : undefined}
              className="mx-auto mt-2 flex w-fit max-w-full items-center gap-1.5 rounded-full border bg-popover/95 px-2 py-1 text-[10px] leading-none font-medium"
            >
              <Check className="size-3 shrink-0 text-success" strokeWidth={3} />
              <span className="truncate">Sent, waiting for host approval</span>
            </span>
          </Plate>

          <Plate label={mode === "live" ? "Straight through" : "Your queue"}>
            {mode === "live" ? (
              <span className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-lg bg-card px-3 text-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span className="text-xs font-medium">Lands at once</span>
              </span>
            ) : (
              <span className="flex min-h-[7rem] flex-col items-center gap-2.5 rounded-lg bg-card px-3">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wide text-warning uppercase">
                    Review
                  </span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
                    {approved ? 0 : 1}
                  </span>
                </span>
                <span className="relative block size-14">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-tile border border-dashed border-border/70 bg-card"
                  />
                  {!approved && (
                    <Traveller key="queue" className="absolute inset-0" />
                  )}
                </span>
                <span className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="inline-flex h-7 items-center gap-1 rounded-lg border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                    <ListChecks className="size-3" /> Select
                  </span>
                  <button
                    type="button"
                    onClick={() => setApproved(true)}
                    disabled={approved}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-primary px-2 text-[11px] font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97] disabled:cursor-default disabled:opacity-50 motion-reduce:active:scale-100"
                  >
                    <Check className="size-3" /> Approve all
                  </button>
                </span>
              </span>
            )}
          </Plate>

          <Plate label="Everyone's album">
            <span className="mx-auto grid w-full max-w-[9rem] grid-cols-2 gap-1">
              {ALBUM.map((id) => (
                <span
                  key={id}
                  className="relative block aspect-square overflow-hidden rounded-tile bg-muted"
                >
                  <Image
                    src={marketingImage(id).src}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </span>
              ))}
              <span className="relative block aspect-square">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-tile border border-dashed border-border/70 bg-card"
                />
                {inAlbum && (
                  <Traveller
                    key={`album-${mode}`}
                    check
                    className="absolute inset-0"
                  />
                )}
              </span>
            </span>
          </Plate>
        </div>
      </div>

      <p
        aria-live="polite"
        className="min-h-5 text-center text-sm text-muted-foreground"
      >
        <TextSwap value={YOUR_CALL.hints[mode]} />
      </p>
    </div>
  );
}

function Plate({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative flex min-w-0 flex-col gap-2.5 px-1 py-1">
      <span className="text-center text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
