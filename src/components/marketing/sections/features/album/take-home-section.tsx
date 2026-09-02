import {
  Download,
  Image as ImageIcon,
  Layers,
  Play,
  Video,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  MARKETING_REELS,
  marketingImage,
} from "@/lib/constants/marketing-media";
import { MAX_EXPORT_ITEMS } from "@/lib/export/build-manifest";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";

/**
 * EVERYONE LEAVES WITH EVERYTHING: the three ways the album comes back out,
 * each as the control the app actually draws. Save (the lightbox pill, the
 * original file). Download album (the export dialog's three chips; the item
 * cap is the only limit worth stating, and the byte cap stays unmarketed by
 * the sharing page's precedent). The reel, which lands in the album the
 * moment you publish it and becomes the album's hero once uploads close.
 */

const EXPORT_CHIPS = [
  { label: "Everything", Icon: Layers, active: true },
  { label: "Photos", Icon: ImageIcon, active: false },
  { label: "Videos", Icon: Video, active: false },
];

function Card({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        aria-hidden
        className="flex min-h-[10.5rem] flex-col justify-center rounded-2xl border bg-card p-4 ring-1 ring-foreground/5"
      >
        {children}
      </div>
      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-heading text-base sm:text-lg">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export function TakeHomeSection() {
  const reel = MARKETING_REELS.find((r) => r.id === "hero-candidate-02");
  if (!reel) throw new Error("Unknown marketing reel id: hero-candidate-02");
  const styleLabel = resolveStyleEntry(reel.recipe.styleId).label;

  return (
    <SectionShell
      eyebrow="Taking it home"
      heading="Everyone leaves with everything."
      subhead="The album is the share. Anyone who can open it can save one shot, take the whole thing, and watch the reel."
    >
      <Reveal className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-3">
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <Card
            title="Save one, the original"
            body="Every photo opens full screen. Save hands back the file that was uploaded, at the size it was shot."
          >
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={marketingImage("wedding-petals").src}
                alt=""
                fill
                sizes="300px"
                className="object-cover"
              />
              <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Download className="size-3" /> Save
              </span>
            </span>
          </Card>
        </div>

        <div data-mkt-reveal style={{ "--i": 4 } as CSSProperties}>
          <Card
            title="Or take all of it"
            body={`Download album bundles the originals into one zip: everything, photos only, or videos only, up to ${MAX_EXPORT_ITEMS.toLocaleString("en-US")} items at a time.`}
          >
            <p className="text-sm font-medium">Download album</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXPORT_CHIPS.map(({ label, Icon, active }) => (
                <span
                  key={label}
                  className={
                    active
                      ? "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium text-foreground ring-1 ring-foreground/40"
                      : "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  <Icon className="size-3" />
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <MonoCaption>214 photos · 12 videos</MonoCaption>
              <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-medium text-primary-foreground">
                <Download className="size-3" /> Download
              </span>
            </div>
          </Card>
        </div>

        <div data-mkt-reveal style={{ "--i": 5 } as CSSProperties}>
          <Card
            title="And the reel, when it's ready"
            body="Publish the highlight reel and it appears in the album for everyone. Once uploads close, it takes the top of the page."
          >
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={reel.poster}
                alt=""
                fill
                sizes="300px"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Play className="ml-0.5 size-4 fill-white text-white" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-2.5">
                <span className="block text-[9px] font-medium tracking-[0.14em] text-white/70 uppercase">
                  The reel
                </span>
                <span className="block font-mono text-[10px] text-white/85">
                  0:47 · {styleLabel} · 18 moments
                </span>
              </span>
            </span>
          </Card>
        </div>
      </Reveal>
      <Reveal className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <div data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          <LearnMoreLink href="/features/sharing">
            Sharing and downloads, in depth
          </LearnMoreLink>
        </div>
        <div data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
          <LearnMoreLink href="/reel">Meet the reel</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
