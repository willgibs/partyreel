"use client";

import { Check, SwitchCamera, X, Zap } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, ROLL, type Still } from "./fixtures";
import { FilmStill, type LookId } from "./film";

/**
 * THE THREE CAMERAS A GUEST COULD SHOOT WITH, each drawn as the whole screen
 * it is (the frame IS the phone): the phone's own camera app, the album's own
 * live camera, and that same camera dressed as a disposable.
 *
 * ★ THE PHONE'S CAMERA IS A STAND-IN, DRAWN PLAIN. It is the operating
 * system's screen, not ours (`capture="environment"` hands the page to it), so
 * it is drawn as generic camera furniture with the two facts that matter to
 * this decision: it opens on its own shutter, and after a shot it asks Retake
 * or Use Photo. Nothing of its colour, its lenses or its modes is claimed.
 *
 * ★ THE VIEWFINDER IS A PHOTOGRAPH STANDING IN FOR THE LIVE CAMERA. In the
 * proposal it is the rear camera's stream in the page (getUserMedia, asked of
 * the phone once), and the shutter draws the frame onto a canvas at the
 * roll's size with the look baked in, then hands it to the album's one upload
 * queue. There is no retake because there is nothing to review: the shot is
 * on the roll the moment the shutter is pressed.
 *
 * Nothing here is wired: every control is inert, drawn at rest.
 */

/* ── the album's own camera ─────────────────────────────────────────────── */

/** The bar every camera screen wears: close, whose camera it is, the flash. */
function CamBar({ sub }: { sub: string }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-3">
      <span className="dm-cam-round" aria-label="Back to the album">
        <X className="size-5" aria-hidden />
      </span>
      {/* The host's name first (bible 7): it is her camera, handed round. */}
      <div className="min-w-0 text-center">
        <p className="truncate font-heading text-base font-medium">
          {EVENT.name}
        </p>
        <p className="text-micro text-white/60">{sub}</p>
      </div>
      <span className="dm-cam-round" aria-label="Flash">
        <Zap className="size-5" aria-hidden />
      </span>
    </div>
  );
}

/**
 * THE ALBUM'S OWN CAMERA. `taken` draws the beat just after the shutter: the
 * shot's receipt at the top of the viewfinder (never the shot itself: a
 * disposable shows nothing), the count one down, the viewfinder already on
 * the next thing she frames.
 */
export function Viewfinder({
  still,
  look,
  left,
  taken,
}: {
  still: Still;
  look: LookId;
  left: number;
  /** The shot just taken, by its number on the roll. */
  taken?: number;
}) {
  return (
    <div className="dm-cam" data-dm-camera="viewfinder">
      <CamBar sub="Disposable camera" />
      <div className="relative shrink-0">
        <FilmStill
          still={still}
          look={look}
          className="aspect-[3/4] w-full"
          position="50% 45%"
        />
        {taken !== undefined && (
          <span
            className={cn(
              GLASS,
              "absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white",
            )}
          >
            <Check className="size-3.5" aria-hidden />
            Shot {taken} is on the roll
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center pb-4">
        <div className="grid grid-cols-3 items-center px-6">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[28px] leading-none font-medium tabular-nums">
              {left}
            </p>
            <p className="mt-1 text-xs text-white/60">shots left</p>
          </div>
          <span
            className="dm-shutter justify-self-center"
            data-dm-reach
            data-spent={taken !== undefined ? "" : undefined}
            aria-label="Take the shot"
          />
          <span
            className="dm-cam-round justify-self-end"
            aria-label="Turn the camera round"
          >
            <SwitchCamera className="size-5" aria-hidden />
          </span>
        </div>
        <p className="mt-5 text-center text-xs text-white/55">
          Every shot counts. There is no retake.
        </p>
      </div>
    </div>
  );
}

/* ── a disposable, drawn ────────────────────────────────────────────────── */

/**
 * THE SAME LIVE CAMERA IN A DISPOSABLE'S BODY: the back of the camera as the
 * screen, the host's name on its label, a small window to frame in, the frame
 * counter's dial, the thumb wheel, the flash's charge and the shutter. `wind`
 * draws the beat after a shot: the shutter locked until the wheel is wound,
 * the counter not yet moved.
 */
export function BodyCamera({
  still,
  look,
  left,
  wind,
}: {
  still: Still;
  look: LookId;
  left: number;
  wind?: boolean;
}) {
  return (
    <div className="dm-body" data-dm-camera="body">
      <div className="flex h-14 shrink-0 items-center px-3">
        <span className="dm-cam-round" aria-label="Back to the album">
          <X className="size-5" aria-hidden />
        </span>
      </div>
      <div className="dm-body-label mx-5 flex items-baseline justify-between rounded-md px-3 py-2">
        <span className="font-heading text-sm font-semibold tracking-[0.18em] uppercase">
          {EVENT.name}
        </span>
        <span className="text-micro font-medium tracking-[0.12em] uppercase">
          {ROLL.shots} exp
        </span>
      </div>

      <div className="dm-body-window mx-5 mt-5">
        <FilmStill
          still={still}
          look={look}
          className="aspect-[4/3] w-full"
          position="50% 45%"
        />
      </div>

      <div className="mx-5 mt-6 flex items-center gap-4">
        <span className="dm-body-counter" data-dm-say>
          <span className="font-heading text-xl font-semibold tabular-nums">
            {left}
          </span>
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <span
            className="dm-body-wheel block"
            data-due={wind ? "" : undefined}
            data-dm-reach={wind ? "" : undefined}
            aria-label="Wind on"
          />
          <p className="text-micro tracking-[0.14em] text-[#f4f1ea]/60 uppercase">
            {wind ? "Wind on to the next shot" : "Wind after every shot"}
          </p>
        </div>
      </div>

      {/* The back's printed card, as every disposable carries one. */}
      <div className="mx-5 mt-8 grid grid-cols-3 gap-2 rounded-lg border border-[#f4f1ea]/10 px-3 py-3.5 text-center">
        {[
          ["1", "Wind"],
          ["2", "Frame"],
          ["3", "Shoot"],
        ].map(([n, word]) => (
          <span key={n} className="space-y-1">
            <span className="block font-heading text-base font-semibold text-[#f4f1ea]/80">
              {n}
            </span>
            <span className="block text-micro tracking-[0.14em] text-[#f4f1ea]/55 uppercase">
              {word}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between px-10 pb-10">
        <span className="flex w-12 flex-col items-center gap-1.5">
          <span
            className={cn(
              "size-2.5 rounded-full",
              wind
                ? "bg-[#f4f1ea]/25"
                : "bg-[#ffd27a] shadow-[0_0_8px_#ffb040]",
            )}
          />
          <span className="text-micro tracking-[0.12em] text-[#f4f1ea]/70 uppercase">
            Flash
          </span>
        </span>
        <span
          className="dm-body-shutter"
          data-locked={wind ? "" : undefined}
          data-dm-reach={wind ? undefined : ""}
          aria-label="Take the shot"
        />
        <span className="w-12" aria-hidden />
      </div>
    </div>
  );
}

/* ── the phone's own camera, a stand-in ─────────────────────────────────── */

/** The phone's camera as the file input opens it: its own shutter, its own Cancel. */
export function NativeCamera({ still }: { still: Still }) {
  return (
    <div className="dm-native" data-dm-camera="phone">
      <div className="flex h-12 shrink-0 items-center px-4">
        <Zap className="size-5" aria-hidden />
      </div>
      <div className="relative shrink-0">
        <FilmStill
          still={still}
          look="clean"
          className="aspect-[3/4] w-full"
          position="50% 45%"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-5 pb-6">
        <p className="text-center text-xs font-medium tracking-[0.14em] text-white/85 uppercase">
          Photo
        </p>
        <div className="grid grid-cols-3 items-center px-6">
          <span className="justify-self-start text-base">Cancel</span>
          <span
            className="dm-native-shutter justify-self-center"
            data-dm-reach
          />
          <span className="dm-cam-round justify-self-end">
            <SwitchCamera className="size-5" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

/** What the phone's camera asks after a shot: keep it, or take it again. */
export function NativeReview({
  still,
  look = "clean",
}: {
  still: Still;
  look?: LookId;
}) {
  return (
    <div className="dm-native" data-dm-camera="phone-review">
      <div className="flex flex-1 items-center">
        <FilmStill
          still={still}
          look={look}
          className="aspect-[3/4] w-full"
          position="50% 45%"
        />
      </div>
      <div className="flex h-24 shrink-0 items-center justify-between px-6 text-base">
        <span data-dm-reach className="py-2">
          Retake
        </span>
        <span className="py-2 font-medium">Use Photo</span>
      </div>
    </div>
  );
}
