import { EyeOff, Trash2, Undo2, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  binCountdownLabel,
  RECENTLY_DELETED_WINDOW_DAYS,
} from "@/lib/lifecycle/recently-deleted";

/**
 * Curation page section 4: the reversibility trio (hide / remove / restore)
 * beside a Trash mock. The countdown chips render from the REAL
 * binCountdownLabel + RECENTLY_DELETED_WINDOW_DAYS single sources, and the
 * permanent-delete confirm quotes recently-deleted-grid.tsx verbatim, so the
 * marketing claim can never drift from the shipped lifecycle.
 */

const TRIO: { icon: LucideIcon; tint: string; title: string; body: string }[] =
  [
    {
      icon: EyeOff,
      tint: "text-warning",
      title: "Hide",
      body: "One tap takes it off the guest album. It stays dimmed in your own view, so bringing it back is one more tap.",
    },
    {
      icon: Trash2,
      tint: "text-muted-foreground",
      title: "Remove",
      body: `Deletes it from the album and into the Trash, where it waits ${RECENTLY_DELETED_WINDOW_DAYS} days before it${"’"}s gone for good.`,
    },
    {
      icon: Undo2,
      tint: "text-success",
      title: "Restore",
      body: "Back exactly as it was, in the same spot, like nothing happened. An accidental swipe is never a disaster.",
    },
  ];

const TRASH_TILES: { id: string; days: number }[] = [
  { id: "wedding-arch", days: 0 },
  { id: "wedding-petals", days: 1 },
  { id: "party-balloons", days: 29 },
];

function TrashMock() {
  return (
    <div
      aria-hidden
      className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Trash
        </p>
        <Caption className="tabular-nums">
          restore within {RECENTLY_DELETED_WINDOW_DAYS} days
        </Caption>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TRASH_TILES.map(({ id, days }) => (
          <div
            key={id}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="(min-width: 1024px) 200px, 30vw"
              className="object-cover opacity-80"
            />
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
              {binCountdownLabel(days)}
            </span>
          </div>
        ))}
      </div>
      {/* The one irreversible act sits behind the app's own confirm, quoted. */}
      <div className="mt-3 rounded-xl border p-4">
        <p className="text-sm font-semibold">Delete permanently?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This skips the {RECENTLY_DELETED_WINDOW_DAYS}-day recovery window and
          deletes the file for good. It can&rsquo;t be undone.
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <span className="inline-flex h-7 items-center rounded-lg border bg-background px-2.5 text-[0.8rem] font-medium">
            Cancel
          </span>
          <span className="inline-flex h-7 items-center rounded-lg bg-destructive px-2.5 text-[0.8rem] font-medium text-white">
            Delete permanently
          </span>
        </div>
      </div>
    </div>
  );
}

export function Reversibility() {
  return (
    <SectionShell
      eyebrow="Change your mind"
      heading="Nothing here has to be final."
      subhead="Curation is a series of small, reversible calls. The only permanent delete is the one you confirm on purpose."
    >
      {/* One Reveal around the whole split so the Trash mock arrives WITH the
          trio instead of standing there already-painted; slots continue
          SectionShell's header count (0-2). */}
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <MediaSplit
          media={
            <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
              <TrashMock />
            </div>
          }
          mediaSide="end"
        >
          <div className="flex flex-col gap-7">
            {TRIO.map((item, i) => (
              <div
                key={item.title}
                data-mkt-reveal
                className="flex items-start gap-4"
                style={{ "--i": 3 + i } as CSSProperties}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${item.tint}`}
                >
                  <item.icon className="size-5" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-heading text-base sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
            <div data-mkt-reveal style={{ "--i": 5 } as CSSProperties}>
              <LearnMoreLink href="/help/how-long-media-is-kept">
                How long media is kept
              </LearnMoreLink>
            </div>
          </div>
        </MediaSplit>
      </Reveal>
    </SectionShell>
  );
}
