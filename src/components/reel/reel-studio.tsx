"use client";

/**
 * THE STUDIO: a dedicated room for the reel, at its own route.
 *
 * Ruled a ROUTE and not a modal (Will, R3): the reel deserves a place you GO to,
 * it survives a refresh, and the phone's back gesture means what it looks like it
 * means. Inside, the canvas is the room. Everything else is either a dock under it
 * (reorder, without swapping modes) or a sheet that slides over it (the four
 * settings), so the reel is never off screen while the host works on it.
 *
 * The one loud action in here is Share, and what answers it is the canvas: what
 * is being published is the thing you are looking at, so the reel's own frame is
 * what lights up. A SHARED reel rests lit from behind, in the house five, for as
 * long as it is shared (Will, 2026-09-17; publish-light.tsx holds the rulings and
 * the lamp). The light is never over the media and never on the Share button.
 */

import { Check, Download, Lock, Share2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
} from "react";

import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import { StudioPublishLight } from "@/components/reel/publish-light";
import { useReel } from "@/components/reel/reel-provider";
import { useReelPublish } from "@/components/reel/reel-share-card";
import { ReelStitchingDialog } from "@/components/reel/reel-stitching-dialog";
import {
  AddMomentsTile,
  StudioFilmstrip,
} from "@/components/reel/studio-filmstrip";
import { StudioMomentsPicker } from "@/components/reel/studio-moments-picker";
import { StyleWall } from "@/components/reel/style-rail";
import {
  NO_EXPORT_NOTICE,
  REEL_LENGTHS,
  useReelConfig,
} from "@/components/reel/use-reel-config";
import { rxpMs } from "@/components/reel/reveal-constants";
import { type GridMedia } from "@/components/app/media-grid";
import { type Tier } from "@/lib/constants/tiers";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type Sheet = "none" | "moments" | "style" | "cover" | "length" | "layout";

// Moments leads the tray (host-app.md): WHAT is in the reel is the first question, and since R3.1 this is
// the primary door for answering it anywhere in the product. The other four style what is already there.
const SHEETS: { id: Exclude<Sheet, "none">; label: string }[] = [
  { id: "moments", label: "Moments" },
  { id: "style", label: "Style" },
  { id: "cover", label: "Cover" },
  { id: "length", label: "Length" },
  { id: "layout", label: "Layout" },
];

/**
 * The player's own width caps, mirrored (CanvasReelPlayer, lib/reel/engine/player.tsx:
 * `max-w-[360px]` portrait, `max-w-[640px]` landscape). The lit frame's wrapper
 * takes the same cap so it is exactly as wide as the reel it holds, which is what
 * lets the publish light be measured against the reel and not against the room.
 * If the player's caps ever move, move these with them: a mismatch fails soft (the
 * narrower of the two wins the reel's width, and the light sits a little off).
 * Literal class names on purpose, so Tailwind's scanner sees them.
 */
const FRAME_CAP = {
  portrait: "max-w-[360px]",
  landscape: "max-w-[640px]",
} as const;

/** The dark-room chip: the Studio's own control language (the app's light chips
 *  would fight the room). */
function RoomChip({
  active,
  disabled,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-50 motion-reduce:active:scale-100",
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80",
        disabled && "border-dashed",
      )}
    >
      {children}
    </button>
  );
}

export function ReelStudio({
  eventId,
  eventName,
  items,
  reelConfig,
  watermark,
  tier,
  guestVisible,
}: {
  eventId: string;
  eventName: string;
  items: GridMedia[];
  reelConfig: ReelConfig | null;
  watermark: boolean;
  tier: Tier;
  guestVisible: boolean;
}) {
  const router = useRouter();
  const reel = useReel();
  const reduced = usePrefersReducedMotion();
  const config = useReelConfig({ eventId, items, reelConfig, watermark, tier });
  const publish = useReelPublish(eventId, guestVisible);

  const [sheet, setSheet] = useState<Sheet>("none");
  const [showControls, setShowControls] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const publishTimer = useRef<number | null>(null);
  // The trigger that opened the current sheet, so Escape can hand focus back
  // instead of dropping it on the document.
  const sheetTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(
    () => () => {
      if (publishTimer.current !== null)
        window.clearTimeout(publishTimer.current);
    },
    [],
  );

  const closeSheet = useCallback(() => {
    setSheet("none");
    sheetTrigger.current?.focus({ preventScroll: true });
  }, []);

  /** The dock's "+" opens the same sheet the tray's first chip does, and records ITSELF as the
   *  trigger so Escape hands focus back to the tile that was tapped, not to the tray. */
  const openMoments = useCallback<MouseEventHandler<HTMLButtonElement>>((e) => {
    sheetTrigger.current = e.currentTarget;
    setSheet("moments");
  }, []);

  // Escape closes the open sheet. Registered only while one is open, so it never
  // competes with anything else for the key.
  useEffect(() => {
    if (sheet === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, closeSheet]);

  /** X: back to wherever the host came from, but REFRESH first. The event page is
   *  force-dynamic yet still route-cached on the client, so without this the feed
   *  would show the pre-Studio config (a stale style, an old cover). */
  function exit() {
    router.back();
    router.refresh();
  }

  function share() {
    if (publishing || publish.pending) return;
    if (reduced) {
      // No theater under reduced motion: the state just lands.
      publish.flip(true);
      return;
    }
    setPublishing(true);
    publish.flip(true);
    // The confirmation card's hold, and only the card's. The LIGHT is not on this
    // timer: the state mounts it (publish.shared) and it stays, and its swell is
    // the engine's own 1400ms one-shot. At the baked 700 the card holds 1600ms, so
    // it leaves a breath after the light has settled to its base.
    publishTimer.current = window.setTimeout(
      () => setPublishing(false),
      rxpMs("--tune-rxp-pub-ms") + 900,
    );
  }

  const meta = formatReelMeta({
    durationLabel: formatReelDuration(config.effectiveSeconds),
    styleLabel: config.styleEntry.label,
    momentCount: config.timeline.length,
  });
  const landscape = config.orientation === "landscape";

  return (
    // The room: full-bleed, near-black, its own world. min-h-dvh (never vh) so
    // mobile browser chrome cannot push the dock off the bottom.
    //
    // overflow-x-clip (never overflow-hidden): the publish light's field is wider
    // than a phone, and the room's edge IS the screen's edge, so clipping there
    // cuts nothing the screen was not already cutting while guaranteeing the
    // wings can never hand the page a sideways scroll. `hidden` would also clip
    // the y axis and turn the room into a scroll container.
    <div
      data-rxp-studio
      className="fixed inset-x-0 top-0 z-40 flex h-dvh flex-col overflow-x-clip bg-[oklch(0.11_0_0)]"
    >
      {/* Header: exit left, the room's name, ONE loud action right.
          ★ `relative z-10` IS THE STACK, here and on the dock and the tray below.
          The publish light is positioned and reaches past the frame, and a
          positioned box paints over every unpositioned one whatever the DOM
          order, so left static these three would sit UNDER the light: the title
          washed, the dock's thumbnails tinted. It reads as "the effect is too
          strong" and sends you tuning opacity instead of fixing the stack. */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={exit}
          aria-label="Close the studio"
          className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100"
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[9px] font-medium tracking-[0.24em] text-white/50 uppercase">
            The studio
          </p>
          <p className="truncate text-[11px] text-white/40">{meta}</p>
        </div>
        {!publish.shared ? (
          <button
            type="button"
            onClick={share}
            disabled={publishing || publish.pending}
            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Share2 className="size-3.5" aria-hidden />
            Share
          </button>
        ) : (
          <button
            type="button"
            onClick={() => publish.flip(false)}
            disabled={publish.pending}
            className="flex h-9 items-center gap-1 rounded-[var(--radius-action-sm)] border border-reel/50 px-3 text-xs font-medium text-[oklch(0.8_0.14_300)] transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Check className="size-3.5" aria-hidden />
            Shared
          </button>
        )}
      </div>

      {/* The canvas IS the room. Height-fit (aspect from h-full) so the WHOLE
          frame sits above the dock instead of sliding under it. */}
      <div className="relative min-h-0 flex-1 px-6">
        <div
          className={cn(
            "mx-auto h-full max-w-full",
            landscape ? "aspect-[16/9]" : "aspect-[9/16]",
          )}
        >
          {/* THE LIT FRAME. The height-fit box above is NOT the frame: the player
              caps its own width (FRAME_CAP), so on a tall screen the box is wider
              and taller than the reel inside it (400x712 around a 360x640 frame
              at 1440x900, and far wider in landscape). A light centred on that
              box sits off the reel. This wrapper hugs the player instead, so the
              lamp's percentages are percentages of the thing being lit.
              Lamp first, frame after it and positioned: the light stays behind
              the reel by DOM order, and `isolate` keeps that local. Never
              `overflow-hidden` here (glow-placement.test.ts). */}
          <div
            className={cn(
              "relative isolate mx-auto w-full",
              landscape ? FRAME_CAP.landscape : FRAME_CAP.portrait,
            )}
          >
            <StudioPublishLight
              shared={publish.shared}
              sharedHere={publish.sharedHere}
            />
            <button
              type="button"
              onClick={() => setShowControls((v) => !v)}
              aria-pressed={showControls}
              aria-label={
                showControls
                  ? "Hide playback controls"
                  : "Show playback controls"
              }
              className="relative block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <CanvasReelPlayer
                reelProps={config.reelProps}
                showControls={showControls}
              />
            </button>
          </div>
        </div>
        {publishing ? (
          <div
            data-rxp-toastcard
            role="status"
            className="absolute inset-x-6 bottom-2 flex items-center gap-2 rounded-lg bg-white/95 p-2.5 shadow-layer"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-reel text-white"
            >
              <Check className="size-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-zinc-900">
                Guests can now watch
              </p>
              <p className="text-[10px] text-zinc-500">
                Live on the album page
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* The dock: reorder while the reel keeps playing, plus the "+" door into the
          picker. The dock stays ORDER-only otherwise (one job per surface) - adding
          and removing happen in the sheet, where there is room to actually look.
          `relative z-10`: above the publish light (the header's note has why). */}
      <div className="relative z-10 px-3 pt-2">
        {reel && config.membership.length > 1 ? (
          <StudioFilmstrip
            items={config.membership}
            coverMediaId={config.coverMediaId}
            onReorder={(ids) => void reel.reorder(ids)}
            trailing={<AddMomentsTile onClick={openMoments} />}
          />
        ) : reel ? (
          // One moment, or none: nothing to reorder, but the door still belongs here.
          // It is the fastest path out of a one-shot reel.
          <div className="flex justify-center pb-1">
            <AddMomentsTile onClick={openMoments} />
          </div>
        ) : null}
      </div>

      {/* The control tray: five sheets that slide over the canvas. `mx-auto w-fit` + overflow rather
          than justify-center, because a centered flex row CLIPS its own start once the content
          overflows, which on a narrow phone would hide the Moments chip.
          `relative z-10`: above the publish light (the header's note has why). The
          sheet below shares the z-index and comes later, so it still covers both. */}
      <div className="relative z-10 px-3 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto">
          {SHEETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-expanded={sheet === id}
              onClick={(e) => {
                sheetTrigger.current = e.currentTarget;
                setSheet(sheet === id ? "none" : id);
              }}
              className={cn(
                "flex h-8 shrink-0 items-center rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100",
                sheet === id
                  ? "border-white bg-white text-zinc-900"
                  : "border-white/20 text-white/80",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ONE sheet at a time, each mounted only while open. That is what makes the
          Style wall affordable: closing it drops 14 canvases, and the shared bitmap
          cache makes reopening cheap. NOT vaul: these are small, non-draggable
          panels over a canvas, so a drawer library's gesture machinery would only
          fight the filmstrip's own pointer handling. */}
      {sheet !== "none" ? (
        <div
          data-rxp-sheet
          role="dialog"
          aria-label={SHEETS.find((s) => s.id === sheet)?.label}
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
            sheet === "style" && "max-h-[52%] overflow-y-auto",
            // The picker is a whole album, so it gets the tall body. It still stops short of the
            // top so the reel stays visible above it: choosing a cut while watching it is the
            // entire argument for doing this in the Studio.
            sheet === "moments" && "max-h-[70dvh] overflow-y-auto",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
              {SHEETS.find((s) => s.id === sheet)?.label}
            </p>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-full border border-white/15 text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          {sheet === "moments" ? (
            <StudioMomentsPicker eventId={eventId} items={items} />
          ) : null}

          {sheet === "style" ? (
            <StyleWall
              reelProps={config.reelProps}
              styleId={config.styleId}
              onSelect={config.setStyleId}
            />
          ) : null}

          {sheet === "cover" ? (
            <div
              role="group"
              aria-label="Opening shot"
              className="flex items-center gap-1.5 overflow-x-auto pb-1"
            >
              <RoomChip
                active={config.coverMediaId == null}
                onClick={() => config.setCoverMediaId(null)}
              >
                Auto
              </RoomChip>
              {config.timeline.map((m, i) => {
                const active = m.id === config.coverMediaId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Use item ${i + 1} as the opening shot`}
                    aria-pressed={active}
                    onClick={() => config.setCoverMediaId(m.id)}
                    className={cn(
                      "shrink-0 overflow-hidden rounded-tile transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] motion-reduce:active:scale-100",
                      active && "ring-2 ring-reel",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.previewUrl ?? m.url}
                      alt=""
                      className="h-16 w-9 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          {sheet === "length" ? (
            <>
              <div role="group" aria-label="Length" className="flex gap-1.5">
                {REEL_LENGTHS.map((l) => {
                  const locked = l.value != null && l.value > config.maxSeconds;
                  return (
                    <RoomChip
                      key={l.label}
                      active={l.value === config.lengthSeconds}
                      disabled={locked}
                      ariaLabel={locked ? `${l.label} (paid plans)` : undefined}
                      onClick={() => config.setLengthSeconds(l.value)}
                    >
                      {locked ? (
                        <Lock className="size-2.5" aria-hidden />
                      ) : null}
                      {l.label}
                    </RoomChip>
                  );
                })}
              </div>
              {/* The free-tier upgrade line. It followed the length control down from the marquee
                  (host-app.md): the Lock on 60s is the nudge, and this is the only place that says
                  what to do about it, so the move had to bring it along. */}
              <p className="mt-2 text-[11px] text-white/45">
                Auto fits your moments into {config.maxSeconds} seconds.
                {config.tier === "free" ? (
                  <>
                    {" "}
                    60-second reels are a paid feature.{" "}
                    <Link
                      href="/pricing"
                      className="font-medium text-white underline underline-offset-4"
                    >
                      Upgrade to enable
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </>
          ) : null}

          {sheet === "layout" ? (
            <div role="group" aria-label="Layout" className="flex gap-1.5">
              {(["portrait", "landscape"] as const).map((o) => (
                <RoomChip
                  key={o}
                  active={o === config.orientation}
                  onClick={() => config.setOrientation(o)}
                >
                  <span className="capitalize">{o}</span>
                </RoomChip>
              ))}
            </div>
          ) : null}

          {/* Download lives in the Length sheet's neighbourhood rather than the
              room's chrome: the room is for LOOKING, and the mp4 is a utility. */}
          {sheet === "length" ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              {config.exportSupported === false ? (
                <p className="text-[11px] text-white/45">{NO_EXPORT_NOTICE}</p>
              ) : (
                <button
                  type="button"
                  onClick={config.handleDownload}
                  disabled={config.downloading}
                  className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/20 px-3 text-[11px] font-medium text-white/80 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97] disabled:opacity-60 motion-reduce:active:scale-100"
                >
                  <Download className="size-3.5" aria-hidden />
                  {config.downloading ? "Preparing…" : "Download video"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* The event's name, quietly, so the room still knows whose night it is. */}
      <p className="pointer-events-none absolute inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] text-center text-[10px] text-white/25">
        {eventName}
      </p>

      {config.encodeState ? (
        <ReelStitchingDialog
          open={config.stitchOpen}
          onOpenChange={config.handleStitchOpenChange}
          onRetry={config.handleDownload}
          encode={config.encodeState}
        />
      ) : null}
    </div>
  );
}
