"use client";

/**
 * The STYLE RAIL: all 14 styles as real engine frames on the host's OWN media.
 *
 * The finding this exists to kill (the R3 audit): the shipped picker was a row of
 * text pills, so 14 designed looks had no visual identity at all. A thumb here is
 * the actual drawReelFrame output on this host's clips, frame-locked — never a
 * screenshot, never a stock preview. Tapping one restyles the live poster
 * instantly, which makes the rail WYSIWYG by construction.
 *
 * What keeps 14 live canvases cheap:
 *   * `frame={45}` makes each player CONTROLLED — exactly one draw, no rAF clock;
 *   * `maxDim={216}` shrinks the BACKING STORE (same draw code, same composition
 *     geometry, ~1/25th the pixels) — the whole reason a rail is affordable;
 *   * every thumb decodes through the shared bitmap cache, so the hero and all 14
 *     thumbs cost ONE decode set between them;
 *   * clips are truncated to the first 4 (pixel-honest: planReel seeds by index,
 *     so a 4-clip prefix plans identically to the full prefix, and frame 45 sits
 *     inside clips 1-2 for every style);
 *   * the rail renders placeholder boxes until it is scrolled into view ONCE,
 *     then mounts for good (a host who never opens the Reel section pays nothing;
 *     one that does should not see thumbs churn on every scroll past).
 *
 * The rail is NEVER mounted in the builder state — there is no reel to style yet.
 */

import { useCallback, useMemo, useRef, useState } from "react";

import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import {
  STYLE_CATALOG,
  type StyleEntry,
  styleThemeId,
} from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

/** The frame every thumb is locked on: ~1.9s in (24fps), past the opening
 *  transition, so each thumb shows the style's grade + composition character. */
const THUMB_FRAME = 45;

/** The longest backing-store dimension a thumb rasterizes at. 216 is ~3x the
 *  64px (w-16) render size, so it stays crisp on a 3x phone screen. */
const THUMB_MAX_DIM = 216;

/** How many clips a thumb plans over. See the pixel-honesty note above. */
const THUMB_CLIPS = 4;

/** Host-language group labels: "Media-first / Stylized" is ENGINE taxonomy. */
const STYLE_GROUP_LABEL: Record<StyleEntry["kind"], string> = {
  mood: "Looks",
  treatment: "Layouts",
};

const STYLE_GROUPS: { kind: StyleEntry["kind"]; styles: StyleEntry[] }[] = [
  { kind: "mood", styles: STYLE_CATALOG.filter((s) => s.kind === "mood") },
  {
    kind: "treatment",
    styles: STYLE_CATALOG.filter((s) => s.kind === "treatment"),
  },
];

/**
 * A one-way latch: false until the sentinel is first seen, true forever after.
 *
 * WHY not useInViewSentinel: its state DEFAULTS to in-view (deliberately, so the
 * floating Add pill never flashes during hydration), which would report "seen" on
 * the very first render and mount all 14 thumbs for a host who is looking at the
 * top of their gallery. This one starts false, so the rail genuinely costs nothing
 * until the Reel section is reached. Once latched we never unmount: a controlled
 * thumb has no clock to waste, so churning them on every scroll pass would only
 * buy re-decodes. A callback ref (not a mount effect) so it attaches even when the
 * rail appears after first paint (the builder-to-Marquee swap).
 */
function useSeenOnce<T extends HTMLElement>() {
  const [seen, setSeen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setSeen(true);
      observer.disconnect(); // one-way: nothing left to watch
      observerRef.current = null;
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return { sentinelRef, seen };
}

/** One thumb's ReelProps: the host's own reel, restyled and truncated. The length
 *  cap is already baked into `base.clips` by buildReelProps, so truncating the
 *  prefix is the only thing a thumb needs to do. */
function thumbProps(base: ReelProps, styleId: string): ReelProps {
  return {
    ...base,
    clips: base.clips.slice(0, THUMB_CLIPS),
    styleId,
    theme: resolveTheme(styleThemeId(styleId)),
  };
}

function StyleThumb({
  style,
  props,
  active,
  onSelect,
  className,
}: {
  style: StyleEntry;
  /** Null until the rail is in view: render a placeholder box, mount nothing. */
  props: ReelProps | null;
  active: boolean;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(style.id)}
      aria-pressed={active}
      className={cn(
        "group flex w-16 shrink-0 flex-col gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        data-rxp-thumb
        data-active={active || undefined}
        // pointer-events-none: the whole button is the target, and a canvas
        // inside it must never swallow the tap.
        className="pointer-events-none block overflow-hidden rounded-[6px]"
      >
        {props ? (
          <CanvasReelPlayer
            reelProps={props}
            frame={THUMB_FRAME}
            maxDim={THUMB_MAX_DIM}
            showControls={false}
          />
        ) : (
          // The placeholder holds the rail's exact geometry so mounting the real
          // thumbs never shifts the row (the aspect matches a portrait frame).
          <span className="block aspect-[9/16] w-full rounded-[6px] bg-muted" />
        )}
      </span>
      <span
        className={cn(
          "truncate text-center text-[10px] leading-tight font-medium",
          active ? "text-reel" : "text-muted-foreground",
        )}
      >
        {style.label}
      </span>
    </button>
  );
}

export function StyleRail({
  reelProps,
  styleId,
  onSelect,
}: {
  /** The host's LIVE reel props — every thumb is this reel, restyled. */
  reelProps: ReelProps;
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const { sentinelRef, seen } = useSeenOnce<HTMLSpanElement>();

  // One props object per style, so a style tap swaps exactly ONE reference and
  // only the tapped thumb's player invalidates. Recomputed when the underlying
  // reel changes (a new moment, a new cover): the thumbs must show the real cut.
  const propsByStyle = useMemo(() => {
    if (!seen) return null;
    const map = new Map<string, ReelProps>();
    for (const s of STYLE_CATALOG) map.set(s.id, thumbProps(reelProps, s.id));
    return map;
  }, [seen, reelProps]);

  return (
    <div
      role="group"
      aria-label="Reel style"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      <span ref={sentinelRef} aria-hidden className="w-0 shrink-0" />
      {STYLE_GROUPS.map(({ kind, styles }) => (
        <div
          key={kind}
          role="group"
          aria-label={STYLE_GROUP_LABEL[kind]}
          className="flex gap-2"
        >
          {/* The group name is REAL text (not a decorative flourish): a screen
              reader must hear "Looks" / "Layouts" before the 8 or 6 thumbs. */}
          <span className="flex w-4 shrink-0 items-center justify-center">
            <span className="rotate-180 text-label font-semibold text-faint uppercase [writing-mode:vertical-rl]">
              {STYLE_GROUP_LABEL[kind]}
            </span>
          </span>
          {styles.map((s) => (
            <StyleThumb
              key={s.id}
              style={s}
              props={propsByStyle?.get(s.id) ?? null}
              active={s.id === styleId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The STYLE WALL: the same thumbs in a 4-column grid, for the Studio's Style
 *  sheet. Mounted only WHILE the sheet is open (unmounting drops 14 canvases;
 *  the shared bitmap cache makes reopening cheap), so it needs no sentinel. */
export function StyleWall({
  reelProps,
  styleId,
  onSelect,
}: {
  reelProps: ReelProps;
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const propsByStyle = useMemo(() => {
    const map = new Map<string, ReelProps>();
    for (const s of STYLE_CATALOG) map.set(s.id, thumbProps(reelProps, s.id));
    return map;
  }, [reelProps]);

  return (
    <div role="group" aria-label="Reel style">
      {STYLE_GROUPS.map(({ kind, styles }) => (
        <div
          key={kind}
          role="group"
          aria-label={STYLE_GROUP_LABEL[kind]}
          className="mb-2 last:mb-0"
        >
          <p className="mb-1.5 text-label font-semibold text-white/45 uppercase">
            {STYLE_GROUP_LABEL[kind]}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {styles.map((s) => (
              <StyleThumb
                key={s.id}
                style={s}
                props={propsByStyle.get(s.id) ?? null}
                active={s.id === styleId}
                onSelect={onSelect}
                className="w-full"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
