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
  ContactSheet,
  developAt,
  type DevelopPicture,
  DevelopSheet,
} from "@/components/guest/gallery-empty-state-sheet";
import {
  type AlbumWaitState,
  AlbumWaitStateProvider,
  useAlbumWaiting,
  useAlbumWaitState,
} from "@/components/guest/gallery-empty-state-yield";
import type { GalleryLive } from "@/components/guest/gallery-live";
import type { HerShots } from "@/components/guest/upload-tracker";
import { type HerShot, waitStands } from "@/lib/disposable/contact-sheet";
import {
  DEVELOP_TEMPO,
  type DevelopGate,
  type DevelopMotion,
  developGateScript,
  developLength,
  developMarkKey,
  developMs,
  developVars,
  developVerdict,
  growAt,
  parseDevelopMark,
  restAt,
  rollOfEntries,
} from "@/lib/disposable/contact-sheet-develop";
import type { WaitingFacts } from "@/lib/disposable/facts";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { type WaitClock, waitRule } from "@/lib/disposable/wait-words";
import { isAlbumId, type ManifestEntry } from "@/lib/events/album-wire";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * THE ALBUM'S WAIT: THE CONTACT SHEET (the-wait r1, Will's `wait=sheet`, his disposable-mode r3 pick ported to the
 * album itself: "revisit the event page while developing to see your shots in similar small tiles"). Wherever an album
 * holds photos back (for the host's approval, or until a develop time), a guest meets one square a photo in the order
 * the night took them, everyone's dark and filling live, hers lit with her own photographs, the count over it and the
 * clock under it. Will's walk, which opened the board: his upload "landed" and then "vanished back to the empty state
 * ... a new guest would likely think that's a bug". Here her photo, once it lands, stays where it landed.
 *
 * ★ EVERYONE'S IS NUMBERS ALONE, HERS ARE HERS ALONE. Everyone's squares are drawn from the sync's waiting facts (a
 * count and its minutes, never an id: `GalleryLive.waiting`); her own from her tracker's read and this device's own
 * files (`HerShots`, published by `UploadTracker`, the one place that holds her rows). Nothing on this sheet is ever
 * another guest's picture, name or id (`lib/disposable/contact-sheet.ts`).
 *
 * ★ IT STANDS ABOVE THE ALBUM, AND IS THE EMPTY ALBUM'S STATE WHILE IT STANDS. The page mounts the sheet over the
 * album's rows (`event-experience.tsx`), and the album's own empty state yields to it (`AlbumWaitYield`): both read the
 * one reading this source makes, so an album with nothing a guest can see yet is this sheet and nothing else, and one
 * that has photos already shows the wait above them.
 */

const NO_SHOTS: readonly HerShot[] = [];
const noSubscription = () => () => {};
const noShots = () => NO_SHOTS;

/**
 * THE PAGE'S SOURCE FOR THE ALBUM'S WAIT, inside the album's live provider: it reads what waits off the album's sync
 * (the provider's `AlbumWaitingProvider`) and her own off her tracker, decides whether the sheet stands, and hands
 * both readers that one reading.
 */
export function AlbumWaitSource({
  clock,
  hers: hersStore,
  onOpenHers,
  firstPaintWidth = null,
  rule = false,
  children,
}: {
  /** The album's live reading as a clock (`waitWords`): the host's approval, or a develop time ahead; null for none. */
  clock: WaitClock | null;
  /** Her waiting shots, as her tracker publishes them; null where nobody tracks hers. */
  hers: HerShots | null;
  onOpenHers?: () => void;
  /** The width the album's rows last laid at on this device (the page's `pr_album_w`). */
  firstPaintWidth?: number | null;
  /** She can add here (full access, uploads open): the album's rule is hers to read before anything waits. */
  rule?: boolean;
  children: ReactNode;
}) {
  const live = useAlbumWaiting();
  const hers = useSyncExternalStore(
    hersStore?.subscribe ?? noSubscription,
    hersStore?.get ?? noShots,
    noShots,
  );
  const full = live?.access === "full";
  const waiting = full ? (live?.waiting ?? null) : null;
  const sending = hers.filter((s) => s.sending).length;
  const stands =
    full &&
    waitStands({
      waits: clock !== null,
      count: waiting?.count ?? 0,
      sending,
      landed: hers.length - sending,
    });
  const says = full && rule && clock !== null;
  const state = useMemo<AlbumWaitState>(
    () => ({
      stands,
      waiting,
      hers,
      clock,
      rule: says,
      onOpenHers,
      firstPaintWidth,
    }),
    [stands, waiting, hers, clock, says, onOpenHers, firstPaintWidth],
  );
  return (
    <AlbumWaitStateProvider value={state}>{children}</AlbumWaitStateProvider>
  );
}

/**
 * The album's wait, above its rows: the sheet while it stands; before anything waits, the album's one rule in its
 * place (`ruleClassName`, the page's words column), so a guest reads how uploads develop here before her first add,
 * and reads it once: the sheet's clock says it from the moment the sheet stands.
 */
export function AlbumWait({
  className,
  ruleClassName,
}: {
  className?: string;
  ruleClassName?: string;
}) {
  const state = useAlbumWaitState();
  if (!state?.clock) return null;
  if (!state.stands)
    return state.rule ? (
      <WaitRuleLine
        clock={state.clock}
        className={ruleClassName ?? className}
      />
    ) : null;
  return (
    <div className={className} data-album-wait={state.clock.kind}>
      <ContactSheet
        waiting={state.waiting}
        hers={state.hers}
        clock={state.clock}
        onOpenHers={state.onOpenHers}
        firstPaintWidth={state.firstPaintWidth}
      />
    </div>
  );
}

/**
 * THE ALBUM'S ONE RULE, in the wait's words (the-wait r1, `model=time`): how uploads develop here, the time in her own
 * clock once it is known (`useWaitClock`; the server's render says the rule without it).
 */
function WaitRuleLine({
  clock,
  className,
}: {
  clock: WaitClock;
  className?: string;
}) {
  const nowMs = useWaitClock();
  return (
    <div className={className}>
      <p
        data-develop-note={clock.kind === "develop" ? "" : undefined}
        data-wait-rule={clock.kind}
        className="rounded-md bg-muted px-3 py-2 text-center text-reading text-muted-foreground"
      >
        {waitRule(clock, nowMs)}
      </p>
    </div>
  );
}

/* ══ THE DEVELOP (the-wait r2, Will's `arrival=in-place`) ══════════════════════════════════════════════════════════ */

/**
 * THE ALBUM'S FIRST OPEN AFTER ITS ROLL DEVELOPS: the contact sheet she watched all night develops where it stood and
 * opens into the album (`DevelopSheet`, the squares a tile grows out of drawn here over it). The data and the tokens are
 * `lib/disposable/contact-sheet-develop.ts`; the stylesheet's half is `gallery-empty-state.css`'s "THE DEVELOP".
 *
 * ★ WHEN IT PLAYS (the board's carried `when`, taken): her first open after the develop, on this device, however late
 * (a mark in this browser's storage, the develop time it saw); live, in place, if the page is open as the roll develops
 * (the 9 am clock, or the host's Develop now); never again, and never for an album that holds nothing back. A first open
 * that came through the door (its page or its scrim) or for the reel spends it unplayed: that was her arrival.
 *
 * ★ IT HOLDS FROM THE FIRST BYTE. The page's server cannot read the mark, so its gate script (`developGateScript`)
 * holds the cover on its house light and the album under the sheet before anything paints; this takes the hold up once
 * the album's seed is read and plays it, or lets it go.
 *
 * ★ ANY PRESS, SCROLL OR KEY ENDS IT ON ITS LAST FRAME AT ONCE (the board's carried `stop`), and spends it. A page put
 * away mid-play stands the sheet still again and plays it from the start when she is back; a page left mid-play is not
 * marked, so her return plays it whole.
 *
 * ★ IT LOADS ONLY WHAT SHE CAN SEE: the pictures of the squares in the first screen and of the tiles that grow (the
 * album's own first-screen tiles), asked for by id as the album asks for its window's; a square below the fold
 * develops in the dark, where nobody watches it.
 */

/** The seed's roll facts: its entries (with their times), the album's whole count, and whether more pages follow. */
type SeedRoll = {
  entries: readonly ManifestEntry[];
  total: number;
  more: boolean;
} | null;

type SeedCell = { value: SeedRoll | undefined; listeners: Set<() => void> };
const seedRolls = new WeakMap<Promise<GallerySeed>, SeedCell>();

/**
 * THE SEED'S ROLL FACTS, READ ONCE PER SEED AND NEVER THROWN (the album's own source reads it the same way:
 * `gallery-live.tsx`'s `readSeed`, its `Promise.resolve` first, since the page's promise is React Flight's thenable).
 * The page primes it as it renders, so by the time the album has drawn, its value is in hand and nothing suspends.
 */
export function primeSeedRoll(seed: Promise<GallerySeed>): SeedCell {
  const known = seedRolls.get(seed);
  if (known) return known;
  const cell: SeedCell = { value: undefined, listeners: new Set() };
  seedRolls.set(seed, cell);
  void Promise.resolve(seed)
    .then(
      (read): SeedRoll =>
        read?.kind === "full" && Array.isArray(read.sync?.entries)
          ? {
              entries: read.sync.entries,
              total: read.sync.total,
              more: read.sync.next != null,
            }
          : null,
      (): SeedRoll => null,
    )
    .catch((): SeedRoll => null)
    .then((value) => {
      cell.value = value;
      for (const listener of cell.listeners) listener();
    });
  return cell;
}

function useSeedRoll(seed: Promise<GallerySeed>): SeedRoll | undefined {
  const cell = primeSeedRoll(seed);
  const subscribe = useCallback(
    (listener: () => void) => {
      cell.listeners.add(listener);
      return () => void cell.listeners.delete(listener);
    },
    [cell],
  );
  return useSyncExternalStore(
    subscribe,
    () => cell.value,
    () => undefined,
  );
}

/* ── this device's mark ──────────────────────────────────────────────────── */

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

/** The develop time this device last saw develop here, or null (and null on the server, which cannot know). */
function useDevelopMark(eventId: string): number | null {
  return useSyncExternalStore(
    subscribeMark,
    () => readMark(eventId),
    () => null,
  );
}

/* ── the switch, on the document ─────────────────────────────────────────── */

const ATTR = "data-develop";
const MOTION_ATTR = "data-develop-motion";
const SHEET_H = "--develop-sheet-h";
const PLAY_VARS = Object.keys(developVars("full"));

const docRoot = () =>
  typeof document === "undefined" ? null : document.documentElement;

/** What the gate script left on the window for this page to take up, if it ran. */
const readGate = (): DevelopGate | null =>
  typeof window === "undefined"
    ? null
    : ((window as { __prDevelop?: DevelopGate }).__prDevelop ?? null);

const noSubscribe = () => () => {};

/** Whether the gate let its hold go before this page took it up (a page that hydrated late): it then opens plainly. */
function useGateReleased(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => readGate()?.released === true,
    () => false,
  );
}

/**
 * THE GATE, AS THE PAGE DRAWS IT (`developGateScript`): before the cover, on the server's render and the hydration's
 * only. A page the browser builds itself (a navigation inside the app) never runs an inline script, and React refuses
 * to draw one there; its develop holds from its own first decision, before that page paints.
 */
export function DevelopGate({
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

function playDocument(motion: DevelopMotion) {
  const root = docRoot();
  if (!root) return;
  for (const [name, value] of Object.entries(developVars(motion)))
    root.style.setProperty(name, value);
  root.setAttribute(MOTION_ATTR, motion);
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

/* ── what starts a develop ───────────────────────────────────────────────── */

/** The sheet as it stood, on a page open across its develop. */
type Night = {
  waiting: Pick<WaitingFacts, "count" | "minutes"> | null;
  hers: readonly HerShot[];
  clock: WaitClock;
  /** The album's ids while the sheet stood: the roll is what lands after them. */
  before: ReadonlySet<string>;
};

type DevelopStart =
  | {
      kind: "cold";
      key: string;
      developsAt: string;
      developsAtMs: number;
      roll: readonly string[];
      count: number;
    }
  | {
      kind: "live";
      key: string;
      developsAt: string;
      developsAtMs: number;
      night: Night;
      /** The sync's word on what waits as the develop came: a newer one saying nothing waits ends the landing. */
      facts: unknown;
    };

/** What this open decided at its first reading: the develop it plays, or what it spends. */
type Cold =
  | { verdict: "plays"; start: DevelopStart }
  | { verdict: "spent"; atMs: number }
  | { verdict: "none" };

/** What the page tells the album's develop (`event-experience.tsx`, through the album's own view). */
export type AlbumDevelopProps = {
  eventId: string;
  /** The album's develop time as the page holds it, ahead or reached (`useLiveUploadsWait`'s), or null for none. */
  developsAt: string | null;
  /** The page's album seed: the roll's times. */
  seed: Promise<GallerySeed>;
  /** The door stood at this open's first byte (its page, or its scrim over a sheet step). */
  arrivedThroughDoor: boolean;
  /** She came for the reel (`?reel`). */
  reelAsked: boolean;
  /** The door's stage stands over the album: a develop under it ends, spent. */
  doorStands: boolean;
  /** The door may yet have a word for her (its first report is still to come): a develop waits for it. */
  doorWaits: boolean;
  isDemo: boolean;
  firstPaintWidth?: number | null;
};

/**
 * THE ALBUM'S DEVELOP, inside the album's live source and the wait's: the album's own view mounts it beside its rows, in
 * the album's box (`live-gallery.tsx`, handed the page's word), and it decides whether this open plays the develop, and
 * plays it.
 */
export function AlbumDevelop({
  live,
  eventId,
  developsAt,
  seed,
  arrivedThroughDoor,
  reelAsked,
  doorStands,
  doorWaits,
  isDemo,
  firstPaintWidth = null,
}: AlbumDevelopProps & { live: GalleryLive | null }) {
  const wait = useAlbumWaitState();
  const seedRoll = useSeedRoll(seed);
  const nowMs = useWaitClock();
  const mark = useDevelopMark(eventId);
  const gateReleased = useGateReleased();
  const reduced = usePrefersReducedMotion();
  const motion: DevelopMotion = reduced ? "reduced" : "full";
  const atMs = developMs(developsAt);
  const full = live?.access === "full" && !isDemo;
  const items = live?.items ?? null;

  /* THE COLD OPEN, decided once, at the first render that holds the seed, her clock and the album's first answer
     (adjusted in that render, so nothing paints before it). */
  const [cold, setCold] = useState<Cold | null>(null);
  if (
    cold === null &&
    seedRoll !== undefined &&
    nowMs !== null &&
    live !== null &&
    live.albumRead !== "trying"
  ) {
    const since = mark !== null && atMs !== null && mark < atMs ? mark : null;
    const roll =
      seedRoll && atMs !== null && live.albumRead === "ready"
        ? rollOfEntries(seedRoll.entries, atMs, since)
        : [];
    const verdict = gateReleased
      ? "none"
      : developVerdict({
          developsAtMs: atMs,
          nowMs,
          mark,
          roll: roll.length,
          full,
          door: arrivedThroughDoor,
          reelAsked,
        });
    if (verdict === "plays" && developsAt && atMs !== null && seedRoll) {
      // Past the first page of a long album the roll runs on: its count is the album's, less what came after it.
      const newer = seedRoll.entries.length - roll.length;
      setCold({
        verdict,
        start: {
          kind: "cold",
          key: `cold:${atMs}`,
          developsAt,
          developsAtMs: atMs,
          roll,
          count:
            seedRoll.more && since === null
              ? Math.max(roll.length, seedRoll.total - newer)
              : roll.length,
        },
      });
    } else if (verdict === "spent" && atMs !== null) {
      setCold({ verdict, atMs });
    } else {
      setCold({ verdict: "none" });
    }
  }

  /* THE LIVE DEVELOP: the sheet stood, and its wait ended as its develop came (the 9 am clock, or the host's Develop
     now). The sheet is remembered while it stands, and the develop starts in the render that sees it end. */
  const [night, setNight] = useState<Night | null>(null);
  const [liveStart, setLiveStart] = useState<DevelopStart | null>(null);
  const stands = !!wait?.stands && wait.clock?.kind === "develop";
  if (stands && wait?.clock && items) {
    if (
      !night ||
      night.waiting !== wait.waiting ||
      night.hers !== wait.hers ||
      night.clock !== wait.clock
    )
      setNight({
        waiting: wait.waiting,
        hers: wait.hers,
        clock: wait.clock,
        // The album as it stood when the sheet first stood: nothing a guest can see arrives while a roll waits.
        before: night?.before ?? new Set(items.map((item) => item.id)),
      });
  } else if (night) {
    setNight(null);
    // It waits for something else now (the host's approval), or the develop time was taken away: no develop.
    const owed = !(mark !== null && atMs !== null && mark >= atMs);
    if (
      !wait?.clock &&
      developsAt &&
      atMs !== null &&
      full &&
      owed &&
      !doorStands
    )
      setLiveStart({
        kind: "live",
        key: `live:${atMs}`,
        developsAt,
        developsAtMs: atMs,
        night,
        facts: live?.waiting ?? null,
      });
  }

  /* WHAT PLAYS NOW: the live develop over the cold one, until it ends (spent, its mark ends it; unspent, it is let go). */
  const [ended, setEnded] = useState<ReadonlySet<string>>(() => new Set());
  const candidate =
    liveStart ?? (cold?.verdict === "plays" ? cold.start : null);
  const start =
    candidate &&
    !ended.has(candidate.key) &&
    !(mark !== null && mark >= candidate.developsAtMs)
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
  // A first open the door or the reel took: the develop is spent here, unplayed.
  useEffect(() => {
    if (cold?.verdict === "spent") writeMark(eventId, cold.atMs);
  }, [cold, eventId]);
  // A page open across the develop asks the album now, rather than at its next calm tick: the develop's rows.
  const liveKey = liveStart?.key;
  useEffect(() => {
    if (liveKey) void live?.retryAlbum();
    // Once per live develop: the album's own source moving is no reason to ask again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKey]);
  // A page that goes takes its develop with it: the document never keeps a hold nobody will lift.
  useEffect(() => () => releaseDocument(), []);

  const end = useCallback(
    (spent: boolean) => {
      if (!start) return;
      if (spent) writeMark(eventId, start.developsAtMs);
      setEnded((prev) => new Set(prev).add(start.key));
    },
    [start, eventId],
  );

  const hers = useMemo(() => {
    const own = new Set(live?.ownIds ?? []);
    if (start?.kind === "live")
      for (const shot of start.night.hers) if (!shot.sending) own.add(shot.key);
    return own;
  }, [live?.ownIds, start]);

  if (!start || !live) return null;
  return (
    <DevelopStage
      key={start.key}
      start={start}
      live={live}
      hers={hers}
      motion={motion}
      doorStands={doorStands}
      doorWaits={doorWaits}
      firstPaintWidth={firstPaintWidth ?? wait?.firstPaintWidth ?? null}
      onEnd={end}
    />
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

/** How far below the fold a square's picture is still worth loading (a phone's momentum before she scrolls). */
const BELOW_FOLD_PX = 48;
/** How often a page open across the develop asks the album again while the roll has not landed. */
const LAND_RETRY_MS = 4_000;
const NO_SLOTS: ReadonlySet<string> = new Set();

const rectIn = (r: DOMRect, box: DOMRect): Rect => ({
  x: r.left - box.left,
  y: r.top - box.top,
  w: r.width,
  h: r.height,
});

/** A photograph's picture as the album's tile draws it (its preview, or a photo's original), or null. */
function tileSrc(
  item: GalleryLive["items"][number] | undefined,
): string | null {
  if (!item) return null;
  if (item.previewUrl) return item.previewUrl;
  return item.type === "photo" && item.url ? item.url : null;
}

/** The album's rows this develop plays over (`live-gallery.tsx`'s `[data-develop-rows]`, beside the stage). */
const rowsOf = (stage: HTMLElement | null) =>
  stage?.parentElement?.querySelector<HTMLElement>("[data-develop-rows]") ??
  null;

function DevelopStage({
  start,
  live,
  hers,
  motion,
  doorStands,
  doorWaits,
  firstPaintWidth,
  onEnd,
}: {
  start: DevelopStart;
  live: GalleryLive;
  hers: ReadonlySet<string>;
  motion: DevelopMotion;
  doorStands: boolean;
  doorWaits: boolean;
  firstPaintWidth: number | null;
  onEnd: (spent: boolean) => void;
}) {
  const { items, ensureLinks } = live;
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const order = useMemo(
    () => new Map(items.map((item, i) => [item.id, i])),
    [items],
  );

  /* THE ROLL: the seed's, or, live, what has landed since the sheet stood (once all of it has). */
  const landed = useMemo(
    () =>
      start.kind === "live"
        ? items
            .filter((item) => !start.night.before.has(item.id))
            .map((item) => item.id)
        : null,
    [start, items],
  );
  const factsMoved = start.kind === "live" && live.waiting !== start.facts;
  const nothingWaits = factsMoved && (live.waiting?.count ?? 0) === 0;
  const roll: readonly string[] | null = useMemo(() => {
    if (start.kind === "cold") return start.roll;
    const expected = start.night.waiting?.count ?? 0;
    if (
      landed &&
      landed.length > 0 &&
      (landed.length >= expected || nothingWaits)
    )
      return landed;
    return null;
  }, [start, landed, nothingWaits]);
  const count = start.kind === "cold" ? start.count : (roll?.length ?? 0);

  // Live: ask again while the roll has not landed, and give the album back plainly if it never does.
  const landing = start.kind === "live" && roll === null;
  useEffect(() => {
    if (!landing) return;
    const retry = window.setInterval(
      () => void live.retryAlbum(),
      LAND_RETRY_MS,
    );
    const cap = window.setTimeout(() => onEnd(false), DEVELOP_TEMPO.landCapMs);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(cap);
    };
  }, [landing, live, onEnd]);
  // The develop came and nothing she can see came with it (every shot of the roll was removed): nothing to play.
  const emptied = landing && nothingWaits && (landed?.length ?? 0) === 0;
  useEffect(() => {
    if (emptied) onEnd(true);
  }, [emptied, onEnd]);

  /* THE STILL SHEET, AND WHAT IT LOADS: the squares in the first screen, hers, and the tiles that grow. */
  const stage = useRef<HTMLDivElement | null>(null);
  const [wanted, setWanted] = useState<ReadonlySet<string>>(
    () => new Set(hers),
  );
  const measureWanted = useCallback(() => {
    const el = stage.current;
    const rows = rowsOf(el);
    if (!el || !rows) return;
    const fold = window.innerHeight + BELOW_FOLD_PX;
    const want = new Set<string>();
    const onSheet = new Set<string>();
    for (const sq of el.querySelectorAll<HTMLElement>("[data-develop-sq]")) {
      const id = sq.dataset.developSq!;
      onSheet.add(id);
      const r = sq.getBoundingClientRect();
      if (hers.has(id) || (r.top < fold && r.bottom > 0)) want.add(id);
    }
    for (const tile of rows.querySelectorAll<HTMLElement>(
      "[data-media-tile][data-media-id]",
    )) {
      const id = tile.dataset.mediaId!;
      const r = tile.getBoundingClientRect();
      if (onSheet.has(id) && r.top < window.innerHeight && r.bottom > 0)
        want.add(id);
    }
    setWanted((prev) =>
      prev.size === want.size && [...want].every((id) => prev.has(id))
        ? prev
        : want,
    );
  }, [hers]);

  // The sheet and the album's box as they lay out: the box keeps the sheet's height, and what is in the first screen
  // is read again (the sheet's width settles, the album's rows lay out under it).
  useLayoutEffect(() => {
    const el = stage.current;
    const root = docRoot();
    if (!el || !root) return;
    const sync = () => {
      root.style.setProperty(SHEET_H, `${el.offsetHeight}px`);
      measureWanted();
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    const rows = rowsOf(el);
    if (rows) ro.observe(rows);
    return () => ro.disconnect();
  }, [measureWanted, roll]);

  // The wanted ids' links, asked for as the album asks for its window's.
  useEffect(() => {
    const owed = [...wanted].filter((id) => !tileSrc(byId.get(id)));
    if (owed.length > 0) ensureLinks(owed);
  }, [wanted, byId, ensureLinks]);

  const pictures = useMemo(() => {
    const map = new Map<string, DevelopPicture>();
    for (const id of wanted) {
      const item = byId.get(id);
      // A square draws the small preview alone: a photograph without one keeps its square dark (its tile, its original).
      if (item?.previewUrl)
        map.set(id, { src: item.previewUrl, video: item.type === "video" });
    }
    return map;
  }, [wanted, byId]);

  /* READY: the roll in hand, its pictures decoded (or the cap passed), the lead stood, the door quiet, the page seen. */
  const [phase, setPhase] = useState<"still" | "play">("still");
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [visible, setVisible] = useState(
    () =>
      typeof document === "undefined" || document.visibilityState === "visible",
  );
  // Each time the page is seen again the still sheet stands its lead anew.
  const [seen, setSeen] = useState(0);
  const [leadFor, setLeadFor] = useState(-1);
  const [capFor, setCapFor] = useState(-1);
  useEffect(() => {
    const onVisibility = () => {
      const shown = document.visibilityState === "visible";
      setVisible(shown);
      if (shown) setSeen((n) => n + 1);
      else {
        // Put away mid-play: the sheet stands still again, and plays from the start when she is back.
        setPhase("still");
        setGeometry(null);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (!visible || phase !== "still") return;
    const at = seen;
    const lead = window.setTimeout(() => setLeadFor(at), DEVELOP_TEMPO.leadMs);
    const cap = window.setTimeout(
      () => setCapFor(at),
      DEVELOP_TEMPO.readyCapMs,
    );
    return () => {
      window.clearTimeout(lead);
      window.clearTimeout(cap);
    };
  }, [visible, phase, seen]);

  // The pictures it waits for: every wanted one with a link, decoded before it moves (each settles, loaded or not).
  const srcKey = useMemo(
    () =>
      [...wanted]
        .map((id) => tileSrc(byId.get(id)))
        .filter((src): src is string => src !== null)
        .sort()
        .join("\n"),
    [wanted, byId],
  );
  const linked = [...wanted].every((id) => tileSrc(byId.get(id)) !== null);
  const [decodedKey, setDecodedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!roll || !linked) return;
    let current = true;
    void Promise.allSettled(
      srcKey
        .split("\n")
        .filter(Boolean)
        .map((src) => {
          const img = new Image();
          img.decoding = "async";
          img.src = src;
          return img.decode();
        }),
    ).then(() => {
      if (current) setDecodedKey(srcKey);
    });
    return () => {
      current = false;
    };
  }, [roll, linked, srcKey]);

  /* THE PLAY: the geometry measured where everything is drawn, then the one clock starts. */
  const play = useCallback(() => {
    const el = stage.current;
    const rows = rowsOf(el);
    if (!el || !rows) return;
    const box = el.getBoundingClientRect();
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
    for (const tile of rows.querySelectorAll<HTMLElement>(
      "[data-media-tile][data-media-id]",
    )) {
      const id = tile.dataset.mediaId!;
      if (!isAlbumId(id)) continue;
      const r = tile.getBoundingClientRect();
      const k = order.get(id) ?? 0;
      const square = squares.get(id);
      // The first screen's tiles grow out of their squares; reduced motion moves nothing.
      if (
        motion === "full" &&
        square &&
        r.top < window.innerHeight &&
        r.bottom > 0
      )
        grows.push({
          id,
          k,
          wave: square.wave,
          hers: square.hers,
          src: tileSrc(byId.get(id)),
          from: square.rect,
          to: rectIn(r, box),
        });
      else rest.push({ id, k });
    }
    grows.sort((a, b) => a.k - b.k);
    grows.forEach((grow, i) => (grow.k = i));
    // The tiles that grow stand hidden under their squares until the play ends; the rest rise at their moments.
    const css = [
      ...grows.map(
        (g) =>
          `[data-develop-rows] [data-media-id="${g.id}"]{visibility:hidden!important;animation:none!important}`,
      ),
      ...rest.map(
        (r) =>
          `:root[data-develop="play"][data-develop-motion="full"] [data-develop-rows] [data-media-tile][data-media-id="${r.id}"]{animation-delay:${restAt(r.k)}ms}`,
      ),
    ].join("\n");
    setGeometry({ grows, css, slots: new Set(grows.map((g) => g.id)) });
    setPhase("play");
  }, [motion, order, byId]);

  const ready =
    roll !== null &&
    visible &&
    !doorWaits &&
    leadFor === seen &&
    (decodedKey === srcKey || capFor === seen);
  // A frame after it is ready, so the measure reads the layout that frame paints.
  useEffect(() => {
    if (phase !== "still" || !ready) return;
    const frame = requestAnimationFrame(play);
    return () => cancelAnimationFrame(frame);
  }, [phase, ready, play]);

  // The document's clock starts in the very commit the drawing's does, and stands still again if the play stops.
  const playing = phase === "play" && geometry !== null;
  useLayoutEffect(() => {
    if (!playing) return;
    playDocument(motion);
    return () => holdDocument();
  }, [playing, motion]);
  const grows = geometry?.grows.length ?? 0;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => onEnd(true),
      developLength(motion, grows),
    );
    return () => window.clearTimeout(timer);
  }, [playing, motion, grows, onEnd]);

  // Any press, scroll or key ends it on its last frame, at once.
  useEffect(() => {
    const stop = () => onEnd(true);
    const opts = { capture: true, passive: true } as const;
    const kinds = [
      "pointerdown",
      "keydown",
      "wheel",
      "touchmove",
      "resize",
    ] as const;
    for (const kind of kinds) window.addEventListener(kind, stop, opts);
    return () => {
      for (const kind of kinds) window.removeEventListener(kind, stop, opts);
    };
  }, [onEnd]);
  // The door's stage coming over the album ends it, spent: the door is the page now.
  useEffect(() => {
    if (doorStands) onEnd(true);
  }, [doorStands, onEnd]);

  return (
    <div
      ref={stage}
      className="pointer-events-none absolute inset-x-0 top-0 z-10"
      data-develop-stage={playing ? "play" : "still"}
    >
      {roll ? (
        <DevelopSheet
          roll={roll}
          count={count}
          hers={hers}
          pictures={pictures}
          slots={geometry?.slots ?? NO_SLOTS}
          stage={playing ? "play" : "still"}
          motion={motion}
          developsAt={start.developsAt}
          firstPaintWidth={firstPaintWidth}
        />
      ) : start.kind === "live" ? (
        // The roll still landing: the sheet as it stood, Developing, while the album asks for it.
        <ContactSheet
          waiting={start.night.waiting}
          hers={start.night.hers}
          clock={start.night.clock}
          firstPaintWidth={firstPaintWidth}
        />
      ) : null}
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
 * ONE OF THE FIRST SCREEN'S PHOTOGRAPHS, GROWING OUT OF ITS SQUARE: it stands on its square from the first frame and
 * develops there with the rest of the sheet (hers lit and rimmed), then grows into its tile, where the album's own
 * tile stands under it when the play ends.
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
