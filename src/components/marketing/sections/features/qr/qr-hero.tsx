"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
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
import { cn } from "@/lib/utils";

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

/** Which preset the hero code is actually wearing — one constant so the render
 *  and the marked swatch can never disagree. */
const HERO_PRESET = "classic" as const;

/** One preset chip, in its picked or unpicked state. The check quotes the
 *  designer's own selected-swatch mark further down the page. */
function Swatch({
  label,
  active,
  className,
  ...props
}: { label: string; active: boolean } & React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-foreground/40 bg-popover text-foreground"
          : "border-border bg-card text-muted-foreground",
        className,
      )}
      {...props}
    >
      {active && <Check className="size-3" aria-hidden />}
      {label}
    </span>
  );
}

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
            <FeatureHeroEyebrow {...cut(0)} label={page.navLabel} />
            {/* LCP rule: the H1 never carries a reveal-hidden state (the home
                hero's ratified shape). The stub around it does the arriving. */}
            <h1 className="font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              {page.h1}
            </h1>
            <p
              {...cut(1)}
              className="max-w-xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div
              {...cut(2)}
              className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <DemoCtaLink />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="mx-auto w-fit">
              {/* R4 / review B1 + B2. B2: the plate was a BLOCK inside a w-fit
                  wrapper the caption actually sized, so the QR sat hard left in
                  a too-wide white field. Both boxes hug the code now (w-fit),
                  which is what makes the quiet zone equal on all four sides.
                  B1: the swatch rail was absolutely positioned at -right-10 and
                  ran back UNDER the plate, slicing its own left caps. It sits
                  in FLOW beside the plate instead, where nothing can bury it. */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div
                  {...cut(2)}
                  className="w-fit rounded-2xl border bg-card p-4 ring-1 ring-foreground/5"
                >
                  <div className="w-fit rounded-xl bg-white p-4">
                    <StyledQr
                      value={QR_VALUE}
                      size={208}
                      style={resolveQrPreset(HERO_PRESET)}
                    />
                  </div>
                </div>

                {/* The preset swatches, fanned beside the plate (desktop).
                    The one the code is actually WEARING is marked, so the fan
                    reads as a picker mid-choice instead of four inert labels. */}
                <div className="hidden shrink-0 flex-col gap-2.5 lg:flex">
                  {QR_STYLE_KEYS.map((key, i) => (
                    <Swatch
                      key={key}
                      {...cut(3 + i)}
                      label={QR_PRESETS[key].label}
                      active={key === HERO_PRESET}
                      className={`${SWATCH_TILT[i]} shadow-sm`}
                    />
                  ))}
                </div>
              </div>

              {/* Stacked variant below the plate on smaller screens. */}
              <div
                {...cut(7)}
                className="mt-3 flex flex-wrap justify-center gap-2 lg:hidden"
              >
                {QR_STYLE_KEYS.map((key) => (
                  <Swatch
                    key={key}
                    label={QR_PRESETS[key].label}
                    active={key === HERO_PRESET}
                  />
                ))}
              </div>

              <MonoCaption {...cut(8)} className="mt-3 text-center lg:mt-4">
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
