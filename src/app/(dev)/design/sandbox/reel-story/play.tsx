"use client";

import { Play, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { DEMO_COUNTS, DEMO_ITEMS, EVENT } from "./fixtures";
import { DemoReel, useOffStage, ViewRest } from "./parts";
import { CinemaRoom, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * WHERE THE HOME TEASER'S PLAY MARK LEADS, EACH DRAWN OPENED ON A REAL SCREEN.
 *
 * Every frame is a whole screen (1440 by 900, 375 by 812), because a layer over
 * the page covers exactly one. Behind it stands the home's reel section: the
 * real `SectionShell` at the chapter-opener tier, its shipped heading, and the
 * teaser the brief describes, a short muted loop with a play mark. The loop is
 * a stand-in (`hero-candidate-02`) until Partyreel's own creator makes the real
 * one from the demo album. Every option opens on the same press and draws the
 * demo album's live reel on the real engine; Close shows where each returns,
 * and the play mark opens it again.
 *
 * ★ THE VIEW IS DRAWN FROM ITS PARTS, NEVER MOUNTED. The shipped view is a radix
 * dialog, which portals to the lab page's body rather than the frame's, so
 * every option draws the same picture and the same resting chrome the view
 * settles into (`parts.tsx`), and nothing that opens a menu.
 */

export type PlayId = "overlay" | "route" | "modal";

/** The teaser's loop, until the demo album's own clip exists. */
const TEASER_LOOP = MARKETING_REELS.find((r) => r.id === "hero-candidate-02")!;

/** The one line of context the overlay and the modal carry. */
const CONTEXT_LINE = "The demo album's highlight reel, playing live.";

/**
 * THE TEASER AT REST: the home's reel section down to its screen. The loop is a
 * plain muted <video>, which the frame's own document plays; under reduced
 * motion it stays on its poster, the loop-pause contract's still state.
 */
function Teaser({ onPlay }: { onPlay: () => void }) {
  const reduced = usePrefersReducedMotion();
  const video = useRef<HTMLVideoElement | null>(null);
  const off = useOffStage(video);
  // The loop runs only while it can be seen: under reduced motion it holds its
  // poster, and a step's hidden option (`useOffStage`) holds its frame.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (reduced || off) v.pause();
    else v.play().catch(() => {});
  }, [reduced, off]);
  return (
    <SectionShell
      eyebrow="The reel"
      heading={SECTION_HEADERS.reel.line}
      subhead="It plays from the second photo, and every guest can make a clip of their own."
      scale="lg"
      reveal="none"
      className="pt-32 pb-10 sm:pt-44 sm:pb-12"
    >
      <div className="mx-auto mt-14 max-w-3xl">
        <button
          type="button"
          onClick={onPlay}
          aria-label="Play the demo album's reel"
          className="group relative block aspect-video w-full overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/5 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <video
            ref={video}
            src={TEASER_LOOP.src}
            poster={TEASER_LOOP.poster}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 size-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
          >
            <span
              className={cn(
                "flex size-16 items-center justify-center rounded-full text-white transition-transform duration-150 ease-emphasis group-hover:scale-105 group-active:scale-[0.97] motion-reduce:transition-none",
                GLASS,
              )}
            >
              <Play
                className={cn(
                  "size-6 translate-x-0.5 fill-white",
                  GLASS_MARK_LIT,
                )}
              />
            </span>
          </span>
        </button>
        <Caption className="mt-4 text-center">
          A few seconds of the demo album&rsquo;s reel
        </Caption>
      </div>
    </SectionShell>
  );
}

/** The two ways on from the reel: the site's one start label, and the album. */
function Onward({ tone = "media" }: { tone?: "media" | "card" }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Button asChild size="cta">
        <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
      </Button>
      <Link
        href="/demo"
        className={cn(
          "mkt-learn inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150",
          tone === "media"
            ? "text-white/85 hover:text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Open the demo album
        <LearnChevron />
      </Link>
    </div>
  );
}

/** INK: type over a photograph carries its own light (the view's own recipe). */
const INK =
  "[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.45)]";

/**
 * `overlay`: the view itself over the page, the demo album's reel full screen
 * at the screen's own orientation, with the view's resting chrome; the page's
 * one addition is a line of context, Start free and the door into the album,
 * set on the floor where the view keeps nothing (a phone lifts it above the
 * bar).
 */
function Overlay({ phone, onClose }: { phone: boolean; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="The demo album's highlight reel"
      data-destination="overlay"
      className="absolute inset-0 z-50 overflow-hidden bg-black text-white"
    >
      <DemoReel orientation={phone ? "portrait" : "landscape"} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
      />
      <div
        className={cn(
          "absolute z-20 flex flex-col items-start gap-4",
          phone ? "inset-x-5 bottom-16" : "bottom-8 left-8 max-w-md",
        )}
      >
        <p className={cn("font-heading text-page text-balance", INK)}>
          {CONTEXT_LINE}
        </p>
        <Onward />
      </div>
      <ViewRest onClose={onClose} />
    </div>
  );
}

/**
 * `modal`: a contained player. A landscape reel in a panel over the dimmed
 * page, a caption under it and the same two ways on; Close in the panel's own
 * corner. On a phone the landscape player is as small as the panel is narrow,
 * which is the option's honest cost.
 */
function Modal({ onClose }: { onClose: () => void }) {
  return (
    <div
      data-destination="modal"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-10"
    >
      <div
        role="dialog"
        aria-label="The demo album's highlight reel"
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-card text-card-foreground shadow-lift ring-1 ring-white/10"
      >
        <div className="relative aspect-video bg-black">
          <DemoReel orientation="landscape" />
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-subsection text-balance">
              {CONTEXT_LINE}
            </p>
            <p className="text-sm text-muted-foreground">
              {`${DEMO_COUNTS.items} photos from ${DEMO_COUNTS.guests} guests, cut together as they land.`}
            </p>
          </div>
          <Onward tone="card" />
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={cn(
            "absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            GLASS,
          )}
        >
          <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * THE DEMO ALBUM, AS A NEW PAGE (`route`'s destination under its reel): the
 * guest album's own head as the demo draws it (the wordmark and the Demo mark,
 * the host's event first, the album's count, Add photos), the Highlight reel
 * tile on the shipped `PosterCard`, and the album beneath. A light replica of
 * the real page's first screen, on the board's album; the real one needs a
 * session and the network.
 */
function DemoAlbumPage({ onReel }: { onReel: () => void }) {
  const still = DEMO_ITEMS[0].previewUrl ?? DEMO_ITEMS[0].url;
  return (
    <div className="dark h-full overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/60 bg-background px-5 py-3">
        <span className="flex items-center gap-2.5">
          <Logo />
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-label font-medium text-muted-foreground uppercase">
            Demo
          </span>
        </span>
        <Button asChild size="sm" variant="ghost">
          <Link href={MARKETING_CTA.href}>Start for free</Link>
        </Button>
      </header>
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-5 pt-6 pb-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-page">{EVENT.name}</h1>
          <p className="text-caption text-muted-foreground">
            {`Hosted by ${EVENT.host} · ${DEMO_COUNTS.items} photos & videos from ${DEMO_COUNTS.guests} guests`}
          </p>
        </div>
        <Button className="w-full" size="lg">
          Add photos
        </Button>
        <button
          type="button"
          onClick={onReel}
          aria-label="Open the Highlight reel"
          className="block w-full text-left"
        >
          <PosterCard
            eventName="Highlight reel"
            media={
              <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
                <img
                  src={still}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            }
          />
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_ITEMS.slice(1, 10).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
            <img
              key={m.id}
              src={m.previewUrl ?? m.url}
              alt=""
              className="aspect-square w-full rounded-tile object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `route`: the press leaves the home page for the demo album with its reel
 * open. The first screen is the album's own view, with nothing of the
 * marketing page on it; Close lands in the album (its tile opens the reel
 * again), and only the browser's Back returns home.
 */
function Route({
  phone,
  viewOpen,
  onCloseView,
  onOpenView,
}: {
  phone: boolean;
  viewOpen: boolean;
  onCloseView: () => void;
  onOpenView: () => void;
}) {
  return (
    <div data-destination="route" className="absolute inset-0 z-50">
      <DemoAlbumPage onReel={onOpenView} />
      {viewOpen && (
        <div
          role="dialog"
          aria-label="Highlight reel"
          className="absolute inset-0 z-30 overflow-hidden bg-black text-white"
        >
          <DemoReel orientation={phone ? "portrait" : "landscape"} />
          <ViewRest onClose={onCloseView} />
        </div>
      )}
    </div>
  );
}

function PlayDrawing({ id, screen }: { id: PlayId; screen: ScreenId }) {
  const phone = screen === "375";
  // Every option is drawn OPENED, the press already made: the destination is
  // what the options differ by. Close shows where each returns.
  const [open, setOpen] = useState(true);
  const [viewOpen, setViewOpen] = useState(true);
  let layer: ReactNode = null;
  if (open && id === "overlay")
    layer = <Overlay phone={phone} onClose={() => setOpen(false)} />;
  if (open && id === "modal") layer = <Modal onClose={() => setOpen(false)} />;
  if (open && id === "route")
    layer = (
      <Route
        phone={phone}
        viewOpen={viewOpen}
        onCloseView={() => setViewOpen(false)}
        onOpenView={() => setViewOpen(true)}
      />
    );
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "100vh" }}
      onClickCapture={stopLinks}
    >
      <CinemaRoom className="h-full overflow-y-auto">
        <Teaser
          onPlay={() => {
            setViewOpen(true);
            setOpen(true);
          }}
        />
      </CinemaRoom>
      {layer}
    </div>
  );
}

export function playPreview(s: BoardState, id: PlayId) {
  const screen = screenOf(s.screen);
  return (
    <Scene
      id={`play-${id}`}
      screen={screen}
      viewport="screen"
      title="The home teaser's play mark, pressed"
      measure={(root) => {
        // Read once, on the pressed state every option opens in; a reader who
        // closes it sees the rest for themselves, so the caption names it.
        const layer = root.querySelector<HTMLElement>("[data-destination]");
        const canvas = layer?.querySelector("canvas");
        if (!layer || !canvas) return null;
        const r = canvas.getBoundingClientRect();
        const reel = `the reel drawn ${Math.round(r.width)} by ${Math.round(r.height)}`;
        if (id === "route")
          return `Pressed: a new page, the demo album's own view, ${reel}. Close lands in the album; only Back returns home.`;
        if (id === "modal")
          return `Pressed: a panel over the dimmed home page, ${reel}. Close returns to the teaser.`;
        return `Pressed: over the home page, ${reel}. Close returns to the teaser; its play mark opens it again.`;
      }}
    >
      <PlayDrawing id={id} screen={screen} />
    </Scene>
  );
}
