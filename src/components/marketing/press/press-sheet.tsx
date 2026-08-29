import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { CopyButton } from "@/components/marketing/press/copy-button";
import { Reveal } from "@/components/marketing/system/reveal";
import { PRESS_KIT, type PressKitAsset } from "@/lib/constants/press";
import { BRAND_HEX } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * THE SHEET: the press kit as a photographic contact sheet (ruled by Will 2026-08-28
 * over the specimen-sheet alternative, "focusing press around the assets and quick hit
 * points"; the explored range is at /design/c/press-identity).
 *
 * ★ THE FRAMES ARE NOT ALL THE SAME KIND OF THING, and that is the whole idea: artwork,
 * an app icon, a share card, a working code, the ink, the type. A contact sheet is
 * everything the roll caught, indexed in one field; eight near-identical logo squares
 * would be a downloads table wearing a metaphor. Do not "tidy" it into uniform tiles.
 *
 * ★ EVERY FRAME IS OURS. The first cut used two stock event photos and Will pulled them
 * ("just feels weird to say here's a random stock photo"), which was right twice over: a
 * press page should not hand a publisher media whose rights we do not hold, and the
 * licence caveat that honesty required read as unfinished. Everything on the sheet is now
 * Partyreel artwork, which also collapsed a whole provenance block into one clear line.
 *
 * ★ THE 3px GAP IS THE TELL. gap-[var(--gap-gallery)] is the site's ONE media-grid gap,
 * so the sheet reads as a Partyreel album at a glance. A comfortable gap-4 turns it into
 * a card grid and throws away the cheapest identity move on the page.
 *
 * ★ PLATE BY LEGIBILITY, NEVER BY VARIETY: white behind anything drawn in ink, ink behind
 * anything drawn in white. The bare mark is a #101010 stroke and was briefly on a
 * translucent-white plate, which resolves to dark grey on ink and all but erased it.
 *
 * Two mechanics, documented at their source: the sheet EXPOSES (frames land in index
 * order as hard film cuts, marketing.css [data-mkt-cut]) and the light-table ISOLATE
 * (pointing at one steps the others back, [data-mkt-isolate]). ★ The cut sits on an INNER
 * layer, never on the isolate item: a filling animation outranks every author declaration,
 * so a frame carrying both would be pinned at the cut's final opacity and the dim would
 * silently never apply.
 */

/** Group the manifest by label, since a press page thinks in ASSETS while PRESS_KIT
 *  stores one row per FILE (the zip builder needs the per-file shape). */
function byLabel(...ids: string[]): PressKitAsset[] {
  return ids.map((id) => {
    const found = PRESS_KIT.find((a) => a.id === id);
    if (!found) throw new Error(`PRESS_KIT is missing "${id}"`);
    return found;
  });
}

function Frame({
  index,
  plate,
  onDark = false,
  label,
  actions,
  children,
}: {
  index: number;
  plate: string;
  /** True when the plate is ink, so the frame index flips to a light tone. */
  onDark?: boolean;
  label: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li
      data-mkt-isolate-item
      className="relative flex flex-col overflow-hidden rounded-tile"
    >
      {/* The entrance lives on this inner layer, never on the isolate item above. */}
      <div
        data-mkt-cut
        style={{ "--i": index } as CSSProperties}
        className="flex flex-col"
      >
        <div
          className={cn(
            "relative flex aspect-square items-center justify-center",
            plate,
          )}
        >
          {/* Mono earns its place here and almost nowhere else on the sheet: the index is
              a NUMBER in a column of numbers, so tabular figures keep it aligned.
              ★ An explicit tone per plate, NOT mix-blend-difference. The blend was fine on
              the old ink ground but the sheet now sits on paper, where a 55%-alpha ink
              glyph composites to mid-grey and then differences against white into
              near-invisibility. The plates are literal artwork grounds, so the index
              matches them literally. */}
          <span
            className={cn(
              "absolute top-2 left-2 font-mono text-[10px] tracking-wider",
              onDark ? "text-white/45" : "text-black/40",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {children}
        </div>
        {/* Stacked below sm: at 375px a two-column sheet leaves ~50px of caption
            beside the chips, which truncated "Mark, dark chip" to "Mark…" and threw
            away the one thing that says WHICH file you are taking. Label, then actions. */}
        <div className="flex min-h-11 flex-col items-start gap-1.5 bg-muted px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
          <span className="max-w-full truncate text-xs text-muted-foreground">
            {label}
          </span>
          {actions && (
            <span className="flex gap-1.5 sm:ml-auto">{actions}</span>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * A download, styled as a real button rather than a bare word. Will's note on the first
 * cut: the formats "look like a list of file types" instead of something to press.
 * --gallery-border is 2.49:1 and decoration only, so the boundary rides --foreground.
 */
function DownloadChip({ asset }: { asset: PressKitAsset }) {
  return (
    <a
      href={asset.file}
      download
      aria-label={`Download ${asset.label}, ${asset.format.toUpperCase()}`}
      className="inline-flex items-center rounded-action-sm border border-foreground/25 px-2 py-1 text-[11px] font-medium text-foreground/80 transition-[color,border-color,background-color,transform] duration-150 ease-[var(--ease-emphasis)] hover:border-foreground/50 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]"
    >
      {asset.format.toUpperCase()}
    </a>
  );
}

export function PressSheet() {
  const [markDark, markDarkPng] = byLabel("mark-dark", "mark-dark-png");
  const [markLight, markLightPng] = byLabel("mark-light", "mark-light-png");
  const [markMono, markMonoPng] = byLabel("mark-mono", "mark-mono-png");
  const [appIcon] = byLabel("app-icon");
  const [shareCard] = byLabel("share-card");
  const [qr, qrPng] = byLabel("qr", "qr-png");

  return (
    <Reveal>
      {/* ★ THE REBATE. On the ink ground the 3px --gap-gallery read on its own; on paper,
          white plates against a near-white page made the grid dissolve. The list paints
          --border so the gaps become hairlines: how frames sit in the rebate of real film.
          ★ The outer inset and the inner gap are the SAME token on purpose. A 1px border
          against 3px gaps read as an uneven frame (Will); a rebate is even all round or it
          is not a rebate. Change one and change the other, and keep both on
          --gap-gallery — that 3px is the album tell. */}
      <ul
        data-mkt-isolate
        className="grid grid-cols-2 gap-[var(--gap-gallery)] rounded-tile bg-border p-[var(--gap-gallery)] sm:grid-cols-4"
      >
        <Frame
          index={0}
          plate="bg-white"
          label="Mark, dark chip"
          actions={
            <>
              <DownloadChip asset={markDark} />
              <DownloadChip asset={markDarkPng} />
            </>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a static press asset
                previewing itself; the downloadable file wants no optimization pipeline. */}
          <img src={markDark.file} alt="" className="size-[46%]" />
        </Frame>

        <Frame
          index={1}
          plate="bg-[#101010]"
          onDark
          label="Mark, light chip"
          actions={
            <>
              <DownloadChip asset={markLight} />
              <DownloadChip asset={markLightPng} />
            </>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static press asset. */}
          <img src={markLight.file} alt="" className="size-[46%]" />
        </Frame>

        <Frame
          index={2}
          plate="bg-white"
          label="Bare mark"
          actions={
            <>
              <DownloadChip asset={markMono} />
              <DownloadChip asset={markMonoPng} />
            </>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static press asset. */}
          <img src={markMono.file} alt="" className="size-[46%]" />
        </Frame>

        <Frame
          index={3}
          plate="bg-white"
          label="App icon"
          actions={<DownloadChip asset={appIcon} />}
        >
          <Image
            src={appIcon.file}
            alt=""
            width={512}
            height={512}
            className="size-[54%] rounded-[18%]"
          />
        </Frame>

        {/* object-contain on an ink plate, NOT cover: the card is 1.9:1 and its
              content is left-aligned, so a square crop would slice the mark off. No
              padding either, so it spans the full frame width; the letterbox bands are
              invisible because the card's own ground is the same ink as the plate. */}
        <Frame
          index={4}
          plate="bg-[#101010]"
          onDark
          label="Share card"
          actions={<DownloadChip asset={shareCard} />}
        >
          <Image
            src={shareCard.file}
            alt=""
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-contain"
          />
        </Frame>

        <Frame
          index={5}
          plate="bg-white"
          label="The QR code"
          actions={
            <>
              <DownloadChip asset={qr} />
              <DownloadChip asset={qrPng} />
            </>
          }
        >
          <Image
            src={qr.file}
            alt=""
            width={512}
            height={512}
            className="size-[62%]"
          />
        </Frame>

        <Frame
          index={6}
          plate="bg-white"
          label="Ink"
          actions={
            <CopyButton
              value={BRAND_HEX}
              label="Copy the ink hex"
              display={<span className="font-mono">{BRAND_HEX}</span>}
              className="border-foreground/25 px-2 py-1 text-[11px] text-foreground/80 hover:border-foreground/50 hover:text-foreground"
            />
          }
        >
          <span className="size-[46%] bg-[#101010]" />
        </Frame>

        {/* The one frame that is not a file: a designer laying out a piece needs the FACE,
            and the honest way to hand that over is a pointer to the open-source family
            rather than shipping font binaries in a press kit. */}
        <Frame
          index={7}
          plate="bg-white"
          label="Type: Urbanist 700"
          actions={
            <a
              href="https://fonts.google.com/specimen/Urbanist"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-action-sm border border-foreground/25 px-2 py-1 text-[11px] font-medium text-foreground/80 transition-[color,border-color,background-color,transform] duration-150 ease-[var(--ease-emphasis)] hover:border-foreground/50 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]"
            >
              Get it
            </a>
          }
        >
          <span className="font-heading text-6xl text-[#101010]">Aa</span>
        </Frame>
      </ul>

      {/* A footnote, not a paragraph: it qualifies the grid above rather than competing
          with it, so it sits a step down in both size and tone. */}
      <p className="mt-5 max-w-2xl text-xs text-pretty text-muted-foreground/75">
        Everything here is Partyreel artwork, free to use in coverage as it
        ships. If a file needs editing to work in your layout, write instead and
        we will make the one you need.
      </p>
    </Reveal>
  );
}
