"use client";

import Image from "next/image";
import Link from "next/link";

import { CtaBand } from "@/components/marketing/system/cta-band";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { ABOUT_CAREERS } from "@/lib/constants/about";
import { IS_HIRING } from "@/lib/constants/careers";
import { marketingImage } from "@/lib/constants/marketing-media";
import { planById } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

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

/**
 * ROUND TWO'S TWO GROUNDS (2026-09-19): `foot-after` and `foot-alone` ask what
 * the footer should be in each of the two contexts every marketing route
 * actually ends in. Both import the real closing composition rather than
 * redrawing it, the same rule `foot.tsx` follows for the demo frame.
 */

/**
 * THE REBUILT `/how-it-works` CLOSE, VERBATIM: the same heading, the same
 * tier-derived subhead, the same secondary and `demoLink`
 * (`src/app/(marketing)/(cinema)/how-it-works/page.tsx`). Most marketing pages
 * now end this way, which is the whole premise of `foot-after`.
 *
 * `ink`: the "merged" option's own ground, forced onto the footer's exact
 * slab tone so the two compositions share one background with no seam. Every
 * other option leaves the band on its ordinary (cinema) ground, where a real
 * `chrome-wiring` build would still show the usual seam glow underneath it.
 */
export function CtaCloseGround({ ink = false }: { ink?: boolean }) {
  const free = planById("free");
  return (
    <div
      className={ink ? "surface-ink bg-background text-foreground" : undefined}
    >
      <CtaBand
        heading="Start your first event free."
        subhead={`${formatBytes(free.storageBytes)} covers a whole first event, and plans are sized by storage, not guest counts. Create the event, share one QR code, and the whole thing lands in one album.`}
        secondary={{ label: "See full pricing", href: "/pricing" }}
        demoLink
      />
    </div>
  );
}

/**
 * THE REAL `/about` CLOSE, VERBATIM: its own final section, the one real route
 * where a paper page runs straight into the footer with no `CtaBand` anywhere
 * above it (`src/app/(marketing)/(cinema)/about/page.tsx`). `foot-alone` is
 * the question of what the footer owes a page that ends this quietly.
 */
export function AboutCloseGround() {
  return (
    <section className="surface-paper border-t bg-background text-foreground">
      <Container className="flex flex-col items-center gap-5 py-20 text-center sm:py-24">
        <h2 className="max-w-2xl font-heading text-prose text-balance">
          {ABOUT_CAREERS.heading}
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          {IS_HIRING ? ABOUT_CAREERS.hiring : ABOUT_CAREERS.notHiring}
        </p>
        <Button asChild size="cta" variant="outline" className="mt-1">
          <Link href={ABOUT_CAREERS.href}>
            {IS_HIRING
              ? ABOUT_CAREERS.linkLabelHiring
              : ABOUT_CAREERS.linkLabelNotHiring}
          </Link>
        </Button>
      </Container>
    </section>
  );
}
