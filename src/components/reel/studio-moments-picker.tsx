"use client";

/**
 * THE MOMENTS PICKER: the Studio's in-room door for choosing what is in the reel.
 *
 * This is the primary selection surface since host-app.md. The gallery tile used to carry a clapperboard
 * chip, so "add this to the reel" was a decision you made one card at a time, in a surface whose job is
 * moderation, next to four other chips. That was backwards: picking a cut is a MODE, and the
 * room you are in should carry the meaning instead of an icon repeated on every card. So membership is
 * chosen HERE, inside the room where the reel is playing two inches above the grid.
 *
 * Three things make it a picker and not a gallery:
 *   * membership IS the state. There is no local selection, no Done, no commit. A tap writes, the
 *     dock reorders under the sheet, and the player above re-cuts. That immediacy is the argument for
 *     doing this in the Studio at all.
 *   * the badge is a POSITION, not a checkmark alone. In a reel, "in" is less interesting than
 *     "where", and the number is the bridge between this grid and the filmstrip dock.
 *   * likes are shown but never obeyed. A like count is a signal the host reads; it is not membership
 *     (Will named the favorites-vs-reel conflict directly). The one place likes DO act is the
 *     "suggested" hint, which is quick-add's blend surfacing its own reasoning.
 *
 * Deliberately bespoke rather than SelectableMediaGrid: that component hard-codes the app's light
 * palette, and this grid lives in an oklch(0.11) room.
 */

import { Check, Clapperboard, EyeOff, Heart, Play } from "lucide-react";
import { useMemo } from "react";

import { type GridMedia } from "@/components/app/media-grid";
import { useReel } from "@/components/reel/reel-provider";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { momentAction } from "@/lib/reel/moment-picker";
import { pickQuickAdd, type QuickAddCandidate } from "@/lib/reel/quick-add";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { cn } from "@/lib/utils";

export function StudioMomentsPicker({
  eventId,
  items,
}: {
  eventId: string;
  /** The event's full visible pool (approved + hidden; the route already drops pending). */
  items: GridMedia[];
}) {
  const reel = useReel();

  // Position lookup built ONCE per render: the badge needs "which slot", and indexOf per tile would
  // walk the reel for every item in the album.
  const positions = useMemo(() => {
    const map = new Map<string, number>();
    (reel?.orderedIds ?? []).forEach((id, i) => map.set(id, i + 1));
    return map;
  }, [reel?.orderedIds]);

  // The same deterministic blend the builder's quick-add offers, over the same candidate shape, so the
  // "suggested" hint here and the "start with the crowd favorites" button there agree about what a good
  // first cut is. Approved-only, because a suggestion the RPC would refuse is not a suggestion.
  const suggested = useMemo(() => {
    const candidates: QuickAddCandidate[] = items
      .filter((m) => (m.status ?? "approved") === "approved")
      .map((m) => ({
        id: m.id,
        type: m.type,
        createdAt: m.createdAt ?? null,
        uploaderKey: m.uploaderKey ?? null,
        likeCount: m.likeCount,
      }));
    return new Set(
      pickQuickAdd(candidates, { seed: defaultReelSeed(eventId) }).ids,
    );
  }, [items, eventId]);

  if (!reel) return null;

  const count = positions.size;
  const toAdd = items
    .filter((m) => suggested.has(m.id) && !reel.inReel(m.id))
    .map((m) => m.id);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-micro text-white/55 tabular-nums">
          {count === 1 ? "1 moment" : `${count} moments`}
        </p>
        {toAdd.length > 0 ? (
          <button
            type="button"
            onClick={() => void reel.addMany(toAdd)}
            className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-reel/50 px-2.5 text-caption font-medium text-[oklch(0.8_0.14_300)] transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100"
          >
            <Clapperboard className="size-3" aria-hidden />
            Add suggested ({toAdd.length})
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-[var(--gap-gallery)] sm:grid-cols-5">
        {items.map((m) => {
          const inReel = reel.inReel(m.id);
          const action = momentAction({ inReel, status: m.status });
          const position = positions.get(m.id);
          const hidden = m.status === "hidden";
          const hint = !inReel && suggested.has(m.id);

          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={inReel}
              disabled={action === "blocked"}
              // Native title, not a styled tooltip: styled tooltips are lightbox-only in this codebase,
              // and ~200 of them on a grid was a hydration risk once already.
              title={
                action === "blocked"
                  ? "Hidden moments can't be added. Show it first."
                  : undefined
              }
              aria-label={
                action === "blocked"
                  ? "Hidden, cannot be added to the reel"
                  : inReel
                    ? `Remove moment ${position} from the reel`
                    : "Add to the reel"
              }
              onClick={() => {
                // The whole routing rule is one pure call (see lib/reel/moment-picker): add goes
                // through the SILENT addMany, because toggle toasts on every add and adding several
                // in a row is the normal gesture here.
                if (action === "add") void reel.addMany([m.id]);
                else if (action === "remove") reel.toggle(m.id);
              }}
              style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-tile)] bg-white/5 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100",
                inReel && "ring-2 ring-reel ring-inset",
                action === "blocked" && "cursor-not-allowed active:scale-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.previewUrl ?? m.url}
                alt=""
                className={cn(
                  "size-full object-cover",
                  // Hidden reads dim wherever it appears (the album's own convention), and an
                  // unpicked tile sits back so the chosen cut is what the eye lands on.
                  hidden ? "opacity-30" : inReel ? "opacity-100" : "opacity-70",
                )}
              />

              {/* In-reel: the violet disc carries the POSITION. Where a moment sits is the useful
                  fact once it is in, and it is the same number the dock shows. */}
              {inReel ? (
                <span
                  aria-hidden
                  className="absolute top-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-reel px-1 text-micro font-semibold text-white tabular-nums"
                >
                  {position}
                </span>
              ) : null}
              {inReel ? (
                <span
                  aria-hidden
                  className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-reel text-white"
                >
                  <Check className="size-2.5" />
                </span>
              ) : null}

              {/* The soft suggestion: quick-add's blend showing its work, never a decision. */}
              {hint ? (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pt-2 pb-0.5 text-label font-medium text-white/85 uppercase"
                >
                  Suggested
                </span>
              ) : null}

              {hidden ? (
                <span
                  aria-hidden
                  className="absolute top-1 right-1 text-warning"
                >
                  <EyeOff className="size-3" />
                </span>
              ) : null}

              {/* The like count is READ-ONLY here, on purpose: it informs the choice, it never is it. */}
              {!inReel && (m.likeCount ?? 0) > 0 ? (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1 text-micro font-medium text-white tabular-nums"
                >
                  <Heart className="size-2 fill-current" />
                  {m.likeCount}
                </span>
              ) : null}

              {m.type === "video" ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50"
                >
                  <Play className="size-2.5 fill-white text-white" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 text-center text-[10px] text-white/40">
        New moments join the end. Drag the strip to reorder.
      </p>
    </div>
  );
}
