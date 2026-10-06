import { Check, Download, FolderDown, ImageDown, Wand2 } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  MARKETING_REELS,
  marketingImage,
} from "@/lib/constants/marketing-media";
import { saveHints, setNoun, type TakeHomeSizes } from "@/lib/export/take-home";

import { TAKE_HOME } from "./album-copy";

/**
 * EVERYONE LEAVES WITH EVERYTHING: three EQUAL photographic plates (the door
 * anatomy, no lamp), each carrying the real control the app draws: the Save
 * pill on a full-screen shot, the guest's take-home over the album (Select,
 * every tile picked, then Save's quick choice: `guest/live-gallery-save.tsx`'s
 * two rows, their sizes in the product's own words through `saveHints`, which
 * mock-parity pins), and the reel's frame under the violet Make your own that
 * starts a clip (reel/live-reel-view.tsx's one primary, its label pinned by
 * mock-parity). Hover lifts the photograph a touch and swaps the pill's icon to
 * a check (the icon-swap recipe), so "leaves with" is felt rather than read.
 * Below lg the plates go 2 + 1, never three 170px columns.
 */

const ALBUM_TILES = [
  "wedding-golden",
  "party-balloons",
  "reception-table",
  "wedding-toast",
  "party-dj",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "wedding-arch",
];

const MB = 1024 * 1024;
/** Every tile picked (her All): 216 photographs and 12 clips, as the server would size them. */
const PICKED: TakeHomeSizes = {
  photos: 216,
  clips: 12,
  original: 1338 * MB,
  phone: 452 * MB,
  photosPhone: 134 * MB,
  clipBytes: 318 * MB,
};

function Plate({
  index,
  title,
  body,
  children,
}: {
  index: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div
      data-mkt-reveal
      className="group flex w-full flex-col gap-4 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
      style={{ "--i": 3 + index } as CSSProperties}
    >
      <div
        aria-hidden
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
      >
        {children}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="font-heading text-subsection">{title}</h3>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}

/** The app's white-on-media pill, with the Download → Check icon swap on hover. */
function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
      <span className="mkt-icon-swap group-hover:[&>.mkt-icon[data-icon=b]]:blur-0 group-hover:[&>.mkt-icon[data-icon=a]]:opacity-0 group-hover:[&>.mkt-icon[data-icon=b]]:opacity-100">
        <span className="mkt-icon" data-icon="a">
          <Download className="size-3.5" />
        </span>
        <span className="mkt-icon" data-icon="b">
          <Check className="size-3.5" />
        </span>
      </span>
      {label}
    </span>
  );
}

/**
 * SAVE'S QUICK CHOICE, rising over her picks: the title names what she picked and each row its size, in the words
 * `live-gallery-save.tsx` gives them (`setNoun`, `saveHints`), so a reader sees Photos is light and the originals
 * whole.
 */
function SaveChoice({ sizes }: { sizes: TakeHomeSizes }) {
  const hints = saveHints(sizes);
  const rows = [
    { Icon: ImageDown, label: "Save to Photos", hint: hints.photos },
    { Icon: FolderDown, label: "Save to Files", hint: hints.originals },
  ];
  return (
    <span className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-layer">
      <span className="px-2 pt-1 pb-1 font-heading text-sm">
        Save {setNoun(sizes.photos, sizes.clips)}
      </span>
      {rows.map(({ Icon, label, hint }) => (
        <span
          key={label}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
        >
          <Icon className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <span className="shrink-0 text-micro text-muted-foreground tabular-nums">
            {hint}
          </span>
        </span>
      ))}
    </span>
  );
}

const LIFT =
  "object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

export function TakeHomeSection() {
  const reel = MARKETING_REELS.find((r) => r.id === "hero-candidate-02");
  if (!reel) throw new Error("Unknown marketing reel id: hero-candidate-02");
  const [save, all, clip] = TAKE_HOME.plates;

  return (
    <SectionShell
      eyebrow="Taking it home"
      heading="Everyone leaves with everything."
      subhead={TAKE_HOME.subhead}
    >
      <Reveal className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-6">
        <Plate index={0} title={save.title} body={save.body}>
          <Image
            src={marketingImage("wedding-petals").src}
            alt=""
            fill
            sizes="(min-width: 1024px) 340px, 50vw"
            className={LIFT}
          />
          <span className="absolute right-3 bottom-3">
            <Pill label="Save" />
          </span>
        </Plate>

        <Plate index={1} title={all.title} body={all.body}>
          <span className="absolute inset-0 grid grid-cols-3 gap-[var(--gap-gallery)] bg-black p-[var(--gap-gallery)]">
            {ALBUM_TILES.map((id) => (
              <span
                key={id}
                className="relative block overflow-hidden rounded-tile"
              >
                <Image
                  src={marketingImage(id).src}
                  alt=""
                  fill
                  sizes="110px"
                  className={LIFT}
                />
                {/* Picked: the album tile's own selection marks, the dim and the check. */}
                <span className="absolute inset-0 bg-black/40" />
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-white">
                  <Check className="size-3" />
                </span>
              </span>
            ))}
          </span>
          <SaveChoice sizes={PICKED} />
        </Plate>

        <Plate index={2} title={clip.title} body={clip.body}>
          <Image
            src={reel.poster}
            alt=""
            fill
            sizes="(min-width: 1024px) 340px, 50vw"
            className={LIFT}
          />
          <span className="absolute inset-x-0 bottom-3 flex justify-center">
            <span className="inline-flex h-9 items-center gap-2 rounded-full bg-reel px-4 text-xs font-semibold text-white">
              <Wand2 className="size-3.5" /> Make your own
            </span>
          </span>
        </Plate>
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
