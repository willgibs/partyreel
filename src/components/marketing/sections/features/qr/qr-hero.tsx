"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import {
  QR_PRESETS,
  QR_STYLE_KEYS,
  resolveQrPreset,
} from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";

/**
 * /features/qr hero: the stub grammar beside THE QR AS OBJECT — one large,
 * genuinely scannable styled code on a white plate (the app's real renderer,
 * StyledQr + resolveQrPreset), with the four preset names floating beside it
 * like paint swatches. When the demo event is configured the code encodes its
 * REAL join URL (scan the hero, land in the demo); otherwise it renders a
 * decorative partyreel.com/e/demo value and the caption drops the scan claim.
 */

// Decorative fallback ONLY (never linked): keeps the hero honest-looking when
// no demo event is configured in the env.
const QR_VALUE = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

/** The swatches' resting tilts: hand-placed so the stack reads like samples
 *  fanned on a table, not a list. */
const SWATCH_TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];

export function QrHero() {
  const page = featurePage("qr");
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <section className="overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-20">
      <Container>
        <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex max-w-2xl flex-col items-start gap-5 lg:col-span-7">
            <Link
              {...cut(0)}
              href="/features"
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
            >
              Features
            </Link>
            <Eyebrow {...cut(1)}>{page.navLabel}</Eyebrow>
            <h1
              {...cut(2)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {page.h1}
            </h1>
            <p
              {...cut(3)}
              className="max-w-xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div
              {...cut(4)}
              className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <DemoCtaLink />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto w-fit">
              <div
                {...cut(2)}
                className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/5"
              >
                <div className="rounded-xl bg-white p-4">
                  <StyledQr
                    value={QR_VALUE}
                    size={208}
                    style={resolveQrPreset("classic")}
                  />
                </div>
              </div>

              {/* The preset swatches, fanned beside the plate (desktop). */}
              <div className="absolute top-1/2 -right-10 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
                {QR_STYLE_KEYS.map((key, i) => (
                  <span
                    key={key}
                    {...cut(4 + i)}
                    className={`${SWATCH_TILT[i]} rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm`}
                  >
                    {QR_PRESETS[key].label}
                  </span>
                ))}
              </div>

              {/* Stacked variant below the plate on smaller screens. */}
              <div
                {...cut(5)}
                className="mt-3 flex flex-wrap justify-center gap-2 lg:hidden"
              >
                {QR_STYLE_KEYS.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {QR_PRESETS[key].label}
                  </span>
                ))}
              </div>

              <MonoCaption {...cut(6)} className="mt-3 text-center lg:mt-4">
                {DEMO_EVENT_URL
                  ? "Scannable for real. It opens the live demo."
                  : "The Classic preset, at print sharpness."}
              </MonoCaption>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
