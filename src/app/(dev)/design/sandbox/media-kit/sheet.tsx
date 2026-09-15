"use client";

/**
 * THE SOURCING SHEET, ON THE BOARD (round four, 2026-09-15). Will's note asked
 * for places rather than picks, so this file is the three surfaces that answer
 * it: the plan (what to buy, where, for how much), the sheet (thirteen real
 * catalogues ranked by the one test that decides them), and the surface check
 * (the same frames inside the geometry they would land in).
 *
 * ★ EVERY FRAME HERE IS A PLAIN <img> AND THAT IS A DECISION, NOT A LIMITATION.
 * next/image would proxy each thumbnail through our own optimizer, which means a
 * cached copy of another company's watermarked comp sitting on our
 * infrastructure. A sourcing board must never do that: the whole claim of the
 * sheet is that nothing paid has been copied anywhere. A plain img fetches from
 * the source's own CDN, our servers never see the bytes, and a frame that stops
 * answering degrades to a labelled slate instead of a broken tile.
 *
 * ★ THE REVEAL IS THE HOUSE BEAT, NOT A PRIVATE ONE. Tiles carry
 * `data-mkt-develop` with `--i`, which is marketing.css's own develop transition
 * (opacity and blur off @starting-style), tuned only in clock by board.css. So
 * this board still mints no keyframe and runs no loop, and a reduced-motion
 * reader gets the settled composition with nothing to undo.
 */

import { useState } from "react";

import { Stage, Toggle } from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
import { cn } from "@/lib/utils";

import { type Frame, FRAME_COUNT, HARVESTED, SHEET_COUNT } from "./catalogue";
import {
  BRIDGE_LIMITS,
  CLIPS_IF_LICENSED,
  PLAN,
  planSource,
  TOTAL,
  TOTAL_PROMO,
  UNSPLASH_PROMO,
} from "./plan";
import {
  ALLOWED_SOURCES,
  BARRED_SOURCES,
  drawableVerticals,
  RETRIEVED,
  sheetFor,
  type SourceCard,
  SOURCES,
  type Vertical,
  VERTICAL_LABEL,
} from "./sources";

export { FRAME_COUNT, HARVESTED, SHEET_COUNT };

/* --------------------------------------------------------------------------
   One frame. The whole sheet is this component repeated, so it carries the
   fallback and nothing else does.
   -------------------------------------------------------------------------- */

function Tile({
  frame,
  source,
  index,
  className,
}: {
  frame: Frame;
  source: string;
  index: number;
  className?: string;
}) {
  const [dead, setDead] = useState(false);
  return (
    <a
      href={frame.page}
      target="_blank"
      rel="noreferrer"
      data-mkt-develop
      style={{ "--i": index % 6 } as React.CSSProperties}
      className={cn(
        "group relative block aspect-4/5 overflow-hidden bg-muted",
        "transition-transform duration-150 ease-emphasis active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
    >
      {dead ? (
        <span className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] p-2 text-center">
          <Caption className="text-[10px] leading-snug">
            {source} did not answer
          </Caption>
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- the source's own
              thumbnail, fetched from the source's own CDN. next/image would cache a
              copy of another company's watermarked comp on our infrastructure, which
              is the one thing a sourcing board must not do. */}
          <img
            src={frame.thumb}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setDead(true)}
            className="absolute inset-0 size-full object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/20 motion-reduce:transition-none"
          />
        </>
      )}
    </a>
  );
}

/* --------------------------------------------------------------------------
   The plan. The only part of this board a reviewer has to agree with.
   -------------------------------------------------------------------------- */

export function PlanCard() {
  return (
    <section
      id="mk-plan"
      className="flex flex-col gap-3 rounded-lg border border-foreground/25 bg-card p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">
          What to buy, where, and what it comes to
        </h2>
        <Caption className="text-[11px]">
          Every figure is read off the source&rsquo;s own card, never typed into
          a sentence
        </Caption>
      </div>
      <p className="max-w-3xl text-xs leading-relaxed">
        One subscription month covers all five verticals, and the only per-frame
        money is the conference rooms, which is the vertical no library on the
        sheet is deep in. The films are the expensive line and the
        recommendation is to shoot rather than license them, because licensing
        them costs more than every photograph here put together.
      </p>

      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[46rem] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Vertical</th>
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 font-medium">What you do</th>
              <th className="py-2 pr-3 text-right font-medium">Spend</th>
            </tr>
          </thead>
          <tbody>
            {PLAN.map((row) => {
              const s = planSource(row);
              return (
                <tr key={row.key} className="border-b border-border align-top">
                  <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                    {row.label}
                  </td>
                  <td className="py-2.5 pr-3">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground"
                    >
                      {s.name}
                    </a>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    <span className="text-foreground">{row.buy}</span>{" "}
                    {row.spendNote}
                    <span className="mt-1 block">
                      Second choice: {row.fallback}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {row.spend > 0 ? (
                      <span className="font-medium">${row.spend}</span>
                    ) : (
                      <span className="text-muted-foreground">included</span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="align-top">
              <td className="py-3 pr-3 font-semibold" colSpan={3}>
                Total, and it is the whole photographic spend
              </td>
              <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                ${TOTAL}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">${TOTAL_PROMO}</span> if
          the ${UNSPLASH_PROMO} launch promotion is still running
        </span>
        <span>
          <span className="font-medium text-foreground">
            ${CLIPS_IF_LICENSED}
          </span>{" "}
          a year if the films were licensed instead of shot
        </span>
        <span>
          <span className="font-medium text-foreground">$0</span> is what the
          twelve stills on the site cost, and why they are still there
        </span>
      </div>

      <div className="mt-1">
        <Caption className="mb-1.5 block">What the money does not buy</Caption>
        <ul className="space-y-1">
          {BRIDGE_LIMITS.map((line, i) => (
            <li
              key={i}
              className="flex gap-2 text-[11px] leading-snug text-muted-foreground"
            >
              <span className="w-3 shrink-0 text-right tabular-nums">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   One source. The facts on the left, the catalogue on the right.
   -------------------------------------------------------------------------- */

const RELEASE_LABEL: Record<SourceCard["release"], string> = {
  held: "Releases held",
  "per-item": "Releases per item",
  none: "No releases",
};

function SourceRow({
  source,
  vertical,
  rank,
}: {
  source: SourceCard;
  vertical: Vertical | "all";
  rank: number;
}) {
  // A source is shown for the chosen vertical when it has a sheet for it; on
  // "all" it shows the first vertical it can actually draw, so a card is never a
  // row of empty slates just because the filter moved.
  const drawable = drawableVerticals(source.id);
  const shown =
    vertical !== "all" && drawable.includes(vertical)
      ? vertical
      : (drawable[0] ?? null);
  const sheet = shown ? sheetFor(source.id, shown) : null;

  return (
    <article
      className={cn(
        "grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]",
        source.barred
          ? "border-destructive/35 bg-destructive/[0.035]"
          : "border-border bg-card",
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {rank}
          </span>
          <h3 className="text-sm font-semibold">
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground"
            >
              {source.name}
            </a>
          </h3>
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-medium",
              source.release === "held"
                ? "bg-foreground text-background"
                : source.release === "per-item"
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/15 text-destructive",
            )}
          >
            {RELEASE_LABEL[source.release]}
          </span>
        </div>

        <p className="text-xs leading-relaxed font-medium">{source.price}</p>

        <p className="text-[11px] leading-snug">
          <span className="text-muted-foreground">{source.licence}:</span>{" "}
          <span
            className={cn(
              "italic",
              source.clauseIs === "bar" && "text-destructive",
            )}
          >
            &ldquo;{source.clause}&rdquo;
          </span>
        </p>

        <p className="text-[11px] leading-snug text-muted-foreground">
          {source.releaseNote}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {source.catalogue}
        </p>
        <p className="mt-auto border-t border-border pt-2 text-[11px] leading-snug">
          {source.verdict}
        </p>
        <Caption className="text-[10px]">
          {source.covers.map((v) => VERTICAL_LABEL[v]).join(", ")}. Read{" "}
          {RETRIEVED}.
        </Caption>
      </div>

      <div className="flex min-w-0 flex-col">
        {sheet ? (
          <>
            <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
              <Caption className="text-[10px]">
                {shown ? VERTICAL_LABEL[shown] : ""}, its own thumbnails
              </Caption>
              {/* ★ SAY WHEN THE SHEET IS NOT THE VERTICAL THAT WAS ASKED FOR.
                  A source with no sheet for the chosen vertical falls back to one
                  it does have, which is more useful than a blank and is a lie
                  unless it is labelled: a reviewer who picked conferences and is
                  looking at weddings should be told, in the same glance. */}
              {vertical !== "all" && shown !== vertical && (
                <span className="rounded-full bg-destructive/15 px-1.5 py-px text-[10px] font-medium text-destructive">
                  nothing for {VERTICAL_LABEL[vertical].toLowerCase()}
                </span>
              )}
              <a
                href={sheet.searchUrl || source.url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:text-foreground"
              >
                {sheet.query}
              </a>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
              {sheet.frames.map((f, i) => (
                <Tile
                  key={f.thumb}
                  frame={f}
                  source={source.name}
                  index={i}
                  className="aspect-square"
                />
              ))}
            </div>
          </>
        ) : (
          // `self-start`, never a stretched cell: a card whose catalogue cannot
          // be drawn should read as a short note, not as a tall empty rectangle
          // that implies the sheet failed. The absence is the fact, not a void.
          //
          // ★ AND THE FACT IS THIS SOURCE'S, NEVER A CATEGORY'S. This slate used
          // to print one sentence under all seven blanks, that the catalogue
          // answers a non-browser client with a 401 or a 403. It was true of
          // three of them and it contradicted the Coverr card printed one column
          // to its left, whose verdict is a measurement taken off the very search
          // page it claimed had refused. On a board whose thesis is that a
          // catalogue must be drawn rather than described, a shared excuse is the
          // one thing a blank must not carry: `noSheet` is per source, measured
          // on the retrieval date, and a source without one fails plan.test.ts.
          // Writing them out one at a time is also what emptied one of the seven:
          // Unsplash+, the card the whole plan asks Will to buy, turned out to be
          // readable and now draws 60 frames instead of explaining itself.
          <div className="max-w-md self-start rounded border border-dashed border-border p-3">
            <Caption className="text-[10px] leading-snug">
              <span className="text-foreground">No contact sheet.</span>{" "}
              {source.noSheet ??
                "No reason recorded, which is itself a defect."}{" "}
              Its licence, its price and its release position are on the left,
              which is what the ranking is made of.
            </Caption>
          </div>
        )}
      </div>
    </article>
  );
}

export function SourcingSheet({ vertical }: { vertical: Vertical | "all" }) {
  return (
    <section id="mk-sheet" className="flex flex-col gap-4" data-mk-sheet>
      <div>
        <h2 className="text-sm font-semibold">
          {SOURCES.length} places, ranked by whether they hold a release
        </h2>
        {/* ★ A NUMBER AND ITS NOUN GO IN ONE EXPRESSION, NEVER `{n} noun`.
            JSX dropped the space after `{SHEET_COUNT}` here and the board
            printed "26pulls of the source's own thumbnails" on the production
            build (it survived a round because the count read as one word and
            nobody rebuilt to look). The same bug was live on the exposure
            paragraph in board.tsx. A template literal cannot be split, so the
            space cannot be lost; if you add another count to this sentence,
            write it the same way and REBUILD before believing the copy. */}
        <Caption className="mt-1 max-w-3xl leading-relaxed">
          Not by price. Our five verticals are rooms full of recognisable
          people, so a free library with no release is not a cheaper source, it
          is a source that cannot supply the frames we came for. Each clause is
          quoted word for word from the licence page on {RETRIEVED}. The sheet
          is {`${SHEET_COUNT} pulls`} of the sources&rsquo; own thumbnails,{" "}
          {`${FRAME_COUNT} frames`} in all, taken on {HARVESTED} and hotlinked
          rather than copied. Nothing here is licensed to us: every tile is a
          preview, and some sources serve theirs unwatermarked.
        </Caption>
      </div>

      <div className="flex flex-col gap-3">
        {ALLOWED_SOURCES.map((s, i) => (
          <SourceRow key={s.id} source={s} vertical={vertical} rank={i + 1} />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-destructive/40" />
        <Caption className="text-[11px] text-destructive">
          Below the line: {BARRED_SOURCES.length} places that cannot put a frame
          on a page under ask 1
        </Caption>
        <span className="h-px flex-1 bg-destructive/40" />
      </div>

      <div className="flex flex-col gap-3">
        {BARRED_SOURCES.map((s, i) => (
          <SourceRow
            key={s.id}
            source={s}
            vertical={vertical}
            rank={ALLOWED_SOURCES.length + i + 1}
          />
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   The surface check: the same catalogue, in the geometry it would land in,
   at 1:1 on a real ground.
   -------------------------------------------------------------------------- */

/** The three rungs of the blog's crop ladder that the real cards actually use. */
const LADDER = ["50% 38%", "50% 50%", "62% 50%"];

const SURFACE_SOURCES = SOURCES.filter(
  (s) => drawableVerticals(s.id).length > 0,
);

export function SurfaceCheck({ vertical }: { vertical: Vertical | "all" }) {
  const [sourceId, setSourceId] = useState(SURFACE_SOURCES[0]?.id ?? "");
  const [mode, setMode] = useState<"desktop" | "phone">("desktop");
  const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
  const drawable = drawableVerticals(source.id);
  const shown =
    vertical !== "all" && drawable.includes(vertical)
      ? vertical
      : (drawable[0] ?? null);
  const frames = (shown ? sheetFor(source.id, shown)?.frames : null) ?? [];

  return (
    <section id="mk-surface" className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">
          The same catalogue, in the geometry it lands in
        </h2>
        <Caption className="mt-1 max-w-3xl leading-relaxed">
          A contact sheet flatters everything, because a square thumbnail asks
          nothing of a photograph. These are the real sizes on the real ground:
          the blog card at 320 by 400 on a cinema page, cut at the three rungs
          of the crop ladder a slug actually produces, and the share card at
          1200 by 630, which centre-crops and ignores the ladder entirely. The
          stage is 1:1, so a frame that cannot survive a 4:5 crop fails here
          where it fails on the site.
        </Caption>
        {/* ★ SAID OUT LOUD, BECAUSE A COMP DOES NOT ALWAYS LOOK LIKE ONE. iStock
            serves its search thumbnails unwatermarked at 612 px, so a plate here
            can read as a finished card. Nothing on this board is licensed to us,
            and a board about licensing is the last place to let that be inferred
            from the absence of a watermark. */}
        <p className="mt-1.5 max-w-3xl text-[11px] leading-snug text-destructive">
          None of these frames is licensed to us. Every one is a preview served
          from the source&rsquo;s own search page, and some sources serve theirs
          without a watermark, so a plate below can look finished when it is
          not. This is the catalogue in our geometry, never what we own.
        </p>
      </div>

      {/* ★ THESE TWO STAY HERE AND ARE NOT IN THE DOCK, WHICH IS A DECISION AND
          NOT AN OMISSION. The round's global note puts every PAGE-WIDE switch in
          the dock and keeps a per-specimen control beside its specimen; source
          and viewport dress this one stage and nothing else on the page moves
          when they change, so docking them would make the dock claim a reach it
          does not have. The vertical, which every contact sheet on the page
          obeys, is in the dock. The Handoff says the same thing out loud against
          goal item (3), and the caption below says it to a reviewer who is
          looking for the missing switch rather than reading the manifest.

          A Toggle was an inline-flex row that never wrapped, and this row of
          seven source names plus a viewport pair overflowed a 375 screen, which
          pushed the whole document into a horizontal scroll (measured before this
          wrapper existed; it is seven since Unsplash+ started drawing, because
          this list is derived from the sources that have a sheet). It is its own
          scroller below sm and wraps from sm up. It stays a scroller while the
          DOCK's row was changed to wrap, and the difference is measured, not a
          taste: the dock's row sits inside the shell's `basis-full` cell, whose
          `min-w-0` applies only from `sm` up, so a scroller there still widens
          the page (see board.tsx). This row's parent has a definite width, so the
          scroller is contained, and the measurement at a real 375 is in the
          Handoff. Wrapping it instead would cost five rows of switch directly
          above the stage it controls. */}
      <div className="-mx-4 flex max-w-full items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0">
        <Toggle
          ariaLabel="Source"
          options={SURFACE_SOURCES.map((s) => ({ id: s.id, label: s.name }))}
          value={sourceId}
          onChange={setSourceId}
        />
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop", label: "1440" },
            { id: "phone", label: "375" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "desktop" | "phone")}
        />
      </div>

      <Caption className="text-[10px]">
        These two dress this stage only, so they sit with it. The dock holds
        what moves the whole page: the vertical every contact sheet above draws,
        the route, the geometry.
      </Caption>

      {frames.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4">
          <Caption className="text-[11px] leading-snug">
            {source.name} has no contact sheet on this board, so there is
            nothing honest to put in a card. Pick another source.
          </Caption>
        </div>
      ) : mode === "desktop" ? (
        <div className="flex flex-col gap-3">
          <Stage mode="desktop" ground="cinema" height={520}>
            <div className="flex h-full items-center justify-center gap-4">
              {frames.slice(0, 3).map((f, i) => (
                <figure key={f.thumb} className="flex flex-col">
                  <div
                    className="relative overflow-hidden bg-muted"
                    style={{ width: 320, height: 400 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- see Tile */}
                    <img
                      src={f.thumb}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                      style={{ objectPosition: LADDER[i % LADDER.length] }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                      <span className="font-heading text-lg leading-tight text-balance text-white">
                        What a QR code at the door actually does
                      </span>
                      <span className="text-xs text-white/65">
                        <span className="font-medium text-white">
                          Partyreel Team
                        </span>
                      </span>
                    </span>
                  </div>
                  <figcaption className="mt-1 text-[10px] text-white/50 tabular-nums">
                    320 x 400 at {LADDER[i % LADDER.length]}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Stage>
          <Stage mode="desktop" ground="cinema" height={740}>
            <div className="flex h-full items-center justify-center">
              <figure className="flex flex-col">
                <div
                  className="relative overflow-hidden bg-[#0d0d0d]"
                  style={{ width: 1200, height: 630 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- see Tile */}
                  <img
                    src={frames[0].thumb}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <span aria-hidden className="absolute inset-0 bg-black/30" />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent to-60%"
                  />
                  <span className="absolute top-20 left-20 flex items-center gap-5">
                    <span className="size-14 rounded-2xl bg-[#fafafa]" />
                    <span className="text-[28px] text-[#e4e4e7]">
                      Partyreel Blog
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[22px] px-20 pb-20">
                    <span className="font-heading text-[58px] leading-[1.08] font-bold tracking-[-0.02em] text-[#fafafa]">
                      What a QR code at the door actually does
                    </span>
                    <span className="text-[28px] text-[#d4d4d8]">
                      Will Gibson
                    </span>
                  </span>
                </div>
                <figcaption className="mt-1 text-[10px] text-white/50 tabular-nums">
                  1200 x 630, centre crop, no ladder
                </figcaption>
              </figure>
            </div>
          </Stage>
        </div>
      ) : (
        <Stage mode="phone" ground="cinema" height={760}>
          <div className="flex h-full flex-col gap-4 px-4 py-6">
            {frames.slice(0, 2).map((f, i) => (
              <div
                key={f.thumb}
                className="relative aspect-4/5 w-full overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- see Tile */}
                <img
                  src={f.thumb}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                  style={{ objectPosition: LADDER[i % LADDER.length] }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
                />
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                  <span className="font-heading text-lg leading-tight text-balance text-white">
                    What a QR code at the door actually does
                  </span>
                  <span className="text-xs text-white/65">
                    <span className="font-medium text-white">
                      Partyreel Team
                    </span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Stage>
      )}
    </section>
  );
}
