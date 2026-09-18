"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useCallback, useState } from "react";

import {
  BoardPage,
  CANVAS,
  Catalog,
  CellLabel,
  FitStage,
  Labeled,
  type Mode,
  ReplayButton,
  Stage,
} from "@/components/lab";
import { ALBUM_FAQ } from "@/components/marketing/sections/features/album/album-faq";
import { ArrivalsHero } from "@/components/marketing/sections/features/album/arrivals-hero";
import { AttributionSection } from "@/components/marketing/sections/features/album/attribution-section";
import { EverywhereSection } from "@/components/marketing/sections/features/album/everywhere-section";
import { GettingInSection } from "@/components/marketing/sections/features/album/getting-in-section";
import { HowMuchFits } from "@/components/marketing/sections/features/album/how-much-fits";
import { QualitySection } from "@/components/marketing/sections/features/album/quality-section";
import { StaysSection } from "@/components/marketing/sections/features/album/stays-section";
import { TakeHomeSection } from "@/components/marketing/sections/features/album/take-home-section";
import { WhoCanOpenSection } from "@/components/marketing/sections/features/album/who-can-open-section";
import { YourCallSection } from "@/components/marketing/sections/features/album/your-call-section";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { GoDeeper } from "@/components/marketing/sections/features/shared/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";

import { type AlbumWidth, albumColumns, AlbumVisual } from "./album";
import { BUILT, type CompId, type Step } from "./compositions";
import { AlbumHero, type Paint } from "./hero";
import { ALBUM_HERO } from "./spec";

/**
 * THE ALBUM PAGE'S HERO BOARD (round three, 2026-09-17): a catalog of four calm
 * compositions, and three things they have to survive.
 *
 * ★ A CARD IS THE REAL HERO AT 1:1, NOT A THUMBNAIL OF ONE. The grid's minimum
 * column is the canvas itself, so the four stack in one column and each stage
 * carries a real 1440 (Will's standing ruling on the lab's previews: 1:1, never
 * zoom-fitted). A hero judged at 0.7 is a different hero, because the frames
 * are the size of the thing being argued about.
 *
 * ★ AND EVERY CARD REPLAYS ON ITS OWN, keyed on its own run rather than on one
 * board-wide Replay: comparing two compositions means restarting one of them
 * while the other holds still. Replay here is a remount, and because none of
 * the four has an entrance tween, a remount simply returns the clock to zero,
 * which is the composition's own rest state.
 *
 * ★ NOTHING PICKED IS A STATE OF ITS OWN. With the pick cleared, the page
 * section shows the hero that SHIPS today, from production code, in the page it
 * has to open. Press a card and the same page wears it, which is the only
 * honest comparison the board can offer.
 *
 * ★ THE STAGES ARE THE KIT'S: `Stage` for a hero, because a hero is a viewport
 * and has to be judged inside one; `FitStage` for the two compositions of
 * arbitrary height, whose ground must end where they do.
 */
export function AlbumHeroBoard() {
  // One run counter per card: see the second landmine above.
  const [runs, setRuns] = useState<Record<string, number>>({});
  const replay = useCallback(
    (id: string) => setRuns((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 })),
    [],
  );

  return (
    <BoardPage
      className="abh-board"
      spec={ALBUM_HERO}
      evidence={(id, state, api) => {
        const mode = state.canvas as Mode;
        const step = state.step as Step;
        const pick = state.composition as CompId | "none";
        const paint = (state["no-script"] ?? "running") as Paint;
        const width = WIDTH[state.width ?? "w880"];
        const run = (key: string) => runs[key] ?? 0;

        switch (id) {
          case "catalog":
            return (
              <Catalog
                spec={ALBUM_HERO}
                state={state}
                setState={api.setState}
                minWidth={CANVAS.desktop.w}
                render={(candidate) => {
                  const comp = candidate.id as CompId;
                  return (
                    <div className="flex min-w-0 flex-col gap-2">
                      <Stage
                        key={`${comp}-${mode}-${run(comp)}`}
                        mode={mode}
                        ground="cinema"
                      >
                        <AlbumHero mode={mode} comp={comp} step="lg" />
                      </Stage>
                      <div className="flex justify-end">
                        <ReplayButton
                          runId={run(comp)}
                          onReplay={() => replay(comp)}
                        />
                      </div>
                    </div>
                  );
                }}
              />
            );

          case "hero": {
            // Nothing picked yet is the board's own answer, said out loud: a
            // step question needs a specimen, and the alternative is an empty
            // frame with a sentence explaining why.
            const comp = pick === "none" ? RECOMMENDED : pick;
            return (
              <Labeled
                name={`${canvasLabel(mode)} · ${cardName(comp)} · Headline: ${step === "xl" ? "one step louder" : "today's"}`}
                note={
                  paint === "running"
                    ? `${BUILT[comp][mode][step].facts.onScreen} frames lit at the busiest instant, at most ${BUILT[comp][mode][step].facts.speed} px a second. No photograph is ever under a word, so the media stays at 100 percent and nothing is dimmed.${pick === "none" ? " Nothing is picked yet, so this is the board's own recommendation." : ""}`
                    : paint === "lockup"
                      ? "A static paint with no photographs at all: what a crawler and a reader with JavaScript off get under the first answer."
                      : "A static paint of the composition at rest: what a crawler and a reader with JavaScript off get under the second answer, and the loop's own first frame."
                }
              >
                <Stage
                  key={`hero-${comp}-${mode}-${step}-${paint}-${run("hero")}`}
                  mode={mode}
                  ground="cinema"
                  bodySkin
                >
                  <AlbumHero
                    mode={mode}
                    comp={comp}
                    step={step}
                    paint={paint}
                  />
                </Stage>
              </Labeled>
            );
          }

          case "album":
            return (
              <Labeled
                name={`${canvasLabel(mode)} · ${mode === "phone" ? "the canvas less its gutter" : `a ${width} px column`} · ${mode === "phone" ? 2 : albumColumns(width)} columns`}
                note={
                  mode === "phone"
                    ? "Two columns at 375 whatever the width switch says, which is what the product ships on a phone. Its only live signal is the green dot beside the words Live now."
                    : "The shipped guest album in a centred column, not the 632 px strip the live guest page gives a laptop today. Its only live signal is the green dot beside the words Live now."
                }
              >
                <FitStage
                  mode={mode}
                  ground="cinema"
                  bodySkin
                  swapKey={`album-${mode}-${width}-${run("album")}`}
                >
                  <AlbumVisual
                    mode={mode}
                    width={width}
                    runId={run("album")}
                  />
                </FitStage>
              </Labeled>
            );

          case "page":
            return (
              <div className="flex min-w-0 flex-col gap-2">
                <FitStage
                  mode={mode}
                  ground="cinema"
                  bodySkin
                  swapKey={`page-${pick}-${mode}-${step}-${width}-${run("page")}`}
                >
                  {/* ★ THE HERO TAKES ITS HEIGHT FROM THE BOX AROUND IT, never
                      from the stage: the composition is `size-full` inside its
                      own positioned root, so without a box of a known height it
                      stretches to the whole measured page and flies frames past
                      the FAQ. */}
                  {pick === "none" ? (
                    <ArrivalsHero />
                  ) : (
                    <div style={{ height: CANVAS[mode].h }}>
                      <AlbumHero mode={mode} comp={pick} step={step} />
                    </div>
                  )}
                  <AlbumVisual
                    mode={mode}
                    width={width}
                    runId={run("page")}
                  />
                  <PageTail />
                </FitStage>
                <div className="flex items-center justify-between gap-3">
                  <CellLabel>
                    {pick === "none"
                      ? "Nothing picked: the hero the page ships today, from production code, with the centred album under it."
                      : "The picked hero, the album, then every section the route ships, in its shipped order, down to the closing band."}
                  </CellLabel>
                  <ReplayButton
                    runId={run("page")}
                    onReplay={() => replay("page")}
                  />
                </div>
              </div>
            );

          default:
            return null;
        }
      }}
    />
  );
}

/** The card the board would pick, read off the spec rather than retyped, so a
 *  change of mind in one place cannot leave the other saying the old thing. */
const RECOMMENDED = (ALBUM_HERO.candidates.find((c) => c.recommended)?.id ??
  "orbit") as CompId;

const cardName = (id: CompId) =>
  ALBUM_HERO.candidates.find((c) => c.id === id)?.name ?? id;

/** The width switch's option ids, in px. The ids carry their own number so the
 *  ledger reads without this table, and this is the one place it is parsed. */
const WIDTH: Record<string, AlbumWidth> = {
  w720: 720,
  w880: 880,
  w1040: 1040,
};

/** The canvas, in the words a caption uses. */
const canvasLabel = (mode: Mode) => (mode === "phone" ? "375" : "1440");

/**
 * THE REST OF THE ROUTE, under the new top. If a hero is too loud the symptom
 * shows up HERE, at the cinema-to-paper cut with the album still going a
 * chapter above, rather than in the hero alone.
 *
 * It mirrors src/app/(marketing)/(cinema)/features/album/page.tsx BY HAND and
 * deliberately: a route module is not something to import from a board (it
 * carries `metadata`, and Next owns its module graph). Only two things are left
 * out, both of them chrome the layout owns rather than the page: the
 * BreadcrumbJsonLd (invisible) and the overlay MarketingHeader, whose sticky
 * position would resolve against the lab page rather than this stage and so
 * would ride down the board instead of sitting over the hero. When that page
 * gains or drops a section, this list follows it.
 */
function PageTail() {
  return (
    <>
      <GettingInSection />
      <EverywhereSection />
      <QualitySection />
      <PaperChapter>
        <YourCallSection />
        <AttributionSection />
        <WhoCanOpenSection />
        <TakeHomeSection />
        <HowMuchFits />
        <StaysSection />
      </PaperChapter>
      <RelatedFeatures slugs={["qr", "curation", "sharing"]} />
      <FeatureFaq items={ALBUM_FAQ}>
        <GoDeeper
          links={[
            {
              href: "/help/how-guests-join-and-upload",
              label: "How guests join and upload",
            },
            {
              href: "/help/storage-plans-and-limits",
              label: "Storage, plans, and limits",
            },
            {
              href: "/help/who-can-see-your-event",
              label: "Who can see your event",
            },
          ]}
        />
      </FeatureFaq>
      <CtaBand
        className="border-t"
        heading="Give the next one an album."
        subhead="Start free. Share one code and the album fills itself."
        demoLink
      />
    </>
  );
}
