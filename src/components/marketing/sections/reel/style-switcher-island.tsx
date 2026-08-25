"use client";

import Image from "next/image";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { marketingImage } from "@/lib/constants/marketing-media";
// Engine imports are SANCTIONED here and only here: this module exists on the far side
// of the style-switcher.lazy.tsx dynamic import, so the player + draw registry + asset
// loader stay out of every initial marketing chunk (the constants.ts bundle lesson).
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import type { ReelClip, ReelProps } from "@/lib/reel/engine/reel-types";
import { styleThemeId } from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

import {
  HERO_REEL,
  STYLE_FACETS,
  SWITCHER_CLIP_IDS,
  SWITCHER_INITIAL_STYLE,
  SWITCHER_SEED,
  type StyleFacetId,
} from "./style-facets";

/**
 * THE LIVE STYLE SWITCHER (the /reel flagship signature, ruled in 2026-08-25): ONE real
 * CanvasReelPlayer over manifest media, restyled instantly through the whole catalog.
 * A styleId change swaps the ReelProps identity, the player re-decodes through the
 * shared bitmap cache (same six sources — one decode total) and starts the new style
 * from frame 0: deterministic per (clips, styleId, seed, orientation), so every visitor
 * sees the same cut (the Studio style-wall precedent proves 14 cheap draws).
 *
 * The player self-enforces the loop-pause contract (its own offscreen IO +
 * document.hidden + reduced-motion handling — the policy use-ambient-pause was modeled
 * on), so no extra pause wiring belongs here.
 *
 * GEOMETRY CONTRACT with style-switcher-fallback.tsx: grid split, media box, caption
 * row identical. Change one file, change both.
 */

const FACET_BY_ID = new Map(STYLE_FACETS.map((f) => [f.id, f]));

// The fixed half of the recipe: the hero candidate's own clips (pinned frame-true to
// the fallback poster in style-facets.test.ts). Module-level so the reelProps memo can
// depend on styleId alone.
const CLIPS: ReelClip[] = SWITCHER_CLIP_IDS.map((id) => {
  const m = marketingImage(id);
  return { url: m.src, type: "photo", width: m.width, height: m.height };
});

export function StyleSwitcherIsland() {
  const [facetId, setFacetId] = useState<StyleFacetId>(STYLE_FACETS[0].id);
  const [styleId, setStyleId] = useState(SWITCHER_INITIAL_STYLE.id);
  // The poster→canvas reveal fires once (sticky): after the first decode the canvas
  // owns the box and the poster never returns, even while a restyle re-decodes.
  const [revealed, setRevealed] = useState(false);

  // Facet memory: switching to Treatments auto-plays its first look (every tap does
  // something visible), and switching BACK restores the mood you were on.
  const lastByFacet = useRef<Record<StyleFacetId, string>>({
    mood: SWITCHER_INITIAL_STYLE.id,
    treatment: FACET_BY_ID.get("treatment")!.styles[0].id,
  });

  const facet = FACET_BY_ID.get(facetId) ?? STYLE_FACETS[0];
  const active =
    facet.styles.find((s) => s.id === styleId) ?? SWITCHER_INITIAL_STYLE;

  const selectStyle = useCallback(
    (id: string) => {
      lastByFacet.current[facetId] = id;
      setStyleId(id);
    },
    [facetId],
  );

  const selectFacet = useCallback((id: StyleFacetId) => {
    setFacetId(id);
    setStyleId(lastByFacet.current[id]);
  }, []);

  // A treatment renders with its NATIVE theme (polaroid → warm, …), exactly like
  // build-reel-props resolves it; a mood's styleId IS its themeId (the parity-harness
  // precedent). Seed + clips fixed → the styleId is the ONLY moving part.
  const reelProps: ReelProps = useMemo(
    () => ({
      clips: CLIPS,
      theme: resolveTheme(styleThemeId(styleId)),
      seed: SWITCHER_SEED,
      styleId,
      orientation: "portrait",
      watermark: false,
    }),
    [styleId],
  );

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <div className="mx-auto w-full max-w-[300px]">
          {/* 14-skeleton-reveal (marketing.css chapter 2): the frame-true poster is
              the "skeleton", the live canvas the content; is-revealed cross-fades
              them the moment the first decode lands (onAssetsReady). */}
          <div
            className={cn("mkt-skel aspect-[9/16] w-full", {
              "is-revealed": revealed,
            })}
          >
            <div className="mkt-skel-skeleton overflow-hidden rounded-xl border bg-black">
              <Image
                src={HERO_REEL.poster}
                alt=""
                fill
                sizes="300px"
                className="object-cover"
              />
            </div>
            <div className="mkt-skel-content">
              {/* maxDim 720: full composition geometry, a 720x1280 backing store —
                  crisp at 300 CSS px on 2x screens, a quarter of the full-res
                  raster cost (the thumb path's own contract). */}
              <CanvasReelPlayer
                reelProps={reelProps}
                maxDim={720}
                showControls={false}
                onAssetsReady={() => setRevealed(true)}
              />
            </div>
          </div>
          <MonoCaption
            aria-live="polite"
            className="mt-3 text-center"
          >
            {active.label} · {active.kind}
          </MonoCaption>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-7">
        <FacetTabs facetId={facetId} onSelect={selectFacet} />
        <div
          role="tabpanel"
          id="style-chip-panel"
          aria-labelledby={`style-facet-${facet.id}`}
          className="flex min-h-24 flex-wrap content-start gap-2"
        >
          {facet.styles.map((style) => (
            <button
              key={style.id}
              type="button"
              aria-pressed={style.id === active.id}
              onClick={() => selectStyle(style.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                style.id === active.id
                  ? "border-foreground/40 bg-popover text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          Moods recut the photos full-frame. Treatments stage them: prints,
          frames, a deck of cards. Same photos, same order, a different film
          every tap.
        </p>
      </div>
    </div>
  );
}

/**
 * The mood/treatment facet switch on the 16-tabs-sliding recipe (.mkt-tabs, marketing.css
 * chapter 2): JS writes the active tab's offsetLeft/offsetWidth onto the pill; the first
 * paint and every resize write WITHOUT a transition (the recipe gotcha: an animated first
 * write flies the pill in from x=0). Real tabs semantics — the recipe's CSS keys on
 * aria-selected, which is only valid on role="tab" — with roving tabindex + arrow keys.
 */
function FacetTabs({
  facetId,
  onSelect,
}: {
  facetId: StyleFacetId;
  onSelect: (id: StyleFacetId) => void;
}) {
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const positioned = useRef(false);

  const positionPill = useCallback((animate: boolean) => {
    const tabs = tabsRef.current;
    const pill = pillRef.current;
    if (!tabs || !pill) return;
    const activeTab = tabs.querySelector<HTMLButtonElement>(
      '[aria-selected="true"]',
    );
    if (!activeTab) return;
    if (!animate) pill.style.transition = "none";
    pill.style.width = `${activeTab.offsetWidth}px`;
    pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    if (!animate) {
      requestAnimationFrame(() => {
        pill.style.transition = "";
      });
    }
  }, []);

  useLayoutEffect(() => {
    positionPill(positioned.current);
    positioned.current = true;
  }, [facetId, positionPill]);

  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => positionPill(false));
    ro.observe(tabs);
    return () => ro.disconnect();
  }, [positionPill]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = STYLE_FACETS.findIndex((f) => f.id === facetId);
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
    else if (e.key === "ArrowRight")
      next = Math.min(STYLE_FACETS.length - 1, idx + 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STYLE_FACETS.length - 1;
    if (next === null || next === idx) return;
    e.preventDefault();
    const id = STYLE_FACETS[next].id;
    onSelect(id);
    tabsRef.current
      ?.querySelector<HTMLButtonElement>(`#style-facet-${id}`)
      ?.focus();
  };

  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label="Style group"
      onKeyDown={onKeyDown}
      className="mkt-tabs self-start"
    >
      {STYLE_FACETS.map((f) => (
        <button
          key={f.id}
          id={`style-facet-${f.id}`}
          type="button"
          role="tab"
          aria-selected={f.id === facetId}
          aria-controls="style-chip-panel"
          tabIndex={f.id === facetId ? 0 : -1}
          onClick={() => onSelect(f.id)}
          className="mkt-tab text-sm font-medium"
        >
          {f.label}
        </button>
      ))}
      <span ref={pillRef} aria-hidden className="mkt-tabs-pill" />
    </div>
  );
}
