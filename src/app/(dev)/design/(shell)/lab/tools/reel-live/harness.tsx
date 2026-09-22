"use client";

/**
 * THE LIVE REEL HARNESS (the reel round, 2026-09-22).
 *
 * A prototype, not a board: it asks for no ruling, it proves something. What it proves is the
 * engineering the rest of the round rests on — that a reel can play an album of any size for hours,
 * take an upload mid-loop without restarting, lose a photograph the instant a host hides it, change
 * its look without blinking, and hold its memory flat the whole time.
 *
 * Every still is a LOCAL marketing fixture: the canvas reads pixels back for the encoder, and one
 * cross-origin image without CORS taints it (the reel-parity precedent).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import type { Orientation } from "@/lib/reel/engine/constants";
import {
  LiveReelPlayer,
  type LiveFrameState,
} from "@/lib/reel/engine/player-live";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import type { LiveMediaItem } from "@/lib/reel/live/items";
import { DEFAULT_SURFACE, type Surface } from "@/lib/reel/live/pacing";
import { createClipSource } from "@/lib/reel/live/source";
import { DEFAULT_WINDOW_SIZE } from "@/lib/reel/live/window";

const MOODS = STYLE_CATALOG.filter((s) => s.kind === "mood");

const UPLOADERS = [
  { key: "host", name: "Mia Calder" },
  { key: "g1", name: "Ruby N." },
  { key: "g2", name: "Sam O." },
  { key: "g3", name: "Theo Calder" },
] as const;

const HOUR = 3_600_000;
const EVENT_START = Date.parse("2026-08-15T18:00:00.000Z");

/** One fixture item: a local still, a believable uploader, a time, sometimes a like. */
function fixture(i: number, at = EVENT_START - i * (HOUR / 6)): LiveMediaItem {
  const image = MARKETING_IMAGES[i % MARKETING_IMAGES.length];
  const who = UPLOADERS[i % UPLOADERS.length];
  return {
    id: `fx-${i}`,
    // Every eighth is a VIDEO, standing in with its poster (what the engine draws today, and what
    // it falls back to for every failure once the range reader lands).
    type: i % 8 === 3 ? "video" : "photo",
    url: image.src,
    previewUrl: image.src,
    status: "approved",
    width: image.width,
    height: image.height,
    durationSeconds: i % 8 === 3 ? 12 : null,
    createdAt: new Date(at).toISOString(),
    uploaderKey: who.key,
    uploaderName: who.name,
    isHost: who.key === "host",
  };
}

const ALBUMS: { id: string; label: string; size: number }[] = [
  { id: "small", label: "3 photographs (the reel's first moment)", size: 3 },
  { id: "album", label: "18 photographs (an evening so far)", size: 18 },
  { id: "big", label: "300 photographs (the soak)", size: 300 },
];

export function LiveReelHarness() {
  const [albumId, setAlbumId] = useState("album");
  const [styleId, setStyleId] = useState("classic");
  const [surface, setSurface] = useState<Surface>(DEFAULT_SURFACE);
  const [holdScale, setHoldScale] = useState(1);
  const [windowSize, setWindowSize] = useState(DEFAULT_WINDOW_SIZE);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [includeVideos, setIncludeVideos] = useState(true);
  const [paused, setPaused] = useState(false);
  const [thumb, setThumb] = useState(false);
  const [eventId, setEventId] = useState("mia-and-theo");
  const [reports, setReports] = useState<string[]>([]);

  const size = ALBUMS.find((a) => a.id === albumId)?.size ?? 18;

  // A new source is a new reel: the player remounts with it and the clock starts again, which is
  // the ONE place that is allowed to happen. Everything else lands in the loop already playing.
  const { source, seedItems } = useMemo(() => {
    const items = Array.from({ length: size }, (_, i) => fixture(i));
    return {
      source: createClipSource({ eventId, items, windowSize }),
      seedItems: items,
    };
  }, [eventId, size, windowSize]);

  // The album as it stands now. A ref, written only from effects and the buttons, exactly as a
  // gallery provider hands the source a new payload when the doorbell rings.
  const itemsRef = useRef<LiveMediaItem[]>(seedItems);
  const arrivalsRef = useRef(0);
  useEffect(() => {
    itemsRef.current = seedItems;
    arrivalsRef.current = 0;
  }, [seedItems]);

  // The live readout, flushed twice a second rather than per frame (a 24fps setState would measure
  // React, not the reel).
  const latest = useRef<LiveFrameState | null>(null);
  const framesSeen = useRef(0);
  const lastFlush = useRef({ at: 0, frames: 0 });
  const [readout, setReadout] = useState({
    fps: 0,
    frame: 0,
    windowIndex: 0,
    loopIndex: 0,
    clip: "",
    who: "",
    failures: 0,
    retained: 0,
    derived: 0,
    cached: 0,
    pinned: 0,
    takeLength: 0,
    eligible: 0,
    heapMb: 0,
    backwards: 0,
  });
  const backwards = useRef(0);
  const lastFrame = useRef(-1);

  const onFrame = useCallback((state: LiveFrameState) => {
    // ★ The contract, watched live: the clock never goes backward. If this counter ever moves, the
    // reel restarted, and a restart is the thing the whole design exists to avoid.
    if (state.globalFrame < lastFrame.current) backwards.current += 1;
    lastFrame.current = state.globalFrame;
    latest.current = state;
    framesSeen.current += 1;
  }, []);

  // ★ THE CONSOLE IS PART OF THE INSTRUMENT. The tiles below flush twice a second, which is right
  // for reading and useless for measuring: "an arrival reaches the screen within one clip" is a
  // claim in frames, and half a second of readout lag is twelve of them. So the un-throttled state
  // is readable from the console (`__reelLive()`), which is how the soak's numbers were taken. Dev
  // only, by the route this page lives on.
  useEffect(() => {
    const w = window as unknown as { __reelLive?: () => unknown };
    w.__reelLive = () => ({ ...latest.current, stats: source.stats() });
    return () => {
      delete w.__reelLive;
    };
  }, [source]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const state = latest.current;
      const stats = source.stats();
      const elapsed = (now - lastFlush.current.at) / 1000;
      const fps =
        lastFlush.current.at > 0 && elapsed > 0
          ? (framesSeen.current - lastFlush.current.frames) / elapsed
          : 0;
      lastFlush.current = { at: now, frames: framesSeen.current };
      const memory = (
        performance as unknown as { memory?: { usedJSHeapSize: number } }
      ).memory;
      const item = state?.clipId ? source.itemFor(state.clipId) : undefined;
      setReadout({
        fps: Math.round(fps),
        frame: state?.globalFrame ?? 0,
        windowIndex: state?.windowIndex ?? 0,
        loopIndex: state?.loopIndex ?? 0,
        clip: state?.clipId ?? "",
        who: item?.uploaderName ?? "",
        failures: state?.failures ?? 0,
        retained: stats.retained,
        derived: stats.derived,
        cached: sharedBitmapCache.size(),
        pinned: sharedBitmapCache.retained(),
        takeLength: stats.takeLength,
        eligible: stats.eligible,
        heapMb: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
        backwards: backwards.current,
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [source]);

  const addThree = () => {
    const next = [...itemsRef.current];
    for (let i = 0; i < 3; i++) {
      arrivalsRef.current += 1;
      const fresh = fixture(
        1000 + arrivalsRef.current,
        Date.now() + arrivalsRef.current,
      );
      next.unshift({ ...fresh, uploaderName: "A new arrival" });
    }
    itemsRef.current = next;
    source.setItems(next);
  };

  const dropOnScreen = () => {
    const id = latest.current?.clipId;
    if (!id) return;
    itemsRef.current = itemsRef.current.filter((it) => it.id !== id);
    source.setItems(itemsRef.current);
  };

  const hideTen = () => {
    const doomed = itemsRef.current.slice(0, 10).map((it) => it.id);
    itemsRef.current = itemsRef.current.filter((it) => !doomed.includes(it.id));
    source.setItems(itemsRef.current);
  };

  const onReport = useCallback((message: string) => {
    setReports((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);

  return (
    <div className="space-y-6">
      {/* The knobs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card p-4">
        <Field label="Album">
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            aria-label="Album"
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            {ALBUMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Style">
          <select
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            aria-label="Style"
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            {MOODS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Surface">
          <select
            value={surface}
            onChange={(e) => setSurface(e.target.value as Surface)}
            aria-label="Surface"
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="hand">Hand</option>
            <option value="wall">Wall</option>
          </select>
        </Field>

        <Field label={`Hold x${holdScale.toFixed(2)}`}>
          <input
            type="range"
            min={0.4}
            max={2}
            step={0.05}
            value={holdScale}
            onChange={(e) => setHoldScale(Number(e.target.value))}
            aria-label="Hold scale"
            className="w-28 accent-foreground"
          />
        </Field>

        <Field label={`Window ${windowSize}`}>
          <input
            type="range"
            min={2}
            max={12}
            step={1}
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            aria-label="Window size"
            className="w-24 accent-foreground"
          />
        </Field>

        <Field label="Seed">
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            aria-label="Event id (the loop's seed)"
            className="w-32 rounded-md border bg-transparent px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="Shape">
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
            aria-label="Shape"
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </Field>

        <Toggle checked={includeVideos} onChange={setIncludeVideos}>
          Include videos
        </Toggle>
        <Toggle checked={thumb} onChange={setThumb}>
          Thumb (216px)
        </Toggle>
      </div>

      {/* The acts */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPaused((p) => !p)}>
          {paused ? "Play" : "Pause"}
        </Button>
        <Button onClick={addThree}>Add three</Button>
        <Button onClick={dropOnScreen}>Hide the one on screen</Button>
        <Button onClick={hideTen}>Hide ten at once</Button>
        <span className="text-xs text-muted-foreground">
          Nothing here restarts the reel. Every act lands in the loop that is already playing.
        </span>
      </div>

      <LiveReelPlayer
        source={source}
        styleId={styleId}
        surface={surface}
        holdScale={holdScale}
        orientation={orientation}
        includeVideos={includeVideos}
        paused={paused}
        maxDim={thumb ? 216 : undefined}
        onFrame={onFrame}
        onReport={onReport}
      />

      {/* The numbers */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Frames drawn" value={readout.frame} />
        <Stat label="rAF ticks per second" value={readout.fps} />
        <Stat label="Window" value={readout.windowIndex} />
        <Stat label="Loop" value={readout.loopIndex} />
        <Stat label="Take length" value={readout.takeLength} />
        <Stat label="Eligible items" value={readout.eligible} />
        <Stat label="Windows held" value={readout.retained} />
        <Stat label="Stills pinned" value={readout.pinned} />
        <Stat label="Stills decoded" value={readout.cached} />
        <Stat label="Derived assets" value={readout.derived} />
        <Stat label="Failures" value={readout.failures} />
        <Stat
          label="JS heap (MB)"
          value={readout.heapMb === 0 ? "n/a" : readout.heapMb}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p>
          <span className="text-muted-foreground">On screen: </span>
          <span className="tabular-nums">{readout.clip || "nothing yet"}</span>
          {readout.who ? (
            <span className="text-muted-foreground"> · {readout.who}</span>
          ) : null}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">
            Times the clock went backward:{" "}
          </span>
          <span
            className={
              readout.backwards > 0 ? "text-destructive" : "tabular-nums"
            }
          >
            {readout.backwards}
          </span>
          <span className="text-muted-foreground">
            {" "}
            (it must stay at zero: a reel that restarts is the whole thing this
            replaces)
          </span>
        </p>
        {reports.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {reports.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-foreground"
      />
      <span>{children}</span>
    </label>
  );
}

function Button({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-1.5 text-sm transition-transform ease-emphasis active:scale-95"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="font-heading text-2xl tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
