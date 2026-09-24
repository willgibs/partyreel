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
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Button } from "@/components/ui/button";
import { GLASS, GLASS_BEHIND, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { ALBUM_WITH_HIDDEN, PEEKED, QUEUE } from "./fixtures";
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
 *
 * ★ ONE PILL, TOP RIGHT, NEVER THE OWN-ITEM MARK'S CORNER (the desk re-cut:
 * his r1 note, "Don't love our 'own photo' marker or placement"). The word
 * used to stand in a second chip at top left, `MineMark`'s own corner
 * (`masonry.tsx:189-242`); `chip` now grows the SAME amber pill the eye
 * already wears instead, so the tile's only other mark is left untouched by
 * this decision, whichever shape `media-viewer` round 2 gives it.
 */
function HiddenChip({ label }: { label?: boolean }) {
  return (
    <span
      // ACTION_BASE, quoted from host-media-grid.tsx: the amber Show that
      // persists off-hover, which is today the ONLY mark a hidden tile wears.
      // `label` grows it into a pill with the word rather than adding a
      // second mark elsewhere on the tile.
      data-hc-chip={label ? "" : undefined}
      className={cn(
        "absolute top-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-black/40 text-warning backdrop-blur-sm",
        label
          ? "h-7 pr-2.5 pl-1.5 text-[11px] font-semibold"
          : "size-7 justify-center",
      )}
      aria-label="Show"
    >
      <Eye className="size-4 fill-warning/25" />
      {label && "Hidden"}
    </span>
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
 * THE MARK ON A NAME NOBODY PROVED, as the shipped `UnverifiedMark` draws it in
 * its `lit` tone over a photograph: a glass disc at the marks' blur and a white
 * dot carrying its own halo, named with the one public word. Quoted rather than
 * mounted because the real one is a Popover trigger, and a radix Popover portals
 * to the lab page rather than into this frame.
 */
function UnverifiedDot() {
  return (
    <span
      data-hc-mark
      role="img"
      aria-label={UNVERIFIED_LABEL}
      title={UNVERIFIED_LABEL}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle",
        GLASS_MARK,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1 rounded-full bg-white", GLASS_MARK_LIT)}
      />
    </span>
  );
}

/**
 * THE PEEK, DRAWN STILL, AT THE MOMENT A HOST IS LOOKING AT ONE PHOTOGRAPH.
 *
 * The shipped peek is private state inside `SelectableMediaGrid` and cannot be
 * opened from outside it, so its surface is quoted exactly: the same fixed full
 * bleed on the lightbox's ruled ground (`GLASS_BEHIND`, the queue behind it
 * blurred at half brightness), the same glass close at the top right. What
 * each option adds sits on that identical ground, over whichever grid the
 * queue decision settled.
 *
 * ★ THE UPLOAD IS A GUEST'S, CREDITED ON THE IDENTITY MODEL. Every uploader
 * passed a door that asked a name, so the viewer option's credit is a name, and
 * the Unverified mark where nobody proved it (`PEEKED`); the host sees no
 * address behind a typed name, and there is no anonymous fallback left to draw.
 *
 * ★ `viewer` NOW WEARS `media-viewer` R1 (the desk re-cut): a face-led credit
 * top left rather than a centred pill under the photograph (`who=face`), the
 * neighbours peeking at each edge instead of chevrons (`next=peek`), and the
 * actions split into two stacked pills — Save/Share/Remove above Hide/Approve
 * — rather than one bar (`holds=pills`). The "i of N" counter is gone with
 * it, exactly as that board's own call: the neighbours say there is more.
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
  const item = PEEKED;
  const at = QUEUE.findIndex((m) => m.id === item.id);
  const before = at > 0 ? QUEUE[at - 1] : undefined;
  const after = at >= 0 && at < QUEUE.length - 1 ? QUEUE[at + 1] : undefined;

  return (
    <div className="relative min-h-full">
      <ReviewSurface triage={stillTriage(QUEUE)} mode={queue} screen={screen} />

      <div className={cn("hc-overlay", GLASS_BEHIND)} data-hc-peek>
        {option === "viewer" ? (
          <div className="flex h-[88vh] w-[94vw] max-w-full items-stretch justify-center gap-1.5">
            {before && (
              <div
                aria-hidden
                className="w-8 shrink-0 overflow-hidden rounded-md opacity-45 sm:w-14"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it */}
                <img
                  src={before.url}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it */}
            <img
              src={item.url}
              alt=""
              className="max-w-[80%] rounded-md object-contain"
            />
            {after && (
              <div
                aria-hidden
                className="w-8 shrink-0 overflow-hidden rounded-md opacity-45 sm:w-14"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it */}
                <img
                  src={after.url}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it
          <img
            src={item.url}
            alt=""
            className="max-h-[88vh] max-w-[94vw] rounded-md object-contain"
          />
        )}

        <button
          type="button"
          aria-label="Close preview"
          className={cn(
            "absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white",
            GLASS,
          )}
        >
          <X className="size-5" />
        </button>

        {option === "viewer" && (
          <div
            data-hc-credit
            className="absolute top-4 left-4 flex max-w-[65%] items-center gap-2 rounded-full bg-black/55 py-1 pr-3 pl-1 backdrop-blur-sm"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold text-white"
            >
              {(item.uploaderName ?? "A").slice(0, 1)}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-white/90">
              <span className="truncate">{item.uploaderName ?? "A guest"}</span>
              {item.isVerified === false && <UnverifiedDot />}
            </span>
          </div>
        )}

        {option === "readonly" ? (
          <p className="absolute inset-x-0 bottom-6 text-center text-xs text-white/60">
            Close it, find the tile again, then decide.
          </p>
        ) : (
          <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2">
            {option === "viewer" && (
              <div
                data-hc-media-pill
                className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-2 backdrop-blur-sm"
              >
                <button type="button" aria-label="Save" className="text-white/80">
                  <Download className="size-4" />
                </button>
                <button type="button" aria-label="Share" className="text-white/80">
                  <Share2 className="size-4" />
                </button>
                <button type="button" aria-label="Remove" className="text-white/80">
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
            <div
              data-hc-verdict
              className="flex items-center gap-4 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm"
            >
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
