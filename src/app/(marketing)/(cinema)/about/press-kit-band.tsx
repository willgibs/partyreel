import { ArrowDown } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { ABOUT_PRESS_KIT } from "@/lib/constants/about";
import {
  formatKitBytes,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
} from "@/lib/constants/press";
import { BRAND_HEX } from "@/lib/constants/site";

/**
 * THE PRESS KIT BAND (about-press r1, `kit=band`): four plates, one download
 * and his usage line, on the muted panel between the six convictions and the
 * close. /press redirects here (`/about#press`), so a writer who comes for the
 * logo lands on this block, and the story still leads the page.
 *
 * ★ ABOUT'S MEASURE, NOT /press's. The convictions ledger reads in `max-w-4xl`,
 * so the band's words do too, in the ledger's own `1fr / 1.15fr` split: the
 * band's two sides line up under the rows above, and a block that started
 * somewhere else would read as another page's section pasted in. In a hand it
 * reads down: the words, the plates, then the download, so a writer sees what
 * is in the kit before taking it.
 *
 * ★ A SET-APART BLOCK INSIDE A PAPER BODY TAKES THE MUTED PANEL, `bg-muted/40`
 * between hairlines (marketing-content.md, the utility-page rhythm); the
 * close's own `border-t` is the band's lower hairline. Its heading sits a step
 * under the page's chapter headings: an appendix to the story, never a third
 * chapter of it.
 *
 * ★ THE DOWNLOAD IS A LINK, NEVER A BUTTON: the close already wears the outline
 * CTA (See open roles) and the footer the page's one conversion, so a third
 * button within a screen would compete with both.
 *
 * ★ FOUR DIFFERENT PLATES: the mark on paper, the mark on ink, the QR and the
 * share card, alternating their grounds. Not the app icon: at this size it is
 * the dark chip again, a hair larger, and two near-twins would say the kit is
 * thinner than it is (the old sheet's rule: never a grid of near-identical
 * squares). The rebate insets by the same `--gap-gallery` as its gaps, so it
 * reads as the album's hairline and not as a card grid.
 *
 * ★ THE PLATE GROUNDS ARE LITERAL: white behind a mark drawn in ink, the ink
 * behind a mark drawn in white, never a theme utility. A plate is the artwork's
 * own ground, and following a token flip hides the artwork.
 *
 * Every file and its size come from `PRESS_KIT` (`scripts/build-press-kit.mjs`
 * zips the same rows), so the day the v1 mark lands (ASSETS row 19) this block
 * changes by a files-and-rows edit and nothing here.
 */

const PLATE_PAPER = "#ffffff";

function asset(id: string) {
  const found = PRESS_KIT.find((a) => a.id === id);
  if (!found) throw new Error(`PRESS_KIT is missing "${id}"`);
  return found;
}

function Plate({ ground, children }: { ground: string; children: ReactNode }) {
  return (
    <li
      style={{ background: ground }}
      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-tile"
    >
      {children}
    </li>
  );
}

function KitPlates() {
  const markDark = asset("mark-dark");
  const markLight = asset("mark-light");
  const qr = asset("qr");
  const card = asset("share-card");
  return (
    <ul
      aria-label={ABOUT_PRESS_KIT.platesLabel}
      className="grid grid-cols-4 gap-[var(--gap-gallery)] rounded-tile bg-border p-[var(--gap-gallery)]"
    >
      <Plate ground={PLATE_PAPER}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static press asset previewing itself; the file wants no optimization pipeline (an SVG could not take one). */}
        <img
          src={markDark.file}
          alt={markDark.label}
          loading="lazy"
          decoding="async"
          className="size-[46%]"
        />
      </Plate>
      <Plate ground={BRAND_HEX}>
        {/* eslint-disable-next-line @next/next/no-img-element -- as above. */}
        <img
          src={markLight.file}
          alt={markLight.label}
          loading="lazy"
          decoding="async"
          className="size-[46%]"
        />
      </Plate>
      <Plate ground={PLATE_PAPER}>
        {/* eslint-disable-next-line @next/next/no-img-element -- as above. */}
        <img
          src={qr.file}
          alt={qr.label}
          loading="lazy"
          decoding="async"
          className="size-[62%]"
        />
      </Plate>
      {/* Contained on the ink, never cropped: the card is 1.9:1 and its lockup
          sits left, so a square crop would slice the mark off. */}
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

export function PressKitBand() {
  return (
    <section
      id={ABOUT_PRESS_KIT.id}
      aria-labelledby="press-kit-heading"
      className="scroll-mt-[calc(var(--mkt-header-h)+1rem)] border-t bg-muted/40 py-16 sm:py-20"
    >
      <Container className="max-w-4xl">
        <div className="grid gap-y-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-x-10 sm:gap-y-5">
          <div className="sm:col-start-1 sm:row-start-1 sm:self-end">
            <Eyebrow>{ABOUT_PRESS_KIT.eyebrow}</Eyebrow>
            <h2
              id="press-kit-heading"
              className="mt-4 font-heading text-subhead text-balance"
            >
              {ABOUT_PRESS_KIT.heading}
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              {ABOUT_PRESS_KIT.body} {ABOUT_PRESS_KIT.usage}
            </p>
          </div>
          <div className="sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-center">
            <KitPlates />
          </div>
          <div className="sm:col-start-1 sm:row-start-2 sm:self-start">
            <a
              href={PRESS_KIT_ZIP}
              download
              className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
            >
              <ArrowDown aria-hidden className="size-3.5 shrink-0" />
              {`${ABOUT_PRESS_KIT.downloadLabel} (${formatKitBytes(PRESS_KIT_BYTES)})`}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
