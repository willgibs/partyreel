"use client";

import "./board.css";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import {
  BoardDock,
  BoardMeta,
  CANVAS,
  type Mode,
  Stage,
  Toggle,
} from "@/components/dev/board";
import { EverywhereSection } from "@/components/marketing/sections/features/album/everywhere-section";
import { GettingInSection } from "@/components/marketing/sections/features/album/getting-in-section";

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
 *  3. THE PAGE, the two together and then the first chapter that follows, so
 *     the hand-off (feeling -> product -> chapters) is judged whole. This is
 *     the one that answers Will's worry about the two animations fighting,
 *     because it is the only stage where both are on screen at once.
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
  // The page stage: the hero's viewport, the album, and the chapter after it.
  // Measured off the rendered stage rather than guessed, and deliberately a
  // little long: the ground below the last section is the page's own.
  const pageH = phone ? 3180 : 3080;

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
          <Stage
            mode={mode}
            ground="cinema"
            bodySkin
            height={phone ? 1180 : 980}
            key={`album-${mode}-${cols}-${runId}`}
          >
            <AlbumVisual mode={mode} cols={cols} runId={runId} />
          </Stage>
        </section>

        <section className="space-y-2">
          <BoardCaption
            title="3 · The page"
            body="The hand-off, whole: the hero, the album, and the first chapter of the real page under them. The one stage where both animations are on screen at once, which is the thing to judge."
          />
          <Stage
            mode={mode}
            ground="cinema"
            bodySkin
            height={pageH}
            key={`page-${mode}-${step}-${cols}-${runId}`}
          >
            <div className="relative size-full overflow-clip bg-background">
              <div style={{ height: CANVAS[mode].h }}>
                <AlbumHeroField mode={mode} step={step} />
              </div>
              <AlbumVisual mode={mode} cols={cols} runId={runId} />
              <GettingInSection />
              <EverywhereSection />
            </div>
          </Stage>
        </section>

        <BoardMeta
          question="The burst's field, killed as the home hero, becomes the live album's hero: emanating for ever, no code, and the product itself wide and calm below it. Is this the top of /features/album?"
          candidates={[
            {
              name: "The hero",
              rationale:
                "One field, born at a point and radiating around the whole compass and forward out of the screen, looping with no end, because a live album has no end. Forty frames at 1440 and thirty-six at 375, every one of them a photograph the moment it exists. The type holds a quiet zone no frame enters, so the media stays at 100 percent and nothing is dimmed.",
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
            "Departure, bible 13, decorative layer only: the field's pre-bloom state sits inside the reduced-motion block, so a reader with JavaScript off who has not asked for less motion sees the album resting around the vent instead of blooming out of it. The eyebrow, the h1, the sentence and the actions are plain markup, never gated, and reduced motion gets the whole album settled and still.",
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
