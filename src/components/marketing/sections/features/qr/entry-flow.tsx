import { Camera, Images, ImageUp } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";

/** The three shots mid-upload in card 03 (the third is the in-flight one). */
const UPLOADING_IDS = ["wedding-toast", "party-balloons", "reception-table"];

/**
 * /features/qr dark close, part 1: THE ENTRY FLOW. Three mini frames of what a
 * guest actually sees after the scan, quoting the shipped entry modal's exact
 * strings ("You're invited to" / "Add your photos and videos in seconds. No
 * app required." / the album line) and the uploader's "Add photos &
 * videos" control, stylized to marketing. Fixture family: Maya & Jay.
 */

export function EntryFlow() {
  // ONE motion voice per section (R4): the header and the three frames share
  // the register. Since the feature-pages round that register is the CUT,
  // because this is the close chapter's OPENER: the first dark section after
  // the paper, a tier up with real air, so the lights come back down on the
  // guest's phone; the doors, FAQ and CTA ramp down after it.
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i + 3 } as CSSProperties,
  });

  return (
    <SectionShell
      eyebrow="After the scan"
      heading="What a guest sees."
      subhead="Camera roll to album in under a minute, and nothing to install on the way."
      scale="lg"
      reveal="cinema"
      className="pt-28 sm:pt-36"
    >
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {/* 01 · The welcome. R4 / review B10: this card used to stop a third of
            the way down and leave the rest empty. It carries the modal's whole
            resting state — byline avatar and the primary — all strings the
            shipped entry modal actually renders.

            ★ ONE PRIMARY, AND IT SAYS "Continue" (Will, 2026-09-21, "the door as three steps":
            "No exit"). The card used to draw two exits the sheet no longer has: "View the album"
            as the primary and a ghost "Just browsing" under it. There is always a step behind the
            welcome now. */}
        <div {...cut(0)} className="flex flex-col gap-3">
          <StepLabel n="01" label="The welcome" />
          <div className="flex flex-1 flex-col rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              You&rsquo;re invited to
            </p>
            <p className="mt-1.5 font-heading text-xl leading-tight text-balance">
              Maya &amp; Jay&rsquo;s Wedding
            </p>
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="grid size-5 place-items-center rounded-full bg-muted text-[9px] font-medium text-foreground">
                M
              </span>
              Hosted by{" "}
              <span className="font-medium text-foreground">Maya</span>
            </p>
            <span className="mt-auto flex h-9 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
              Continue
            </span>
          </div>
        </div>

        {/* 02 · The promise. */}
        <div {...cut(1)} className="flex flex-col gap-3">
          <StepLabel n="02" label="The promise" />
          <div className="flex flex-1 flex-col gap-3.5 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Camera className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Add your photos and videos in seconds. No app required.
            </p>
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Images className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Everyone&rsquo;s shots land in one album, yours included.
            </p>
          </div>
        </div>

        {/* 03 · The upload. */}
        <div {...cut(2)} className="flex flex-col gap-3">
          <StepLabel n="03" label="The upload" />
          <div className="flex flex-1 flex-col gap-3 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
            <span className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-dashed text-sm font-medium text-muted-foreground">
              <ImageUp className="size-4" />
              Add photos &amp; videos
            </span>
            {/* R4 / review B10: these were three EMPTY grey rectangles under a
                heading about uploading photos. They are the guest's actual
                camera roll now (manifest fixtures), so the card shows shots
                landing rather than placeholders. */}
            <div className="grid grid-cols-3 gap-1.5">
              {UPLOADING_IDS.map((id, i) => (
                <span
                  key={id}
                  className="relative aspect-square overflow-hidden rounded-tile bg-muted"
                >
                  <Image
                    src={marketingImage(id).src}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 92px, 28vw"
                    className={`object-cover ${i === 2 ? "opacity-60" : ""}`}
                  />
                  {/* The in-flight shot: the thin progress strip the guest
                      uploader shows over an uploading tile. */}
                  {i === 2 && (
                    <span className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-black/40">
                      <span className="block h-full w-[70%] rounded-full bg-white/90" />
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-[11px] tracking-wide text-muted-foreground tabular-nums">
              Uploading 3 · full quality
            </p>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

function StepLabel({ n, label }: { n: string; label: string }) {
  return (
    <p className="text-xs tracking-wide text-muted-foreground tabular-nums">
      {n} · {label}
    </p>
  );
}
