"use client";

import Image from "next/image";

import { PHOTOS, PORTRAIT_PHOTO } from "../screens/sample-photos";
import { DesktopFrame, Reveal } from "./marketing-lab-shared";

/**
 * DIRECTION A: EDITORIAL GALLERY (marketing-identity round, 2026-07-03).
 * Quiet-luxury magazine: a 12-column paper spread, huge Urbanist display type,
 * photos as matted PLATES with numbered captions. The signature section flips
 * to near-black where the plates become the light source (the always-dark
 * media-surface rule, worn as identity). Motion language: SLOW AND CONFIDENT.
 * 550ms entrances (--dir-duration overridden on the root), 900ms drawn
 * hairlines, 1000ms clip-path plate reveals; nothing bounces, nothing loops.
 * The brand whispers so the photography speaks. Copy is the live site's,
 * recast in editorial voice.
 */
export function MarketingEditorialDirection() {
  return (
    <DesktopFrame>
      {/* The direction slows the shared entrance hooks to its own pace. */}
      <div style={{ "--dir-duration": "550ms" } as React.CSSProperties}>
        <EditorialNav />
        <EditorialHero />
        <EditorialDarkSection />
        <EditorialClose />
      </div>
    </DesktopFrame>
  );
}

function EditorialNav() {
  return (
    <header className="flex items-center justify-between px-12 pt-7 pb-5">
      <span data-dir-display className="text-lg">
        Partyreel
      </span>
      <nav className="flex items-center gap-7 text-[13px] text-muted-foreground">
        <span>How it works</span>
        <span>Events</span>
        <span>Pricing</span>
        <button
          type="button"
          data-dir-press
          className="h-8 rounded-[var(--radius-action-sm)] bg-primary px-4 text-[13px] font-medium text-primary-foreground"
        >
          Start free
        </button>
      </nav>
    </header>
  );
}

function EditorialHero() {
  return (
    <section className="px-12 pb-20">
      {/* The masthead rule: magazine furniture, drawn in slowly. */}
      <Reveal>
        <div className="flex items-baseline justify-between pb-2 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          <span data-mkt-reveal>The shared camera roll for real life</span>
          <span data-mkt-reveal style={{ "--i": 2 } as React.CSSProperties}>
            No app · No account
          </span>
        </div>
        <div data-mkt-rule className="h-px w-full bg-foreground/80" />
      </Reveal>

      <div className="mt-12 grid grid-cols-12 gap-x-6">
        <div data-dir-stagger className="col-span-8">
          <h1
            data-dir-display
            className="text-[76px] leading-[0.96] text-balance"
          >
            <span className="block" style={{ "--i": 0 } as React.CSSProperties}>
              Every guest is
            </span>
            <span className="block" style={{ "--i": 2 } as React.CSSProperties}>
              your photographer.
            </span>
          </h1>
        </div>
        <div
          data-dir-stagger
          className="col-span-4 flex flex-col justify-end gap-6 pb-2"
        >
          <p
            className="text-[15px] leading-relaxed text-muted-foreground"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            One QR code on the table. Guests add every photo and video from
            their phones, and you keep the album everyone wishes they had.
          </p>
          <div
            className="flex items-center gap-4"
            style={{ "--i": 6 } as React.CSSProperties}
          >
            <button
              type="button"
              data-dir-press
              className="h-11 rounded-[var(--radius-action)] bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              Start free
            </button>
            <span className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4">
              See how it works
            </span>
          </div>
        </div>
      </div>

      {/* The plates: photography presented like a printed spread, the page's
          only color. Captions run museum-style beneath the mat. */}
      <div className="mt-16 grid grid-cols-12 items-start gap-x-6">
        <Reveal className="col-span-8">
          <figure>
            <div
              data-mkt-plate
              className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-tile)]"
            >
              <Image
                src={PHOTOS[4]}
                alt=""
                fill
                sizes="640px"
                className="object-cover"
              />
            </div>
            <figcaption
              data-mkt-reveal
              className="mt-3 flex items-baseline justify-between text-[12px] text-muted-foreground"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <span className="tracking-[0.14em] uppercase">
                No. 04 · The sparkler exit
              </span>
              <span>Shot by a guest, kept by the host</span>
            </figcaption>
          </figure>
        </Reveal>
        <Reveal className="col-span-4 -mt-10">
          <figure>
            <div
              data-mkt-plate
              className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-tile)]"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <Image
                src={PORTRAIT_PHOTO}
                alt=""
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
            <figcaption
              data-mkt-reveal
              className="mt-3 text-[12px] tracking-[0.14em] text-muted-foreground uppercase"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              No. 07 · The first dance
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* The signature scroll section: the paper flips to night and the plates carry
   all the light (a soft white glow, zero chroma; the photos supply color). */
function EditorialDarkSection() {
  const plates = [
    { src: PHOTOS[1], caption: "The toast you missed" },
    { src: PHOTOS[8], caption: "The dance floor at midnight" },
    { src: PHOTOS[5], caption: "The whole table, finally in one frame" },
  ];
  return (
    <section className="bg-[oklch(0.13_0_0)] px-12 py-20 text-[oklch(0.96_0_0)]">
      <Reveal>
        <p
          data-mkt-reveal
          className="text-[11px] font-medium tracking-[0.22em] text-[oklch(0.65_0_0)] uppercase"
        >
          The morning after
        </p>
        <h2
          data-dir-display
          data-mkt-reveal
          className="mt-4 max-w-3xl text-[44px] leading-[1.04] text-balance"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          The photos are out there. You just never got them.
        </h2>
        <p
          data-mkt-reveal
          className="mt-5 max-w-xl text-[15px] leading-relaxed text-[oklch(0.65_0_0)]"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          The group chat gets a handful. The rest stay stuck on everyone
          else&apos;s camera roll. Partyreel collects all of it in one gallery,
          while the night is still happening.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-3 gap-6">
        {plates.map((plate, i) => (
          <Reveal key={plate.caption}>
            <figure>
              <div
                data-mkt-plate
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)] shadow-[0_0_90px_-18px_rgba(255,255,255,0.3)]"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Image
                  src={plate.src}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <figcaption
                data-mkt-reveal
                className="mt-3 text-[12px] tracking-[0.14em] text-[oklch(0.65_0_0)] uppercase"
                style={{ "--i": i + 3 } as React.CSSProperties}
              >
                {plate.caption}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function EditorialClose() {
  return (
    <section className="px-12 pt-20 pb-16">
      <Reveal className="flex flex-col items-start gap-7">
        <h2
          data-dir-display
          data-mkt-reveal
          className="text-[56px] leading-[1.0]"
        >
          Then the night ends with a reel.
        </h2>
        <p
          data-mkt-reveal
          className="max-w-lg text-[15px] leading-relaxed text-muted-foreground"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          Partyreel stitches the best moments into a highlight reel you can
          share or download. Automatically, and free to host.
        </p>
        <div data-mkt-reveal style={{ "--i": 4 } as React.CSSProperties}>
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Create your event
          </button>
        </div>
      </Reveal>
      <div className="mt-16 flex items-center justify-between border-t pt-5 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        <span>Partyreel</span>
        <span>The shared camera roll for real life</span>
      </div>
    </section>
  );
}
