"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReviewActions } from "@/components/app/event-feed/review-actions";
import { ReviewGrid } from "@/components/app/event-feed/review-grid";
import { SelectableMediaGrid } from "@/components/app/event-feed/selectable-media-grid";
import type { ReviewTriage } from "@/components/app/event-feed/use-review-triage";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";

import { ALBUM_WITH_HIDDEN, QUEUE } from "./fixtures";
import { type ScreenId } from "./scene";
import { stillTriage, useLabTriage } from "./triage";

/** The floating action bar's own shell, quoted from `EventFeedActionBar`: in
 *  select mode the cluster is NOT in the header, it rides this pill at the foot
 *  of the screen, and a picture that puts it anywhere else is not the product. */
const BAR_PILL =
  "pointer-events-auto flex items-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-layer backdrop-blur";

/** ★ `fixed`, EXACTLY AS THE PRODUCT HAS IT. The frame IS the viewport here
 *  (the subtree is portalled into an iframe document), so `fixed` pins the bar
 *  to the bottom of the screen a host is looking at. An `absolute` bar inside a
 *  `min-h-full` column pins to the bottom of the CONTENT instead, which on this
 *  board put the whole decision below the fold: the words said the bar fits and
 *  the picture never showed it. */
function FloatingBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className={BAR_PILL}>{children}</div>
    </div>
  );
}

/* ── the queue ───────────────────────────────────────────────────────────── */

export type QueueMode = "uniform" | "natural" | "one";
export const queueOf = (v: string | undefined): QueueMode =>
  v === "natural" ? "natural" : v === "one" ? "one" : "uniform";

/**
 * THE SHIPPED REVIEW SECTION'S PENDING BRANCH, WITH ONE PROP FREED.
 *
 * ★ WHY IT IS QUOTED AND NOT IMPORTED. `ReviewSection` hard-codes `ReviewGrid`,
 * which hard-codes `layout="uniform"`, so the one thing this decision is about
 * cannot be varied from outside. Everything around the grid is the shipped
 * component line for line — the same `<section aria-label="Review">`, the same
 * `space-y-2.5`, the same `FeedSectionHeader` with the amber tone, the count
 * and the action slot, and the same rule that the cluster leaves the header in
 * select mode — so the ONLY difference between these pictures is the grid.
 * `uniform` renders the real `ReviewGrid`, unchanged.
 */
function ReviewSurface({
  triage,
  mode,
  screen,
  headerless,
}: {
  triage: ReviewTriage;
  mode: QueueMode;
  screen: ScreenId;
  headerless?: boolean;
}) {
  const { pending, selected, exiting, selectMode, toggle } = triage;

  return (
    <section aria-label="Review" className="space-y-2.5">
      {!headerless && (
        <FeedSectionHeader
          label="Review"
          count={pending.length}
          amber
          action={!selectMode ? <ReviewActions triage={triage} /> : undefined}
        />
      )}
      {mode === "uniform" ? (
        <ReviewGrid
          items={pending}
          selectMode={selectMode}
          selected={selected}
          exiting={exiting}
          onToggle={toggle}
        />
      ) : mode === "natural" ? (
        <SelectableMediaGrid
          items={pending}
          selectMode={selectMode}
          selected={selected}
          exiting={exiting}
          onToggle={toggle}
          enablePreview
          clampAspect
        />
      ) : (
        <OneAtATime items={pending} screen={screen} />
      )}
    </section>
  );
}

/**
 * ONE PHOTOGRAPH, WHOLE, WITH THE VERDICT UNDER IT. The queue becomes a room
 * rather than a grid: the upload at its own shape (`object-contain`, so nothing
 * is cropped at all), the two acts as real buttons a thumb can reach, and what
 * is left as a strip. It is the only option where the host is never asked to
 * judge a photograph they have not seen whole.
 */
function OneAtATime({
  items,
  screen,
}: {
  items: GridMedia[];
  screen: ScreenId;
}) {
  const [at, setAt] = useState(0);
  const i = Math.min(at, items.length - 1);
  const current = items[i];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div
        data-hc-judge
        className="relative flex items-center justify-center overflow-hidden rounded-[var(--radius-tile)] bg-gallery"
        style={{ height: screen === "375" ? 360 : 470 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it */}
        <img
          src={current.url}
          alt=""
          data-hc-whole
          className="max-h-full max-w-full object-contain"
        />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] tabular-nums text-white backdrop-blur-sm">
          {i + 1} of {items.length}
        </span>
        <button
          type="button"
          aria-label="Previous"
          onClick={() => setAt(Math.max(0, i - 1))}
          className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => setAt(Math.min(items.length - 1, i + 1))}
          className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setAt(Math.min(items.length - 1, i + 1))}
        >
          <EyeOff className="text-warning" /> Hide
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => setAt(Math.min(items.length - 1, i + 1))}
        >
          <Check /> Approve
        </Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {items.map((m, n) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setAt(n)}
            aria-label={`Upload ${n + 1}`}
            className="relative size-12 shrink-0 overflow-hidden rounded-md outline-none"
            style={{ opacity: n === i ? 1 : 0.45 }}
          >
            <MediaTile item={m} playBadge="none" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function QueueShowcase({
  mode,
  screen,
}: {
  mode: QueueMode;
  screen: ScreenId;
}) {
  const triage = useLabTriage({ items: QUEUE });
  return <ReviewSurface triage={triage} mode={mode} screen={screen} />;
}

/* ── the verb ────────────────────────────────────────────────────────────── */

export type VerbOption = "today" | "reject" | "chip";
export const verbOf = (v: string | undefined): VerbOption =>
  v === "reject" ? "reject" : v === "chip" ? "chip" : "today";

/**
 * A SKETCH OF THE BAR UNDER EACH RULE, built from the real `Button` at the real
 * sizes, inside the real floating pill. `ReviewActions` hard-codes its own
 * words, so the two alternatives cannot be had by flipping a prop; `today`
 * renders the SHIPPED cluster so the comparison is against the real thing.
 */
function VerbBar({ option, count }: { option: VerbOption; count: number }) {
  if (option === "today") {
    return (
      <ReviewActions
        triage={stillTriage(QUEUE, {
          selectMode: true,
          selected: new Set(QUEUE.slice(0, count).map((m) => m.id)),
        })}
      />
    );
  }
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button type="button" variant="ghost" size="sm">
        All
      </Button>
      <span className="px-0.5 text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
      <Button type="button" variant="outline" size="sm">
        {option === "reject" ? (
          <X className="text-warning" />
        ) : (
          <EyeOff className="text-warning" />
        )}
        {option === "reject" ? "Reject" : "Hide"}
      </Button>
      <Button type="button" size="sm">
        <Check /> Approve
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel selection"
      >
        <X />
      </Button>
    </div>
  );
}

/**
 * THE WORD, AND WHAT THE WORD PRODUCED, IN ONE PICTURE. The bar over the queue
 * is the decision; the album under it is the consequence, because the review
 * "Hide" and the gallery "Hide" reach the SAME row state by two different acts.
 * Two album tiles really carry `status: "hidden"`.
 *
 * ★ AND THE ALBUM IS DRAWN AS IT REALLY IS, WHICH IS NOT AS IT IS DOCUMENTED.
 * `host-media-grid.tsx` says a hidden tile wears "a 1-tap show atop the 30%
 * dim". It does not: `masonry.tsx` builds that class as
 * `active:scale-[0.98]${dimItem ? "opacity-30" : ""}` with no separator, so the
 * two run together into one token Tailwind never emits and a hidden photograph
 * sits in the album at full brightness. Nothing tests it. The bug is a ROADMAP
 * line in this lane's manifest; the picture here is the product, unfixed, which
 * is what makes `today` an honest option to judge.
 *
 * ★ THE GRID IS `MasonryColumns` DIRECTLY, which is what `HostMediaGrid`
 * renders. Its per-tile overlay is not exported and every chip on it calls
 * `setMediaStatusAction`, so the one chip this decision needs — the persistent
 * amber Show — is quoted from it at its own classes and the rest is left out.
 */
function HiddenChip({ label }: { label?: boolean }) {
  return (
    <>
      <span
        // ACTION_BASE, quoted from host-media-grid.tsx: the amber Show that
        // persists off-hover, which is today the ONLY mark a hidden tile wears.
        className="absolute top-1.5 right-1.5 z-10 ml-1 flex size-7 items-center justify-center rounded-full bg-black/40 text-warning backdrop-blur-sm"
        aria-label="Show"
      >
        <Eye className="size-4 fill-warning/25" />
      </span>
      {label && (
        <span
          data-hc-chip
          className="absolute top-1.5 left-1.5 z-10 flex h-5 items-center gap-1 rounded-full bg-warning/90 px-2 text-[10px] font-semibold text-black"
        >
          <EyeOff className="size-2.5" /> Hidden
        </span>
      )}
    </>
  );
}

export function VerbShowcase({
  option,
  screen,
}: {
  option: VerbOption;
  screen: ScreenId;
}) {
  const phone = screen === "375";
  const album = ALBUM_WITH_HIDDEN.slice(0, phone ? 6 : 9);
  const hidden = album.filter((m) => m.status === "hidden").length;

  return (
    <div className="relative min-h-full space-y-6 pb-16">
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader
          label="Review"
          count={phone ? 4 : 6}
          amber
        />
        <ReviewGrid
          items={QUEUE.slice(0, phone ? 4 : 6)}
          selectMode
          selected={new Set(QUEUE.slice(0, 2).map((m) => m.id))}
          exiting={new Set()}
          onToggle={() => {}}
        />
      </section>

      <section aria-label="Gallery" className="space-y-2.5">
        <FeedSectionHeader label="Gallery" count={album.length} />
        <p className="text-xs text-muted-foreground" data-hc-says>
          {option === "chip"
            ? `One word did both acts, and the ${hidden} tiles it put down say Hidden themselves.`
            : option === "reject"
              ? `Refused at the door is "Reject". Taken down later is "Hide", and ${hidden} tiles wear it.`
              : `One word did both acts. ${hidden} tiles are down, marked only by an amber eye, and nothing says which act put them there.`}
        </p>
        <div className="pointer-events-none" data-hc-album>
          <MasonryColumns
            items={album}
            clampAspect
            viewerIsHost
            dimItem={(m) => m.status === "hidden"}
            renderOverlay={(m) =>
              m.status === "hidden" ? (
                <HiddenChip label={option === "chip"} />
              ) : null
            }
          />
        </div>
      </section>

      <FloatingBar>
        <VerbBar option={option} count={2} />
      </FloatingBar>
    </div>
  );
}

/* ── the peek ────────────────────────────────────────────────────────────── */

export type PeekOption = "readonly" | "verdict" | "viewer";
export const peekOf = (v: string | undefined): PeekOption =>
  v === "verdict" ? "verdict" : v === "viewer" ? "viewer" : "readonly";

/**
 * THE PEEK, DRAWN STILL, AT THE MOMENT A HOST IS LOOKING AT ONE PHOTOGRAPH.
 *
 * The shipped peek is private state inside `SelectableMediaGrid` and cannot be
 * opened from outside it, so its surface is quoted exactly: the same
 * `bg-black/95` full bleed, the same `max-h-[88vh] max-w-[94vw]` contain, the
 * same round `bg-white/10` close at the top right. What each option adds sits
 * on that identical ground, over whichever grid the queue decision settled.
 */
export function PeekShowcase({
  option,
  queue,
  screen,
}: {
  option: PeekOption;
  queue: QueueMode;
  screen: ScreenId;
}) {
  const item = QUEUE[1];

  return (
    <div className="relative min-h-full">
      <ReviewSurface triage={stillTriage(QUEUE)} mode={queue} screen={screen} />

      <div className="hc-overlay" data-hc-peek>
        {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it */}
        <img
          src={item.url}
          alt=""
          className="max-h-[88vh] max-w-[94vw] rounded-md object-contain"
        />
        <button
          type="button"
          aria-label="Close preview"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="size-5" />
        </button>

        {option === "viewer" && (
          <>
            <button
              type="button"
              aria-label="Previous"
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {option === "readonly" ? (
          <p className="absolute inset-x-0 bottom-6 text-center text-xs text-white/60">
            Close it, find the tile again, then decide.
          </p>
        ) : (
          <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2">
            {option === "viewer" && (
              <div className="flex max-w-[88%] flex-col items-center rounded-full bg-black/55 px-3 py-1 text-center backdrop-blur-sm">
                <span className="text-xs text-white/85">
                  {item.uploaderName ?? "Anonymous"}
                  <span className="text-white/60"> · 2 of {QUEUE.length}</span>
                </span>
              </div>
            )}
            <div
              data-hc-verdict
              className="flex items-center gap-4 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm"
            >
              {option === "viewer" && (
                <>
                  <button type="button" aria-label="Save" className="text-white/80">
                    <Download className="size-5" />
                  </button>
                  <button type="button" aria-label="Share" className="text-white/80">
                    <Share2 className="size-5" />
                  </button>
                  <button type="button" aria-label="Remove" className="text-white/80">
                    <Trash2 className="size-5" />
                  </button>
                  <span className="h-5 w-px bg-white/25" aria-hidden />
                </>
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-white/85"
              >
                <EyeOff className="size-4 text-warning" /> Hide
              </button>
              <span className="h-4 w-px bg-white/25" aria-hidden />
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-white"
              >
                <Check className="size-4 text-success" /> Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── the keyboard ────────────────────────────────────────────────────────── */

export type KeysOption = "none" | "jk" | "arrows";
export const keysOf = (v: string | undefined): KeysOption =>
  v === "jk" ? "jk" : v === "arrows" ? "arrows" : "none";

const HINTS: Record<"jk" | "arrows", [string, string][]> = {
  jk: [
    ["j / k", "move"],
    ["a", "approve"],
    ["h", "hide"],
  ],
  arrows: [
    ["← →", "move"],
    ["Enter", "approve"],
    ["Backspace", "hide"],
  ],
};

/**
 * THE KEYS, REALLY BOUND. The hint row is the affordance being judged; the
 * handling under it is live on the forked triage, so pressing a key inside the
 * frame really moves the ring and really empties the queue at the shipped exit
 * and beat timings. Nothing reaches a server: the fork's run resolves.
 *
 * `none` is today: nothing in the queue takes a key at all, so there is no ring
 * to draw. `jk` is the power idiom with no visible affordance, which is exactly
 * its cost, so the only thing it adds to the picture is the ring.
 *
 * ★ THE RING IS DRAWN BY nth-child, NOT BY POKING THE GRID. The tile is inside
 * `SelectableMediaGrid` and takes no prop for it, and rewriting attributes into
 * someone else's subtree from a ref is how a board ends up drawing a state the
 * product cannot. One scoped rule on the grid's own children says it instead.
 */
export function KeysShowcase({
  option,
  queue,
  screen,
}: {
  option: KeysOption;
  queue: QueueMode;
  screen: ScreenId;
}) {
  const triage = useLabTriage({ items: QUEUE });
  const [at, setAt] = useState(0);
  const box = useRef<HTMLDivElement | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const live = option !== "none";
  const { pending, run } = triage;
  const i = Math.min(at, Math.max(0, pending.length - 1));

  useEffect(() => {
    const doc = box.current?.ownerDocument;
    if (!doc || !live) return;
    const [fwd, back, yes, no] =
      option === "jk"
        ? ["j", "k", "a", "h"]
        : ["ArrowRight", "ArrowLeft", "Enter", "Backspace"];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === fwd) setAt((n) => Math.min(pending.length - 1, n + 1));
      else if (e.key === back) setAt((n) => Math.max(0, n - 1));
      else if (e.key === yes || e.key === no) {
        const item = pending[Math.min(at, pending.length - 1)];
        if (item) void run(e.key === yes ? "approve" : "hide", [item.id]);
      } else return;
      e.preventDefault();
    };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
  }, [at, live, option, pending, run]);

  return (
    <div ref={box} className={`hc-k-${uid} space-y-2.5`} data-hc-keys>
      {live && queue !== "one" && (
        <style>{`.hc-k-${uid} section[aria-label="Review"] > div:first-child > *:nth-child(${i + 1}) { outline: 3px solid var(--ring); outline-offset: 3px; border-radius: var(--radius-tile); }`}</style>
      )}
      <FeedSectionHeader label="Review" count={pending.length} amber />
      {option === "arrows" ? (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
          data-hc-hint
        >
          {HINTS.arrows.map(([key, does]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] leading-none">
                {key}
              </kbd>
              {does}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground" data-hc-hint>
          {option === "jk"
            ? "The keys work. Nothing on the page says so."
            : "Every verdict is a tap. The only keys in the product are the viewer's arrows."}
        </p>
      )}
      <ReviewSurface triage={triage} mode={queue} screen={screen} headerless />
    </div>
  );
}
