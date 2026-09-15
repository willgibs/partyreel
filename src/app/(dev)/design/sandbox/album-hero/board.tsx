"use client";

import "./board.css";

import { RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import {
  BoardDock,
  BoardMeta,
  CANVAS,
  type Mode,
  Stage,
  Toggle,
} from "@/components/dev/board";
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
import { AlbumHeroField, type Step } from "./burst";

/**
 * THE ALBUM PAGE'S HERO (the album-hero track, round one, 2026-09-15).
 *
 * Will's ruling, verbatim: "3 can be killed as the home hero, but the
 * background (images emanating) would be beautiful for the /features/album hero
 * for the live album. Use that for the hero animation looped to add the 'live'
 * feel of an album full of images, then keep an album page visual wide below as
 * the actual live album product, with less animation so the hero images and
 * album animation don't conflict and get too overwhelming. It doesn't need the
 * QR code for the new version."
 *
 * So the board is that page's top, in three readings, and the three are ordered
 * the way the decision is made rather than the way the page is built:
 *
 *  1. THE HERO alone, at a real viewport, so the field is judged as a hero.
 *  2. THE ALBUM alone, wide, so the product is judged as the product.
 *  3. THE PAGE: the two on top of the WHOLE shipped route, every section in
 *     its shipped order, so the hand-off (feeling -> product -> chapters) is
 *     judged whole and the cinema-to-paper cut, the flip most likely to be
 *     disturbed by a full-bleed hero that never stops moving, is judged under
 *     it rather than imagined. This is also the one that answers Will's worry
 *     about the two animations fighting, because it is the only stage where
 *     both are on screen at once.
 *
 * EVERY PAGE-WIDE SWITCH IS IN THE DOCK (Will, 2026-09-15: "the GUI control
 * should be fixed so that variants can be toggled on different previews
 * anywhere on the page"): the canvas, the headline step, the album's column
 * rule and Replay all flip from wherever you are reading. Nothing on a stage
 * carries a control of its own, which is also why the field's headline toggle
 * moved off it.
 *
 * THE STAGES ARE 1:1 (the shell's default since round four): a hero judged at
 * 0.69 is a hero nobody judged. A 1440 canvas scrolls sideways on a narrower
 * window, and that is correct.
 */
export function AlbumHeroBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [step, setStep] = useState<Step>("lg");
  const [wide, setWide] = useState(true);
  const [runId, setRunId] = useState(0);

  const phone = mode === "phone";
  // What the candidate's responsive rule resolves to on this canvas. The
  // shipped component is two columns everywhere; the candidate is two on a
  // phone and four on a laptop, so at 375 the switch is deliberately a no-op
  // and the caption under the stage says so rather than leaving a stranger to
  // wonder whether the control is broken.
  const cols = wide ? (phone ? 2 : 4) : 2;

  return (
    <div className="alb-board pt-2">
      <BoardDock
        aside={
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Replay
          </button>
        }
      >
        <Toggle
          ariaLabel="Canvas"
          options={[
            { id: "desktop" as Mode, label: "Desktop 1440" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Toggle
          ariaLabel="Headline step"
          options={[
            { id: "lg" as Step, label: "Headline lg" },
            { id: "xl" as Step, label: "Headline xl" },
          ]}
          value={step}
          onChange={setStep}
        />
        <Toggle
          ariaLabel="Album columns"
          options={[
            { id: "ship", label: "Album: 2 columns" },
            { id: "wide", label: "Album: responsive" },
          ]}
          value={wide ? "wide" : "ship"}
          onChange={(v) => setWide(v === "wide")}
        />
      </BoardDock>

      <div className="mt-4 space-y-8">
        <section className="space-y-2">
          <BoardCaption
            title="1 · The hero"
            body="The field, looped for ever, with nothing at the centre but the vent the album comes out of. The page's own eyebrow, headline, sentence and actions sit in a quiet zone no frame ever enters, so no word is over a photograph and nothing is dimmed."
          />
          <Stage
            mode={mode}
            ground="cinema"
            bodySkin
            key={`hero-${mode}-${step}-${runId}`}
          >
            <AlbumHeroField mode={mode} step={step} />
          </Stage>
        </section>

        <section className="space-y-2">
          <BoardCaption
            title="2 · The live album, wide"
            body={
              phone
                ? "The shipped guest album, composed: the same masonry, the same tiles, the same lightbox. Two columns at 375 under either switch, which is what the candidate's responsive rule resolves to on a phone."
                : `The shipped guest album, composed: the same masonry, the same tiles, the same lightbox, at ${cols} columns. Its only motion is the product's own entrance, so it never competes with the hero.`
            }
          />
          <MeasuredStage mode={mode} key={`album-${mode}-${cols}-${runId}`}>
            <AlbumVisual mode={mode} cols={cols} runId={runId} />
          </MeasuredStage>
        </section>

        <section className="space-y-2">
          <BoardCaption
            title="3 · The page, whole"
            body="The hand-off, end to end: the hero, the album, and then every section /features/album ships, in its shipped order, down to the closing band. The one stage where both animations are on screen at once, and the only place to see what a hero that never stops moving does to the cinema-to-paper cut a chapter below it."
          />
          <MeasuredStage
            mode={mode}
            key={`page-${mode}-${step}-${cols}-${runId}`}
          >
            <div style={{ height: CANVAS[mode].h }}>
              <AlbumHeroField mode={mode} step={step} />
            </div>
            <AlbumVisual mode={mode} cols={cols} runId={runId} />
            <PageTail />
          </MeasuredStage>
        </section>

        <BoardMeta
          question="The burst's field, killed as the home hero, becomes the live album's hero: emanating for ever, no code, and the product itself wide and calm below it. Is this the top of /features/album?"
          candidates={[
            {
              name: "The hero",
              rationale:
                "One field, born at a point and radiating around the whole compass and forward out of the screen, looping with no end, because a live album has no end. Fifty-two frames at 1440 and forty-four at 375, nineteen to twenty-seven of them on screen at any moment, every one a photograph from the frame it is born in. The type holds a quiet zone no frame enters, so the media stays at 100 percent and nothing is dimmed.",
            },
            {
              name: "The album",
              rationale:
                "The shipped guest album composed rather than drawn: GuestMasonry, MediaTile, the lightbox trigger, the host's own event chrome (bible 4), and the product's own entrance as its only motion. The board argues one production change, the column rule, and shows it as a switch rather than asserting it.",
            },
          ]}
          asks={[
            "Rule on, the headline step: lg or xl. It is the one choice that changes the composition rather than the styling, because the field is re-solved against the lockup the step draws. lg (text-7xl at 1440, text-4xl at 375) leaves the album the canvas and keeps the corridor beside the vent wide enough to be born in; xl (text-8xl, text-5xl) is the louder promise and takes about 80 px of quiet zone in every direction, which at 375 drops a further slice of the compass out of the pool.",
            "Rule on, the album's column rule, and it is an APP-UI change, not a marketing one. Shipped is columns-2 at every width, which is right for the phone it was designed for; the candidate is two on a phone and four on a laptop (columns-2 md:columns-3 xl:columns-4 in guest-masonry.tsx). WHAT IT BUYS: a host opening their own album on a laptop sees twelve photographs where they now see four, and the marketing page can show the album wide at all. WHAT IT COSTS: a smaller tile, so a face at 1440 goes from about 700 px to about 280 px, and the masonry's natural-ratio signature reads quieter the more columns it has.",
            "Rule on, the album's life: the pulse alone, or an arrival. It ships with one live signal, a 6 px green dot pulsing every 2 s, and nothing else; the product's real behaviour is a new tile landing at the head of the album every few seconds with its green check. The second is the truer demonstration of live and is the thing most likely to fight the hero, which is why it is an ask and not a default.",
            "Rule on, the copy: the page's own lines stand (bible 21 leaves them open). The hero renders /features/album's shipped eyebrow, h1 and subhead verbatim from feature-pages.ts. The brand-voice board's proposal would rewrite the subhead here; this board proposes nothing of its own, because the field is the argument and the sentence is the page's.",
          ]}
          departures={[
            "Departure, bible 10 (the hero is unlit by the standing ruling): the frames carry a drop shadow, the light spec's LIFT family (docs/specs/light.md) at four times the offsets, because LIFT separates two cards a pixel apart and these are separated by a depth axis measured in hundreds of units. It is a shadow, never a lamp: no light source is added, no photograph is darkened, and there is no scrim anywhere on the hero.",
            "Departure, bible 13, decorative layer only: the field's FIRST FRAME (every card collapsed on the vent at no size) sits inside the prefers-reduced-motion: no-preference query, and no-preference is the DEFAULT match, so with JavaScript off the hero paints as the lockup alone on the cinema ground, no photographs behind it, until the loop takes over on the next frame. A reader who HAS asked for less motion gets the opposite and the better one: the album settled around the vent, whole and still, because that state is what the cards carry outside every query. Nothing that carries meaning is gated (the eyebrow, the h1, the sentence and the actions are plain markup at full opacity, and the field is aria-hidden), and the alternative is worse to look at, not better: paint the album settled for everyone and the loop has to snap it back to the vent on every load. Rule on whether the no-script frame should be the settled album anyway.",
            "Departure, the production component is changed from the outside: album.css drives GuestMasonry's column count through a variable rather than forking the component, so the candidate is composed and the diff it argues for is one declaration. Nothing under src/components/guest was edited.",
          ]}
          assets={[
            "24 event photographs as 512 x 512 squares · one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot · replaces the 12 landscape stand-ins the field cycles (FRAMES in the home hero's shared.tsx). Already asked for as docs/ASSETS.md row 2; the same 24 serve this board, and they serve the album grid below as well as the field.",
            "11 more of the same, as 4:5 portraits · 512 x 640, same grade, and they may be recrops of the 24 rather than new photography · one for every 4:5 slot the field lays out, so no frame is on screen twice. Already asked for as ASSETS row 9. Guests shoot vertical, so a field of nothing but squares reads as a deck of cards rather than as an album, and the wide album grid reads flatter than a real one for exactly the same reason: eleven of the twelve stand-ins are landscape.",
            "2 short clips as album tiles · 6 to 10 s, 4:5 or 9:16, muted, under 2 MB each, poster frame included · so the album grid can show a real video tile with the corner play badge the guest album ships. The grid is all photographs today because MediaTile renders a real <video> element and pointing one at a jpg shows an empty box.",
            "Nothing else · no plate art, no lamp, no QR: the code left the composition with Will's ruling.",
          ]}
        />
      </div>
    </div>
  );
}

/**
 * THE REST OF THE ROUTE, under the new top (round one's read-back fix). The
 * goal asked for "the two together, then the rest of the page's sections as
 * they ship", and the first pass stopped after two chapters, which quietly hid
 * the one hand-off most at risk from a full-bleed hero that never resolves: the
 * CINEMA-TO-PAPER CUT. QualitySection winds the dark chapter down, PaperChapter
 * flips the token subtree light on a hard hairline, and six desk sections run
 * on paper before the close returns to cinema. If the field is too loud, the
 * symptom shows up HERE (a reader arriving at the cut with the album still
 * flying a chapter above), not in the hero alone.
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

/**
 * A STAGE AS TALL AS WHAT IT HOLDS. The board's second and third readings are
 * compositions rather than viewports, and a hand-set canvas height is wrong
 * twice over: the first guess cut the page reading's second chapter in half,
 * and any number written down goes stale the moment a section or an asset
 * changes. So the content measures itself and the canvas follows. It converges
 * in one pass, because the content's own height is auto and never reads the
 * canvas's, so setting the canvas cannot change the measurement; and it
 * re-measures when the photographs finish decoding, which is the case a
 * one-shot measurement misses. Remount it with a key from the caller so the
 * whole thing, height included, resets with the reading it is showing.
 */
function MeasuredStage({
  mode,
  children,
}: {
  mode: Mode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number>(CANVAS[mode].h);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setH((prev) => {
        const next = Math.ceil(el.scrollHeight);
        return next > 0 && next !== prev ? next : prev;
      });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <Stage mode={mode} ground="cinema" bodySkin height={h}>
      <div ref={ref} className="relative w-full overflow-clip">
        {children}
      </div>
    </Stage>
  );
}

/** A stage's own caption. The board has three readings of one page, and a
 *  stranger has to know which one they are looking at before they can rule on
 *  it; the dock carries the switches, so this carries only the sentence. */
function BoardCaption({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-medium tracking-widest text-foreground uppercase">
        {title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
