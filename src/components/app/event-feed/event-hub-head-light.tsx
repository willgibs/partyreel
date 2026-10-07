"use client";

import "./event-hub-head-seam.css";

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  COVER_SLOTS,
  type HeadStill,
} from "@/components/guest/event-experience-head";
import { ENTRY_PREVIEW, type ManifestEntry } from "@/lib/events/album-wire";
import { captureWarning } from "@/lib/observability/sentry";
import { decodeImage } from "@/lib/reel/engine/assets";
import type { CanvasImage } from "@/lib/reel/engine/canvas2d";

import {
  chromaOf,
  edgeBand,
  edgeHues,
  type EdgeLight,
  HOUSE_LIGHT,
  intensityOf,
  type Thumb,
} from "./event-hub-head-edge";
import { useHostAlbum, useHubEntries } from "./host-album";

/**
 * THE HUB'S ONE LIGHT (event-header r6, the Seam made Afterglow's): born where the cover's photograph ends, in that edge's
 * own colours, falling past the cards into the page. Drawn under the cover by the cards row (`event-cards-row.tsx`), whose
 * footprint it follows, on the seam's numbers (`event-hub-head-seam.css`); on paper inside Aperture's strip of the room.
 *
 * ★ ONE LIGHT A PHOTOGRAPH, ON THE COVER'S OWN CLOCK: the cover dissolves through its photographs (`HeadStills`, six slots
 * of one keyframe), so the light does too, each slot keyed and delayed as the cover's own, rendered with the cover from
 * the server's first byte, so the two clocks start together and stay together; reduced motion holds the first.
 *
 * ★ THE EDGE IS READ HERE, AT RUNTIME, OFF THE CROP THE EYE SEES (event-header r6's call on the edge's colours): the
 * cover's crop changes with its width and its height (a long name grows it), so a colour stored at upload would be one
 * crop's guess, and its column, its upload path and a backfill would all have to exist first. Each photograph's preview is
 * read once a page (CORS-clean and `no-store`, `decodeImage`: a tile's plain read poisons the cache for a CORS one,
 * uploads-and-r2.md), drawn small, and its edge read again from that small copy whenever the cover's size changes, with
 * no new request. ★ THE COST PER HUB VIEW: at most six preview GETs of about 16KB (one R2 Class B operation each,
 * $0.36 a million past the free ten million a month; no egress, no Vercel, no database), the first at once and the rest
 * at idle, and nothing for a photograph with no preview (its tile is the full original).
 *
 * ★ A QUIET STAND-IN: until a photograph's edge is read its slot borrows a read neighbour's light, and the whole Seam is
 * unlit until the first is read, then arrives (once, over 1.2s); a cover with no photograph, or none that can be read,
 * wears the house's dusk (Afterglow's light before the album has a photograph). A cover none of whose readable previews
 * could be read says so once a page where failures are read, since a refused origin would otherwise dim every hub
 * silently.
 */

/** HeadStills' hold (`event-experience-head.tsx`'s own `HOLD_SEC`, which it keeps to itself), a still's sixth of the cycle. */
export const HOLD_SEC = 4.6;

/** How wide a photograph is read: enough for six sixths of a few rows each at any crop, about 110KB of pixels at most. */
const THUMB_W = 192;

/** What a photograph gives the light once read: its small copy, and its light's chroma. */
type Read = { thumb: Thumb; c: number };

/** The page's reads, by still: one read a photograph a page, kept with the link it was read from. */
const reads = new Map<string, { src: string; read: Promise<Read | null> }>();

/**
 * How many reads the page keeps: four covers' worth. A host moving between her events in one visit would otherwise keep
 * every cover she ever opened (about 110KB of pixels a photograph); a cover read past this is simply read again.
 */
const KEPT = 24;

/** A failed read says so once a page, never once a photograph. */
let warned = false;

/** A decoded picture's own size (an image element's natural one; a bitmap or a canvas is its size). */
function sizeOf(img: CanvasImage): [number, number] {
  return "naturalWidth" in img
    ? [img.naturalWidth, img.naturalHeight]
    : [img.width, img.height];
}

/** A photograph read small: its pixels at `THUMB_W` and its intensity over a 32px read (the sampler's own size). */
async function readStill(src: string): Promise<Read | null> {
  const img = await decodeImage(src);
  try {
    const [nw, nh] = sizeOf(img);
    if (!nw || !nh) return null;
    const w = Math.min(THUMB_W, nw);
    const h = Math.max(1, Math.round((w * nh) / nw));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const small = document.createElement("canvas");
    small.width = 32;
    small.height = 32;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    if (!ctx || !sctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    sctx.drawImage(img, 0, 0, 32, 32);
    return {
      thumb: { w, h, px: ctx.getImageData(0, 0, w, h).data },
      c: chromaOf(intensityOf(sctx.getImageData(0, 0, 32, 32).data)),
    };
  } finally {
    // A decoded bitmap lives outside the JS heap, so it is released by hand once its small copy is drawn.
    if ("close" in img) img.close();
  }
}

/** The page's one read of a photograph; a read that failed is tried again once its link is a new one (a re-mint). */
function readOnce(still: HeadStill): Promise<Read | null> {
  const had = reads.get(still.id);
  if (had && had.src === still.tile) return had.read;
  const read = had
    ? had.read.then((r) => r ?? readStill(still.tile).catch(() => null))
    : readStill(still.tile).catch(() => null);
  reads.delete(still.id);
  reads.set(still.id, { src: still.tile, read });
  // The oldest go first (a Map keeps its insertion order).
  for (const id of reads.keys()) {
    if (reads.size <= KEPT) break;
    reads.delete(id);
  }
  return read;
}

/** HeadStills' own order: each photograph once, in the order the cover dissolves through them. */
function uniqueStills(stills: readonly HeadStill[]): HeadStill[] {
  const seen = new Set<string>();
  const out: HeadStill[] = [];
  for (const still of stills) {
    if (!still.tile || seen.has(still.id)) continue;
    seen.add(still.id);
    out.push(still);
  }
  return out;
}

/**
 * WHICH PHOTOGRAPHS MAY BE READ: on the hub, those with a preview (a photograph without one shows its full original, a
 * read of megabytes for six rows of it); off the hub (the Library's specimen, its photographs the app's own), every one.
 */
function readable(
  stills: readonly HeadStill[],
  entries: readonly ManifestEntry[] | null,
): HeadStill[] {
  if (!entries) return [...stills];
  const flags = new Map(entries.map((e) => [e[0], e[3]] as const));
  return stills.filter((s) => ((flags.get(s.id) ?? 0) & ENTRY_PREVIEW) !== 0);
}

/** The cover the light falls from: the nearest hub cover before it in the page, its box read again as it changes. */
function useCoverBox(
  ref: RefObject<HTMLElement | null>,
): { w: number; h: number } | null {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    const doc = el?.ownerDocument;
    const win = doc?.defaultView;
    if (!el || !doc || !win) return;
    const covers = [
      ...doc.querySelectorAll<HTMLElement>('[data-event-head="hub"]'),
    ].filter(
      (c) => c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const cover = covers.at(-1);
    if (!cover) return;
    const read = () => {
      const r = cover.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      setBox((was) => (was && was.w === w && was.h === h ? was : { w, h }));
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(cover);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

/** Runs `fn` once the page is idle (or soon, where it cannot say), so a read never competes with the first paint's tiles. */
function whenIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 300);
  return () => clearTimeout(id);
}

/**
 * Every readable photograph's read, by still: undefined while it is read, null where it could not be. The first is read at
 * once (it is the one on screen), the rest at idle, each one a page.
 */
function useReads(stills: readonly HeadStill[]): Record<string, Read | null> {
  const [done, setDone] = useState<Record<string, Read | null>>({});
  const key = stills.map((s) => `${s.id} ${s.tile}`).join("|");
  useEffect(() => {
    let gone = false;
    const land = (id: string) => (read: Read | null) => {
      if (!gone) setDone((was) => ({ ...was, [id]: read }));
    };
    const [first, ...rest] = stills;
    if (first) void readOnce(first).then(land(first.id));
    const cancel = whenIdle(() => {
      for (const s of rest) void readOnce(s).then(land(s.id));
    });
    return () => {
      gone = true;
      cancel();
    };
    // `key` stands for the stills and their links: a new array of the same photographs is the same read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return done;
}

/** The light itself (Afterglow's Seam): the edge's colours pooled in three soft ellipses, and the edge lit. */
function Lit({ light }: { light: EdgeLight }) {
  return (
    <div className="hub-light-lit">
      <div
        className="hub-light-glow"
        style={{ background: edgeBand(light, "glow") }}
      />
      <div
        className="hub-light-line"
        style={{ background: edgeBand(light, "line") }}
      />
    </div>
  );
}

/**
 * THE SEAM UNDER THE HUB'S COVER, for the cover's photographs as the cover draws them (`useHubCoverStills`, handed the
 * same facts as the cover, so the two can never dissolve through different photographs).
 */
export function HubLight({ stills }: { stills: readonly HeadStill[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const entries = useHubEntries(useHostAlbum());
  const unique = useMemo(() => uniqueStills(stills), [stills]);
  const toRead = useMemo(() => readable(unique, entries), [unique, entries]);
  const box = useCoverBox(ref);
  const done = useReads(toRead);

  // Each photograph's light at the cover's size: its edge, read again from its small copy as the cover's size changes.
  const lights = useMemo(() => {
    const out = new Map<string, EdgeLight | null>();
    if (!box) return out;
    for (const s of unique) {
      const read = done[s.id];
      if (!read) continue;
      const hues = edgeHues(read.thumb, box.w, box.h);
      out.set(s.id, hues ? { hues, c: read.c } : null);
    }
    return out;
  }, [unique, done, box]);

  const waiting = toRead.some((s) => !(s.id in done));
  const ownLight = unique.map((s) => lights.get(s.id)).find((l) => l);
  // The light a photograph with none of its own yet wears: a read neighbour's, else (all read, none with a colour, or a
  // cover with no photograph at all) the house's dusk, else nothing while the first is still being read.
  const standIn: EdgeLight | null =
    ownLight ?? (unique.length === 0 || !waiting ? HOUSE_LIGHT : null);

  const failed =
    !waiting && toRead.length > 0 && toRead.every((s) => done[s.id] === null);
  useEffect(() => {
    if (!failed || warned) return;
    warned = true;
    captureWarning("media", "hub_light_unread", { photographs: toRead.length });
  }, [failed, toRead.length]);

  const cycle = unique.length > 1;
  const slots: (HeadStill | null)[] =
    unique.length === 0
      ? [null]
      : cycle
        ? Array.from(
            { length: COVER_SLOTS },
            (_, i) => unique[i % unique.length],
          )
        : unique;
  const state =
    unique.length === 0
      ? "house"
      : ownLight
        ? "lit"
        : standIn
          ? "house"
          : "reading";

  return (
    <div
      ref={ref}
      aria-hidden
      data-hub-light={state}
      className="hub-seam hub-light"
    >
      {/* The field wears the room: on paper it is Aperture's strip of it; in the room it is clear (the seam's sheet). */}
      <div className="dark hub-light-field">
        {slots.map((still, i) => {
          const light =
            (still ? lights.get(still.id) : null) ?? standIn ?? null;
          return (
            <div
              // HeadStills' own keys, so a photograph's slot and its light's are made and remade in the same commit.
              key={still ? `${i}-${still.id}` : "house"}
              className="hub-light-slot"
              data-rest={i === 0 ? "" : undefined}
              data-cycle={cycle ? "" : undefined}
              data-hues={
                light ? light.hues.map(Math.round).join(" ") : "unread"
              }
              style={
                {
                  "--head-hold": HOLD_SEC,
                  "--head-delay": i * HOLD_SEC - HOLD_SEC * COVER_SLOTS,
                } as CSSProperties
              }
            >
              {light ? <Lit light={light} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
