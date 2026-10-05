"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  useHerShots,
  useLinksRevision,
} from "@/components/app/event-feed/event-hub-head-cover";
import {
  hubRollOf,
  videoIdsOf,
} from "@/components/app/event-feed/hub-develop-roll";
import {
  useHostAlbum,
  useHubEntries,
} from "@/components/app/event-feed/host-album";
import {
  developAt,
  type DevelopPicture,
  DevelopSheet,
} from "@/components/guest/gallery-empty-state-sheet";
import {
  DEVELOP_TEMPO,
  type DevelopGate,
  developGateScript,
  developLength,
  developMarkKey,
  developMs,
  developVars,
  developVerdict,
  growAt,
  parseDevelopMark,
  restAt,
} from "@/lib/disposable/contact-sheet-develop";
import type { HubDevelopFacts } from "@/lib/disposable/host-cover";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { isAlbumId } from "@/lib/events/album-wire";
import { reelOfAddress } from "@/lib/guest/reel-url";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * THE HUB DEVELOPS TOO (crumbs-73; the-wait r2's carried `hub`, deferred by arrival-wiring). Her hub's cover is her
 * guests' contact sheet all the while the album waits (`event-hub-head-cover.tsx`), so her first open after the develop
 * develops it where it stood: the same `DevelopSheet` her guests meet (`gallery-empty-state-sheet.tsx`), in the album's
 * place, its squares flashing up in the night's order, "Developing" turning to "Developed", the newest squares growing
 * into her album's first rows while the rest sink. The data and the tokens are the guests' (`contact-sheet-develop.ts`),
 * and so is the stylesheet's half (`gallery-empty-state.css`'s "THE DEVELOP", read from the same switch on the document),
 * so a re-tune of the develop is one change for both sides.
 *
 * ★ THE SAME MARK RULES AS HER GUESTS' (`pr_develop:<eventId>`, the develop time this phone saw): her first open after
 * the develop plays it, once per phone, however late; a host who opened the hub through the wait (the cover, or Look)
 * meets it on her next open after, and never twice (the mark is written as it ends or she ends it, and by a develop her
 * own guest page played on this phone); a develop she moves later plays again. `?reel` spends it unplayed (the reel was
 * what she came for), and a page that hydrates after the gate's release opens plainly.
 *
 * ★ REDUCED MOTION LANDS DEVELOPED AT ONCE: no sheet, no hold, the album as it stands, and the mark written.
 *
 * ★ IT PLAYS WHEN IT IS SEEN, NOT WHEN THE PAGE OPENS. Her album stands below the head, the cards and the checklist, so
 * the still sheet (the cover as it stood, "Developing") waits where the album's rows are, held under it from the first
 * byte (the gate script: `developGateScript`, drawn on the server's render and the hydration's only), and develops as it
 * scrolls into view and has stood a beat (`DEVELOP_TEMPO.leadMs`). A scroll never ends it (she must scroll to reach it);
 * a press or key in the album while it waits, and any press or key while it plays, ends it on its last frame at once.
 *
 * ★ HER MANIFEST HOLDS THE WHOLE ROLL, so unlike her guests' there is no landing to wait for: the roll is read off it as
 * the page opens (`hub-develop-roll.ts`), and her own are lit by the cover's own reading of them (`useHerShots`).
 * It loads only what she can see (the squares in the first screen and the tiles that grow), asked by id as her album
 * asks for its window's.
 */

/** How far below the fold a square's picture is still worth loading (a phone's momentum before she scrolls). */
const BELOW_FOLD_PX = 48;
/** A stage this tall is in view at a lesser share of itself (a short viewport, a sheet of many rows). */
const IN_VIEW_RATIO = 0.4;
const IN_VIEW_PX = 240;
/** The rest tiles that stagger by their place, before the album's own cap (`restAt`'s) takes the rest together. */
const STAGGERED_TILES =
  Math.ceil(DEVELOP_TEMPO.step.tileCap / DEVELOP_TEMPO.step.tile) + 1;

const ATTR = "data-develop";
const MOTION_ATTR = "data-develop-motion";
const SHEET_H = "--develop-sheet-h";
const PLAY_VARS = Object.keys(developVars("full"));

const noSubscribe = () => () => {};
/** The wall clock, for the gate's reading on the server's render and the hydration's (the render's own now). */
const wallClock = () => Date.now();
const docRoot = () =>
  typeof document === "undefined" ? null : document.documentElement;

/* ── this device's mark (the guests' key, so one phone plays one develop once, whichever page it met) ─────────────── */

const markListeners = new Set<() => void>();

function subscribeMark(listener: () => void) {
  markListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    markListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readMark(eventId: string): number | null {
  try {
    return parseDevelopMark(localStorage.getItem(developMarkKey(eventId)));
  } catch {
    return null;
  }
}

function writeMark(eventId: string, developsAtMs: number) {
  try {
    localStorage.setItem(developMarkKey(eventId), String(developsAtMs));
  } catch {
    // Storage refused (a private window): the develop may play again on her next open, which costs a few seconds.
  }
  for (const listener of markListeners) listener();
}

/** The develop time this phone last saw develop here, or null (and null on the server, which cannot know). */
function useDevelopMark(eventId: string): number | null {
  return useSyncExternalStore(
    subscribeMark,
    () => readMark(eventId),
    () => null,
  );
}

/* ── the switch, on the document (the guests': `html[data-develop]`, `held` then `play`) ──────────────────────────── */

/** What the gate script left on the window for this page to take up, if it ran. */
const readGate = (): DevelopGate | null =>
  typeof window === "undefined"
    ? null
    : ((window as { __prDevelop?: DevelopGate }).__prDevelop ?? null);

/** Whether the gate let its hold go before this page took it up (a page that hydrated late): it then opens plainly. */
function useGateReleased(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => readGate()?.released === true,
    () => false,
  );
}

/**
 * THE GATE, AS THE PAGE DRAWS IT: before the album's rows, on the server's render and the hydration's only (a page the
 * browser builds itself never runs an inline script, and its develop holds from its own first decision, before that
 * page paints).
 */
function HubDevelopGate({
  eventId,
  developsAtMs,
}: {
  eventId: string;
  developsAtMs: number;
}) {
  const firstRender = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true,
  );
  if (!firstRender) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: developGateScript({ eventId, developsAtMs }),
      }}
    />
  );
}

function holdDocument() {
  const root = docRoot();
  if (!root) return;
  for (const name of PLAY_VARS) root.style.removeProperty(name);
  root.removeAttribute(MOTION_ATTR);
  root.setAttribute(ATTR, "held");
}

function playDocument() {
  const root = docRoot();
  if (!root) return;
  for (const [name, value] of Object.entries(developVars("full")))
    root.style.setProperty(name, value);
  root.setAttribute(MOTION_ATTR, "full");
  root.setAttribute(ATTR, "play");
}

function releaseDocument() {
  const root = docRoot();
  if (!root) return;
  root.removeAttribute(ATTR);
  root.removeAttribute(MOTION_ATTR);
  for (const name of PLAY_VARS) root.style.removeProperty(name);
  root.style.removeProperty(SHEET_H);
}

/* ── the album's box ─────────────────────────────────────────────────────── */

/**
 * THE ALBUM'S ROWS, AND THE DEVELOP OVER THEM: the rows where they stand, held under the sheet while it develops (the
 * stylesheet's `[data-develop-rows]`), the box keeping the sheet's height (`[data-develop-album]`), and the sheet over
 * their top, where the cover stood all night. Its shape is the same whether or not a develop is owed, so the rows are
 * never remounted as one starts or ends.
 */
export function HubDevelop({
  eventId,
  develop,
  children,
}: {
  eventId: string;
  /** The event's develop facts (the page's): the develop time, set and reached, is what may be owed. */
  develop?: HubDevelopFacts | null;
  children: ReactNode;
}) {
  return (
    <div className="relative" data-develop-album="">
      {develop?.develops_at ? (
        <HubDevelopDirector
          eventId={eventId}
          developsAt={develop.develops_at}
        />
      ) : null}
      <div data-develop-rows="">{children}</div>
    </div>
  );
}

/** What this open decided at its first reading: the develop it plays, or what it spends. */
type Cold =
  | {
      verdict: "plays";
      key: string;
      atMs: number;
      roll: readonly string[];
    }
  | { verdict: "spent"; atMs: number }
  | { verdict: "none" };

/**
 * THE HUB'S DEVELOP DIRECTOR: decides once, at the first render that holds her manifest and her clock, whether this
 * open plays the develop, holds the document's switch while it does, and ends it. Nothing here for an album whose
 * develop time is still ahead (`develop.develops_at` later than now: the cover stands, or she is looking), which the
 * decision reads as none; a time that comes while she is looking never plays, and is owed her next open.
 */
function HubDevelopDirector({
  eventId,
  developsAt,
}: {
  eventId: string;
  developsAt: string;
}) {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const nowMs = useWaitClock();
  const mark = useDevelopMark(eventId);
  const gateReleased = useGateReleased();
  const reduced = usePrefersReducedMotion();
  const atMs = developMs(developsAt);

  /* THE COLD OPEN, decided once (adjusted in the render that holds everything it reads, so nothing paints before it). */
  const [cold, setCold] = useState<Cold | null>(null);
  if (cold === null && album !== null && entries !== null && nowMs !== null) {
    const since = mark !== null && atMs !== null && mark < atMs ? mark : null;
    const roll = atMs !== null ? hubRollOf(entries, atMs, since) : [];
    const verdict = gateReleased
      ? "none"
      : developVerdict({
          developsAtMs: atMs,
          nowMs,
          mark,
          roll: roll.length,
          // Her manifest is her whole album, and no door stands in front of her own hub.
          full: true,
          door: false,
          reelAsked: false,
        });
    if (verdict === "plays" && atMs !== null)
      setCold(
        reduced
          ? { verdict: "spent", atMs }
          : { verdict: "plays", key: `cold:${atMs}`, atMs, roll },
      );
    else setCold({ verdict: "none" });
  }

  const [ended, setEnded] = useState<ReadonlySet<string>>(() => new Set());
  const candidate = cold?.verdict === "plays" ? cold : null;
  const start =
    candidate &&
    !ended.has(candidate.key) &&
    !(mark !== null && mark >= candidate.atMs)
      ? candidate
      : null;

  // The gate's hold, taken up: this page owns the document's switch from its first decision.
  useLayoutEffect(() => {
    const gate = readGate();
    if (gate) gate.claimed = true;
  }, []);
  useLayoutEffect(() => {
    if (start) holdDocument();
    else if (cold !== null) releaseDocument();
  }, [start, cold]);
  // A page that goes takes its develop with it: the document never keeps a hold nobody will lift.
  useEffect(() => () => releaseDocument(), []);
  // Reduced motion lands developed at once: spent, the mark written.
  useEffect(() => {
    if (cold?.verdict === "spent") writeMark(eventId, cold.atMs);
  }, [cold, eventId]);

  const end = useCallback(
    (spent: boolean) => {
      if (!start) return;
      if (spent) writeMark(eventId, start.atMs);
      setEnded((prev) => new Set(prev).add(start.key));
    },
    [start, eventId],
  );
  // `?reel` over the hub is what she came for: spent unplayed. Read as the address stands a frame after the page mounts,
  // since a soft navigation renders against the page it leaves (`reelOfAddress`'s note); the reel's own black stands
  // over the hub meanwhile.
  useEffect(() => {
    if (!start) return;
    const frame = requestAnimationFrame(() => {
      if (reelOfAddress() !== null) end(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [start, end]);

  // The gate goes where a develop may be owed and the page paints before this knows: the server's own reading (a develop
  // time reached, something in the roll), drawn again by the hydration.
  const owedRoll = useMemo(
    () => (atMs !== null && entries ? hubRollOf(entries, atMs, null) : []),
    [entries, atMs],
  );
  const gateAtMs =
    atMs !== null && owedRoll.length > 0 && atMs <= wallClock() ? atMs : null;

  return (
    <>
      {gateAtMs !== null ? (
        <HubDevelopGate eventId={eventId} developsAtMs={gateAtMs} />
      ) : null}
      {start ? (
        <HubDevelopStage
          key={start.key}
          roll={start.roll}
          developsAt={developsAt}
          onEnd={end}
        />
      ) : null}
    </>
  );
}

/* ── the stage ───────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number };

type Grow = {
  id: string;
  /** Its turn among the growing, newest first. */
  k: number;
  /** Its square's moment in the wave. */
  wave: number;
  hers: boolean;
  src: string | null;
  from: Rect;
  to: Rect;
};

type Geometry = { grows: Grow[]; css: string; slots: ReadonlySet<string> };

const NO_SLOTS: ReadonlySet<string> = new Set();

const rectIn = (r: DOMRect, box: DOMRect): Rect => ({
  x: r.left - box.left,
  y: r.top - box.top,
  w: r.width,
  h: r.height,
});

/** The album's rows this develop plays over (`HubDevelop`'s `[data-develop-rows]`, beside the stage). */
const rowsOf = (stage: HTMLElement | null) =>
  stage?.parentElement?.querySelector<HTMLElement>("[data-develop-rows]") ??
  null;

/** A picture decoded before the sheet moves, settled whether it loaded or not (a browser without `decode` waits for none). */
function decoded(src: string): Promise<unknown> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return typeof img.decode === "function" ? img.decode() : Promise.resolve();
}

function HubDevelopStage({
  roll,
  developsAt,
  onEnd,
}: {
  roll: readonly string[];
  developsAt: string;
  onEnd: (spent: boolean) => void;
}) {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const linksRevision = useLinksRevision(album);
  const shots = useHerShots(roll);
  const hers = useMemo(() => new Set(shots.map((s) => s.key)), [shots]);
  const videos = useMemo(
    () => videoIdsOf(entries ?? [], roll),
    [entries, roll],
  );

  /* THE STILL SHEET, AND WHAT IT LOADS: the squares in the first screen, and the tiles that grow. */
  const stage = useRef<HTMLDivElement | null>(null);
  // Once it plays, what it loads stands: a picture arriving mid-play would start its own develop late.
  const settled = useRef(false);
  const [wanted, setWanted] = useState<ReadonlySet<string>>(() => new Set());
  const measureWanted = useCallback(() => {
    const el = stage.current;
    const rows = rowsOf(el);
    if (!el || settled.current) return;
    const fold = window.innerHeight + BELOW_FOLD_PX;
    const want = new Set<string>();
    const onSheet = new Set<string>();
    for (const sq of el.querySelectorAll<HTMLElement>("[data-develop-sq]")) {
      const id = sq.dataset.developSq!;
      onSheet.add(id);
      const r = sq.getBoundingClientRect();
      if (r.top < fold && r.bottom > 0) want.add(id);
    }
    if (rows)
      for (const tile of rows.querySelectorAll<HTMLElement>(
        "[data-media-tile][data-media-id]",
      )) {
        const id = tile.dataset.mediaId!;
        const r = tile.getBoundingClientRect();
        if (onSheet.has(id) && r.top < window.innerHeight && r.bottom > 0)
          want.add(id);
      }
    // Only ever more: a square that was in the first screen as she scrolled stays loaded.
    setWanted((prev) =>
      [...want].every((id) => prev.has(id))
        ? prev
        : new Set([...prev, ...want]),
    );
  }, []);

  // The sheet and the album's box as they lay out: the box keeps the sheet's height, and what is in the first screen is
  // read again (the sheet's width settles, the album's rows lay out under it).
  useLayoutEffect(() => {
    const el = stage.current;
    const root = docRoot();
    if (!el || !root || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      root.style.setProperty(SHEET_H, `${el.offsetHeight}px`);
      measureWanted();
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    const rows = rowsOf(el);
    if (rows) ro.observe(rows);
    return () => ro.disconnect();
  }, [measureWanted]);

  // The wanted ids' links, asked for as her album asks for its window's (the cover's newest are asked already).
  useEffect(() => {
    const owed = [...wanted].filter((id) => !album?.linkOf(id)?.tile);
    if (owed.length > 0) void album?.store.links.ensure(owed);
    // A link that lands is no reason to ask again: `wanted` moving is.
  }, [wanted, album]);

  const pictures = useMemo(() => {
    const map = new Map<string, DevelopPicture>();
    for (const id of wanted) {
      const src = album?.linkOf(id)?.tile;
      if (src) map.set(id, { src, video: videos.has(id) });
    }
    return map;
    // `linksRevision` stands for the links `linkOf` reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, album, videos, linksRevision]);

  /* WHEN IT IS SEEN: the sheet in view, the page in front, and the sheet stood a beat with its pictures decoded (or the
     cap passed): a page open on a slow link plays with dark squares rather than holding her album. */
  const [phase, setPhase] = useState<"still" | "play">("still");
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const [visible, setVisible] = useState(
    () =>
      typeof document === "undefined" || document.visibilityState === "visible",
  );
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (items) => {
        const item = items[items.length - 1];
        if (!item) return;
        setInView(
          item.isIntersecting &&
            (item.intersectionRatio >= IN_VIEW_RATIO ||
              item.intersectionRect.height >= IN_VIEW_PX),
        );
      },
      { threshold: [0, IN_VIEW_RATIO, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const onVisibility = () => {
      const shown = document.visibilityState === "visible";
      setVisible(shown);
      if (!shown) {
        // Put away mid-play: the sheet stands still again, and plays from the start when she is back.
        settled.current = false;
        setPhase("still");
        setGeometry(null);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  // What is in the first screen is read as she scrolls it into view (a scroll is never an end: she scrolls to reach it).
  useEffect(() => {
    if (!inView || phase !== "still") return;
    let frame = requestAnimationFrame(measureWanted);
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureWanted);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [inView, phase, measureWanted]);

  // Each time it is seen anew the still sheet stands its lead anew.
  const watching = visible && inView && phase === "still";
  const [session, setSession] = useState(0);
  const [wasWatching, setWasWatching] = useState(false);
  if (watching !== wasWatching) {
    setWasWatching(watching);
    if (watching) setSession((n) => n + 1);
  }
  const [leadFor, setLeadFor] = useState(-1);
  const [capFor, setCapFor] = useState(-1);
  useEffect(() => {
    if (!watching) return;
    const at = session;
    const lead = window.setTimeout(() => setLeadFor(at), DEVELOP_TEMPO.leadMs);
    const cap = window.setTimeout(
      () => setCapFor(at),
      DEVELOP_TEMPO.readyCapMs,
    );
    return () => {
      window.clearTimeout(lead);
      window.clearTimeout(cap);
    };
  }, [watching, session]);

  // The pictures it waits for: every wanted one with a link, decoded before it moves (each settles, loaded or not).
  const srcKey = useMemo(
    () =>
      [...pictures.values()]
        .map((p) => p.src)
        .sort()
        .join("\n"),
    [pictures],
  );
  const linked = [...wanted].every((id) => pictures.has(id));
  const [decodedKey, setDecodedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!linked) return;
    let current = true;
    void Promise.allSettled(srcKey.split("\n").filter(Boolean).map(decoded)).then(
      () => {
        if (current) setDecodedKey(srcKey);
      },
    );
    return () => {
      current = false;
    };
  }, [linked, srcKey]);

  /* THE PLAY: the geometry measured where everything is drawn, then the one clock starts. */
  const play = useCallback(() => {
    const el = stage.current;
    const rows = rowsOf(el);
    if (!el || !rows) return;
    const box = el.getBoundingClientRect();
    settled.current = true;
    const squares = new Map<
      string,
      { rect: Rect; wave: number; hers: boolean }
    >();
    for (const sq of el.querySelectorAll<HTMLElement>("[data-develop-sq]"))
      squares.set(sq.dataset.developSq!, {
        rect: rectIn(sq.getBoundingClientRect(), box),
        wave: Number(sq.dataset.developWave ?? 0),
        hers: sq.hasAttribute("data-hers"),
      });
    const grows: Grow[] = [];
    const rest: { id: string; k: number }[] = [];
    let k = 0;
    for (const tile of rows.querySelectorAll<HTMLElement>(
      "[data-media-tile][data-media-id]",
    )) {
      const id = tile.dataset.mediaId!;
      if (!isAlbumId(id)) continue;
      const r = tile.getBoundingClientRect();
      const place = k++;
      const square = squares.get(id);
      // The first screen's tiles grow out of their squares.
      if (square && r.top < window.innerHeight && r.bottom > 0)
        grows.push({
          id,
          k: place,
          wave: square.wave,
          hers: square.hers,
          src: album?.linkOf(id)?.tile ?? null,
          from: square.rect,
          to: rectIn(r, box),
        });
      else rest.push({ id, k: place });
    }
    grows.forEach((grow, i) => (grow.k = i));
    // The tiles that grow stand hidden under their squares until the play ends; the rest rise at their moments, the
    // first few by their place and every later one together at the last (`restAt`'s own cap).
    const rise = `:root[data-develop="play"][data-develop-motion="full"] [data-develop-rows] [data-media-tile]`;
    const css = [
      `${rise}[data-media-id]{animation-delay:${restAt(STAGGERED_TILES)}ms}`,
      ...rest
        .slice(0, STAGGERED_TILES)
        .map(
          (r, i) =>
            `${rise}[data-media-id="${r.id}"]{animation-delay:${restAt(i)}ms}`,
        ),
      ...grows.map(
        (g) =>
          `[data-develop-rows] [data-media-id="${g.id}"]{visibility:hidden!important;animation:none!important}`,
      ),
    ].join("\n");
    setGeometry({ grows, css, slots: new Set(grows.map((g) => g.id)) });
    setPhase("play");
  }, [album]);

  const ready =
    watching &&
    leadFor === session &&
    (decodedKey === srcKey || capFor === session);
  // A frame after it is ready, so the measure reads the layout that frame paints.
  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(play);
    return () => cancelAnimationFrame(frame);
  }, [ready, play]);

  // The document's clock starts in the very commit the drawing's does, and stands still again if the play stops.
  const playing = phase === "play" && geometry !== null;
  useLayoutEffect(() => {
    if (!playing) return;
    playDocument();
    return () => holdDocument();
  }, [playing]);
  const grows = geometry?.grows.length ?? 0;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => onEnd(true),
      developLength("full", grows),
    );
    return () => window.clearTimeout(timer);
  }, [playing, grows, onEnd]);

  // A press or a key ends it on its last frame, at once: while it plays anywhere on the page, while it waits only in her
  // album (a press on a card above it is no reason to take the develop from her). A window that changes size mid-play
  // ends it too (its tiles were measured where they stood), while the still sheet simply lays itself out again.
  useEffect(() => {
    const stop = () => onEnd(true);
    const opts = { capture: true, passive: true } as const;
    const section =
      stage.current?.closest("section") ?? stage.current?.parentElement;
    const target: EventTarget = playing ? window : (section ?? window);
    const kinds = ["pointerdown", "keydown"] as const;
    for (const kind of kinds) target.addEventListener(kind, stop, opts);
    if (playing) window.addEventListener("resize", stop, opts);
    return () => {
      for (const kind of kinds) target.removeEventListener(kind, stop, opts);
      window.removeEventListener("resize", stop, opts);
    };
  }, [onEnd, playing]);

  return (
    <div
      ref={stage}
      className="pointer-events-none absolute inset-x-0 top-0 z-10"
      data-hub-develop={playing ? "play" : "still"}
    >
      <DevelopSheet
        roll={roll}
        count={roll.length}
        hers={hers}
        pictures={pictures}
        slots={geometry?.slots ?? NO_SLOTS}
        stage={playing ? "play" : "still"}
        motion="full"
        developsAt={developsAt}
      />
      {playing && (
        <>
          <style>{geometry.css}</style>
          {geometry.grows.map((grow) => (
            <GrowingTile key={grow.id} grow={grow} />
          ))}
        </>
      )}
    </div>
  );
}

/**
 * ONE OF THE FIRST SCREEN'S PHOTOGRAPHS, GROWING OUT OF ITS SQUARE (the guests' `GrowingTile`, over her own rows): it
 * stands on its square from the first frame and develops there with the rest of the sheet (hers lit and rimmed), then
 * grows into its tile, where the album's own tile stands under it when the play ends.
 */
function GrowingTile({ grow }: { grow: Grow }) {
  const at = growAt(grow.k);
  return (
    <div
      className="develop-a wait-develop-grow wait-develop-as-cell absolute overflow-hidden"
      data-develop-grow={grow.id}
      data-hers={grow.hers ? "" : undefined}
      style={
        {
          left: grow.to.x,
          top: grow.to.y,
          width: grow.to.w,
          height: grow.to.h,
          borderRadius: "var(--radius-tile)",
          "--develop-fx": `${grow.from.x}px`,
          "--develop-fy": `${grow.from.y}px`,
          "--develop-fw": `${grow.from.w}px`,
          "--develop-fh": `${grow.from.h}px`,
          ...developAt(at),
        } as CSSProperties
      }
    >
      {grow.src && (
        // eslint-disable-next-line @next/next/no-img-element -- the album tile's own presigned picture (media-cost-policy)
        <img
          src={grow.src}
          alt=""
          draggable={false}
          className={cn(
            "absolute inset-0 size-full object-cover",
            !grow.hers && "develop-a wait-develop-up",
          )}
          style={grow.hers ? undefined : developAt(grow.wave)}
        />
      )}
      {grow.hers ? (
        <span
          aria-hidden
          className="develop-a wait-develop-rim"
          style={developAt(at)}
        />
      ) : (
        <span
          aria-hidden
          className="develop-a wait-develop-flash"
          style={developAt(grow.wave)}
        />
      )}
    </div>
  );
}
