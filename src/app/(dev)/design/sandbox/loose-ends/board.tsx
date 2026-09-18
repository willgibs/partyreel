"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type CastId, ChartCastDemo } from "./chart-cast";
import { type FaqLookId, FaqLookPanel, type FaqSourceId } from "./faq-look";
import { GettingInPace } from "./getting-in-pace";
import { type HeroTabletOption, tableForOption } from "./hero-tablet-engine";
import { TabletHero } from "./hero-tablet";
import { EverywherePill } from "./everywhere-pill";
import { ReviewPhoto } from "./review-photo";
import { LOOSE_ENDS } from "./spec";

/**
 * THE PREVIEWS, and nothing else: every option is the real component (or the
 * one-prop copy the manifest's Handoff says why a copy exists) at a real
 * size. Decisions drawn at two widths reuse the same small `Widths` helper
 * everywhere so a reviewer meets one convention, not six.
 */

/** Two real viewports, one above the other (album-page's own pattern): 1440
 *  first, 375 second, both loaded into a real iframe so a `vw`-sized type
 *  step or a Tailwind breakpoint resolves against the width being judged
 *  rather than the lab page's own. */
function Widths({
  id,
  desktopH,
  phoneH,
  render,
}: {
  id: string;
  desktopH: number;
  phoneH: number;
  render: (mode: "desktop" | "phone") => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {(["desktop", "phone"] as const).map((mode) => (
        <Frame
          key={mode}
          id={`le-${id}-${mode}`}
          w={mode === "desktop" ? 1440 : 375}
          h={mode === "desktop" ? desktopH : phoneH}
          title={mode === "desktop" ? "1440" : "375"}
        >
          {render(mode)}
        </Frame>
      ))}
    </div>
  );
}

/* ── 1. The admin chart ramp's cast ───────────────────────────────────────── */

const castPreview = (cast: CastId, mode: "light" | "dark") => (
  <ChartCastDemo cast={cast} mode={mode} />
);

/* ── 2. One FAQ look ───────────────────────────────────────────────────────── */

const faqSourceOf = (s: BoardState): FaqSourceId =>
  s["faq-source"] === "album" ? "album" : "pricing";

function faqPreviewFor(look: FaqLookId, s: BoardState) {
  const source = faqSourceOf(s);
  return (
    <Widths
      id={`faq-${look}`}
      desktopH={920}
      phoneH={1700}
      render={() => <FaqLookPanel look={look} source={source} />}
    />
  );
}

/* ── 3. The home hero between 768 and 1023 ────────────────────────────────── */

const heroPreview = (option: HeroTabletOption) => {
  const table = tableForOption(option);
  const h = Math.round(table.axisMin + table.below);
  return (
    <Frame id={`le-hero-${option}`} w={900} h={h} title="900">
      <TabletHero option={option} />
    </Frame>
  );
};

/* ── 4. The phone's screen cycle ──────────────────────────────────────────── */

const HOLD_MS: Record<string, number> = {
  today: 3200,
  beat: 1250,
  "two-beat": 2500,
};

const phonePacePreview = (option: keyof typeof HOLD_MS) => (
  <Widths
    id={`pace-${option}`}
    desktopH={620}
    phoneH={1250}
    render={() => <GettingInPace holdMs={HOLD_MS[option]} />}
  />
);

/* ── 5. The Live | Review photograph ──────────────────────────────────────── */

const REVIEW_PHOTO: Record<string, string> = {
  today: "wedding-toast",
  rings: "wedding-rings",
  arch: "wedding-arch",
};

const reviewPhotoPreview = (option: keyof typeof REVIEW_PHOTO) => (
  <Widths
    id={`review-${option}`}
    desktopH={560}
    phoneH={980}
    render={() => <ReviewPhoto photo={REVIEW_PHOTO[option]} />}
  />
);

/* ── 6. The lightbox pill ──────────────────────────────────────────────────── */

const pillPreview = (pill: "none" | "corner" | "hover") => (
  <Widths
    id={`pill-${pill}`}
    desktopH={420}
    phoneH={420}
    render={() => <EverywherePill pill={pill} />}
  />
);

const PREVIEWS: PreviewsFor<typeof LOOSE_ENDS> = {
  "chart-light.today": castPreview("today", "light"),
  "chart-light.graphite": castPreview("graphite", "light"),
  "chart-light.accent": castPreview("accent", "light"),
  "chart-light.warm": castPreview("warm", "light"),
  "chart-dark.today": castPreview("today", "dark"),
  "chart-dark.graphite": castPreview("graphite", "dark"),
  "chart-dark.accent": castPreview("accent", "dark"),
  "chart-dark.warm": castPreview("warm", "dark"),

  "faq-look.card": (s) => faqPreviewFor("card", s),
  "faq-look.shared": (s) => faqPreviewFor("shared", s),
  "faq-look.heading": (s) => faqPreviewFor("heading", s),

  "hero-tablet.today": heroPreview("today"),
  "hero-tablet.tablet": heroPreview("tablet"),
  "hero-tablet.early": heroPreview("early"),

  "phone-cycle.today": phonePacePreview("today"),
  "phone-cycle.beat": phonePacePreview("beat"),
  "phone-cycle.two-beat": phonePacePreview("two-beat"),

  "review-photo.today": reviewPhotoPreview("today"),
  "review-photo.rings": reviewPhotoPreview("rings"),
  "review-photo.arch": reviewPhotoPreview("arch"),

  "everywhere-pill.none": pillPreview("none"),
  "everywhere-pill.corner": pillPreview("corner"),
  "everywhere-pill.hover": pillPreview("hover"),
};

export function LooseEndsBoard() {
  return <ExplorationBoard spec={LOOSE_ENDS} previews={PREVIEWS} />;
}
