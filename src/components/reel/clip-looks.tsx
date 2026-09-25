"use client";

import { useMemo, type CSSProperties } from "react";
import { Check } from "lucide-react";

import { CLIP_STILL_FRAME } from "@/lib/reel/clip-encode";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { STYLE_CATALOG, styleThemeId } from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

import { ClipCanvas } from "./clip-canvas";
import { PanelLabel, ROOM_FOCUS, ROOM_PRESS } from "./clip-room";

/**
 * THE LOOKS: the wall of fourteen, each tile the engine's still of HER clip in that look (reel-cut
 * round 2, `bench=column`, the Looks tab as the `strip` option drew it), the one it wears ringed
 * with a check. The live reel offers the eight moods; a clip offers every look the engine draws.
 *
 * ★ HER CLIP, NOT A SAMPLE. A tile is the clip's own first moments restyled (a plan seeds by
 * index, so four moments plan exactly as the clip's head does, and the still frame sits inside
 * them for every look), which is what makes the wall a choice about this clip rather than a
 * catalogue. The wall mounts only while its tab is open, so a maker on Moments pays for none of it.
 */

/** How many of the clip's moments a look's still plans over (see the note above). */
const LOOK_CLIPS = 4;

/** A still's backing store: about three times the tile's width on a phone, so it stays crisp. */
const LOOK_MAX_DIM = 280;

export function LooksWall({
  props,
  styleId,
  onPick,
  cols,
  className,
  style,
}: {
  /** The clip as it stands; every look is this clip restyled. */
  props: ReelProps;
  styleId: string;
  onPick: (styleId: string) => void;
  cols: number;
  className?: string;
  style?: CSSProperties;
}) {
  // One props object per look, so a pick redraws the two tiles whose ring moved and nothing else;
  // a new selection redraws all fourteen, because each one IS the clip.
  const byLook = useMemo(() => {
    const head = props.clips.slice(0, LOOK_CLIPS);
    return new Map(
      STYLE_CATALOG.map((look) => [
        look.id,
        {
          ...props,
          clips: head,
          styleId: look.id,
          theme: resolveTheme(styleThemeId(look.id)),
        } satisfies ReelProps,
      ]),
    );
  }, [props]);
  const worn = STYLE_CATALOG.find((look) => look.id === styleId);
  const landscape = props.orientation === "landscape";

  return (
    <section data-clip-looks className={className} style={style}>
      <PanelLabel aside={`${STYLE_CATALOG.length} looks`}>
        {`Look · ${worn?.label ?? STYLE_CATALOG[0].label}`}
      </PanelLabel>
      <div
        role="radiogroup"
        aria-label="Look"
        className="grid gap-x-2.5 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {STYLE_CATALOG.map((look) => {
          const active = look.id === styleId;
          const lookProps = byLook.get(look.id);
          return (
            <button
              key={look.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(look.id)}
              data-clip-look={look.id}
              className={cn(
                "group flex min-w-0 flex-col gap-1 rounded-lg text-left",
                ROOM_FOCUS,
                ROOM_PRESS,
              )}
            >
              <span
                className={cn(
                  "relative block overflow-hidden rounded-lg",
                  landscape ? "aspect-[16/9]" : "aspect-[9/16]",
                  active
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[oklch(0.14_0_0)]"
                    : "ring-1 ring-white/10 group-hover:ring-white/30",
                )}
              >
                {lookProps && lookProps.clips.length > 0 ? (
                  <ClipCanvas
                    props={lookProps}
                    frame={CLIP_STILL_FRAME}
                    maxDim={LOOK_MAX_DIM}
                    label={`Your clip in ${look.label}`}
                  />
                ) : (
                  <span className="block size-full bg-[oklch(0.16_0_0)]" />
                )}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white text-zinc-900"
                  >
                    <Check className="size-2.5" />
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "truncate text-micro",
                  active ? "font-medium text-white" : "text-white/55",
                )}
              >
                {look.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
