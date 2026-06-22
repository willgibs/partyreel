"use client";

import { Check, Clapperboard, Clock, Shuffle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { type GridMedia } from "@/components/app/media-grid";
import { ReelPlayer } from "@/components/reel/reel-player";
import { useReel } from "@/components/reel/reel-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEME_LABELS,
  THEMES,
  type ThemeId,
} from "@/lib/reel/composition";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Seeds stay < 1e6 so seeded()'s `seed * 2654435761` multiply is exact in V8 (both the browser Player
// and the Lambda's headless Chrome) → the preview and the export render the identical take.
const SEED_MAX = 1_000_000;

const LENGTHS: { label: string; value: number | null }[] = [
  { label: "Auto", value: null },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
];

// A stable default seed per event, so an un-shuffled reel looks the same on every reload (until the host
// shuffles + we persist a chosen seed).
function seedFromEventId(eventId: string): number {
  let h = 0;
  for (let i = 0; i < eventId.length; i++) {
    h = (h * 31 + eventId.charCodeAt(i)) % SEED_MAX;
  }
  return h;
}

function rpcOk(data: unknown): boolean {
  return (
    !!data && typeof data === "object" && (data as { ok?: boolean }).ok === true
  );
}

/**
 * The live reel COMPOSER: the @remotion/player hero + the auto-magic controls (theme · shuffle · cover ·
 * length). All client-side + $0 — a shuffle re-seeds and the player re-renders instantly; nothing
 * encodes. Config persists (debounced) via upsert_reel_config, which lazily creates the reel row on the
 * first edit. Reads the shared ReelProvider so adds/removes/reorders in the grid below reflect live.
 */
export function ReelComposer({
  eventId,
  items,
  reelConfig,
}: {
  eventId: string;
  /** All visible gallery items (already presigned); the reel is a subset by id. */
  items: GridMedia[];
  reelConfig: ReelConfig | null;
}) {
  const reel = useReel();
  const orderedIds = useMemo(() => reel?.orderedIds ?? [], [reel?.orderedIds]);

  const [themeId, setThemeId] = useState<ThemeId>(() =>
    reelConfig && reelConfig.theme in THEMES
      ? (reelConfig.theme as ThemeId)
      : DEFAULT_THEME_ID,
  );
  const [seed, setSeed] = useState<number>(
    () => reelConfig?.seed ?? seedFromEventId(eventId),
  );
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    () => reelConfig?.coverMediaId ?? null,
  );
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(
    () => reelConfig?.lengthSeconds ?? null,
  );

  const byId = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);

  // The in-reel, approved media (for the cover picker thumbnails) in reel order.
  const reelMedia = useMemo(
    () =>
      orderedIds
        .map((id) => byId.get(id))
        .filter((m): m is GridMedia => !!m && m.status === "approved"),
    [orderedIds, byId],
  );

  const reelProps = useMemo(
    () =>
      buildReelProps({
        orderedIds,
        byId,
        theme: THEMES[themeId],
        seed,
        coverMediaId,
        lengthSeconds,
        posterMode: true,
      }),
    [orderedIds, byId, themeId, seed, coverMediaId, lengthSeconds],
  );

  // Debounced persist. Skips the first run (the config is already server truth / defaults) so just
  // viewing the reel never writes; a real edit (theme/shuffle/cover/length) lazily upserts the row.
  const supabase = useMemo(() => createClient(), []);
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const args: {
        p_event_id: string;
        p_theme: string;
        p_seed: number;
        p_length_seconds?: number;
        p_cover_media_id?: string;
      } = { p_event_id: eventId, p_theme: themeId, p_seed: seed };
      // Omit (→ SQL default null) to CLEAR length/cover; pass to set.
      if (lengthSeconds != null) args.p_length_seconds = lengthSeconds;
      if (coverMediaId != null) args.p_cover_media_id = coverMediaId;
      const { data, error } = await supabase.rpc("upsert_reel_config", args);
      if (error || !rpcOk(data))
        toast.error("Couldn't save your reel settings.");
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [themeId, seed, coverMediaId, lengthSeconds, eventId, supabase]);

  return (
    <div className="space-y-3">
      <ReelPlayer reelProps={reelProps} />

      {/* Auto-magic controls — no timeline, no sliders; just a vibe + a re-roll. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {/* Theme kit */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Theme"
        >
          {THEME_IDS.map((id) => {
            const active = id === themeId;
            return (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setThemeId(id)}
              >
                {THEME_LABELS[id]}
              </Button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-border" aria-hidden />

        {/* Shuffle — a new seed = a new auto-magic take, instantly + free. */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setSeed(
              (s) => (s + 1 + Math.floor(Math.random() * SEED_MAX)) % SEED_MAX,
            )
          }
        >
          <Shuffle />
          Shuffle
        </Button>

        {/* Cover — pin the opening shot. */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Clapperboard />
              Cover
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <p className="mb-2 px-1 text-xs text-muted-foreground">
              Opening shot
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCoverMediaId(null)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border text-[0.7rem] text-muted-foreground transition-colors ease-emphasis active:scale-[0.97]",
                  coverMediaId == null && "border-primary text-foreground",
                )}
              >
                Auto
              </button>
              {reelMedia.map((m) => {
                const active = m.id === coverMediaId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCoverMediaId(m.id)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-md border transition-transform ease-emphasis active:scale-[0.97]",
                      active && "ring-2 ring-primary",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.previewUrl ?? m.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {active && (
                      <span className="absolute top-0.5 right-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-5 w-px bg-border" aria-hidden />

        {/* Length — auto, or a tier-capped duration. */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Length"
        >
          <Clock className="size-3.5 text-muted-foreground" aria-hidden />
          {LENGTHS.map((l) => {
            const active = l.value === lengthSeconds;
            return (
              <Button
                key={l.label}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setLengthSeconds(l.value)}
              >
                {l.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
