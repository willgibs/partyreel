"use client";

import Image from "next/image";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { FIXTURE_PAGE, HERO_WALL } from "./fixtures";

/**
 * THE PAGE THE CHROME IS JUDGED OVER.
 *
 * ★ A HEADER ON ITS OWN IS NOT A HEADER. The whole reason the marketing bar
 * has two postures is that on a cinema route it starts TRANSPARENT over a wall
 * of photographs and crossfades to glass on scroll, so a bar drawn on the
 * lab's own ground answers a question nobody is asking. Every option on this
 * board therefore stands on one fixture page: a wall of licensed marketing
 * photographs, the lockup over it, and a paper chapter beneath for the scrolled
 * state. Fixture copy in the site's own register, never a real row.
 *
 * ★ AND IT IS A PAGE, NOT A SCREENSHOT: the wall is real `next/image` at the
 * frame's real width, so the header's `md` split and the wall's own
 * breakpoints resolve against the width being judged rather than the browser's.
 */

/** The first screen: the media wall a cinema route opens on. */
export function HeroGround({ phone }: { phone: boolean }) {
  return (
    // ★ THE NEGATIVE MARGIN IS THE WHOLE OVERLAY POSTURE, not a tidy-up. The
    // shipped bar is `sticky top-0` and therefore IN FLOW, so a cinema hero
    // only runs under it because it pulls itself up by exactly the header's
    // height (`cinema-hero.tsx`: `-mt-[var(--mkt-header-h,4rem)]`). Without
    // the same pull the transparent bar here would sit on plain background
    // and the one thing this board exists to judge, a bar over photographs,
    // would never be drawn. min-h-screen inside a Frame IS the frame's height,
    // so the wall fills the window rather than stopping short of it.
    <section className="relative isolate -mt-[var(--mkt-header-h,4rem)] min-h-screen overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-20 grid gap-1",
          phone ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {HERO_WALL.map((id) => {
          const img = marketingImage(id);
          return (
            <span key={id} className="relative block overflow-hidden">
              <Image
                src={img.src}
                alt=""
                fill
                sizes={phone ? "50vw" : "33vw"}
                className="object-cover"
              />
            </span>
          );
        })}
      </div>
      {/* The scrim is the hero's, not the header's: the bar is transparent here
          and the type has to hold on its own (the no-scrim-over-a-photograph
          ruling applies to the LOCKUP, which sits below the wall's bottom). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-background"
      />
      <Container
        className={cn(
          "relative flex flex-col items-start gap-5",
          phone ? "pt-28 pb-16" : "pt-40 pb-24",
        )}
      >
        <p className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">
          {FIXTURE_PAGE.eyebrow}
        </p>
        <h1
          className={cn(
            "max-w-[16ch] font-heading text-balance text-white",
            phone ? "text-4xl" : "text-6xl",
          )}
        >
          {FIXTURE_PAGE.heading}
        </h1>
        <p className="max-w-[46ch] text-[17px] text-pretty text-white/80">
          {FIXTURE_PAGE.subhead}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="button" size="lg">
            Start free
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10"
          >
            See a real album
          </Button>
        </div>
      </Container>
    </section>
  );
}

/** What is under the bar once the page has been scrolled: an ordinary chapter. */
export function ReadingGround({ phone }: { phone: boolean }) {
  return (
    <section className="surface-paper bg-background pt-16 pb-20 text-foreground">
      <Container className="flex flex-col gap-8">
        <h2
          className={cn(
            "max-w-[18ch] font-heading",
            phone ? "text-3xl" : "text-5xl",
          )}
        >
          {FIXTURE_PAGE.chapter}
        </h2>
        <p className="max-w-[54ch] text-[17px] text-pretty text-muted-foreground">
          {FIXTURE_PAGE.body}
        </p>
        <div
          className={cn("grid gap-3", phone ? "grid-cols-2" : "grid-cols-4")}
        >
          {HERO_WALL.slice(0, 4).map((id) => {
            const img = marketingImage(id);
            return (
              <span
                key={id}
                className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)]"
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes={phone ? "45vw" : "22vw"}
                  className="object-cover"
                />
              </span>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
