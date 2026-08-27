"use client";

import { Check, EyeOff, ListChecks, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * THE SIGNATURE (curation page): a working review-queue triage demo. The mock
 * QUOTES the shipped review surface (feed-section-header.tsx + review-actions.tsx
 * + selectable-media-grid.tsx): the amber 11px REVIEW eyebrow + bare count pill,
 * the browse cluster [Select · Approve all], the select face
 * [All/Clear · count · Hide · Approve · X], a uniform bulk-only queue grid, and
 * the app's "All caught up" success beat, restyled to the marketing paper card.
 *
 * The state machine is deliberately small: pending -> approving (the mkt-check
 * draw) -> approved (the tile's album slot flies in below); Hide skips the check
 * and lands the tile dimmed in the album (hidden stays visible ONLY in the
 * host's own view, which this frame is). Reduced motion jumps every phase
 * (approve() sets final states directly; the CSS recipes degrade to fades).
 * Replay remounts the stage (the LiveDemo runId convention, never
 * setState-in-effect resets).
 */

type TileState = "pending" | "approving" | "approved" | "hidden";

// Queue fixtures + their FIXED album landing slots (deterministic targets keep
// the grid from reflowing mid-run; slots read as "room waiting to fill").
const QUEUE_IDS = [
  "wedding-rings",
  "party-balloons",
  "festival-lights",
  "reception-hall",
  "wedding-toast",
  "concert-confetti",
];
// The album already has a life before the queue clears: a FULL first row of
// real shots (every manifest image the queue isn't using), so the resting frame
// reads as a working album with room to fill instead of a sheet of empty slots.
// One seed rests HIDDEN so the caption's "hidden items land dimmed" has
// something to point at before you touch anything.
const ALBUM_SEEDS: { id: string; hidden?: boolean }[] = [
  { id: "wedding-golden" },
  { id: "reception-table" },
  { id: "wedding-arch" },
  { id: "party-dj", hidden: true },
  { id: "festival-crowd" },
  { id: "wedding-petals" },
];

// The approve cascade's offset. Deliberately longer than the entrance stagger
// token: this is sequential ACTION feedback (you watch each verdict land), not
// an entrance, so the usage is a readable beat rather than a group arrival.
const APPROVE_STAGGER_MS = 160;
// The tile settles for a breath after the check finishes drawing.
const CHECK_SETTLE_MS = 120;

/**
 * How long the approval beat runs, READ from the CSS clocks that own it
 * (marketing.css chapter 2's check recipe) so a tuner change can never desync
 * the JS wait. readCssMs, never parseInt: Lightning CSS canonicalizes 500ms
 * to `.5s` and parseInt would collapse the beat to 0.
 */
function checkBeatMs(from: Element | null) {
  // `from` = any element inside the [data-mkt] scope: the --mkt-* clocks are
  // declared there (never :root), so a documentElement read would silently
  // return the fallbacks (R4 readCssMs fix).
  return (
    readCssMs("--mkt-check-dur", 500, from) +
    readCssMs("--mkt-check-path-delay", 80, from) +
    CHECK_SETTLE_MS
  );
}

export function ReviewQueueDemo() {
  const [runId, setRunId] = useState(0);
  return (
    <SectionShell
      eyebrow="The review queue"
      heading="Approve a whole event in one scroll."
      subhead={
        "Turn on review and new uploads wait for you instead of going live. This queue works: clear it in one tap, or Select just the exceptions."
      }
    >
      {/* The body rides the header's choreography: SectionShell's own Reveal
          spends --i 0-2 on eyebrow/heading/subhead, so the frame and its
          caption arrive together on slot 3 (one device, one arrival). */}
      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <QueueStage key={runId} onReplay={() => setRunId((n) => n + 1)} />
        </div>
        <MonoCaption
          data-mkt-reveal
          className="mt-4 text-center"
          style={{ "--i": 3 } as CSSProperties}
        >
          the host view · hidden items land dimmed, and only you see them
        </MonoCaption>
      </Reveal>
    </SectionShell>
  );
}

function QueueStage({ onReplay }: { onReplay: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [states, setStates] = useState<Record<string, TileState>>(() =>
    Object.fromEntries(QUEUE_IDS.map((id) => [id, "pending" as TileState])),
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const pendingIds = QUEUE_IDS.filter((id) => states[id] === "pending");
  const busy = QUEUE_IDS.some((id) => states[id] === "approving");
  // The pill ticks down as each approval LANDS (approving tiles still count,
  // exactly like the live queue).
  const queueCount = QUEUE_IDS.filter(
    (id) => states[id] === "pending" || states[id] === "approving",
  ).length;
  const cleared = queueCount === 0;
  const galleryCount =
    ALBUM_SEEDS.length +
    QUEUE_IDS.filter(
      (id) => states[id] === "approved" || states[id] === "hidden",
    ).length;

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function approve(ids: string[]) {
    if (ids.length === 0) return;
    exitSelect();
    if (reduced) {
      setStates((s) => {
        const next = { ...s };
        ids.forEach((id) => (next[id] = "approved"));
        return next;
      });
      return;
    }
    const beat = checkBeatMs(rootRef.current);
    ids.forEach((id, i) => {
      timers.current.push(
        setTimeout(
          () => setStates((s) => ({ ...s, [id]: "approving" })),
          i * APPROVE_STAGGER_MS,
        ),
        setTimeout(
          () => setStates((s) => ({ ...s, [id]: "approved" })),
          i * APPROVE_STAGGER_MS + beat,
        ),
      );
    });
  }

  function hide(ids: string[]) {
    if (ids.length === 0) return;
    exitSelect();
    setStates((s) => {
      const next = { ...s };
      ids.forEach((id) => (next[id] = "hidden"));
      return next;
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected =
    pendingIds.length > 0 && selected.size === pendingIds.length;

  return (
    <div ref={rootRef} role="group" aria-label="Interactive review queue demo">
      <BrowserFrame label={"Maya & Jay’s Wedding · host view"}>
        <div className="px-1 pb-1">
          {/* The REVIEW header row: the FeedSectionHeader shape, quoted. */}
          <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-warning uppercase">
                Review
              </span>
              {queueCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
                  {queueCount}
                </span>
              )}
            </span>
            {!cleared &&
              (selectMode ? (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelected(allSelected ? new Set() : new Set(pendingIds))
                    }
                  >
                    {allSelected ? "Clear" : "All"}
                  </Button>
                  <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
                    {selected.size}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={() => hide([...selected])}
                  >
                    <EyeOff className="text-warning" /> Hide
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={() => approve([...selected])}
                  >
                    <Check /> Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Cancel selection"
                    onClick={exitSelect}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy || pendingIds.length === 0}
                    onClick={() => setSelectMode(true)}
                  >
                    <ListChecks /> Select
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || pendingIds.length === 0}
                    onClick={() => approve(pendingIds)}
                  >
                    <Check /> Approve all
                  </Button>
                </div>
              ))}
          </div>

          {/* The queue: uniform, bulk-mode only (no per-tile approve icons). A
              cleared tile leaves a dashed slot; its album slot below fills. */}
          {cleared ? (
            <ClearedBeat onReplay={onReplay} />
          ) : (
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {QUEUE_IDS.map((id) => (
                <QueueTile
                  key={id}
                  id={id}
                  state={states[id]}
                  selectMode={selectMode}
                  selected={selected.has(id)}
                  onToggle={() => toggle(id)}
                />
              ))}
            </div>
          )}

          {/* The album beneath: same band grammar, muted tone. */}
          <div className="mt-5 flex min-h-7 items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Gallery
              </span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
                {galleryCount}
              </span>
            </span>
          </div>
          {/* Six columns, same rhythm as the queue above: the seeds fill row
              one, the six landing slots wait as row two. */}
          <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {ALBUM_SEEDS.map((seed) => (
              <AlbumCell key={seed.id}>
                <AlbumPhoto id={seed.id} hidden={Boolean(seed.hidden)} />
              </AlbumCell>
            ))}
            {QUEUE_IDS.map((id) => {
              const landed =
                states[id] === "approved" || states[id] === "hidden";
              return (
                <AlbumCell key={id}>
                  <div
                    data-mkt-fly
                    data-on={landed ? "true" : "false"}
                    className="absolute inset-0"
                    style={
                      {
                        "--fly-x": "0px",
                        "--fly-y": "-44px",
                        "--i": 0,
                      } as CSSProperties
                    }
                  >
                    <AlbumPhoto id={id} hidden={states[id] === "hidden"} />
                  </div>
                </AlbumCell>
              );
            })}
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

/** An album slot: dashed "room to fill" under the (possibly invisible) tile. */
function AlbumCell({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-square">
      <span
        aria-hidden
        className="absolute inset-0 rounded-lg border border-dashed border-border/60"
      />
      {children}
    </div>
  );
}

/**
 * One album tile. Hidden is the HOST's view of it: dimmed, with the amber
 * eye badge, which is exactly what the caption under the frame promises.
 */
function AlbumPhoto({ id, hidden }: { id: string; hidden: boolean }) {
  return (
    <>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-lg",
          hidden && "opacity-40",
        )}
      >
        <Image
          src={marketingImage(id).src}
          alt=""
          fill
          sizes="130px"
          className="object-cover"
        />
      </div>
      {hidden && (
        <span className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-background/85 text-warning">
          <EyeOff className="size-3" />
        </span>
      )}
    </>
  );
}

function QueueTile({
  id,
  state,
  selectMode,
  selected,
  onToggle,
}: {
  id: string;
  state: TileState;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const media = marketingImage(id);
  const gone = state === "approved" || state === "hidden";
  return (
    <div className="relative aspect-square">
      {/* The dashed slot the tile leaves behind. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-lg border border-dashed border-border/60"
      />
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-lg transition-opacity duration-300",
          gone && "pointer-events-none opacity-0",
        )}
      >
        <Image
          src={media.src}
          alt=""
          fill
          sizes="(min-width: 640px) 110px, 33vw"
          className="object-cover"
        />
        {/* Select mode: the SelectableMediaGrid overlay + corner check, quoted. */}
        {selectMode && state === "pending" && (
          <>
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={selected}
              aria-label={selected ? "Deselect" : "Select"}
              className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            />
            <span
              className={cn(
                "pointer-events-none absolute inset-0 transition-colors",
                selected ? "bg-black/40" : "bg-black/0",
              )}
            />
            <span
              className="pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-colors"
              style={
                selected
                  ? { borderColor: "#fff", background: "var(--success)" }
                  : {
                      borderColor: "rgba(255,255,255,0.85)",
                      background: "rgba(0,0,0,0.35)",
                    }
              }
            >
              {selected && <Check className="size-3.5 text-white" />}
            </span>
          </>
        )}
        {/* The approval beat: the mkt-check draw over the tile. */}
        {state === "approving" && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/40">
            <span className="mkt-check" data-state="in">
              <span className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* dasharray = path length + 1 (the recipe's calibration note). */}
                  <path
                    d="M20 6 9 17l-5-5"
                    style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
                  />
                </svg>
              </span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

/** The app's caught-up beat, quoted (review-section.tsx), plus Replay. */
function ClearedBeat({ onReplay }: { onReplay: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // Double rAF so the initial (hidden) style paints before the pop runs.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return (
    <div
      data-mkt-toast
      data-on={on ? "true" : "false"}
      className="flex flex-col items-center gap-3 py-6 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-7" />
      </span>
      <p className="font-heading text-lg">All caught up</p>
      <Button type="button" variant="ghost" size="sm" onClick={onReplay}>
        <RotateCcw /> Replay
      </Button>
    </div>
  );
}
