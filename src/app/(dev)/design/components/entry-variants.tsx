import Image from "next/image";
import { Camera, Images, Lock, Smartphone, Users } from "lucide-react";

import { COVER_PHOTO, EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the guest entry moment, THE core capture mechanic. Round-6
 * additions (V4-V6) attack Will's tension head-on: the teaser must
 * incentivize the account WITHOUT leaking real media on password events and
 * WITHOUT falling flat on empty events. The shared trick: tease the
 * gallery's SHAPE and COUNT (ghost tiles + real numbers), never its pixels -
 * which also keeps the server-side never-leak invariant trivially true.
 */
export function EntryVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Centered card"
        rationale="The classic modal: focused, symmetrical, fastest to dismiss. The gallery stays visible around it."
      >
        <GalleryBackdrop dim="bg-black/50" />
        <div className="absolute inset-0 flex items-center p-5">
          <WelcomeCard compact />
        </div>
      </Variant>

      <Variant
        n={2}
        name="Bottom sheet"
        rationale="Mobile-native: rises from where thumbs live, reads as lightweight, swipe-to-dismiss affordance built in."
      >
        <GalleryBackdrop dim="bg-black/35" />
        <div className="absolute inset-x-0 bottom-0">
          <div
            data-dir-card
            data-dir-enter
            className="rounded-b-none border-b-0 p-5 pt-3"
            style={{
              borderTopLeftRadius: "calc(var(--radius-action) * 1.4)",
              borderTopRightRadius: "calc(var(--radius-action) * 1.4)",
            }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
            <WelcomeCard bare />
          </div>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Full-screen welcome"
        rationale="The editorial take: the cover photo IS the invitation. Maximum occasion, one extra tap to the gallery."
      >
        <div className="absolute inset-0">
          <div className="relative h-2/5">
            <Image
              src={COVER_PHOTO}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="flex flex-col px-6 pb-8">
            <p
              data-dir-display
              className="mt-2 text-center text-3xl leading-tight text-balance"
            >
              You&rsquo;re invited to {EVENT_NAME}
            </p>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Add your photos and browse everyone&rsquo;s. No app, no account.
            </p>
            <FeatureRows className="mt-5" />
            {/* Semibold here only: at full-screen scale next to text-3xl
                display, a medium CTA reads secondary. */}
            <button
              data-dir-press
              className="mt-6 h-11 w-full rounded-[var(--radius-action)] bg-primary text-sm font-semibold text-primary-foreground"
            >
              Continue
            </button>
          </div>
        </div>
      </Variant>

      <Variant
        n={4}
        name="Adaptive sheet + ghost grid"
        rationale="The sheet's incentive without the leak: behind it sits the gallery's SHAPE (ghost tiles) plus the real count. Password events stay sealed, empty events read as a door about to open, and the want-in pull survives."
      >
        <div className="absolute inset-0">
          <div className="px-4 pt-12 pb-2">
            <p data-dir-display className="text-lg">
              {EVENT_NAME}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="size-3" />
              128 photos & videos inside
            </p>
          </div>
          <GhostGrid />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div
            data-dir-card
            data-dir-enter
            className="rounded-b-none border-b-0 p-5 pt-3"
            style={{
              borderTopLeftRadius: "calc(var(--radius-action) * 1.4)",
              borderTopRightRadius: "calc(var(--radius-action) * 1.4)",
            }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
            <p data-dir-display className="text-center text-xl leading-snug text-balance">
              128 photos are waiting
            </p>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              From 43 guests at {EVENT_NAME}, growing live. Create a free
              account to open the gallery and add your own.
            </p>
            <button
              data-dir-press
              className="mt-4 h-11 w-full rounded-[var(--radius-action)] bg-primary text-sm font-semibold text-primary-foreground"
            >
              See all 128 photos
            </button>
            <button className="mt-1.5 h-9 w-full text-[13px] text-muted-foreground">
              Just browsing
            </button>
          </div>
        </div>
      </Variant>

      <Variant
        n={5}
        name="Full-screen marquee"
        rationale="Numbers AS the teaser: the count in display type is the whole pitch. Identical for open, locked, and empty events (empty flips to a be-the-first invitation); zero pixels ever at stake."
      >
        <div className="absolute inset-0 flex flex-col px-6 pt-14 pb-8">
          <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {EVENT_NAME}
          </p>
          <div className="flex flex-1 flex-col justify-center">
            <p data-dir-display className="text-7xl leading-none">
              128
            </p>
            <p data-dir-display className="mt-1 text-2xl leading-snug text-balance">
              photos & videos inside
            </p>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
              <Users className="size-4 shrink-0" />
              From 43 guests, growing as the night goes on
            </p>
          </div>
          <button
            data-dir-press
            className="h-11 w-full rounded-[var(--radius-action)] bg-primary text-sm font-semibold text-primary-foreground"
          >
            Create a free account to open it
          </button>
          <button className="mt-1.5 h-9 w-full text-[13px] text-muted-foreground">
            Just browsing
          </button>
        </div>
      </Variant>

      <Variant
        n={6}
        name="Inline teaser + sticky bar"
        rationale="No modal at all: the page IS the pitch. A capped grid (real when allowed, ghost when locked or empty) fades into a sticky account bar - the same floating-bottom pattern as upload and lightbox."
      >
        <div className="absolute inset-0">
          <div className="px-4 pt-12 pb-2">
            <p data-dir-display className="text-lg">
              {EVENT_NAME}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Hosted by Maya · 128 photos & videos
            </p>
          </div>
          <div className="relative px-4">
            <div className="grid grid-cols-3 gap-1.5">
              {PHOTOS.slice(0, 9).map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden"
                  style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
                >
                  <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
            {/* The fade says "there's more" without showing it. */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div data-dir-card className="p-3.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">
            <p className="text-center text-[13px] font-medium">
              You&rsquo;re seeing 9 of 128
            </p>
            <button
              data-dir-press
              className="mt-2.5 h-10 w-full rounded-[var(--radius-action)] bg-primary text-[13px] font-semibold text-primary-foreground"
            >
              Create a free account to see the rest
            </button>
          </div>
        </div>
      </Variant>
    </div>
  );
}

/* Ghost tiles: the gallery's silhouette with zero real pixels. A faint
   camera glyph every few cells keeps it readable as "photos live here". */
function GhostGrid() {
  return (
    <div className="grid grid-cols-3 gap-1.5 px-4">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center border border-border/70 bg-muted/60"
          style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
        >
          {i % 4 === 1 && (
            <Camera className="size-4 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  );
}

function GalleryBackdrop({ dim }: { dim: string }) {
  return (
    <>
      <div className="absolute inset-0">
        <div className="px-4 pt-12 pb-2">
          <p data-dir-display className="text-lg">
            {EVENT_NAME}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            128 photos & videos
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 px-4">
          {PHOTOS.slice(0, 9).map((src) => (
            <div
              key={src}
              className="relative aspect-square overflow-hidden"
              style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
            >
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className={`absolute inset-0 ${dim} backdrop-blur-[2px]`} />
    </>
  );
}

function WelcomeCard({
  compact = false,
  bare = false,
}: {
  compact?: boolean;
  bare?: boolean;
}) {
  const inner = (
    <>
      <div className="relative mx-auto size-12 overflow-hidden rounded-full ring-2 ring-background">
        <Image src={COVER_PHOTO} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <p
        data-dir-display
        className="mt-3 text-center text-xl leading-snug text-balance"
      >
        You&rsquo;re invited to {EVENT_NAME}
      </p>
      <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
        Add your photos and browse everyone&rsquo;s. No app, no account.
      </p>
      <FeatureRows className="mt-4" />
      <button
        data-dir-press
        className="mt-5 h-11 w-full rounded-[var(--radius-action)] bg-primary text-sm font-medium text-primary-foreground"
      >
        Continue
      </button>
      <button className="mt-1.5 h-9 w-full text-[13px] text-muted-foreground">
        Just browsing
      </button>
    </>
  );
  if (bare) return <div>{inner}</div>;
  return (
    <div data-dir-card data-dir-enter className={`w-full ${compact ? "p-5" : "p-6"}`}>
      {inner}
    </div>
  );
}

function FeatureRows({ className }: { className?: string }) {
  return (
    <ul className={`space-y-2.5 text-[13px] ${className ?? ""}`}>
      <li className="flex items-center gap-3">
        <Camera className="size-4 shrink-0 text-muted-foreground" />
        Add your photos and videos
      </li>
      <li className="flex items-center gap-3">
        <Images className="size-4 shrink-0 text-muted-foreground" />
        See everyone&rsquo;s shots in one place
      </li>
      <li className="flex items-center gap-3">
        <Smartphone className="size-4 shrink-0 text-muted-foreground" />
        Straight from your phone
      </li>
    </ul>
  );
}
