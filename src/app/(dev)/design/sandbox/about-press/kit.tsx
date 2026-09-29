"use client";

import { ArrowDown } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { PressSheet } from "@/components/marketing/press/press-sheet";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import {
  PRESS_FACTS,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
  formatKitBytes,
} from "@/lib/constants/press";
import { BRAND_HEX } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * THE KIT, THREE WAYS, AND THE FOUR FACTS: every piece is production's own
 * (PressSheet, the kit's files and zip off `PRESS_KIT`, the facts off
 * `PRESS_FACTS`, About's Eyebrow, SectionShell and measure), composed into
 * About's grammar rather than /press's.
 *
 * ★ ABOUT'S MEASURE, NOT /press's. The convictions ledger reads in
 * `max-w-4xl`, so every kit's words do too, left edge on the ledger's: a
 * block that starts somewhere else reads as another page's section pasted in.
 * The one exception is the whole sheet, which runs a step wider (`max-w-5xl`)
 * as a figure breaks out of a column: at the ledger's own measure its four
 * frames are 203 px, and PressSheet's captions ("Mark, dark chip" beside two
 * chips) cut to "Mark, dark c...". At 5xl they are 235 px, /press's 231 and
 * whole, and the header above stays on the ledger's edge.
 *
 * ★ A SET-APART BLOCK INSIDE A PAPER BODY TAKES THE MUTED PANEL, `bg-muted/40`
 * between hairlines (marketing-content.md, the utility-page rhythm), which is
 * the band; the close's own `border-t` is its lower hairline.
 *
 * ★ THE DOWNLOAD IS A LINK, NEVER A BUTTON: About's close already wears the
 * outline CTA (See open roles) and the footer the page's one conversion, so a
 * third button within a screen would compete with both. It is /press's own
 * "Download all" link, glyph and size included.
 *
 * ★ THE PLATE GROUNDS ARE LITERAL, PressSheet's rule: white behind a mark
 * drawn in ink, the ink behind a mark drawn in white, never a theme utility.
 */

/** The usage line (his usage-note pick on press-page), the same words wherever a kit stays. */
const USAGE = "Use the marks as provided: no recoloring, no stretching.";

const INLINE_LINK =
  "underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

const PLATE_PAPER = "#ffffff";

function asset(id: string) {
  const found = PRESS_KIT.find((a) => a.id === id);
  if (!found) throw new Error(`PRESS_KIT is missing "${id}"`);
  return found;
}

/** The download, as /press draws its "Download all": the glyph, the words, the size. */
function KitDownload({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <a
      href={PRESS_KIT_ZIP}
      download
      className={cn(
        "mkt-learn inline-flex items-center gap-1.5 text-sm font-medium",
        INLINE_LINK,
        className,
      )}
    >
      <ArrowDown aria-hidden className="size-3.5 shrink-0" />
      {label} ({formatKitBytes(PRESS_KIT_BYTES)})
    </a>
  );
}

/**
 * FOUR PLATES IN THE REBATE, four different things: the mark on paper, the
 * mark on ink, the QR and the share card, drawn from the kit's own files and
 * alternating their grounds. Not the app icon: at this size it is the dark
 * chip again, a hair larger, and two near-twins would say the kit is thinner
 * than it is (PressSheet's own rule: never a grid of near-identical squares).
 * The rebate insets by the same `--gap-gallery` as its gaps, so it reads as
 * the album's hairline and not as a card grid.
 */
function KitPlates() {
  const markDark = asset("mark-dark");
  const markLight = asset("mark-light");
  const qr = asset("qr");
  const card = asset("share-card");
  return (
    <ul
      aria-label="In the kit"
      className="grid grid-cols-4 gap-[var(--gap-gallery)] rounded-tile bg-border p-[var(--gap-gallery)]"
    >
      <Plate ground={PLATE_PAPER}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static press asset previewing itself, press-sheet.tsx's own call. */}
        <img src={markDark.file} alt={markDark.label} className="size-[46%]" />
      </Plate>
      <Plate ground={BRAND_HEX}>
        {/* eslint-disable-next-line @next/next/no-img-element -- as above. */}
        <img src={markLight.file} alt={markLight.label} className="size-[46%]" />
      </Plate>
      <Plate ground={PLATE_PAPER}>
        {/* eslint-disable-next-line @next/next/no-img-element -- as above. */}
        <img src={qr.file} alt={qr.label} className="size-[62%]" />
      </Plate>
      {/* Contained on the ink, never cropped: the card is 1.9:1 and its lockup
          sits left, so a square crop would slice the mark off (PressSheet's
          frame 05 does the same). */}
      <Plate ground={BRAND_HEX}>
        <Image
          src={card.file}
          alt={card.label}
          fill
          sizes="120px"
          className="object-contain"
        />
      </Plate>
    </ul>
  );
}

function Plate({
  ground,
  children,
}: {
  ground: string;
  children: ReactNode;
}) {
  return (
    <li
      data-ap-plate
      style={{ background: ground }}
      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-tile"
    >
      {children}
    </li>
  );
}

/** The four facts a strip carries, read from the fact sheet's own rows (the array /llms-full.txt is built from). */
const FOUR = ["Founded", "How it works", "Guests need", "Pricing"] as const;

const FACTS = FOUR.map((label) => {
  const row = PRESS_FACTS.find((f) => f.label === label);
  if (!row) throw new Error(`PRESS_FACTS has no "${label}" row`);
  return row;
});

/** Four facts in one strip: two across in a hand, four at a desk. */
function FactStrip({
  inKit = false,
  className,
}: {
  /** Inside a kit: the strip is the facts' own block, and a hairline parts it from the kit above. */
  inKit?: boolean;
  className?: string;
}) {
  return (
    <dl
      data-ap-facts={inKit ? "" : undefined}
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 sm:gap-x-8",
        inKit && "border-t pt-6",
        className,
      )}
    >
      {FACTS.map(({ label, value }) => (
        <div key={label} data-ap-fact>
          <dt className="text-sm font-medium">{label}</dt>
          <dd
            className={cn(
              "mt-1 text-sm text-pretty text-muted-foreground",
              /^\d/.test(value) && "tabular-nums",
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * THE FOUR FACTS ON THEIR OWN, when no kit holds them: a quiet section after
 * the convictions, in the ledger's measure, before the close.
 */
export function FactsSection({ focus }: { focus: boolean }) {
  return (
    <SectionShell
      data-ap-facts=""
      data-ap-focus={focus ? "" : undefined}
      reveal="none"
      className="border-t py-14 sm:py-16"
      containerClassName="max-w-4xl"
    >
      <Eyebrow>At a glance</Eyebrow>
      <FactStrip className="mt-6" />
    </SectionShell>
  );
}

/**
 * THE WHOLE SHEET, ITS OWN CHAPTER: the ledger's header grammar (an eyebrow,
 * the heading at the page's `text-prose`, a lead) on the ledger's edge, then
 * production's PressSheet unedited, its eight plates and its own footnote, a
 * step wider (the measure note above).
 */
export function KitChapter({ facts }: { facts: boolean }) {
  return (
    <section
      id="press"
      data-ap-kit="chapter"
      data-ap-focus=""
      className="scroll-mt-[calc(var(--mkt-header-h)+1rem)] border-t py-20 sm:py-24"
    >
      <Container className="max-w-4xl">
        <div className="max-w-2xl">
          <Eyebrow>Press kit</Eyebrow>
          <h2 className="mt-4 font-heading text-prose text-balance">
            The brand files, ready to publish.
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            The marks, the app icon, the share card and a QR code, each on its
            own or all in one download. {USAGE}
          </p>
          <KitDownload label="Download all" className="mt-5" />
        </div>
      </Container>
      <Container className="mt-10 max-w-5xl sm:mt-12">
        <PressSheet />
      </Container>
      {facts ? (
        <Container className="max-w-4xl">
          <FactStrip inKit className="mt-12" />
        </Container>
      ) : null}
    </section>
  );
}

/**
 * A SHORT BAND BEFORE THE CLOSE: the muted panel, in the ledger's own split
 * (its `1fr / 1.15fr` columns, so the band's two sides line up under the rows
 * above), the words and the download on the left, four plates on the right.
 * In a hand it reads down: the words, the plates, then the download, so a
 * writer sees what is in the kit before taking it. Its heading sits a step
 * under the page's chapter headings: it is an appendix to the story, never a
 * third chapter of it.
 */
export function KitBand({ facts }: { facts: boolean }) {
  return (
    <section
      id="press"
      data-ap-kit="band"
      data-ap-focus=""
      className="scroll-mt-[calc(var(--mkt-header-h)+1rem)] border-t bg-muted/40 py-16 sm:py-20"
    >
      <Container className="max-w-4xl">
        <div className="grid gap-y-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-x-10 sm:gap-y-5">
          <div className="sm:col-start-1 sm:row-start-1 sm:self-end">
            <Eyebrow>Press kit</Eyebrow>
            <h2 className="mt-4 font-heading text-subhead text-balance">
              The brand files, ready to publish.
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              The mark, the app icon, the share card and a QR code, in one
              download. {USAGE}
            </p>
          </div>
          <div className="sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-center">
            <KitPlates />
          </div>
          <div className="sm:col-start-1 sm:row-start-2 sm:self-start">
            <KitDownload label="Download the kit" />
          </div>
        </div>
        {facts ? <FactStrip inKit className="mt-10 sm:mt-12" /> : null}
      </Container>
    </section>
  );
}

/**
 * ONE LINE IN THE CLOSE: under the careers button, past a short hairline, so
 * the close still asks one thing first. No plates: the zip is the kit.
 */
export function KitLine() {
  return (
    <p
      id="press"
      data-ap-kit="line"
      className="mt-6 w-full max-w-xl border-t pt-6 text-sm text-pretty text-muted-foreground"
    >
      Writing about Partyreel?{" "}
      <a
        href={PRESS_KIT_ZIP}
        download
        className={cn("font-medium text-foreground", INLINE_LINK)}
      >
        Download the press kit
      </a>{" "}
      ({formatKitBytes(PRESS_KIT_BYTES)}), with the marks, the app icon and a
      QR code. {USAGE}
    </p>
  );
}
