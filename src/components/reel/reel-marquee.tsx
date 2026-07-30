"use client";

/**
 * THE MARQUEE: the Reel section once a reel exists (ADR-0023 ruling 4, V1).
 *
 * The reel stays in the stacked feed but stops whispering. It gets a FACE (the
 * poster card is a live paused player, not a placeholder), LABELED control rows
 * instead of one undifferentiated chip strip, a thumbnail style rail on the
 * host's own media, and a persistent share card. The audit's finding was that the
 * North Star feature read as the weakest thing on the page; every choice here is
 * aimed at that.
 *
 * What deliberately did NOT change: the Download capability (kept, as a quiet
 * row, including the honest no-WebCodecs notice), the tier lock on 60s, Auto
 * length, and the curated filmstrip's add/remove/reorder behavior. This is a
 * re-presentation of a working feature, not a re-litigation of it.
 */

import { Clock, Download, ExternalLink, Lock } from "lucide-react";
import Link from "next/link";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import {
  formatReelDuration,
  formatReelMeta,
  PosterCard,
} from "@/components/reel/poster-card";
import {
  type ReelPublishController,
  ReelShareCard,
  ReelStatusChip,
} from "@/components/reel/reel-share-card";
import { ReelStitchingDialog } from "@/components/reel/reel-stitching-dialog";
import { StyleRail } from "@/components/reel/style-rail";
import {
  NO_EXPORT_NOTICE,
  REEL_LENGTHS,
  type ReelConfigController,
} from "@/components/reel/use-reel-config";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { cn } from "@/lib/utils";

/** One labeled control group. The label is REAL text, not a decorative eyebrow:
 *  a screen reader has to hear which set of options it is walking into. */
function ControlRow({
  label,
  children,
  htmlId,
}: {
  label: string;
  children: React.ReactNode;
  htmlId: string;
}) {
  return (
    <div>
      <p
        id={htmlId}
        className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
      >
        {label}
      </p>
      <div role="group" aria-labelledby={htmlId}>
        {children}
      </div>
    </div>
  );
}

/** The house chip button for the Layout / Length / Cover-Auto options. */
function OptionChip({
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
        "flex h-7 items-center gap-1 rounded-[var(--radius-action-sm)] border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-60 motion-reduce:active:scale-100",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
        disabled && "border-dashed",
      )}
    >
      {children}
    </button>
  );
}

export function ReelMarquee({
  eventId,
  eventName,
  shareUrl,
  config,
  publish,
}: {
  eventId: string;
  eventName: string;
  shareUrl?: string;
  config: ReelConfigController;
  publish: ReelPublishController;
}) {
  const {
    styleId,
    setStyleId,
    styleEntry,
    orientation,
    setOrientation,
    coverMediaId,
    setCoverMediaId,
    lengthSeconds,
    setLengthSeconds,
    maxSeconds,
    effectiveSeconds,
    tier,
    timeline,
    reelProps,
    handleDownload,
    downloading,
    exportSupported,
    stitchOpen,
    encodeState,
    handleStitchOpenChange,
    watermark,
  } = config;

  const meta = formatReelMeta({
    durationLabel: formatReelDuration(effectiveSeconds),
    styleLabel: styleEntry.label,
    momentCount: timeline.length,
  });

  return (
    <div className="space-y-3">
      {/* The section's own status row. The chip lives HERE and not in the feed's
          section header, which is ratified as a locked-height label row. The
          Studio door sits beside it because the floating action bar (the ruled
          entry point) only appears once the page is scrolled: a section with no
          visible door at the top of the page would be a dead end. */}
      <div className="flex min-h-7 items-center justify-between gap-2">
        <ReelStatusChip shared={publish.shared} />
        <Link
          href={`/dashboard/${eventId}/reel`}
          className="flex items-center gap-1 rounded text-[11px] font-medium text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open studio
          <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>

      {/* The poster: the reel's face. The SAME component the guest card uses, so
          what the host made and what the guest meets read as one thing. */}
      <PosterCard
        eventName={eventName}
        meta={meta}
        media={<CanvasReelPlayer reelProps={reelProps} showControls={false} />}
      />

      <ReelShareCard publish={publish} />

      <div className="flex flex-col gap-3">
        <ControlRow label="Style" htmlId="reel-style-label">
          <StyleRail
            reelProps={reelProps}
            styleId={styleId}
            onSelect={setStyleId}
          />
        </ControlRow>

        <ControlRow label="Layout" htmlId="reel-layout-label">
          <div className="flex items-center gap-1.5">
            {(["portrait", "landscape"] as const).map((o) => (
              <OptionChip
                key={o}
                active={o === orientation}
                onClick={() => setOrientation(o)}
              >
                <span className="capitalize">{o}</span>
              </OptionChip>
            ))}
          </div>
        </ControlRow>

        <ControlRow label="Cover" htmlId="reel-cover-label">
          {/* Inline, not a popover: picking the opening shot is a LOOKING task,
              and a strip of real thumbs answers it in one glance. */}
          <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
            <OptionChip
              active={coverMediaId == null}
              onClick={() => setCoverMediaId(null)}
            >
              Auto
            </OptionChip>
            {timeline.map((m, i) => {
              const active = m.id === coverMediaId;
              return (
                <button
                  key={m.id}
                  type="button"
                  // The thumbnail's alt is empty (decorative), so without this a
                  // screen reader hears a row of bare "button"s with no way to
                  // tell which one is the chosen cover.
                  aria-label={`Use item ${i + 1} as the opening shot`}
                  aria-pressed={active}
                  onClick={() => setCoverMediaId(m.id)}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-[var(--radius-tile)] transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:active:scale-100",
                    active && "ring-2 ring-reel",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.previewUrl ?? m.url}
                    alt=""
                    className="h-12 w-9 object-cover"
                  />
                </button>
              );
            })}
          </div>
        </ControlRow>

        <ControlRow label="Length" htmlId="reel-length-label">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            {REEL_LENGTHS.map((l) => {
              const active = l.value === lengthSeconds;
              // Every tier SEES every option; past the cap it renders locked (the
              // house upgrade-hint pattern, so the locked 60s IS the nudge).
              const locked = l.value != null && l.value > maxSeconds;
              return (
                <OptionChip
                  key={l.label}
                  active={active}
                  disabled={locked}
                  ariaLabel={locked ? `${l.label} (paid plans)` : undefined}
                  onClick={() => setLengthSeconds(l.value)}
                >
                  {locked ? <Lock className="size-2.5" aria-hidden /> : null}
                  {l.label}
                </OptionChip>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Auto fills your reel up to {maxSeconds} seconds.
            {tier === "free" ? (
              <>
                {" "}
                60-second reels are a paid feature.{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Upgrade to enable
                </Link>
                .
              </>
            ) : null}
          </p>
        </ControlRow>
      </div>

      {/* The curated set. LikesProvider lives HERE (it seeds off exactly the ids
          this grid renders), and the grid keeps the uniform layout: a legible
          sequence, not the gallery's natural-ratio masonry. */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Moments
          </p>
          <p className="text-[11px] text-muted-foreground">
            {timeline.length} · Reorder in the header
          </p>
        </div>
        <LikesProvider mediaIds={timeline.map((i) => i.id)}>
          <HostMediaGrid
            eventId={eventId}
            items={timeline}
            shareUrl={shareUrl}
            layout="uniform"
          />
        </LikesProvider>
      </div>

      {/* Download: a QUIET row, on purpose. The mp4 matters, but the reel already
          plays above it, so it is a utility and not the headline. A browser that
          can't encode (no WebCodecs) gets the honest notice instead of a button it
          could never fulfill. */}
      <div className="border-t pt-3">
        {exportSupported === false ? (
          <p className="text-[11px] text-muted-foreground">
            {NO_EXPORT_NOTICE}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border px-3 text-xs font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-60 motion-reduce:active:scale-100"
            >
              <Download className="size-3.5" aria-hidden />
              {downloading ? "Preparing…" : "Download video"}
            </button>
            {watermark ? (
              <span className="text-[11px] text-muted-foreground">
                Free reels include a small partyreel.com mark.
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* The progress modal exists only during an on-device encode (encodeState
          non-null); the client finalize flips the reel to ready synchronously, so
          there is no idle/poll state to render. */}
      {encodeState ? (
        <ReelStitchingDialog
          open={stitchOpen}
          onOpenChange={handleStitchOpenChange}
          onRetry={handleDownload}
          encode={encodeState}
        />
      ) : null}
    </div>
  );
}
