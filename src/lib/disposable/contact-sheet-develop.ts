/**
 * THE DEVELOP, AS DATA (the-wait r2, Will's `arrival=in-place`): the first open of an album after its roll develops
 * plays the contact sheet she watched all night developing where it stood, into the album's first rows. Its squares
 * flash and come up in the night's order, "Developing" turns to "Developed", the cover comes up out of its house light,
 * then the newest squares grow into the album's first rows while the rest sink and the well dissolves. Reduced motion
 * is its own pass: fades alone.
 *
 * ★ THE TEMPO AND THE EASING ARE TOKENS, AND THIS IS THEIR ONE HOME (`DEVELOP_TEMPO`). Every moment, duration and curve
 * of the develop is read from here: the drawing's per-square moments by the functions below, and the stylesheet's
 * durations and curves through `developVars` (`gallery-empty-state.css` names no number of its own), so the brand
 * round's motion principles re-tune the whole develop in one change.
 *
 * ★ THE ROLL IS WHAT DEVELOPED, NEVER A GUESS AT WHAT WAITED. A guest never learned a waiting id (the seal's own rule,
 * `contact-sheet.ts`), so the develop's sheet is drawn from what the album holds once it has developed: the seed's
 * entries created at or before the develop time, or, on a page open across the develop, the photographs that landed
 * after it. Each square is then the very photograph the tile it grows into is.
 *
 * ★ ONCE PER DEVICE (the board's carried answer, `when`): a mark in this browser's storage, the develop time it saw,
 * so a second device plays it once too, Monday's open is plain, and a develop the host moves later plays again.
 *
 * Pure and isomorphic, but for the storage key's name.
 */
import {
  columnsFor,
  type HerShot,
  layoutSheet,
  SHEET_FOLD_CELLS,
  sheetCapFor,
} from "@/lib/disposable/contact-sheet";
import type { WaitingFacts } from "@/lib/disposable/facts";
import type { ManifestEntry } from "@/lib/events/album-wire";

/* ── the tokens ──────────────────────────────────────────────────────────── */

/** The develop's two passes: the full one, and reduced motion's, where nothing moves and opacity alone changes. */
export type DevelopMotion = "full" | "reduced";

/**
 * THE DEVELOP'S TEMPO AND EASING, ms from the play's first movement (the board's `in-place` take, measured on its
 * frames and picked as drawn).
 */
export const DEVELOP_TEMPO = {
  /** The still sheet stands this long before it moves, so its first frame is read (and its pictures land). */
  leadMs: 700,
  /** The longest the still sheet waits for its squares' pictures before it plays with what it has. */
  readyCapMs: 3_000,
  /** A page open across the develop waits this long for the roll to land before it gives the album back plainly. */
  landCapMs: 30_000,
  /** The moments of each pass: the wave's start and spread, the word's turn, the cover's develop, the open. */
  full: { wave: 150, spread: 950, word: 1250, cover: 1650, open: 1750 },
  reduced: { wave: 200, spread: 0, word: 700, cover: 1500, open: 1500 },
  /** How long each part takes. */
  ms: {
    /** A square's photograph coming up out of the flash, from blown-out pale to itself. */
    square: 900,
    /** The flash a square takes as it develops: a warm light up fast, a long going out. */
    flash: 700,
    /** The words and the well going. */
    fade: 420,
    /** Reduced motion's fades in (the squares' photographs, the album). */
    fadeIn: 400,
    /** A word or the album's head rising in. */
    rise: 280,
    /** The older squares sinking away, down toward where they stand in the album. */
    sink: 460,
    /** A square growing into its tile. */
    grow: 720,
    /** Her rim going as one of hers becomes a photograph like any other. */
    rim: 500,
    /** The cover's photographs coming up out of the house light (the host's Look, a beat longer). */
    cover: 1300,
    /** The album's regular open, its numbers (`globals.css`, `[data-media-tile]`). */
    tile: 240,
  },
  /** The offsets the drawing staggers by. */
  step: {
    /** The new word follows the old one's going by this much. */
    word: 60,
    /** Each row of the sheet sinks this much after the row above it. */
    sinkRow: 24,
    /** The well's ground goes this long after its squares begin to sink. */
    ground: 60,
    /** The first square grows this long after the open, and each next one this much later. */
    growLead: 40,
    grow: 60,
    /** The album's head row rises this long after the open. */
    head: 380,
    /** The album's other photographs rise this long after the open, each this much after the last, at most `tileCap`. */
    restLead: 480,
    tile: 45,
    tileCap: 540,
  },
  /** The curves (the house's own where one fits: `theme.css`'s `--ease-*`). */
  ease: {
    square: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    flash: "ease-out",
    fade: "ease-out",
    rise: "var(--ease-emphasis)",
    sink: "cubic-bezier(0.55, 0, 0.8, 0.2)",
    grow: "var(--ease-in-out-strong)",
    cover: "var(--ease-emphasis)",
    tile: "var(--ease-emphasis)",
  },
} as const;

type Moments = (typeof DEVELOP_TEMPO)["full" | "reduced"];

/** A pass's moments. */
export const momentsOf = (motion: DevelopMotion): Moments =>
  DEVELOP_TEMPO[motion];

/**
 * A square's moment in the wave: the night's order (oldest first), a touch uneven, as a tray develops. Reduced motion
 * brings every square up at once.
 */
export function waveAt(i: number, n: number, motion: DevelopMotion): number {
  const { wave, spread } = momentsOf(motion);
  if (spread === 0 || n <= 1) return wave;
  // A fixed jitter per square (Knuth's multiplicative hash), so the same sheet always develops the same way.
  const jitter = (((i * 2654435761) >>> 0) % 70) - 35;
  return Math.max(wave, wave + (i / (n - 1)) * spread + jitter);
}

/** When the k-th square of the first screen grows into its tile (newest first: the album's first tile first). */
export const growAt = (k: number): number =>
  DEVELOP_TEMPO.full.open +
  DEVELOP_TEMPO.step.growLead +
  k * DEVELOP_TEMPO.step.grow;

/** When a square in the sheet's row `row` sinks (the fold's chip is row 0's). */
export const sinkAt = (row: number): number =>
  DEVELOP_TEMPO.full.open + row * DEVELOP_TEMPO.step.sinkRow;

/** When the album's k-th photograph (by its place in the album) rises, the regular open after the develop. */
export const restAt = (k: number): number =>
  DEVELOP_TEMPO.full.open +
  DEVELOP_TEMPO.step.restLead +
  Math.min(k * DEVELOP_TEMPO.step.tile, DEVELOP_TEMPO.step.tileCap);

/**
 * How long a play runs, from its first movement to its last: the cover's coming up, the last square's growing and
 * the album's last rise, whichever ends latest. Reduced motion's ends with the cover.
 */
export function developLength(motion: DevelopMotion, grows: number): number {
  const t = momentsOf(motion);
  const { ms, step } = DEVELOP_TEMPO;
  const cover = t.cover + ms.cover;
  if (motion === "reduced") return Math.max(cover, t.open + ms.fadeIn);
  const grown = grows > 0 ? growAt(grows - 1) + ms.grow : 0;
  const risen = t.open + step.restLead + step.tileCap + ms.tile;
  return Math.max(cover, grown, risen, t.open + step.ground + ms.fade);
}

/** A token's name as a custom property's: `fadeIn` is `fade-in`. */
const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * THE TOKENS AS THE STYLESHEET READS THEM: every duration and curve, and the moments of the parts the page draws
 * outside the develop's own drawing (the cover, the album's head, its photographs). Written on the document's root for
 * the play (`gallery-empty-state-wait.tsx`), so the cover and the album, which stand far apart, read one clock.
 */
export function developVars(motion: DevelopMotion): Record<string, string> {
  const t = momentsOf(motion);
  const { ms, ease, step } = DEVELOP_TEMPO;
  const vars: Record<string, string> = {
    "--develop-cover-at": `${t.cover}ms`,
    "--develop-open-at": `${t.open}ms`,
    "--develop-head-at": `${t.open + step.head}ms`,
    "--develop-rest-at": `${restAt(0)}ms`,
  };
  for (const [part, value] of Object.entries(ms))
    vars[`--develop-${kebab(part)}-ms`] = `${value}ms`;
  for (const [part, value] of Object.entries(ease))
    vars[`--develop-${kebab(part)}-ease`] = value;
  return vars;
}

/* ── the roll ────────────────────────────────────────────────────────────── */

/** A manifest entry's `created_at`, epoch ms (the wire carries microseconds). */
const createdMs = (entry: ManifestEntry) => entry[4] / 1000;

/**
 * THE ROLL THAT DEVELOPED, AS THE SEED HOLDS IT: the ids (newest first, the album's own order) of the photographs
 * created at or before the develop time, and after `sinceMs` where this device saw an earlier develop of the album
 * (the host set a new time once one had come: only the new roll develops). An album turned disposable mid-party also
 * develops what showed before the switch: a guest's page cannot tell one from the other, and it costs nothing worse
 * than a few more squares.
 */
export function rollOfEntries(
  entries: readonly ManifestEntry[],
  developsAtMs: number,
  sinceMs: number | null,
): string[] {
  const roll: string[] = [];
  for (const entry of entries) {
    const at = createdMs(entry);
    if (at > developsAtMs) continue;
    if (sinceMs !== null && at <= sinceMs) continue;
    roll.push(entry[0]);
  }
  return roll;
}

/**
 * THE ROLL IN THE NIGHT'S ORDER, on a page open across its develop: her squares stand where the night's sheet drew them
 * (at their own minutes, which the album's photographs no longer carry), everyone's take the rest in the album's own
 * order, so the sheet she was watching develops square for square, never reshuffled at the turn. What the night did not
 * count (a shot that landed with the develop) stands after it, newest last. Newest first, as the album holds the roll.
 */
export function nightRoll(input: {
  /** What waited as the develop came: the night's count and its minutes. */
  waiting: Pick<WaitingFacts, "count" | "minutes"> | null;
  /** Her shots on the night's sheet. */
  hers: readonly HerShot[];
  /** The roll that landed, newest first. */
  roll: readonly string[];
}): string[] {
  const { waiting, hers, roll } = input;
  const night = layoutSheet({
    waiting,
    hers: hers.filter((shot) => !shot.sending),
    cap: Number.MAX_SAFE_INTEGER,
    nowMs: null,
  });
  const landed = new Set(roll);
  const mine = new Set(
    night.cells.flatMap((cell) =>
      cell.kind === "hers" && landed.has(cell.key.slice(2))
        ? [cell.key.slice(2)]
        : [],
    ),
  );
  // Everyone's, oldest first, in the album's order.
  const theirs = [...roll].reverse().filter((id) => !mine.has(id));
  const order: string[] = [];
  for (const cell of night.cells) {
    if (cell.kind === "hers" && mine.has(cell.key.slice(2)))
      order.push(cell.key.slice(2));
    else if (cell.kind === "theirs" && theirs.length > 0)
      order.push(theirs.shift()!);
  }
  order.push(...theirs);
  return order.reverse();
}

/* ── the sheet ───────────────────────────────────────────────────────────── */

/** One square of the develop's sheet: the photograph it is, and whether it is one of hers. */
export type DevelopCell = { id: string; hers: boolean };

export type DevelopSheetPlan = {
  columns: number;
  /** The squares drawn, oldest first (the night's order). */
  cells: DevelopCell[];
  /** How many older squares folded into the "+N" at its head. */
  folded: number;
  /** The whole roll. */
  count: number;
  /** How many of the roll are hers, folded ones too. */
  hers: number;
};

/**
 * THE DEVELOP'S SHEET AT ITS WIDTH: the roll's squares in the night's order, capped as the wait's own sheet is
 * (`columnsFor`, `sheetCapFor`, a capped sheet giving its first three cells to the fold's chip), so the sheet that
 * develops is the sheet that stood all night, square for square.
 */
export function layoutDevelopSheet(input: {
  /** The roll, newest first. */
  roll: readonly string[];
  hers: ReadonlySet<string>;
  /** The sheet's own width (its well less its padding and, at a desk, the count's column). */
  sheetWidth: number;
  /** The whole roll's count, where the roll in hand is only its newest part (a long album's first manifest page). */
  count?: number;
}): DevelopSheetPlan {
  const { roll, hers, sheetWidth } = input;
  const columns = columnsFor(sheetWidth);
  const cap = sheetCapFor(columns);
  const count = Math.max(input.count ?? roll.length, roll.length);
  const oldestFirst = [...roll].reverse();
  const shown =
    count > cap ? cap - SHEET_FOLD_CELLS : Math.min(cap, oldestFirst.length);
  const cells = oldestFirst
    .slice(Math.max(0, oldestFirst.length - shown))
    .map((id) => ({ id, hers: hers.has(id) }));
  return {
    columns,
    cells,
    folded: count - cells.length,
    count,
    hers: roll.reduce((n, id) => n + (hers.has(id) ? 1 : 0), 0),
  };
}

/** The sheet's row of its i-th square, the fold's chip counted where it stands at the head. */
export function rowOf(plan: DevelopSheetPlan, i: number): number {
  return Math.floor(
    (i + (plan.folded > 0 ? SHEET_FOLD_CELLS : 0)) / plan.columns,
  );
}

/* ── when it plays ───────────────────────────────────────────────────────── */

/** This device's mark for an album: the develop time it last saw develop, epoch ms. */
export const developMarkKey = (eventId: string) => `pr_develop:${eventId}`;

/** A stored mark read back, or null for none (or one it cannot read). */
export function parseDevelopMark(
  raw: string | null | undefined,
): number | null {
  if (!raw) return null;
  const at = Number(raw);
  return Number.isFinite(at) ? at : null;
}

/** A develop time off the wire as epoch ms, or null for none (or one it cannot read). */
export function developMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isFinite(at) ? at : null;
}

/**
 * WHAT THIS OPEN DOES WITH A DEVELOP: `plays` it; `spent`, where the album has developed and this open is her first
 * since without it being the album's to play (the door was this visit's arrival, or the reel was what she came for), so
 * the mark is written and Monday is plain; or `none`.
 */
export type DevelopVerdict = "plays" | "spent" | "none";

export function developVerdict(input: {
  developsAtMs: number | null;
  nowMs: number;
  /** This device's mark for the album. */
  mark: number | null;
  /** How many photographs the roll holds. */
  roll: number;
  /** She sees the whole album (never a teaser, a lock or the demo). */
  full: boolean;
  /** The door stood at this open's first byte (its page, or its scrim over a sheet step). */
  door: boolean;
  /** She came for the reel (`?reel`). */
  reelAsked: boolean;
}): DevelopVerdict {
  const { developsAtMs, nowMs, mark, roll, full, door, reelAsked } = input;
  if (developsAtMs === null || developsAtMs > nowMs) return "none";
  if (!full || roll === 0) return "none";
  if (mark !== null && mark >= developsAtMs) return "none";
  return door || reelAsked ? "spent" : "plays";
}

/**
 * THE GATE, BEFORE THE FIRST PAINT: the page's server cannot read this device's mark, so where a develop may be owed it
 * sends this script ahead of the cover. It holds the cover on its house light and the album under its sheet from the
 * first byte (`html[data-develop]`) when the mark says the develop has not played here, and lets go after `releaseMs`
 * if the page's own develop never took it up (a script that never loaded), saying so (`released`), so a page that
 * hydrates later than that opens plainly rather than pulling the album away again.
 */
export function developGateScript(input: {
  eventId: string;
  developsAtMs: number;
  releaseMs?: number;
}): string {
  const key = JSON.stringify(developMarkKey(input.eventId));
  const at = JSON.stringify(String(input.developsAtMs));
  const release = Math.round(input.releaseMs ?? 6_000);
  return `(function(){try{var m=localStorage.getItem(${key});if(m!==null&&Number(m)>=Number(${at}))return;var d=document.documentElement,g=window.__prDevelop={at:${at},claimed:false,released:false};d.setAttribute("data-develop","held");setTimeout(function(){if(!g.claimed&&d.getAttribute("data-develop")==="held"){d.removeAttribute("data-develop");g.released=true}},${release})}catch(e){}})();`;
}

/** What the gate left on the window for the page's develop to take up. */
export type DevelopGate = { at: string; claimed: boolean; released: boolean };
