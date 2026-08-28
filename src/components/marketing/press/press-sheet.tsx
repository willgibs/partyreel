import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { marketingImage } from "@/lib/constants/marketing-media";
import { PRESS_KIT, type PressKitAsset } from "@/lib/constants/press";
import { BRAND_HEX, SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE SHEET: the press kit as a photographic contact sheet (ruled by Will 2026-08-28
 * over the specimen-sheet alternative, "focusing press around the assets and quick hit
 * points"; the explored range is at /design/c/press-identity).
 *
 * ★ THE FRAMES ARE NOT ALL THE SAME KIND OF THING, and that is the whole idea. Three
 * marks, the ink, the type, a working code, two rooms. A contact sheet is everything the
 * roll caught, indexed in one field; six near-identical logo squares would be a downloads
 * table wearing a metaphor. Do not "tidy" this into a uniform grid of marks.
 *
 * ★ THE 3px GAP IS THE TELL. gap-[var(--gap-gallery)] is the site's ONE media-grid gap,
 * so the sheet reads as a Partyreel album at a glance. A comfortable gap-4 turns it into
 * a card grid and throws away the cheapest identity move on the page.
 *
 * Two mechanics, both documented at their source:
 *  - The sheet EXPOSES: frames land in index order as hard film cuts ([data-mkt-cut]),
 *    not fades, left to right like a sheet being exposed.
 *  - The light-table ISOLATE: pointing at one frame steps the others back
 *    ([data-mkt-isolate] in marketing.css, promoted from the lab in this round).
 *
 * ★ The cut sits on an INNER layer, never on the isolate item. A filling animation
 * outranks every author declaration, so a frame carrying both would be pinned at the
 * cut's final opacity and the dim would silently never apply. See marketing.css.
 *
 * NO STRADDLE HERE, deliberately. The paper-to-ink plane change is already the hard cut,
 * and pulling the grid across the seam would leave half a row of DOWNLOADABLE assets
 * floating on paper: decoration fighting utility on a page whose whole job is "find the
 * file, get the file". A timid straddle is worse than none.
 */

/** The three marks, each carrying both of its formats. PRESS_KIT stores one row per FILE
 *  (the zip builder needs that); a press page thinks in marks, not files. */
function pressMarks(): { label: string; files: PressKitAsset[] }[] {
  const byLabel = new Map<string, { label: string; files: PressKitAsset[] }>();
  for (const asset of PRESS_KIT) {
    const found = byLabel.get(asset.label);
    if (found) found.files.push(asset);
    else byLabel.set(asset.label, { label: asset.label, files: [asset] });
  }
  return [...byLabel.values()];
}

/** The two rooms. Deliberately NOT in the kit: their provenance is unverified, and a
 *  press page must not hand a publisher media we cannot grant rights to. */
const ROOMS = ["wedding-toast", "party-balloons"] as const;

/** A plate per mark, each chosen so THAT mark is legible on it: the dark chip needs
 *  white, the light chip needs ink, and the bare mark is a #101010 stroke, so it needs a
 *  light ground (a translucent-white plate on ink is a dark grey; the mark vanished). */
const MARK_PLATES = ["bg-white", "bg-[#101010]", "bg-white/70"];

function Frame({
  index,
  plate,
  caption,
  children,
}: {
  index: number;
  plate: string;
  caption: ReactNode;
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
          <span className="absolute top-2 left-2 font-mono text-[10px] tracking-wider text-foreground/55 mix-blend-difference">
            {String(index + 1).padStart(2, "0")}
          </span>
          {children}
        </div>
        <div className="flex min-h-9 items-center gap-2 bg-foreground/8 px-2.5 py-2 font-mono text-[10px] tracking-wide">
          {caption}
        </div>
      </div>
    </li>
  );
}

/** A download in the sheet's own language: on a real contact sheet the frame number IS
 *  how you order the print. --gallery-border is 2.49:1 and decoration only, so a control
 *  boundary here rides --foreground instead. */
function FrameLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="rounded-[2px] px-1 py-0.5 text-foreground/70 transition-colors duration-150 ease-[var(--ease-emphasis)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {label}
    </a>
  );
}

export function PressSheet() {
  const marks = pressMarks();
  // Never a dead QR (the DemoCtaLink contract): with no demo event configured the code
  // would encode the marketing site the reader is already on, so it falls back to the
  // page a journalist would actually want in print.
  const qrValue = DEMO_EVENT_URL ?? `${SITE_URL}/press`;

  return (
    <Reveal>
      <Container className="py-14 sm:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b pb-3 font-mono text-[11px] tracking-wide text-muted-foreground">
          <span className="text-foreground">THE SHEET</span>
          <span>
            8 frames. The marks, the ink, the type, a code, two rooms.
          </span>
        </div>

        <ul
          data-mkt-isolate
          className="mt-4 grid grid-cols-2 gap-[var(--gap-gallery)] sm:grid-cols-4"
        >
          {marks.map((mark, i) => (
            <Frame
              key={mark.label}
              index={i}
              plate={MARK_PLATES[i]}
              caption={
                <>
                  <span className="truncate text-foreground/50">
                    {mark.label}
                  </span>
                  <span className="ml-auto flex gap-1">
                    {mark.files.map((file) => (
                      <FrameLink
                        key={file.id}
                        href={file.file}
                        label={file.format.toUpperCase()}
                      />
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

          {/* On WHITE, not ink: an ink swatch on an ink sheet reads as a hole in the
              grid, and the marks are genuinely drawn in #101010 ON white. */}
          <Frame
            index={3}
            plate="bg-white"
            caption={
              <>
                <span className="text-foreground/50">Ink</span>
                <span className="ml-auto text-foreground/70">{BRAND_HEX}</span>
              </>
            }
          >
            <span className="flex size-[46%] items-center justify-center bg-[#101010] font-mono text-[10px] tracking-widest text-white/50">
              {BRAND_HEX}
            </span>
          </Frame>

          <Frame
            index={4}
            plate="bg-white"
            caption={
              <>
                <span className="text-foreground/50">Type</span>
                <span className="ml-auto text-foreground/70">Urbanist 700</span>
              </>
            }
          >
            <span className="font-heading text-6xl text-[#101010]">Aa</span>
          </Frame>

          {/* The one press asset that works in a journalist's OWN medium: a printed code
              on a page is the product demonstrating itself. Server-rendered, zero JS. */}
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
            <FooterQr value={qrValue} size={96} />
          </Frame>

          {ROOMS.map((id, i) => {
            const image = marketingImage(id);
            return (
              <Frame
                key={id}
                index={6 + i}
                plate="bg-black"
                caption={
                  <>
                    <span className="truncate text-foreground/50">
                      {image.subject}
                    </span>
                    <span className="ml-auto shrink-0 text-foreground/70">
                      On request
                    </span>
                  </>
                }
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover"
                />
              </Frame>
            );
          })}
        </ul>

        {/* THE CREDIT LINE. Provenance, not social proof, so it clears the claims fence,
            and it is the most practically useful thing a press kit can carry: nobody can
            publish an image whose licence they cannot see. It also states the media gap
            honestly instead of hiding it. */}
        <div className="mt-6 border-t pt-4">
          <p className="font-mono text-[11px] tracking-wide text-foreground">
            EVERY FRAME, WITH ITS LICENCE
          </p>
          <dl className="mt-3 grid gap-x-10 gap-y-2 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
            <div className="flex gap-3">
              <dt className="shrink-0 text-foreground/50">01-05</dt>
              <dd>Partyreel artwork. Free to use in coverage, unaltered.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="shrink-0 text-foreground/50">06</dt>
              <dd>Generated code. Free to print or embed.</dd>
            </div>
            {ROOMS.map((id, i) => (
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
      </Container>
    </Reveal>
  );
}

/** The manifest's licence strings are deliberately blunt ("unsplash (per lab-pack
 *  comment; provenance unverified)"). Render the same facts as a sentence: the honesty is
 *  the point, the raw punctuation is not. */
function tidyLicence(licence: string): string {
  const source = licence.split(" (")[0];
  const unverified = /unverified/i.test(licence);
  return `${source.charAt(0).toUpperCase()}${source.slice(1)}${
    unverified ? ", provenance unverified." : "."
  }`;
}
