"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  BoardPage,
  CANVAS,
  FitStage,
  Labeled,
  type Mode,
  ReplayButton,
  Stage,
  useReplay,
} from "@/components/lab";
import { optionId, optionLabel } from "@/components/lab/board-spec";
import { ALBUM_FAQ } from "@/components/marketing/sections/features/album/album-faq";
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

import { AlbumVisual } from "./album";
import {
  AlbumHeroField,
  FIELD_DENSITY,
  FIELD_FLIGHT_S,
  type Step,
} from "./field";
import { ALBUM_HERO } from "./spec";

/**
 * THE ALBUM PAGE'S HERO (round one, 2026-09-15; on the kit's template since the
 * migration wave, round two, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the five one-word calls, the two candidates, the departures and
 * the three assets. What is left here is what a board should be and nothing
 * else, which is the evidence for each declared section as a function of the
 * declared state.
 *
 * THE THREE READINGS ARE THE THREE SECTIONS, ordered the way the decision is
 * made rather than the way the page is built:
 *
 *  1. THE HERO alone, at a real viewport, so the field is judged as a hero.
 *  2. THE ALBUM alone, wide, so the product is judged as the product.
 *  3. THE PAGE: the two on top of the WHOLE shipped route, every section in its
 *     shipped order, so the hand-off (feeling -> product -> chapters) is judged
 *     whole and the cinema-to-paper cut, the flip most likely to be disturbed
 *     by a full-bleed hero that never stops moving, is judged UNDER it rather
 *     than imagined. It is also the only stage where both animations run at
 *     once, which was Will's original worry.
 *
 * ★ SECTIONS RATHER THAN A `reading` CONTROL, deliberately, because the round's
 * goal line can be read either way. A reading is not a variant of one specimen,
 * it is a different specimen: as sections the three get anchors, the index, the
 * dock's Sections menu, the asks restated over the evidence that argues them
 * and a walk that lands on them, and a link to one of them survives being
 * pasted into a chat. Collapsed into a single switch they would share one
 * anchor and the board would have exactly one section, which is the shape the
 * template exists to replace. The page-wide switches that ARE variants of one
 * specimen (the canvas, the headline step, the album's column rule) are the
 * declared controls, and they are in the dock, which is Will's note (a).
 *
 * THE STAGES ARE THE KIT'S. `Stage` for the hero, because a hero is a viewport
 * and has to be judged inside one; `FitStage` for the two compositions, which
 * are blocks of arbitrary height whose ground must end where they do. Round one
 * carried its own measuring stage for those; the kit owns that now, and the
 * kit's also re-measures when the webfont lands.
 *
 * THEY ARE 1:1 (the shell's default): a hero judged at 0.69 is a hero nobody
 * judged. A 1440 canvas scrolls sideways on a narrower window, and that is
 * correct.
 */
export function AlbumHeroBoard() {
  const { runId, replay } = useReplay();

  return (
    <BoardPage
      className="alb-board"
      spec={ALBUM_HERO}
      dock={() => <ReplayButton runId={runId} onReplay={replay} />}
      evidence={(id, state) => {
        const mode = state.canvas as Mode;
        const step = state.step as Step;
        const phone = mode === "phone";
        // The width ask's own option, straight off the switch that mirrors it.
        const width = state.columns === "both" ? "both" : "ship";
        // What the candidate's responsive rule RESOLVES TO on this canvas. The
        // shipped component is two columns everywhere; the candidate is two on
        // a phone and four on a laptop, so at 375 the switch is deliberately a
        // no-op, and the caption says so rather than leaving a stranger to
        // wonder whether the control is broken.
        const cols = width === "both" ? (phone ? 2 : 4) : 2;

        switch (id) {
          case "hero":
            return <HeroReading mode={mode} step={step} runId={runId} />;
          case "album":
            return (
              <AlbumReading
                mode={mode}
                width={width}
                cols={cols}
                runId={runId}
              />
            );
          case "page":
            return (
              <PageReading
                mode={mode}
                step={step}
                width={width}
                cols={cols}
                runId={runId}
              />
            );
          default:
            return null;
        }
      }}
    />
  );
}

/** The canvas, in the words a caption uses. */
const canvasLabel = (mode: Mode) => (mode === "phone" ? "375" : "1440");

/**
 * ★ THE EVIDENCE CARRIES THE OPTION'S OWN NAME (the clarity round, 2026-09-15).
 * Will's first review could not map an ask's options onto the specimens in
 * front of him, so every caption on this board says which option it is showing,
 * in the ask's words. It is READ OFF THE SPEC rather than retyped, so a caption
 * and the ask a reviewer answers can never drift into two vocabularies; the
 * light board's `cueLabel` is the same rule spelled by hand.
 */
function optionWords(askId: string, id: string): string {
  const ask = ALBUM_HERO.asks.find((a) => a.id === askId);
  const option = ask?.options.find((o) => optionId(o) === id);
  return option ? optionLabel(option) : id;
}

/**
 * 1 · THE HERO. A real viewport on the cinema ground, remounted by the canvas,
 * the step and Replay: the pool is re-solved against the lockup the step draws,
 * so a step change is a new field rather than a restyled one.
 */
function HeroReading({
  mode,
  step,
  runId,
}: {
  mode: Mode;
  step: Step;
  runId: number;
}) {
  const density = FIELD_DENSITY[mode];
  return (
    <Labeled
      /* Three asks are judged here (the headline, the hero's words, the
         no-script paint), so the caption names the option each one is showing
         in that ask's own words rather than in the board's nicknames. */
      name={`${canvasLabel(mode)} · Headline: ${optionWords("headline", step)}`}
      note={`${density.cards} frames over a ${FIELD_FLIGHT_S} s flight, ${density.onScreen} on screen at any moment, every one a photograph. The type sits in a space no frame enters, so the media stays at 100 percent and nothing is dimmed. The words over the field are the live page's own words, unchanged. With Reduce Motion on, this paints the album spread out and still, which is what a reader with no JavaScript would get under the other no-script option.`}
    >
      <Stage
        key={`hero-${mode}-${step}-${runId}`}
        mode={mode}
        ground="cinema"
        bodySkin
      >
        <AlbumHeroField mode={mode} step={step} />
      </Stage>
    </Labeled>
  );
}

/**
 * 2 · THE LIVE ALBUM, WIDE. A composition rather than a viewport, so the ground
 * takes its height from the content.
 */
function AlbumReading({
  mode,
  width,
  cols,
  runId,
}: {
  mode: Mode;
  /** The width ask's option this specimen is showing. */
  width: "ship" | "both";
  cols: number;
  runId: number;
}) {
  const phone = mode === "phone";
  return (
    <Labeled
      /* Two asks are judged here (the width and the album's live signal), so
         the caption names the width option in the ask's own words and the note
         names the live one. */
      name={`${optionWords("width", width)} · the album at ${cols} columns`}
      note={
        phone
          ? "Two columns at 375 under either switch, which is what the candidate's responsive rule resolves to on a phone. Its only live signal is the green dot, as it ships, beside the words Live now."
          : "The frame is 1154 px, about what the widened laptop page would give, and not the 632 px the guest page ships at every screen size. Its only live signal is the green dot, as it ships, beside the words Live now."
      }
    >
      <FitStage
        mode={mode}
        ground="cinema"
        bodySkin
        swapKey={`album-${mode}-${cols}-${runId}`}
      >
        <AlbumVisual mode={mode} cols={cols} runId={runId} />
      </FitStage>
    </Labeled>
  );
}

/**
 * 3 · THE PAGE, WHOLE. The hero at exactly one viewport's height, the album
 * under it, then the rest of the route.
 *
 * ★ THE HERO TAKES ITS HEIGHT FROM THE BOX AROUND IT, never from the stage. The
 * field is `size-full` inside its own positioned root, so without a box of a
 * known height it stretches to the whole measured composition and flies frames
 * past the FAQ.
 */
function PageReading({
  mode,
  step,
  width,
  cols,
  runId,
}: {
  mode: Mode;
  step: Step;
  width: "ship" | "both";
  cols: number;
  runId: number;
}) {
  return (
    <Labeled
      name={`${canvasLabel(mode)} · Headline: ${optionWords("headline", step)} · Album: ${optionWords("width", width)}`}
      note="Hero, album, then every section the route ships, in its shipped order, down to the closing band. The stage measures its own content, so no section is ever clipped in half."
    >
      <FitStage
        mode={mode}
        ground="cinema"
        bodySkin
        swapKey={`page-${mode}-${step}-${cols}-${runId}`}
      >
        <div style={{ height: CANVAS[mode].h }}>
          <AlbumHeroField mode={mode} step={step} />
        </div>
        <AlbumVisual mode={mode} cols={cols} runId={runId} />
        <PageTail />
      </FitStage>
    </Labeled>
  );
}

/**
 * THE REST OF THE ROUTE, under the new top. If the field is too loud, the
 * symptom shows up HERE (a reader arriving at the cinema-to-paper cut with the
 * album still flying a chapter above), not in the hero alone: QualitySection
 * winds the dark chapter down, PaperChapter flips the token subtree light on a
 * hard hairline, and six desk sections run on paper before the close returns to
 * cinema.
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
