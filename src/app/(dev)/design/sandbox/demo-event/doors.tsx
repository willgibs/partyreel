"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { FooterDemo } from "@/components/marketing/chrome/footer-demo";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Logo } from "@/components/shared/logo";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { DEMO, DEMO_URL } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE FOUR DOORS, AND WHAT THEY PROMISE.
 *
 * Four objects on the marketing site point at one guest page, in four idioms:
 * a white code plate on the home hero (128px, `cinema-hero.tsx`'s `DemoQr`), a
 * photo pile under a code in the footer (`FooterDemo`, desktop only: you
 * cannot scan the screen you are holding), a text line on the feature and
 * event pages (`DemoCtaLink`, "Try the live demo, no signup."), and a QR
 * ticket in the nav mega-panel (`DemoTicket`, whose `row` variant is dead
 * code). `/demo` 307s to the same page for a printed code.
 *
 * ★ WHAT IS SHIPPED AND WHAT IS QUOTED. `FooterQr` (the real server-rendered
 * matrix) and `FooterDemo` (the real pile) are imported and rendered with the
 * board's own URL: they already take the destination as a prop, which is the
 * one reason a door can be drawn here at all. `DemoCtaLink` and `DemoTicket`
 * cannot: both read `DEMO_EVENT_URL` from `lib/demo.ts` and return `null` when
 * no demo is configured, so a checkout without the env var would draw an empty
 * tile. Their markup is quoted instead, `DEMO_CTA_LABEL` and all, and the
 * board never depends on a live demo existing.
 *
 * ★ THE HERO BAND AND THE FOOTER SLAB ARE SKETCHED, NOT SHIPPED. The real hero
 * is a streaming band on a rAF engine and the real footer is four columns of
 * links, and neither is what is being judged: the question is what the OBJECT
 * says. So each door sits on its own ground at its real size, with the copy it
 * really carries, and everything around it is held constant across the three
 * options. `marketing.css` never loads inside a lab frame, so the pile's fan
 * and the line's chevron spread are still: their positioning is
 * self-sufficient by design (footer-demo.tsx's fourth star).
 */

export type DoorShape = "quiet" | "named" | "pile";
export type PlaceId = "hero" | "footer" | "line";

export const doorOf = (v: string | undefined): DoorShape =>
  v === "named" ? "named" : v === "pile" ? "pile" : "quiet";

export const placeOf = (v: string | undefined): PlaceId =>
  v === "footer" ? "footer" : v === "line" ? "line" : "hero";

/**
 * What a door says when it names what it opens. One line, everywhere, and the
 * numbers are the fixture's own so they cannot drift from the album behind it.
 */
const named = () =>
  `A real wedding album. ${DEMO.items.length} photos from ${DEMO.guests} guests.`;

/* ── the pile, small ─────────────────────────────────────────────────────── */

/**
 * The pile at the small size a copy line can carry: three photographs behind
 * the object instead of four around a plate. The `pile` answer's claim is that
 * ONE object skins per place, and this is what "per place" costs at the
 * smallest of them.
 */
function SmallPile() {
  const ids = ["wedding-arch", "reception-table", "festival-lights"] as const;
  return (
    <span className="relative inline-block h-11 w-16 shrink-0">
      {ids.map((id, i) => {
        const img = marketingImage(id);
        return (
          <span
            key={id}
            className="absolute top-0 overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-border"
            style={
              {
                left: i * 14,
                width: 36,
                height: 44,
                zIndex: i,
                transform: `rotate(${(i - 1) * 6}deg)`,
              } as CSSProperties
            }
          >
            <Image
              src={img.src}
              alt=""
              width={img.width}
              height={img.height}
              sizes="36px"
              className="size-full object-cover"
            />
          </span>
        );
      })}
    </span>
  );
}

/* ── 1. the home hero's code ─────────────────────────────────────────────── */

const HERO_FRAMES = [
  "wedding-golden",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "reception-hall",
] as const;

/**
 * The hero band: photographs streaming behind, the white plate on the axis,
 * the block beneath it. The plate is the real matrix at the shipped 128px.
 */
function HeroDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="surface-ink relative flex h-full flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <Logo />
        <span className="text-[13px] text-muted-foreground">Start for free</span>
      </div>
      {/* THE BAND of photographs the plate is born in front of, on the hero's
          own axis: the object sits at the band's vertical centre, and the
          words hang below it, which is the composition cinema-hero.tsx
          measures rather than lays out in flow. */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        {/* THE OBJECT, ON THE BAND'S AXIS: the frames are born BEHIND it and
            centred on it, which is the composition cinema-hero.tsx measures
            (its own words: "the object, on the axis and at the exact centre of
            the band, above the frames so they are born behind it"). */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 justify-center gap-3 opacity-70"
          >
            {HERO_FRAMES.slice(0, wide ? 5 : 3).map((id) => {
              const img = marketingImage(id);
              return (
                <span
                  key={id}
                  className="overflow-hidden rounded-[var(--radius-tile)]"
                  style={{ width: wide ? 210 : 105, height: wide ? 140 : 78 }}
                >
                  <Image
                    src={img.src}
                    alt=""
                    width={img.width}
                    height={img.height}
                    sizes="210px"
                    className="size-full object-cover"
                  />
                </span>
              );
            })}
          </div>
          {/* `pile` swaps the bare plate for the footer's pile at the hero's
              own size; the other two keep the plate and differ only in what is
              said under it. */}
          <div
            data-de-door
            className="relative z-10 flex flex-col items-center"
          >
            {shape === "pile" ? (
              <FooterDemo href={DEMO_URL} value={DEMO_URL} />
            ) : (
              <span className="inline-flex rounded-[var(--radius-tile)] bg-white p-2">
                <FooterQr value={DEMO_URL} size={128} />
              </span>
            )}
            {shape === "named" && (
              <p
                data-de-promise
                className="mt-3 text-[13px] whitespace-nowrap text-muted-foreground"
              >
                {named()}
              </p>
            )}
          </div>
        </div>
        <p
          className="mt-12 max-w-3xl font-heading text-balance text-foreground"
          style={{ fontSize: wide ? 44 : 30, lineHeight: 1.05 }}
        >
          The whole event, in one album.
        </p>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">
          Partyreel collects the photos and videos from your guests with one QR
          code.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <span className="rounded-full bg-foreground px-5 py-2.5 text-[15px] font-medium text-background">
            Start for free
          </span>
          <span className="rounded-full border border-border px-5 py-2.5 text-[15px] font-medium text-foreground">
            Watch a sample reel
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 2. the footer's pile ────────────────────────────────────────────────── */

/**
 * The ink slab's sign-off, with the real `FooterDemo`. The footer is the one
 * door that already says something about what is behind it ("a real event
 * album, exactly the way a guest arrives"), which is why `quiet` and `pile`
 * draw the same object here and only `named` moves: the pile IS the pile
 * answer, already built, in one of four places.
 */
function FooterDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="surface-ink flex h-full flex-col justify-end bg-background px-8 pb-8">
      <div
        className={cn(
          "flex gap-10",
          wide ? "flex-row items-center" : "flex-col items-start gap-8",
        )}
      >
        <div data-de-door className="shrink-0">
          <FooterDemo href={DEMO_URL} value={DEMO_URL} />
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-heading text-chapter">Explore a demo event.</h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            Scan the code for a real event album on your phone, exactly the way
            a guest arrives. No app, no account.
          </p>
          {shape === "named" && (
            <p data-de-promise className="text-[15px] font-medium text-foreground">
              {named()}
            </p>
          )}
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[13px] text-faint">
        <Logo />
        <span>Privacy · Terms</span>
      </div>
    </div>
  );
}

/* ── 3. a feature page's line ────────────────────────────────────────────── */

/** `DemoCtaLink`'s chevron, quoted: the recipe's two arms, still in a frame. */
function Chevron() {
  return (
    <span className="inline-flex" aria-hidden>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M6 4L10 8" />
        <path d="M10 8L6 12" />
      </svg>
    </span>
  );
}

/**
 * The copy line, in the place it is read: under a feature page's paragraph,
 * beside a picture. `DemoCtaLink` is quoted rather than imported (see the
 * header's second star).
 */
function LineDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="flex h-full items-center bg-background px-8">
      <div
        className={cn("flex w-full gap-10", wide ? "flex-row" : "flex-col")}
      >
        <div className="flex max-w-md flex-1 flex-col justify-center">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            The QR code
          </p>
          <h2 className="mt-3 font-heading text-section text-balance">
            One code. Every phone at the party.
          </h2>
          <p className="mt-4 text-[17px] text-pretty text-muted-foreground">
            Print it, stand it on a table, put it on the screen. Guests scan and
            start adding, with nothing to install and no account to make.
          </p>
          <div data-de-door className="mt-6">
            {shape === "pile" ? (
              <span className="inline-flex items-center gap-3">
                <SmallPile />
                <span className="inline-flex flex-col">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    {DEMO_CTA_LABEL}
                    <Chevron />
                  </span>
                  <span
                    data-de-promise
                    className="text-[13px] text-muted-foreground"
                  >
                    {named()}
                  </span>
                </span>
              </span>
            ) : (
              <span className="inline-flex flex-col gap-1">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  {DEMO_CTA_LABEL}
                  <Chevron />
                </span>
                {shape === "named" && (
                  <span
                    data-de-promise
                    className="text-[13px] text-muted-foreground"
                  >
                    {named()}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        {wide && (
          <div className="relative flex-1 overflow-hidden rounded-xl">
            <Image
              src={marketingImage("wedding-petals").src}
              alt=""
              fill
              sizes="480px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function Door({
  shape,
  place,
  screen,
}: {
  shape: DoorShape;
  place: PlaceId;
  screen: ScreenId;
}) {
  if (place === "footer") return <FooterDoor shape={shape} screen={screen} />;
  if (place === "line") return <LineDoor shape={shape} screen={screen} />;
  return <HeroDoor shape={shape} screen={screen} />;
}
