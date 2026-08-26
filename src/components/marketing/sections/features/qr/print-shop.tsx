import type { CSSProperties } from "react";

import { StyledQr } from "@/components/app/styled-qr";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";

/**
 * /features/qr paper section 1: THE PRINT SHOP. Two physical artifacts (a
 * table card and a poster corner) mocked as white print stock on the paper
 * chapter, plus the download truth (PNG or SVG) and the help center's
 * test-scan tip as a mono note. Print mocks stay achromatic ink-on-white (the
 * scanner-safest pairing, per qr-presets.ts); shadow-float is the paper
 * theme's real elevation, so the pieces read as stock laid on the desk.
 */

const QR_VALUE = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

export function PrintShop() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit media={<PrintMocks />}>
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Print it</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            It was made to be printed.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Download the code as SVG (best for print) or PNG (best for screens)
            and drop it onto table cards, a welcome sign, or the program. The
            SVG stays razor sharp at any size, from a place card to a poster.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            However far you scale it, the code itself never changes: same link,
            same album, every copy.
          </p>
          <MonoCaption {...rise(4)}>
            Tip: test-scan with your own phone before you print a hundred.
          </MonoCaption>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}

/** The stock on the desk: a poster corner behind, the table card in front. */
function PrintMocks() {
  return (
    <Reveal
      aria-hidden
      className="relative mx-auto flex min-h-[21rem] w-full max-w-md items-center justify-center py-6"
    >
      {/* The poster corner: cropped by its own frame, big type first. */}
      <div
        data-mkt-reveal
        className="absolute top-0 left-0 w-64 rotate-1 overflow-hidden rounded-lg border bg-white p-6 pb-10 text-neutral-900 shadow-[var(--shadow-float)] sm:w-72"
        style={{ "--i": 0 } as CSSProperties}
      >
        <p className="font-heading text-3xl leading-tight text-balance">
          Add your photos
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Scan the code. No app, no account.
        </p>
        <div className="mt-5 w-fit rounded-md bg-white">
          <StyledQr
            value={QR_VALUE}
            size={88}
            style={resolveQrPreset("classic")}
          />
        </div>
      </div>

      {/* The table card, laid over the poster's lower corner (never its copy). */}
      <div
        data-mkt-reveal
        className="relative mt-32 ml-24 w-52 -rotate-3 rounded-lg border bg-white p-5 text-center text-neutral-900 shadow-[var(--shadow-float)] sm:mt-28 sm:ml-48"
        style={{ "--i": 1 } as CSSProperties}
      >
        <div className="mx-auto w-fit rounded-md bg-white">
          <StyledQr
            value={QR_VALUE}
            size={116}
            style={resolveQrPreset("classic")}
          />
        </div>
        <p className="mt-3 font-heading text-base">Scan to add your photos</p>
        <p className="mt-1 font-mono text-[11px] tracking-wide text-neutral-500">
          Maya &amp; Jay&rsquo;s Wedding
        </p>
      </div>
    </Reveal>
  );
}
