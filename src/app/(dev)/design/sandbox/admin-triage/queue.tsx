"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BadgeCheck, Check, ShieldAlert, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GLASS, GLASS_BEHIND, GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  CountChip,
  FactList,
  FactLines,
  type FactWorld,
  KindChip,
  kindShown,
  NowChip,
  ReportWhole,
  Still,
  uploaderParts,
  Verbs,
  Words,
} from "./facts";
import {
  type Entry,
  type HarmShape,
  kindOf,
  type Lane,
  LICENCE,
  STUDENT,
  TICKED,
  whenOf,
} from "./fixtures";

/**
 * THE REPORTS QUEUE, FOUR WAYS (`look`, round two).
 *
 * Will on round one's `look`: split, "however, I don't believe these are our
 * best ideas. I think some balance of this option plus option 3's review queue
 * grid, but reshaped for better speed workflows (fast/batch handling) rather
 * than slow, one at a time. Each report should provide all the context needed
 * to handle or make a decision." So every shape here carries the same three
 * things and differs only in how it balances words against pictures:
 *
 *  - THE SWEEP. Tick many, one Dismiss, an Undo on the toast: the host review
 *    queue's grammar (`host-curation`'s picks) with a report's verbs. The keys
 *    are that queue's, mapped (a carried call): the arrows move, X ticks,
 *    Enter dismisses (the photo stays, as Approve keeps it), Space opens the
 *    report whole, Escape closes, and H moves a report to the front.
 *  - EVERY FACT (facts.tsx, the one list of them).
 *  - THE FRONT: a lane ahead of the sweep, judged a report at a time and never
 *    ticked, so a sweep can never take a report of harm with it. What fills it
 *    is the `harm` ask's; in today's world it is what the operator moved there.
 *
 * ★ LIVE IN THE FRAME, AND ONLY THERE. Each frame's own window listens for the
 * keys (never the lab page's, so nothing on the board moves it), a tick and a
 * Dismiss really move the queue, and the toast's Undo puts them back. Every
 * frame opens on the same state (seven ticked, the cursor on the licence), so
 * a capture taken twice is the same capture.
 *
 * ★ NO `sm:` OR `lg:` ANYWHERE. A Tailwind breakpoint reads the lab page's
 * width, not the frame's (round one's capture pass found `sm:w-[200px]`
 * unapplied), so every shape takes its size as a prop and branches on it.
 */

export type LookShape = "rows" | "pane" | "grid" | "albums";

export const lookOf = (v: string | undefined): LookShape =>
  v === "rows" || v === "pane" || v === "albums" ? v : "grid";

export type Size = "1440" | "375";

/**
 * HOW MUCH OF THE ACT A PHONE IS TRUSTED WITH (the `phone` ask). Set only on
 * that ask's frames; everywhere else a queue is a desk's and offers the whole
 * act.
 */
export type PhoneShape = "stop" | "sweep" | "hold" | "all";

/** Whether a phone may tick and sweep, under each answer. */
export const phoneSweeps = (p: PhoneShape) => p === "sweep" || p === "all";

export type QueueWorld = FactWorld & { look: LookShape; phone?: PhoneShape };

/** Where the cursor opens: the licence in today's world, the worst report once a kind sorts the front. */
export const cursorFor = (harm: HarmShape) =>
  harm === "eye" ? LICENCE.id : STUDENT.id;

/**
 * What a later ask stacks under a report's facts where it opens whole (the
 * proof thread), without every shape threading it through.
 */
const DetailCtx = createContext<((e: Entry) => ReactNode) | null>(null);

/* ── The live state ─────────────────────────────────────────────────────── */

type Toast = { text: string; ids: string[] } | null;

export type QueueState = {
  lanes: Lane[];
  ticked: ReadonlySet<string>;
  cursor: string;
  peek: string | null;
  toast: Toast;
  tick: (id: string) => void;
  point: (id: string) => void;
  open: (id: string | null) => void;
  dismiss: (ids: string[]) => void;
  clear: () => void;
  undo: () => void;
};

/**
 * One queue's state: which reports are ticked, where the cursor is, what the
 * peek shows, and what a Dismiss took (so its Undo can put it back).
 */
export function useQueue(
  source: readonly Lane[],
  {
    cursor: start,
    peek: peekOn = null,
  }: { cursor: string; peek?: string | null },
): QueueState {
  const sweepIds = useMemo(
    () =>
      new Set(
        source
          .filter((l) => l.sweep)
          .flatMap((l) => l.entries.map((e) => e.id)),
      ),
    [source],
  );
  const [ticked, setTicked] = useState<ReadonlySet<string>>(
    () => new Set([...TICKED].filter((id) => sweepIds.has(id))),
  );
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  const [cursor, setCursor] = useState(start);
  const [peek, setPeek] = useState<string | null>(peekOn);
  const [toast, setToast] = useState<Toast>(null);

  const lanes = useMemo(
    () =>
      source.map((l) => ({
        ...l,
        entries: l.entries.filter((e) => !gone.has(e.id)),
      })),
    [source, gone],
  );

  const tick = useCallback(
    (id: string) => {
      if (!sweepIds.has(id)) return;
      setTicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [sweepIds],
  );

  // The order the cursor walks, and the toast an Undo answers, for the
  // callbacks below (refreshed after each commit, never read in render).
  const order = useRef<string[]>([]);
  const lastToast = useRef<Toast>(null);
  useEffect(() => {
    order.current = lanes.flatMap((l) => l.entries.map((e) => e.id));
    lastToast.current = toast;
  });

  /**
   * ★ THE CURSOR MOVES ON BEFORE THE REPORTS LEAVE (the host queue's own
   * rule, `review-keys.ts`), so the next Enter lands on the next report and
   * never on nothing: the first one after it that stays, else the one before.
   */
  const dismiss = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const leaving = new Set(ids);
    setCursor((at) => {
      if (!leaving.has(at)) return at;
      const all = order.current;
      const i = all.indexOf(at);
      const after = all.slice(i + 1).find((id) => !leaving.has(id));
      const before = all
        .slice(0, Math.max(0, i))
        .reverse()
        .find((id) => !leaving.has(id));
      return after ?? before ?? at;
    });
    setGone((prev) => new Set([...prev, ...ids]));
    setTicked((prev) => new Set([...prev].filter((id) => !leaving.has(id))));
    setPeek(null);
    setToast({
      text: `Dismissed ${ids.length} report${ids.length === 1 ? "" : "s"}`,
      ids,
    });
  }, []);

  const undo = useCallback(() => {
    const t = lastToast.current;
    if (!t) return;
    setGone((prev) => new Set([...prev].filter((id) => !t.ids.includes(id))));
    setToast(null);
  }, []);

  return {
    lanes,
    ticked,
    cursor,
    peek,
    toast,
    tick,
    point: setCursor,
    open: setPeek,
    dismiss,
    clear: () => setTicked(new Set()),
    undo,
  };
}

/**
 * The keys, on the frame's own window. The order the arrows walk is the
 * page's: the front, then each lane down.
 */
function useKeys(
  anchor: React.RefObject<HTMLElement | null>,
  q: QueueState,
  { across = 1, peeks = true }: { across?: number; peeks?: boolean },
) {
  const latest = useRef(q);
  useEffect(() => {
    latest.current = q;
  });
  useEffect(() => {
    const win = anchor.current?.ownerDocument.defaultView;
    if (!win) return;
    const onKey = (e: KeyboardEvent) => {
      const s = latest.current;
      const order = s.lanes.flatMap((l) => l.entries.map((x) => x.id));
      const at = Math.max(0, order.indexOf(s.cursor));
      const move = (by: number) => {
        const next = order[Math.min(order.length - 1, Math.max(0, at + by))];
        if (next) s.point(next);
      };
      if (e.key === "ArrowDown") move(across);
      else if (e.key === "ArrowUp") move(-across);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "x" || e.key === "X") s.tick(s.cursor);
      else if (e.key === "Enter")
        s.dismiss(s.ticked.size > 0 ? [...s.ticked] : [s.cursor]);
      else if (e.key === " " && peeks) s.open(s.peek ? null : s.cursor);
      else if (e.key === "Escape") {
        if (s.peek) s.open(null);
        else s.clear();
      } else return;
      e.preventDefault();
    };
    win.addEventListener("keydown", onKey);
    return () => win.removeEventListener("keydown", onKey);
  }, [anchor, across, peeks]);
}

/* ── The parts every shape shares ───────────────────────────────────────── */

/** The filter bar as round one's `idiom=shape` left it: the shared bar, Reports' own words. */
export function Filters() {
  return (
    <nav data-tri-tabs className="flex flex-wrap gap-1">
      {["All", "Open", "Dismissed", "Actioned"].map((w) => (
        <span
          key={w}
          className={cn(
            "rounded-md px-3 py-1.5 text-working",
            w === "Open"
              ? "bg-foreground text-background"
              : "text-muted-foreground",
          )}
        >
          {w}
        </span>
      ))}
    </nav>
  );
}

const LANE_NOTE: Record<Lane["id"], (harm: HarmShape) => string | null> = {
  harm: (harm) =>
    harm === "eye"
      ? "What you moved here with H. Judged one at a time, never in a sweep."
      : "What its reporter called harm, worst first. Judged one at a time, never in a sweep.",
  people: () => null,
  items: () => null,
  rest: () => null,
};

/** A lane's head: its name and count, a line of what it is, and its batch bar. */
function LaneHead({
  lane,
  harm,
  size,
  children,
}: {
  lane: Lane;
  harm: HarmShape;
  size: Size;
  children?: ReactNode;
}) {
  const note = LANE_NOTE[lane.id](harm);
  const count = lane.entries.reduce((n, e) => n + e.reports.length, 0);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
        size === "375" ? "mb-2" : "mb-2.5",
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <h2
          className={cn(
            "text-label font-semibold uppercase",
            lane.id === "harm" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {lane.label}
          <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
        </h2>
        {note && size === "1440" ? (
          <p className="truncate text-caption text-muted-foreground">{note}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** The batch bar: what is ticked, and the one press that sweeps it. */
export function BulkBar({
  q,
  size,
  remove = true,
}: {
  q: QueueState;
  size: Size;
  /** Whether a batch Remove is on offer (a phone may be trusted with less). */
  remove?: boolean;
}) {
  const n = q.ticked.size;
  if (n === 0) return null;
  return (
    <div
      data-tri-bulk
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card py-1 pr-1 pl-3 shadow-xs",
        size === "375" && "w-full",
      )}
    >
      <span className="flex size-4 items-center justify-center rounded-[4px] bg-foreground text-background">
        <Check className="size-3" aria-hidden />
      </span>
      <span className="mr-auto text-working font-medium tabular-nums">
        {n} ticked
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => q.dismiss([...q.ticked])}
      >
        Dismiss {n}
      </Button>
      {remove && size === "1440" ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive"
        >
          Remove {n}…
        </Button>
      ) : null}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Clear the ticks"
        onClick={q.clear}
      >
        <X />
      </Button>
    </div>
  );
}

/** The one toast, with its Undo, as the host queue's verdict toast. */
function UndoToast({ q }: { q: QueueState }) {
  if (!q.toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-float bg-popover py-2 pr-2 pl-4 text-working text-popover-foreground shadow-layer ring-1 ring-foreground/10"
      >
        {q.toast.text}
        <Button type="button" size="sm" variant="outline" onClick={q.undo}>
          Undo
        </Button>
      </div>
    </div>
  );
}

/** A tick box, drawn on the same shape as the host queue's select marks. */
function Tick({
  on,
  onClick,
  glass = false,
}: {
  on: boolean;
  onClick: () => void;
  /** Over a photograph: the glass mark, as a tile's select circle. */
  glass?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Untick" : "Tick"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex shrink-0 items-center justify-center",
        glass
          ? cn(
              "size-6 rounded-full text-white",
              on
                ? "bg-success text-success-foreground ring-2 ring-white"
                : GLASS_MARK,
            )
          : cn(
              "size-4 rounded-[4px] border",
              on
                ? "border-foreground bg-foreground text-background"
                : "border-muted-foreground/40 bg-background",
            ),
      )}
    >
      {on ? <Check className={glass ? "size-3.5" : "size-3"} /> : null}
    </button>
  );
}

/* ── 1. The sheet ───────────────────────────────────────────────────────── */

/**
 * `rows`: A SHEET, ONE ROW A REPORT. Every fact on its row in its own column,
 * beside a 4:5 frame small enough to scan; a tick on every row of the sweep.
 * Round one's split row made dense: every report's facts at once, the
 * smallest picture, and Space for the frame whole.
 */
function SheetRow({
  entry,
  q,
  world,
  sweep,
  front,
  size,
}: {
  entry: Entry;
  q: QueueState;
  world: FactWorld;
  sweep: boolean;
  front: boolean;
  size: Size;
}) {
  const at = q.cursor === entry.id;
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  const up = uploaderParts(entry);
  if (size === "375")
    return (
      <li
        data-tri-entry={entry.id}
        data-tri-cursor={q.cursor === entry.id ? "" : undefined}
        onClick={() => q.point(entry.id)}
        className={cn(
          "flex gap-3 px-3 py-3",
          at && "bg-muted/60",
          q.ticked.has(entry.id) && "bg-muted/40",
        )}
      >
        {sweep ? (
          <div className="pt-0.5">
            <Tick
              on={q.ticked.has(entry.id)}
              onClick={() => q.tick(entry.id)}
            />
          </div>
        ) : null}
        <Still entry={entry} covered={covered} mini className="w-14" />
        <div className="min-w-0 flex-1 space-y-1">
          <Words entry={entry} clamp={2} />
          <div className="flex flex-wrap gap-1">
            <KindChip entry={entry} world={world} />
            <CountChip entry={entry} />
            <NowChip entry={entry} />
          </div>
          <FactLines entry={entry} world={world} />
        </div>
      </li>
    );
  return (
    <li
      data-tri-entry={entry.id}
      data-tri-cursor={q.cursor === entry.id ? "" : undefined}
      onClick={() => q.point(entry.id)}
      className={cn(
        "relative px-3 py-1.5",
        at ? "bg-muted/70" : q.ticked.has(entry.id) && "bg-muted/35",
      )}
    >
      {at ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 bg-foreground"
        />
      ) : null}
      <div className="tri-sheet-row">
        <div className="flex justify-center pt-0.5">
          {sweep ? (
            <Tick
              on={q.ticked.has(entry.id)}
              onClick={() => q.tick(entry.id)}
            />
          ) : null}
        </div>
        <Still entry={entry} covered={covered} mini className="w-10" />
        {/* One line a row, so a screen holds the most rows; the cursor's row
            opens its words whole. */}
        <div className="min-w-0 space-y-0.5">
          <Words entry={entry} clamp={at ? 3 : 1} />
          <FactLines entry={entry} world={world} only={["who"]} />
        </div>
        {/* A person has no uploader and no album: the columns name the
            account reported and its profile instead, in the same places. */}
        <div data-tri-fact="uploader" className="min-w-0 text-working">
          {entry.person ? (
            <>
              <p className="truncate">{entry.person.name}</p>
              <p className="text-caption text-muted-foreground">
                The account reported
              </p>
            </>
          ) : up.length > 0 ? (
            <>
              <p className="truncate">{up[0]}</p>
              <p className="line-clamp-2 text-caption text-muted-foreground">
                {up.slice(1).join(" · ")}
              </p>
            </>
          ) : (
            <p className="text-caption text-muted-foreground">
              The whole album, no one photo
            </p>
          )}
        </div>
        <div data-tri-fact="album" className="min-w-0 text-working">
          <p className="truncate">
            {entry.album?.name ??
              (entry.person?.slug ? `@${entry.person.slug}` : "No handle")}
          </p>
          <p className="truncate text-caption text-muted-foreground">
            {entry.album
              ? `${entry.album.uploads} uploads · ${entry.album.host}`
              : "Profile is up"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <KindChip entry={entry} world={world} />
          <CountChip entry={entry} />
          <NowChip entry={entry} />
        </div>
      </div>
      {at ? (
        <Verbs
          entry={entry}
          world={world}
          front={front}
          className="mt-2 mb-1 pl-[76px]"
        />
      ) : null}
    </li>
  );
}

function SheetQueue({
  q,
  world,
  size,
}: {
  q: QueueState;
  world: FactWorld;
  size: Size;
}) {
  // The columns are named once, over the first lane: every lane below lines
  // up under the same heads.
  const firstLane = q.lanes.find((l) => l.entries.length > 0)?.id;
  return (
    <div className="space-y-4">
      {q.lanes.map((lane) =>
        lane.entries.length === 0 ? null : (
          <section key={lane.id} data-tri-lane={lane.id}>
            <LaneHead lane={lane} harm={world.harm} size={size}>
              {lane.sweep ? <BulkBar q={q} size={size} /> : null}
            </LaneHead>
            <div className="overflow-hidden rounded-lg border bg-card">
              {size === "1440" && lane.id === firstLane ? (
                <div className="tri-sheet-row border-b bg-muted/30 px-3 py-1.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">
                  <span />
                  <span />
                  <span>Report</span>
                  <span>Sent by</span>
                  <span>Album</span>
                  <span className="text-right">Now</span>
                </div>
              ) : null}
              <ul className="divide-y">
                {lane.entries.map((e) => (
                  <SheetRow
                    key={e.id}
                    entry={e}
                    q={q}
                    world={world}
                    sweep={lane.sweep}
                    front={lane.id === "harm"}
                    size={size}
                  />
                ))}
              </ul>
            </div>
          </section>
        ),
      )}
    </div>
  );
}

/* ── 2. The list beside the report ──────────────────────────────────────── */

/**
 * `pane`: THE PORTAL'S OWN LIST-AND-PANE, WITH PICTURES. Support and
 * Applicants read as a list beside the message (`density=hybrid`: "a table
 * for data, a pane for prose"); a report is a picture and a paragraph, so the
 * list keeps a thumbnail and one line, and the pane is the report in focus,
 * whole. The arrows step it, Enter dismisses it and the next one is already
 * there; ticks sweep many from the list.
 */
function PaneItem({
  entry,
  q,
  world,
  sweep,
}: {
  entry: Entry;
  q: QueueState;
  world: FactWorld;
  sweep: boolean;
}) {
  const at = q.cursor === entry.id;
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <li
      data-tri-entry={entry.id}
      data-tri-cursor={q.cursor === entry.id ? "" : undefined}
      onClick={() => q.point(entry.id)}
      className={cn(
        "relative flex cursor-default gap-2.5 px-3 py-2.5",
        at ? "bg-muted" : q.ticked.has(entry.id) && "bg-muted/40",
      )}
    >
      {at ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 bg-foreground"
        />
      ) : null}
      <div className="flex w-4 justify-center pt-1">
        {sweep ? (
          <Tick on={q.ticked.has(entry.id)} onClick={() => q.tick(entry.id)} />
        ) : null}
      </div>
      <Still entry={entry} covered={covered} mini className="w-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Words entry={entry} clamp={1} className="font-medium" />
          <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
            {whenOf(entry)}
          </span>
        </div>
        <p className="truncate text-caption text-muted-foreground">
          <span data-tri-fact="album">
            {entry.album?.name ?? entry.person?.name}
          </span>
          {entry.uploader ? (
            <span data-tri-fact="uploader"> · {entry.uploader.name}</span>
          ) : null}
        </p>
        <div className="mt-1 flex flex-wrap gap-1 empty:hidden">
          <KindChip entry={entry} world={world} />
          <CountChip entry={entry} />
          <NowChip entry={entry} />
        </div>
      </div>
    </li>
  );
}

function PaneQueue({
  q,
  world,
  size,
}: {
  q: QueueState;
  world: FactWorld;
  size: Size;
}) {
  const all = q.lanes.flatMap((l) => l.entries);
  const open = all.find((e) => e.id === q.cursor) ?? all[0];
  const openLane = q.lanes.find((l) =>
    l.entries.some((e) => e.id === open?.id),
  );
  const sweepLane = q.lanes.find((l) => l.sweep && l.entries.length > 0);
  const list = (
    <ul
      data-slot="inbox-list"
      className={cn(size === "1440" ? "overflow-y-auto border-r" : "border-t")}
    >
      {q.lanes.map((lane) =>
        lane.entries.length === 0 ? null : (
          <li key={lane.id} data-tri-lane={lane.id}>
            <p
              className={cn(
                "sticky top-0 z-10 border-b bg-card/95 px-3 py-1.5 text-label font-semibold uppercase backdrop-blur",
                lane.id === "harm"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {lane.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {lane.entries.reduce((n, e) => n + e.reports.length, 0)}
              </span>
            </p>
            <ul className="divide-y">
              {lane.entries.map((e) => (
                <PaneItem
                  key={e.id}
                  entry={e}
                  q={q}
                  world={world}
                  sweep={lane.sweep}
                />
              ))}
            </ul>
          </li>
        ),
      )}
    </ul>
  );
  const detail = useContext(DetailCtx);
  const whole = open ? (
    <div
      data-tri-whole
      className={cn(size === "1440" ? "overflow-y-auto p-6" : "p-4")}
    >
      {size === "1440" ? (
        <ReportWhole
          entry={open}
          world={world}
          front={openLane?.id === "harm"}
          frameWidth={260}
        >
          {detail?.(open)}
        </ReportWhole>
      ) : (
        <PhoneWhole
          entry={open}
          world={world}
          front={openLane?.id === "harm"}
        />
      )}
    </div>
  ) : null;
  return (
    <div className="space-y-3">
      {sweepLane ? (
        <div className="flex min-h-9 items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            {sweepLane.label}: tick to sweep
          </p>
          <BulkBar q={q} size={size} />
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-float border bg-card",
          size === "1440" && "tri-pane",
        )}
      >
        {/* At 375 the report that matters opens above the list (the
            phone's front), so the pane keeps only its list there. */}
        {size === "1440" ? (
          <>
            {list}
            {whole}
          </>
        ) : (
          list
        )}
      </div>
    </div>
  );
}

/** The report whole at 375: the frame above, the facts under it. */
export function PhoneWhole({
  entry,
  world,
  front,
  verbs,
}: {
  entry: Entry;
  world: FactWorld;
  front: boolean;
  /** The phone's own verbs, where the `phone` ask sets them. */
  verbs?: ReactNode;
}) {
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Still
          entry={entry}
          covered={covered}
          big
          className="w-32 rounded-lg"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-1">
            <KindChip entry={entry} world={world} />
            <CountChip entry={entry} />
            <NowChip entry={entry} />
          </div>
          <Words entry={entry} all />
        </div>
      </div>
      <FactLines entry={entry} world={world} />
      {verbs ?? <Verbs entry={entry} world={world} front={front} />}
    </div>
  );
}

/* ── 3. The review grid, its words on every tile ────────────────────────── */

/**
 * `grid`: THE HOST QUEUE'S GRAMMAR, WITH A REPORT'S WORDS. Uniform 4:5 tiles
 * on the review grid's floor (host-curation `queue=uniform`), a select circle
 * on every tile of the sweep, and under each tile the reason in two lines
 * with who sent it and where; a tap (or Space) opens the report whole on the
 * peek (`peek=verdict`, its facts beside it).
 */
function Tile({
  entry,
  q,
  world,
  sweep,
  size,
  width,
}: {
  entry: Entry;
  q: QueueState;
  world: FactWorld;
  sweep: boolean;
  size: Size;
  /** A fixed width, for a row that scrolls rather than wraps (the albums). */
  width?: number;
}) {
  const at = q.cursor === entry.id;
  const on = q.ticked.has(entry.id);
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <li
      data-tri-entry={entry.id}
      data-tri-cursor={q.cursor === entry.id ? "" : undefined}
      data-tri-tile
      className="min-w-0 shrink-0 space-y-1.5"
      style={width ? { width } : undefined}
    >
      <div
        className={cn(
          "relative rounded-tile outline-2 outline-offset-2",
          at ? "outline-foreground" : "outline-transparent",
        )}
      >
        <button
          type="button"
          aria-label={`Open the report on ${entry.album?.name ?? entry.person?.name}`}
          onClick={() => {
            q.point(entry.id);
            q.open(entry.id);
          }}
          className="relative block w-full"
        >
          <Still entry={entry} covered={covered} className="w-full" />
          {/* The host queue's own select marks: a ticked tile dims under a
              wash, and its check (top right, in the one material) turns the
              success colour, since state feedback is always coloured. */}
          {on ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-tile bg-black/40"
            />
          ) : null}
        </button>
        {sweep ? (
          <span className="absolute top-1.5 right-1.5">
            <Tick on={on} glass onClick={() => q.tick(entry.id)} />
          </span>
        ) : null}
        {entry.reports.length > 1 ? (
          <span
            className={cn(
              "absolute top-2 left-2 inline-flex h-5 items-center rounded-full px-2 text-micro font-medium text-white",
              GLASS_MARK,
            )}
          >
            {entry.reports.length} reports
          </span>
        ) : null}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap gap-1 empty:hidden">
          <KindChip entry={entry} world={world} />
          <NowChip entry={entry} />
        </div>
        <Words
          entry={entry}
          clamp={size === "375" ? 1 : 2}
          className="text-caption leading-snug"
        />
        {/* Under the words, in one line: who reported (her glyph), who sent
            it and how many more, the album and when. The rest is one Space
            away, on the peek. */}
        {size === "1440" ? (
          <p className="flex min-w-0 items-center gap-1 text-micro text-muted-foreground">
            <span
              data-tri-fact="who"
              className="shrink-0"
              title={
                entry.reports[0].reporter === "account"
                  ? "Signed-in guest"
                  : "Signed-out guest"
              }
            >
              {entry.reports[0].reporter === "account" ? (
                <BadgeCheck className="size-3" aria-label="Signed-in guest" />
              ) : (
                <UserRound className="size-3" aria-label="Signed-out guest" />
              )}
            </span>
            <span className="min-w-0 truncate">
              <span data-tri-fact="uploader">
                {entry.uploader
                  ? `${entry.uploader.name} · ${entry.uploader.more} more`
                  : entry.subject === "person"
                    ? "A profile"
                    : "The whole album"}
              </span>
              {" · "}
              <span data-tri-fact="album">
                {entry.album?.name ?? entry.person?.name}
              </span>{" "}
              · {whenOf(entry)}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

function GridQueue({
  q,
  world,
  size,
}: {
  q: QueueState;
  world: FactWorld;
  size: Size;
}) {
  return (
    <div className="space-y-6">
      {size === "1440" ? <FrontCards q={q} world={world} /> : null}
      {q.lanes.map((lane) =>
        lane.entries.length === 0 || (size === "1440" && !lane.sweep) ? null : (
          <section key={lane.id} data-tri-lane={lane.id}>
            <LaneHead lane={lane} harm={world.harm} size={size}>
              {lane.sweep ? <BulkBar q={q} size={size} /> : null}
            </LaneHead>
            <ul
              data-tri-grid
              className={size === "1440" ? "tri-grid" : "tri-grid-phone"}
            >
              {lane.entries.map((e) => (
                <Tile
                  key={e.id}
                  entry={e}
                  q={q}
                  world={world}
                  sweep={lane.sweep}
                  size={size}
                />
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

/**
 * ★ THE LANES JUDGED ONE AT A TIME ARE SPLIT CARDS, SIDE BY SIDE, in the two
 * shapes built of tiles. Drawn as tiles, the front's one report and the
 * People section's one person each took a whole row of the grid, which pushed
 * the sweep (the thing these shapes are for) under the fold. A report that is
 * judged alone wants its words beside its frame anyway, so the front wears
 * round one's split row, small, and the sweep wears the grid: his note's
 * balance of the two, literally.
 */
function FrontCards({ q, world }: { q: QueueState; world: FactWorld }) {
  const lanes = q.lanes.filter((l) => !l.sweep && l.entries.length > 0);
  if (lanes.length === 0) return null;
  return (
    <div className="tri-fronts">
      {lanes.map((lane) => {
        const span = Math.min(2, lane.entries.length);
        return (
          <section
            key={lane.id}
            data-tri-lane={lane.id}
            className="min-w-0"
            style={{ gridColumn: `span ${span}` }}
          >
            <LaneHead lane={lane} harm={world.harm} size="1440" />
            <ul
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
              }}
            >
              {lane.entries.map((e) => (
                <FrontCard key={e.id} entry={e} q={q} world={world} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FrontCard({
  entry,
  q,
  world,
}: {
  entry: Entry;
  q: QueueState;
  world: FactWorld;
}) {
  const at = q.cursor === entry.id;
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <li
      data-tri-entry={entry.id}
      data-tri-cursor={q.cursor === entry.id ? "" : undefined}
      className={cn(
        "flex min-w-0 gap-3 rounded-lg border bg-card p-3",
        at && "ring-2 ring-foreground",
      )}
    >
      <button
        type="button"
        aria-label="Open this report whole"
        onClick={() => {
          q.point(entry.id);
          q.open(entry.id);
        }}
        className="shrink-0"
      >
        <Still entry={entry} covered={covered} className="w-20" />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap gap-1 empty:hidden">
          <KindChip entry={entry} world={world} />
          <CountChip entry={entry} />
          <NowChip entry={entry} />
        </div>
        <Words entry={entry} clamp={2} />
        <FactLines entry={entry} world={world} />
      </div>
    </li>
  );
}

/* ── 4. Grouped by album ────────────────────────────────────────────────── */

/**
 * `albums`: THE SWEEP GATHERED UNDER ITS ALBUMS. Each album says its facts
 * once (its name, its size, its host) and holds its reports as tiles with
 * their words; its head carries Dismiss all, so the one party a griefer went
 * through is one press. The front stays as the other shapes draw it: a
 * report of harm is never folded into its album's sweep.
 */
function AlbumsQueue({
  q,
  world,
  size,
}: {
  q: QueueState;
  world: FactWorld;
  size: Size;
}) {
  return (
    <div className="space-y-6">
      {size === "1440" ? <FrontCards q={q} world={world} /> : null}
      {q.lanes.map((lane) => {
        if (lane.entries.length === 0) return null;
        if (size === "1440" && !lane.sweep) return null;
        if (!lane.sweep)
          return (
            <section key={lane.id} data-tri-lane={lane.id}>
              <LaneHead lane={lane} harm={world.harm} size={size} />
              <ul className="flex gap-3 overflow-x-auto pb-1">
                {lane.entries.map((e) => (
                  <Tile
                    key={e.id}
                    entry={e}
                    q={q}
                    world={world}
                    sweep={false}
                    size={size}
                    width={size === "1440" ? 150 : 108}
                  />
                ))}
              </ul>
            </section>
          );
        // The sweep, by album, in the order each album last drew a report.
        const albums: { name: string; entries: Entry[] }[] = [];
        for (const e of lane.entries) {
          const name = e.album?.name ?? "People";
          const group = albums.find((a) => a.name === name);
          if (group) group.entries.push(e);
          else albums.push({ name, entries: [e] });
        }
        return (
          <section key={lane.id} data-tri-lane={lane.id}>
            <LaneHead lane={lane} harm={world.harm} size={size}>
              <BulkBar q={q} size={size} />
            </LaneHead>
            <div className={size === "1440" ? "tri-albums" : "space-y-3"}>
              {albums.map((a) => {
                const album = a.entries[0].album;
                const n = a.entries.reduce((m, e) => m + e.reports.length, 0);
                return (
                  <article
                    key={a.name}
                    data-tri-album
                    className="min-w-0 rounded-lg border bg-card"
                  >
                    <header className="flex items-center justify-between gap-3 border-b px-3 py-2">
                      <div data-tri-fact="album" className="min-w-0">
                        <p className="truncate text-working font-medium">
                          {a.name}
                        </p>
                        {album ? (
                          <p className="truncate text-caption text-muted-foreground">
                            {album.uploads} uploads · {album.guests} guests ·{" "}
                            {album.host}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => q.dismiss(a.entries.map((e) => e.id))}
                      >
                        Dismiss {n === 1 ? "it" : `all ${n}`}
                      </Button>
                    </header>
                    <ul className="flex gap-3 overflow-x-auto p-3">
                      {a.entries.map((e) => (
                        <Tile
                          key={e.id}
                          entry={e}
                          q={q}
                          world={world}
                          sweep
                          size={size}
                          width={size === "1440" ? 116 : 104}
                        />
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── The peek ───────────────────────────────────────────────────────────── */

/**
 * THE REPORT WHOLE ON THE LIGHTBOX'S GROUND, for the shapes whose frame is
 * small in the queue: the photograph large on the left, its words, facts and
 * verbs on an opaque panel beside it (glass is media chrome, never a panel).
 */
function Peek({
  q,
  world,
  size,
}: {
  q: QueueState;
  world: FactWorld;
  size: Size;
}) {
  const all = q.lanes.flatMap((l) => l.entries);
  const entry = all.find((e) => e.id === q.peek);
  if (!entry) return null;
  const front = q.lanes.find((l) => l.id === "harm")?.entries.includes(entry);
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <div data-tri-peek className="tri-peek">
      <div aria-hidden className={cn("tri-peek-ground", GLASS_BEHIND)} />
      <button
        type="button"
        aria-label="Close"
        onClick={() => q.open(null)}
        className={cn(
          "absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full text-white",
          GLASS,
        )}
      >
        <X className="size-5" />
      </button>
      {size === "1440" ? (
        <div className="relative flex h-full w-full items-center justify-center gap-6">
          <div className="flex h-full max-h-[720px] items-center">
            <Still
              entry={entry}
              covered={covered}
              big
              className="h-full max-h-[720px] w-auto rounded-lg"
            />
          </div>
          <div className="w-[420px] shrink-0 space-y-4 rounded-float bg-popover p-5 text-popover-foreground shadow-layer ring-1 ring-foreground/10">
            <PeekFacts entry={entry} world={world} front={Boolean(front)} />
          </div>
        </div>
      ) : (
        <div className="relative flex h-full w-full flex-col justify-end gap-3">
          <Still
            entry={entry}
            covered={covered}
            big
            className="mx-auto w-48 rounded-lg"
          />
          <div className="rounded-float bg-popover p-4 text-popover-foreground shadow-layer ring-1 ring-foreground/10">
            <PhoneWhole entry={entry} world={world} front={Boolean(front)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** The peek's panel: everything the pane carries, beside the photograph. */
function PeekFacts({
  entry,
  world,
  front,
}: {
  entry: Entry;
  world: FactWorld;
  front: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5 empty:hidden">
        <KindChip entry={entry} world={world} />
        <CountChip entry={entry} />
        <NowChip entry={entry} />
      </div>
      <Words entry={entry} all className="text-reading" />
      <FactList entry={entry} world={world} />
      <PeekDetail entry={entry} />
      <Verbs entry={entry} world={world} front={front} />
    </>
  );
}

function PeekDetail({ entry }: { entry: Entry }) {
  const detail = useContext(DetailCtx);
  return <>{detail?.(entry)}</>;
}

/* ── A phone's front ────────────────────────────────────────────────────── */

const PHONE_LINE: Record<Exclude<PhoneShape, "all">, string> = {
  stop: "It leaves the album at once. The report stays open until a desk writes its record.",
  sweep:
    "It leaves the album at once, and the sweep below can be dismissed here. Notes, proof and holds wait for a desk.",
  hold: "The hold starts now, without its reason; the reason and the rest wait for a desk.",
};

/** What a phone may press on a report of harm, under each `phone` answer. */
export function PhoneVerbs({
  entry,
  world,
  phone,
}: {
  entry: Entry;
  world: FactWorld;
  phone: PhoneShape;
}) {
  if (phone === "all") return <Verbs entry={entry} world={world} front />;
  if (entry.subject === "person")
    return (
      <p data-tri-verbs className="text-caption text-muted-foreground">
        A person is actioned out of band, so this one waits for a desk.
      </p>
    );
  return (
    <div data-tri-verbs className="space-y-2">
      <Button type="button" variant="destructive" className="w-full">
        Take it down now
      </Button>
      {phone === "hold" ? (
        <Button type="button" variant="outline" className="w-full">
          <ShieldAlert />
          Hold for forensics
        </Button>
      ) : null}
      <p className="text-caption text-muted-foreground">{PHONE_LINE[phone]}</p>
    </div>
  );
}

/**
 * ★ AT 375 THE FRONT OPENS WHOLE, IN EVERY SHAPE. A phone is for the report
 * that cannot wait, so what is at the front is drawn open with the verbs the
 * `phone` answer allows, and the rest of the queue follows in the shape's own
 * phone grammar. The shapes differ below it; the phone answers differ in it.
 */
function PhoneFront({
  lane,
  q,
  world,
  phone,
}: {
  lane: Lane;
  q: QueueState;
  world: FactWorld;
  phone: PhoneShape;
}) {
  if (lane.entries.length === 0) return null;
  return (
    <section data-tri-lane={lane.id} className="mb-5">
      <LaneHead lane={lane} harm={world.harm} size="375" />
      <div className="space-y-3">
        {lane.entries.map((e) => (
          <article
            key={e.id}
            data-tri-entry={e.id}
            data-tri-front
            className="rounded-lg border bg-card p-3"
          >
            <PhoneWhole
              entry={e}
              world={world}
              front
              verbs={<PhoneVerbs entry={e} world={world} phone={phone} />}
            />
          </article>
        ))}
      </div>
      {/* The desk's keys have no phone: the front's own verbs are the act. */}
      <span className="sr-only">{q.cursor}</span>
    </section>
  );
}

/* ── The queue, whichever shape ─────────────────────────────────────────── */

/**
 * One queue in one shape. `peekOn` opens a report whole where the shape has a
 * peek (the second frame of the three that do); the pane has none, because
 * its report in focus is already whole. `cursor` moves where it opens, and
 * `detail` stacks a later ask's part under a report's facts.
 */
export function Queue({
  lanes: given,
  world,
  size,
  peekOn = null,
  cursor,
  detail = null,
}: {
  lanes: Lane[];
  world: QueueWorld;
  size: Size;
  peekOn?: string | null;
  cursor?: string;
  detail?: ((e: Entry) => ReactNode) | null;
}) {
  // A phone that may not sweep has no ticks to draw at all.
  const lanes = useMemo(
    () =>
      world.phone && !phoneSweeps(world.phone)
        ? given.map((l) => ({ ...l, sweep: false }))
        : given,
    [given, world.phone],
  );
  const q = useQueue(lanes, {
    cursor: cursor ?? cursorFor(world.harm),
    peek: peekOn,
  });
  const anchor = useRef<HTMLDivElement | null>(null);
  const across = world.look === "grid" ? (size === "1440" ? 6 : 3) : 1;
  useKeys(anchor, q, { across, peeks: world.look !== "pane" });

  const phone = size === "375" && world.phone ? world.phone : null;
  const front = phone ? q.lanes.find((l) => l.id === "harm") : undefined;
  const shown: QueueState = front
    ? { ...q, lanes: q.lanes.filter((l) => l.id !== "harm") }
    : q;

  return (
    <DetailCtx.Provider value={detail}>
      <div ref={anchor} data-tri-queue={world.look}>
        {front && phone ? (
          <PhoneFront lane={front} q={q} world={world} phone={phone} />
        ) : null}
        {world.look === "rows" ? (
          <SheetQueue q={shown} world={world} size={size} />
        ) : world.look === "pane" ? (
          <PaneQueue q={shown} world={world} size={size} />
        ) : world.look === "grid" ? (
          <GridQueue q={shown} world={world} size={size} />
        ) : (
          <AlbumsQueue q={shown} world={world} size={size} />
        )}
        {world.look !== "pane" ? (
          <Peek q={q} world={world} size={size} />
        ) : null}
        <UndoToast q={q} />
      </div>
    </DetailCtx.Provider>
  );
}
