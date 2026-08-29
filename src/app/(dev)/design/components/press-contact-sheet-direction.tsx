"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SITE_URL } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

import { Reveal } from "./marketing-lab-shared";
import {
  CopyButton,
  DownloadKit,
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_COPY,
  PRESS_FACTS,
  PRESS_INK,
  PRESS_USAGE_RULES,
  pressMarks,
} from "./press-lab-shared";

/**
 * V1 THE CONTACT SHEET. The press kit as a photographic proof sheet: a paper masthead,
 * then ONE ink plate holding every asset as a numbered frame on the album grid.
 *
 * WHY THIS AND NOT A LOGO GRID: the frames are deliberately NOT all the same kind of
 * thing. Three marks, the ink, the type, a working QR, two event photos. That is what a
 * contact sheet IS: everything the roll caught, indexed in one field. A grid of six
 * near-identical logo squares is a downloads table with ambition.
 *
 * THE 3px GAP IS THE TELL. gap-[var(--gap-gallery)] is the site's one media-grid gap, so
 * the sheet reads as a Partyreel album at a glance. A comfortable gap-4 would make it a
 * card grid and throw away the cheapest identity move on the page. Do not relax it.
 *
 * The two signature moves:
 *  A. THE SHEET EXPOSES. Frames land in index order as hard film cuts ([data-mkt-cut],
 *     --i = frame index, 120ms stagger), not fades. A sheet being exposed, left to right.
 *  B. THE LIGHT-TABLE ISOLATE. Hover or focus a frame and the rest steps back
 *     ([data-press-sheet] in design.css). What you actually do at a light table.
 *
 * THE CREDIT LINE is the move only a photo product could make: constants/marketing-media.ts
 * already carries per-image provenance, and a journalist genuinely cannot publish an image
 * whose licence they do not know. It also states the media gap honestly instead of hiding
 * it: the two photo frames are marked as not in the kit, because their provenance is
 * unverified and we will not hand a publisher media we do not hold rights to.
 */

/** The always-dark plate. --gallery* covers the surface, but --ring, --border,
 *  --foreground, --muted-foreground, --brand, --card and --muted are NOT in that family
 *  and would keep their LIGHT values under .surface-paper (the invisible-contrast bug
 *  footer-contract.test.ts exists to catch). --brand is redeclared DIRECTLY, never via
 *  var(--primary): an unregistered custom property substitutes at the DECLARING element. */
const INK =
  "[--background:var(--gallery)] [--foreground:var(--gallery-foreground)] " +
  "[--muted-foreground:var(--gallery-muted)] [--border:var(--gallery-border)] " +
  "[--ring:var(--gallery-foreground)] [--card:var(--gallery)] " +
  "[--card-foreground:var(--gallery-foreground)] [--muted:var(--gallery)] " +
  "[--brand:var(--gallery-foreground)] [--brand-foreground:var(--gallery)] " +
  "[--primary:var(--gallery-foreground)] [--primary-foreground:var(--gallery)]";

const PHOTOS = ["wedding-toast", "party-balloons"] as const;

/** One cell on the sheet. The caption bar stays INSIDE the tile so the 3px gap is the
 *  only thing between frames, and so a download never hides behind a hover. */
function Frame({
  index,
  plate,
  caption,
  children,
}: {
  index: number;
  plate?: string;
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // ★ THE ENTRANCE AND THE ISOLATE MUST SIT ON DIFFERENT ELEMENTS. mkt-cut runs with
    // animation-fill-mode: both, and a filling animation wins the cascade over every
    // author declaration, so once the cut finishes it pins opacity:1 forever and the
    // light-table dim silently never applies. Verified live: the hover fired, :hover
    // matched, the CSS was correct, and the opacity never moved. The cut goes on an
    // inner layer; [data-press-frame] keeps a clean opacity of its own.
    <li
      data-press-frame
      className="group relative flex flex-col overflow-hidden rounded-tile"
    >
      <div
        data-mkt-cut
        style={{ "--i": index } as CSSProperties}
        className="flex flex-col"
      >
        <div
          className={cn(
            "relative flex aspect-square items-center justify-center",
            plate ?? "bg-white",
          )}
        >
          <span className="absolute top-2 left-2 font-mono text-[10px] tracking-wider text-foreground/55 mix-blend-difference">
            {String(index + 1).padStart(2, "0")}
          </span>
          {children}
        </div>
        <div className="flex min-h-9 items-center gap-2 bg-foreground/8 px-2.5 py-2 font-mono text-[10px] tracking-wide text-muted-foreground">
          {caption}
        </div>
      </div>
    </li>
  );
}

/** A download in the sheet's own language: the frame number IS the order number, the way
 *  a photo editor asks for a print off a contact sheet. */
function FrameLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download
      className="rounded-[2px] px-1 py-0.5 text-foreground/70 transition-colors duration-150 ease-[var(--dir-ease)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
    >
      {children}
    </a>
  );
}

/** The manifest's licence strings are deliberately blunt ("unsplash (per lab-pack comment;
 *  provenance unverified)"). Render the same facts as a sentence: the honesty is the point,
 *  the raw punctuation is not. */
function tidyLicence(licence: string): string {
  const source = licence.split(" (")[0];
  const unverified = /unverified/i.test(licence);
  return `${source.charAt(0).toUpperCase()}${source.slice(1)}${unverified ? ", provenance unverified." : "."}`;
}

export function PressContactSheetDirection() {
  const marks = pressMarks();
  // A plate per mark, each chosen so THAT mark is legible on it: the dark chip needs
  // white, the light chip needs ink, and the bare mark is a #101010 stroke, so it
  // needs a light ground (bg-white/10 on ink is a dark grey; the mark vanished).
  const plates = ["bg-white", "bg-[#101010]", "bg-white/70"];

  return (
    <div className="surface-paper overflow-hidden rounded-2xl border bg-background text-foreground">
      {/* THE MASTHEAD. Left-aligned on purpose: /about, /careers and /press all open with
          the identical centered careers hero today, and breaking that is structural, not
          cosmetic. No right-hand index column here either, because the sheet's own index
          sits thirty pixels below it. Type and air, then the sheet is the surprise. */}
      <header className="px-6 pt-12 pb-16 sm:px-10 sm:pt-16 sm:pb-24">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {PRESS_COPY.eyebrow}
        </p>
        <h1 className="mt-5 max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl">
          {PRESS_COPY.h1}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
          {PRESS_COPY.standfirst}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <DownloadKit />
          <CopyButton
            value={PRESS_BOILERPLATE}
            label="Copy the boilerplate"
            className="h-10 px-4"
          />
        </div>
      </header>

      {/* THE SHEET. Full-bleed to the frame edge (negative margin, never translate: a
          transform leaves the layout box behind and opens a phantom gap). */}
      <Reveal>
        <section
          className={cn(
            INK,
            "bg-background px-6 py-10 text-foreground sm:px-10 sm:py-14",
          )}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3 font-mono text-[11px] tracking-wide text-muted-foreground">
            <span className="text-foreground">THE SHEET</span>
            <span>
              8 frames · {marks.length} marks, the ink, the type, a code, two
              rooms
            </span>
          </div>

          <ul
            data-press-sheet
            className="mt-4 grid grid-cols-2 gap-[var(--gap-gallery)] sm:grid-cols-4"
          >
            {marks.map((mark, i) => (
              <Frame
                key={mark.label}
                index={i}
                plate={plates[i]}
                caption={
                  <>
                    <span className="truncate text-foreground/50">
                      {mark.label}
                    </span>
                    <span className="ml-auto flex gap-1">
                      {mark.files.map((f) => (
                        <FrameLink key={f.id} href={f.file}>
                          {f.format.toUpperCase()}
                        </FrameLink>
                      ))}
                    </span>
                  </>
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a static press
                    asset previewing itself; the downloadable file wants no pipeline. */}
                <img src={mark.files[0].file} alt="" className="size-[46%]" />
              </Frame>
            ))}

            {/* On WHITE, not ink: an ink swatch on an ink sheet reads as a hole in
                the grid, and "the marks are drawn in #101010 on white" is the rule. */}
            <Frame
              index={3}
              plate="bg-white"
              caption={
                <>
                  <span className="text-foreground/50">Ink</span>
                  <span className="ml-auto text-foreground/70">
                    {PRESS_INK}
                  </span>
                </>
              }
            >
              <span className="flex size-[46%] items-center justify-center bg-[#101010] font-mono text-[10px] tracking-widest text-white/50">
                {PRESS_INK}
              </span>
            </Frame>

            <Frame
              index={4}
              plate="bg-white"
              caption={
                <>
                  <span className="text-foreground/50">Type</span>
                  <span className="ml-auto text-foreground/70">
                    Urbanist 700
                  </span>
                </>
              }
            >
              <span className="font-heading text-6xl text-[#101010]">Aa</span>
            </Frame>

            <Frame
              index={5}
              plate="bg-white"
              caption={
                <>
                  <span className="text-foreground/50">A live album</span>
                  <span className="ml-auto text-foreground/70">
                    Scan or print
                  </span>
                </>
              }
            >
              {/* The one press asset that works in the journalist's OWN medium: a printed
                  code on a page is the product demonstrating itself. */}
              <FooterQr value={SITE_URL} size={96} />
            </Frame>

            {PHOTOS.map((id, i) => {
              const img = marketingImage(id);
              return (
                <Frame
                  key={id}
                  index={6 + i}
                  plate="bg-black"
                  caption={
                    <>
                      <span className="truncate text-foreground/50">
                        {img.subject}
                      </span>
                      <span className="ml-auto shrink-0 text-foreground/70">
                        On request
                      </span>
                    </>
                  }
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </Frame>
              );
            })}
          </ul>

          {/* THE CREDIT LINE. Provenance is not social proof, so it clears the claims
              fence, and it is the single most practically useful thing a press kit can
              carry: nobody can publish an image whose licence they cannot see. */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="font-mono text-[11px] tracking-wide text-foreground">
              EVERY FRAME, WITH ITS LICENCE
            </p>
            <dl className="mt-3 grid gap-x-8 gap-y-2 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
              <div className="flex gap-3">
                <dt className="shrink-0 text-foreground/50">01-05</dt>
                <dd>Partyreel artwork. Free to use in coverage, unaltered.</dd>
              </div>
              <div className="flex gap-3">
                <dt className="shrink-0 text-foreground/50">06</dt>
                <dd>Generated code. Free to print or embed.</dd>
              </div>
              {PHOTOS.map((id, i) => (
                <div key={id} className="flex gap-3">
                  <dt className="shrink-0 text-foreground/50">0{7 + i}</dt>
                  <dd>
                    {tidyLicence(marketingImage(id).credit.license)} Not in the
                    kit.
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveal>

      {/* THE RULES, still on ink: they are about the artwork, so they stay on the plate
          the artwork lives on. Written against the mark's OWN box, so the coming logo
          change inherits every one of them unchanged. */}
      <section
        className={cn(INK, "bg-background px-6 py-14 text-foreground sm:px-10")}
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div>
            <p className="font-mono text-[11px] tracking-wide">CLEAR SPACE</p>
            <div className="mt-4 inline-flex border border-dashed border-foreground/35 p-[22px]">
              <span className="flex size-[88px] items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- static asset. */}
                <img
                  src="/press/partyreel-mark-dark.svg"
                  alt=""
                  className="size-11"
                />
              </span>
            </div>
            <p className="mt-3 max-w-[15rem] font-mono text-[11px] text-muted-foreground">
              A quarter of the mark&rsquo;s height, all four sides.
            </p>
          </div>
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {PRESS_USAGE_RULES.map(({ title, body }) => (
              <div key={title}>
                <dt className="font-heading text-base">{title}</dt>
                <dd className="mt-1 text-sm text-pretty text-muted-foreground">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Back to paper for the reading material. */}
      <section className="px-6 py-14 sm:px-10 sm:py-20">
        <div className="max-w-2xl">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {PRESS_COPY.boilerplateLabel}
            </p>
            <CopyButton value={PRESS_BOILERPLATE} label="Copy" />
          </div>
          <blockquote className="mt-4 border-l-2 border-foreground/20 pl-5 text-lg leading-8 text-pretty">
            {PRESS_BOILERPLATE}
          </blockquote>
          <div className="mt-8 flex items-baseline justify-between gap-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {PRESS_COPY.shortLabel}
            </p>
            <CopyButton value={PRESS_BOILERPLATE_SHORT} label="Copy" />
          </div>
          <p className="mt-3 text-pretty text-muted-foreground">
            {PRESS_BOILERPLATE_SHORT}
          </p>
        </div>

        <div className="mt-16 max-w-3xl">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {PRESS_COPY.factsLabel}
          </p>
          {/* The R6 mono ruling applied: Inter for the scaffolding, mono only where the
              value is actually data (a year, a domain, an address, a price). */}
          <dl className="mt-5 divide-y divide-border">
            {PRESS_FACTS.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <dt className="w-36 shrink-0 text-sm font-medium">{label}</dt>
                <dd
                  className={cn(
                    "text-sm text-pretty text-muted-foreground",
                    /^[\d$]|@|\.com/.test(value) && "font-mono text-[13px]",
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 max-w-xl border-t pt-10">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            {PRESS_COPY.closeHeading}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {PRESS_COPY.closeBody}
          </p>
          <p className="mt-5">
            <a
              href="mailto:help@partyreel.com"
              className="text-base font-medium underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
            >
              help@partyreel.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
